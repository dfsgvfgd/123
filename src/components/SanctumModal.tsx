import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  Coins,
  Flame,
  Gem,
  History,
  Lock,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { ATK_PER_CHAR_LEVEL, COMBAT_DAMAGE_SCALE, computePlayerStats } from '../game/combatMath';
import {
  DAILY_LOGIN_REWARDS,
  DAILY_QUESTS,
  EVENT_BANNERS,
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  getNextClaimableDailyDay,
  HARD_PITY_LIMIT,
  SOFT_PITY_START,
  syncDailyQuestDate,
} from '../game/gacha';
import {
  ACTIVE_SKILLS,
  BESTIARY_ENTRIES,
  BLADE_AURAS,
  BLADE_STYLES,
  CHARACTER_ROSTER,
  getActiveSkillUpgradeCost,
  getCharacterActiveSkills,
  getCharacterUpgradeCost,
  getForgeCost,
  LUNA_SCYTHE_ART_PATH,
  LUNA_SCYTHE_STYLES,
  LYRA_WEAPON_STYLES,
  MAX_ACTIVE_SKILL_LEVEL,
  PASSIVE_TREE,
  WEAPON_ENCHANTS,
  WITCH_WEAPON_STYLES,
} from '../game/progression';
import { getUiStrings } from '../game/i18n';
import { getTodayDateKey, isCharacterUnlocked } from '../game/storage';
import type {
  ActiveSkillId,
  BladeAuraId,
  BladeStyleId,
  CharacterId,
  DailyQuestId,
  GachaRarity,
  LanguageCode,
  LyraWeaponId,
  MonsterType,
  PassiveNodeId,
  PullRecord,
  SaveData,
  ScytheWeaponId,
  WeaponEnchantId,
  WitchWeaponId,
} from '../game/types';
import {
  getLunaSprite,
  getLyraSprite,
  getMonsterSprite,
  getVelveraSprite,
  getWitchSprite,
} from '../engine/pixelSprites';
import { CleanPortrait } from './CleanPortrait';
import {
  getSanctumNavForScope,
  type SanctumScope,
  type SanctumTab,
} from '../game/sanctumNav';

export type { SanctumScope, SanctumTab };

const MonsterPreviewCanvas: React.FC<{ monsterType: MonsterType }> = ({ monsterType }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    const spr = getMonsterSprite(monsterType, 0, 1, false);
    const scale = Math.min((c.width - 8) / spr.width, (c.height - 8) / spr.height);
    const dw = Math.round(spr.width * scale);
    const dh = Math.round(spr.height * scale);
    ctx.drawImage(spr, Math.round((c.width - dw) * 0.5), Math.round((c.height - dh) * 0.5), dw, dh);
  }, [monsterType]);

  return (
    <canvas
      ref={ref}
      width={68}
      height={68}
      className="pixelated shrink-0 bg-[#0B0C12] border border-[#252838] rounded"
    />
  );
};

interface SanctumModalProps {
  open: boolean;
  scope?: SanctumScope;
  initialTab: SanctumTab;
  initialGachaBanner?: CharacterId;
  language?: LanguageCode;
  save: SaveData;
  latestPulls: PullRecord[];
  onClose: () => void;
  onSelectCharacter: (id: CharacterId) => void;
  onOpenGachaForHero?: (heroId: CharacterId) => void;
  onPullSingle: (bannerId: CharacterId) => void;
  onPullTen: (bannerId: CharacterId) => void;
  onChangeLunaWeaponStyle: (style: ScytheWeaponId) => void;
  onChangeWeaponStyle: (style: BladeStyleId) => void;
  onChangeLyraWeaponStyle: (style: LyraWeaponId) => void;
  onChangeWitchWeaponStyle: (style: WitchWeaponId) => void;
  onChangeWeaponAura: (aura: BladeAuraId) => void;
  onChangeWeaponEnchant: (enchant: WeaponEnchantId) => void;
  onForgeWeapon: () => void;
  onEquipSkill: (slot: 0 | 1 | 2, skillId: ActiveSkillId) => void;
  onUpgradeActiveSkill: (skillId: ActiveSkillId) => void;
  onUpgradePassive: (nodeId: PassiveNodeId) => void;
  onUpgradeCharacter: () => void;
  onClaimBestiary: (monsterId: MonsterType) => void;
  onClaimDaily: () => void;
  onClaimDailyQuest: (questId: DailyQuestId) => void;
  onClaimEvent: (eventId: string) => void;
}

export const SanctumModal: React.FC<SanctumModalProps> = ({
  open,
  scope = 'character',
  initialTab,
  initialGachaBanner,
  language = 'id',
  save,
  latestPulls,
  onClose,
  onSelectCharacter,
  onOpenGachaForHero,
  onPullSingle,
  onPullTen,
  onChangeLunaWeaponStyle,
  onChangeWeaponStyle,
  onChangeLyraWeaponStyle,
  onChangeWitchWeaponStyle,
  onChangeWeaponAura,
  onChangeWeaponEnchant,
  onForgeWeapon,
  onEquipSkill,
  onUpgradeActiveSkill,
  onUpgradePassive,
  onUpgradeCharacter,
  onClaimBestiary,
  onClaimDaily,
  onClaimDailyQuest,
  onClaimEvent,
}) => {
  const [tab, setTab] = useState<SanctumTab>(initialTab);
  const [gachaBanner, setGachaBanner] = useState<CharacterId>(
    initialGachaBanner ?? save.selectedCharacter ?? 'velvera'
  );
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | GachaRarity>('ALL');
  const [selectedSkillSlot, setSelectedSkillSlot] = useState<0 | 1 | 2>(0);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setTab(initialTab);
    if (open) {
      setShowHistory(false);
      setGachaBanner(initialGachaBanner ?? save.selectedCharacter ?? 'velvera');
    }
  }, [initialTab, initialGachaBanner, open, save.selectedCharacter]);

  useEffect(() => {
    if (!open || tab !== 'weapon') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const spr =
      save.selectedCharacter === 'luna'
        ? getLunaSprite('idle0', save.lunaWeapon?.style ?? 'umbral_crescent_scythe', false)
        : save.selectedCharacter === 'witch'
          ? getWitchSprite('idle0', save.witchWeapon?.style ?? 'raven_gnarled_staff', false)
          : save.selectedCharacter === 'lyra'
            ? getLyraSprite('idle0', true, false, save.lyraWeapon?.style ?? 'iron_knuckle')
            : getVelveraSprite('idle0', save.weapon.style, save.weapon.aura, false);
    const scale = Math.min((canvas.width - 14) / spr.width, (canvas.height - 14) / spr.height);
    const dw = Math.round(spr.width * scale);
    const dh = Math.round(spr.height * scale);
    ctx.drawImage(
      spr,
      Math.round((canvas.width - dw) * 0.5),
      Math.round((canvas.height - dh) * 0.5),
      dw,
      dh
    );
  }, [
    open,
    tab,
    save.selectedCharacter,
    save.lunaWeapon?.style,
    save.witchWeapon?.style,
    save.weapon.style,
    save.weapon.aura,
    save.lyraWeapon?.style,
  ]);

  if (!open) return null;

  const stats = computePlayerStats(save);
  const isLuna = save.selectedCharacter === 'luna';
  const isLyra = save.selectedCharacter === 'lyra';
  const isWitch = save.selectedCharacter === 'witch';
  const activeForgeLevel = isLuna
    ? save.lunaWeapon?.forgeLevel ?? 0
    : isWitch
      ? save.witchWeapon?.forgeLevel ?? 0
      : isLyra
        ? save.lyraWeapon?.forgeLevel ?? 0
        : save.weapon.forgeLevel;
  const forgeCost = getForgeCost(activeForgeLevel);
  const charCost = getCharacterUpgradeCost(save.characterLevel);
  const todayKey = getTodayDateKey();
  const nextDailyDay = getNextClaimableDailyDay(save, todayKey);

  const filteredHistory = save.pullHistory.filter((r) =>
    historyFilter === 'ALL' ? true : r.rarity === historyFilter
  );

  const t = getUiStrings(language);
  const navConfig = getSanctumNavForScope(scope);

  const tabMeta: Record<SanctumTab, { label: string; icon: React.ReactNode }> = {
    skills: {
      label: `${t.sanctumTabCharacter} & ${t.sanctumTabSkills}`,
      icon: <Flame className="w-4 h-4" />,
    },
    weapon: {
      label: t.sanctumTabWeapon,
      icon: <Swords className="w-4 h-4" />,
    },
    gacha: {
      label: t.sanctumTabGacha,
      icon: <Sparkles className="w-4 h-4" />,
    },
    bestiary: {
      label: t.sanctumTabBestiary,
      icon: <BookOpen className="w-4 h-4" />,
    },
    daily: {
      label: t.sanctumTabDaily,
      icon: <Calendar className="w-4 h-4" />,
    },
    events: {
      label: t.sanctumTabEvents,
      icon: <Bell className="w-4 h-4" />,
    },
  };

  const unreadEventCount = EVENT_BANNERS.filter(
    (ev) => !save.claimedEventRewardIds.includes(ev.id)
  ).length;

  const modalTitle =
    scope === 'gacha'
      ? 'SUMMON GACHA'
      : scope === 'weapon'
        ? language === 'en'
          ? 'ENCHANT & FORGE ALTAR'
          : 'ALTAR ENCHANT & SENJATA'
        : scope === 'events'
          ? language === 'en'
            ? 'EVENT BANNERS & NOTICES'
            : 'EVENT & PENGUMUMAN'
          : scope === 'daily'
            ? language === 'en'
              ? 'DAILY LOGIN & QUESTS'
              : 'HARIAN & MISI'
            : language === 'en'
              ? 'CHARACTER · SKILL · WEAPON'
              : 'KARAKTER · SKILL · SENJATA';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 md:p-6 bg-[#05060A]/90"
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
    >
      <div className="df-modal-frame w-full max-w-5xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="df-modal-header flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-lg md:text-xl font-bold text-[#F8FAFC] tracking-wide">
              {modalTitle}
            </h2>
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono-num text-[#CBD5E1]">
              <span className="inline-flex items-center gap-1 text-[#C084FC] font-bold">
                <Gem className="w-3.5 h-3.5" />
                {save.gems.toLocaleString('id-ID')}
              </span>
              <span className="inline-flex items-center gap-1 text-[#FACC15] font-bold">
                <Coins className="w-3.5 h-3.5" />
                {save.gold.toLocaleString('id-ID')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{save.forgeShards} Shards</span>
              <span aria-hidden="true">·</span>
              <span>{save.skillEssence} Essence</span>
            </div>
          </div>

          <button
            type="button"
            data-testid="sanctum-close-btn"
            onClick={onClose}
            aria-label={t.closeBtn}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E2E8F0] bg-[#1B1D2B] hover:bg-[#272A3D] border border-[#383C52] rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{t.closeBtn}</span>
          </button>
        </div>

        {/* Focused Scope Navigation Tabs + Dedicated Side Access Button */}
        <div
          data-testid="sanctum-nav-bar"
          className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-[#252838] bg-[#0B0C13] overflow-x-auto"
        >
          <div className="flex items-center gap-1.5">
            {navConfig.primaryTabs.map((tabId) => {
              const active = tab === tabId;
              const meta = tabMeta[tabId];
              return (
                <button
                  key={tabId}
                  type="button"
                  data-testid={`sanctum-tab-${tabId}`}
                  onClick={() => setTab(tabId)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#7E22CE] text-[#FFFFFF]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#171925]'
                  }`}
                >
                  {meta.icon}
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {navConfig.sideTab && (
            <div className="flex items-center gap-2 shrink-0 pl-3 border-l border-[#252838]">
              {tab === navConfig.sideTab && (
                <button
                  type="button"
                  data-testid="sanctum-back-main-btn"
                  onClick={() => setTab(navConfig.primaryTabs[0])}
                  className="px-3 py-2 text-xs font-semibold rounded bg-[#171925] hover:bg-[#222536] text-[#CBD5E1] border border-[#33384D] cursor-pointer whitespace-nowrap"
                >
                  ← {tabMeta[navConfig.primaryTabs[0]].label}
                </button>
              )}
              <button
                type="button"
                data-testid={`sanctum-side-${navConfig.sideTab}`}
                onClick={() => setTab(navConfig.sideTab!)}
                className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded whitespace-nowrap shrink-0 cursor-pointer border ${
                  tab === navConfig.sideTab
                    ? 'bg-[#8A7656] text-[#09090E] border-[#FACC15] font-bold'
                    : 'bg-[#151724] text-[#E2E8F0] hover:bg-[#1F2235] border-[#383C52]'
                }`}
              >
                {tabMeta[navConfig.sideTab].icon}
                <span>{tabMeta[navConfig.sideTab].label}</span>
                {navConfig.sideTab === 'events' && unreadEventCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono-num font-bold rounded bg-[#FACC15] text-[#09090E]">
                    {unreadEventCount}
                  </span>
                )}
                {navConfig.sideTab === 'daily' && nextDailyDay !== null && (
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full bg-[#FACC15]"
                  />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto abyss-scroll p-5 md:p-6">
          {/* TAB 1: GACHA & HISTORI */}
          {tab === 'gacha' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#141621] rounded border border-[#252838]">
                    {(['luna', 'velvera', 'lyra', 'witch'] as CharacterId[]).map((bId) => {
                      const active = gachaBanner === bId;
                      return (
                        <button
                          key={bId}
                          type="button"
                          onClick={() => setGachaBanner(bId)}
                          className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${
                            active
                              ? 'text-[#09090E] font-bold'
                              : 'text-[#94A3B8] hover:text-white'
                          }`}
                          style={
                            active
                              ? { backgroundColor: CHARACTER_ROSTER[bId].accentHex }
                              : undefined
                          }
                        >
                          Banner {CHARACTER_ROSTER[bId].name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-[#B8C0D2] font-mono-num">
                    Pity SSR:{' '}
                    <strong className="text-[#C084FC]">
                      {save.pityCount} / {HARD_PITY_LIMIT}
                    </strong>{' '}
                    (Soft Pity mulai {SOFT_PITY_START})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#E8EEF5] bg-[#161824] hover:bg-[#212436] border border-[#8A7656]/55 rounded cursor-pointer whitespace-nowrap"
                >
                  <History className="w-4 h-4 text-[#C084FC]" />
                  <span>{showHistory ? 'Kembali ke Banner' : `Histori Tarikan (${save.pullHistory.length})`}</span>
                </button>
              </div>

              {!showHistory ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Featured Character Art Showcase */}
                  <div className="lg:col-span-5 relative rounded-md overflow-hidden border border-[#8A7656]/50 bg-[#12131D] min-h-[300px] flex items-center justify-center">
                    <CleanPortrait
                      src={CHARACTER_ROSTER[gachaBanner].portraitPath}
                      alt={`${CHARACTER_ROSTER[gachaBanner].name} SSR Featured Banner`}
                      removeSolidBg={gachaBanner === 'luna' || gachaBanner === 'witch'}
                      removeCheckerboard={gachaBanner === 'lyra'}
                      className={`w-full h-full max-h-[380px] ${
                        gachaBanner === 'velvera'
                          ? 'object-cover object-top'
                          : 'object-contain pt-4 pb-12'
                      }`}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 p-4"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(9,9,14,0) 0%, rgba(9,9,14,0.95) 58%, #09090E 100%)',
                      }}
                    >
                      <div className="text-[11px] font-semibold text-[#FACC15] tracking-wider uppercase">
                        SSR · {CHARACTER_ROSTER[gachaBanner].weaponStyle}
                      </div>
                      <div className="font-display text-2xl font-bold text-[#F8FAFC]">
                        {CHARACTER_ROSTER[gachaBanner].name}
                      </div>
                      <div className="text-xs text-[#CBD5E1] font-mono-num mt-0.5">
                        Awakening Lv.
                        {gachaBanner === 'luna'
                          ? save.lunaAwakening ?? 0
                          : gachaBanner === 'witch'
                            ? save.witchAwakening ?? 0
                            : gachaBanner === 'lyra'
                              ? save.lyraAwakening
                              : save.velveraAwakening}
                        /6 · Total Tarikan: {save.totalPulls}
                      </div>
                    </div>
                  </div>

                  {/* Pull Controls & Latest Pull Results */}
                  <div className="lg:col-span-7 flex flex-col justify-between gap-5">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[#F8FAFC] mb-2">
                        {gachaBanner === 'luna'
                          ? 'Banner: Umbral Scythe Harvest'
                          : gachaBanner === 'witch'
                            ? 'Banner: Astral Raven Starfall'
                            : gachaBanner === 'lyra'
                              ? 'Banner: Crimson Martial Awakening'
                              : 'Banner: Crimson Eclipse Awakening'}
                      </h3>
                      <p className="text-sm text-[#B8C0D2] leading-relaxed mb-4">
                        {CHARACTER_ROSTER[gachaBanner].description} Setiap tarikan meningkatkan penghitung Pity menuju jaminan SSR pada tarikan ke-80. Duplikat meningkatkan Awakening hingga Lv.6 dan memberi bonus Forge Shards.
                      </p>

                      {/* Pity Progress Bar */}
                      <div className="mb-5">
                        <div className="flex justify-between text-xs font-mono-num mb-1.5">
                          <span className="text-[#94A3B8]">Progres Pity SSR</span>
                          <span className="text-[#C084FC] font-bold">
                            {save.pityCount} / {HARD_PITY_LIMIT}
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-[#191B28] rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-[#A855F7]"
                            style={{ width: `${Math.min(100, (save.pityCount / HARD_PITY_LIMIT) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={save.gems < GACHA_COST_SINGLE}
                          onClick={() => onPullSingle(gachaBanner)}
                          className="px-5 py-3 text-sm font-bold rounded bg-[#1D1F2F] hover:bg-[#2A2D42] disabled:opacity-45 text-[#F8FAFC] border border-[#8A7656]/70 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Tarik 1x · {GACHA_COST_SINGLE} Gems
                        </button>
                        <button
                          type="button"
                          disabled={save.gems < GACHA_COST_TEN}
                          onClick={() => onPullTen(gachaBanner)}
                          className="px-6 py-3 text-sm font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] disabled:opacity-45 text-[#09090E] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Tarik 10x · {GACHA_COST_TEN} Gems
                        </button>
                      </div>
                    </div>

                    {/* Latest Pull Reveal */}
                    <div className="border-t border-[#252838] pt-4">
                      <div className="text-xs font-semibold text-[#94A3B8] mb-2">
                        Hasil Tarikan Terakhir
                      </div>
                      {latestPulls.length === 0 ? (
                        <p className="text-xs text-[#64748B]">
                          Belum ada tarikan di sesi ini. Klaim Abyssal Gems dari Login Harian atau Event lalu lakukan tarikan!
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {latestPulls.map((rec) => (
                            <div
                              key={rec.id}
                              className={`p-2 rounded border text-left ${
                                rec.rarity === 'SSR'
                                  ? 'bg-[#2B1740] border-[#FACC15]'
                                  : rec.rarity === 'SR'
                                    ? 'bg-[#1B172B] border-[#A855F7]'
                                    : 'bg-[#141621] border-[#2C3042]'
                              }`}
                            >
                              <div className="font-mono-num text-[11px] font-bold text-[#FACC15]">
                                {rec.rarity}
                              </div>
                              <div className="text-xs font-semibold text-[#F8FAFC] truncate mt-0.5">
                                {rec.name}
                              </div>
                              <div className="text-[10px] text-[#94A3B8]">
                                {rec.isDuplicate ? 'Duplikat (+Shards)' : rec.category}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Pull History Panel */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                      Riwayat Tarikan Gacha
                    </h3>
                    <div className="flex items-center gap-1 p-1 bg-[#141621] rounded">
                      {(['ALL', 'SSR', 'SR', 'R'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setHistoryFilter(r)}
                          className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${
                            historyFilter === r
                              ? 'bg-[#7E22CE] text-white'
                              : 'text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          {r === 'ALL' ? 'Semua' : r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredHistory.length === 0 ? (
                    <p className="text-sm text-[#64748B] py-8 text-center">
                      Belum ada riwayat tarikan untuk filter ini.
                    </p>
                  ) : (
                    <div className="border border-[#252838] rounded overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#141621] text-[#94A3B8] border-b border-[#252838]">
                          <tr>
                            <th className="py-2.5 px-3 font-mono-num">#</th>
                            <th className="py-2.5 px-3">Rarity</th>
                            <th className="py-2.5 px-3">Item / Karakter</th>
                            <th className="py-2.5 px-3">Kategori</th>
                            <th className="py-2.5 px-3 text-right">Waktu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2130]">
                          {filteredHistory.slice(0, 40).map((row) => (
                            <tr key={row.id} className="hover:bg-[#141622]">
                              <td className="py-2 px-3 font-mono-num text-[#94A3B8]">
                                {row.pullIndex}
                              </td>
                              <td
                                className={`py-2 px-3 font-mono-num font-bold ${
                                  row.rarity === 'SSR'
                                    ? 'text-[#FACC15]'
                                    : row.rarity === 'SR'
                                      ? 'text-[#C084FC]'
                                      : 'text-[#94A3B8]'
                                }`}
                              >
                                {row.rarity}
                              </td>
                              <td className="py-2 px-3 font-semibold text-[#F8FAFC]">
                                {row.name}
                                {row.isDuplicate && (
                                  <span className="ml-2 text-[11px] font-normal text-[#B09567]">
                                    (Duplikat)
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[#CBD5E1]">{row.category}</td>
                              <td className="py-2 px-3 text-right font-mono-num text-[#94A3B8]">
                                {new Date(row.timestamp).toLocaleTimeString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WEAPON CUSTOMIZATION & FORGING */}
          {tab === 'weapon' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Live Pixel Art Weapon Preview */}
              <div className="lg:col-span-4 flex flex-col items-center justify-between p-5 bg-[#12131D] border border-[#282B3C] rounded-md">
                <div className="text-center">
                  <div className="text-xs font-semibold text-[#B09567]">
                    {isLuna
                      ? 'Pratinjau Pixel Art Sabit Umbral'
                      : isWitch
                        ? 'Pratinjau Tongkat Sihir & Lentera'
                        : isLyra
                          ? 'Pratinjau Senjata Tangan & Kaki'
                          : 'Pratinjau Pixel Art Dual Blade'}
                  </div>
                  <div className="font-display text-lg font-bold text-[#F8FAFC] mt-0.5">
                    {isLuna
                      ? `${LUNA_SCYTHE_STYLES[save.lunaWeapon?.style ?? 'umbral_crescent_scythe'].name} +${activeForgeLevel}`
                      : isWitch
                        ? `${WITCH_WEAPON_STYLES[save.witchWeapon?.style ?? 'raven_gnarled_staff'].name} +${activeForgeLevel}`
                        : isLyra
                          ? `${LYRA_WEAPON_STYLES[save.lyraWeapon?.style ?? 'iron_knuckle'].name} +${activeForgeLevel}`
                          : `${BLADE_STYLES[save.weapon.style].name} +${activeForgeLevel}`}
                  </div>
                </div>

                <div className="my-4 flex items-center justify-center gap-3">
                  <canvas
                    ref={previewCanvasRef}
                    width={154}
                    height={170}
                    className="pixelated bg-[#0B0C12] border border-[#252838] rounded"
                  />
                  {isLuna && (
                    <div className="w-24 h-[170px] rounded border border-[#818CF8]/45 bg-[#0B0C12] flex items-center justify-center p-1.5">
                      <CleanPortrait
                        src={LUNA_SCYTHE_ART_PATH}
                        alt="Sabit Kosmik Luna"
                        removeSolidBg
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="w-full space-y-2 text-xs font-mono-num">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Total Attack</span>
                    <span className="text-[#F8FAFC] font-bold">{stats.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Peluang Crit</span>
                    <span className="text-[#FACC15] font-bold">
                      {Math.round(stats.critChance * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Kecepatan Serang</span>
                    <span className="text-[#C084FC] font-bold">
                      {stats.attackSpeedMult.toFixed(2)}x
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    activeForgeLevel >= 10 ||
                    save.gold < forgeCost.gold ||
                    save.forgeShards < forgeCost.shards
                  }
                  onClick={onForgeWeapon}
                  className="w-full mt-4 py-2.5 px-4 text-xs font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] disabled:opacity-45 text-[#09090E] transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {activeForgeLevel >= 10
                    ? 'Tempa Maksimal (+10)'
                    : `Tempa +${activeForgeLevel + 1} (${forgeCost.gold}G · ${forgeCost.shards} Shards)`}
                </button>
              </div>

              {/* Customization Options */}
              <div className="lg:col-span-8 space-y-5">
                {isLuna ? (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B09567] mb-2.5">
                      1. Sabit Kosmik Ungu-Kebiruan (Senjata Luna)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(Object.keys(LUNA_SCYTHE_STYLES) as ScytheWeaponId[]).map((id) => {
                        const st = LUNA_SCYTHE_STYLES[id];
                        const unlocked = (save.unlockedLunaWeapons ?? ['umbral_crescent_scythe']).includes(id);
                        const selected = (save.lunaWeapon?.style ?? 'umbral_crescent_scythe') === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => onChangeLunaWeaponStyle(id)}
                            className={`p-3 rounded border text-left transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                              selected
                                ? 'bg-[#171936] border-[#818CF8]'
                                : 'bg-[#131520] border-[#26293A] hover:border-[#8A7656]'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
                              <span>{st.name}</span>
                              <span className="font-mono-num text-[#818CF8]">+{st.atkBonus} ATK</span>
                            </div>
                            <div className="text-[11px] text-[#94A3B8] mt-1">
                              {unlocked
                                ? st.subtitle
                                : `Terkunci · Beli di Toko Senjata (${st.shopPrice}G) atau Tempa`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : isWitch ? (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B09567] mb-2.5">
                      1. Tongkat Lentera Gagak (Senjata Seraphina)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(Object.keys(WITCH_WEAPON_STYLES) as WitchWeaponId[]).map((id) => {
                        const st = WITCH_WEAPON_STYLES[id];
                        const unlocked = (save.unlockedWitchWeapons ?? ['raven_gnarled_staff']).includes(id);
                        const selected = (save.witchWeapon?.style ?? 'raven_gnarled_staff') === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => onChangeWitchWeaponStyle(id)}
                            className={`p-3 rounded border text-left transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                              selected
                                ? 'bg-[#221536] border-[#C084FC]'
                                : 'bg-[#131520] border-[#26293A] hover:border-[#8A7656]'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
                              <span>{st.name}</span>
                              <span className="font-mono-num text-[#C084FC]">+{st.atkBonus} ATK</span>
                            </div>
                            <div className="text-[11px] text-[#94A3B8] mt-1">
                              {unlocked
                                ? st.subtitle
                                : `Terkunci · Beli di Toko Senjata (${st.shopPrice}G) atau Tempa`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : isLyra ? (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B09567] mb-2.5">
                      1. Senjata Tangan & Kaki (Gauntlet & Greaves Lyra)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(Object.keys(LYRA_WEAPON_STYLES) as LyraWeaponId[]).map((id) => {
                        const st = LYRA_WEAPON_STYLES[id];
                        const unlocked = (save.unlockedLyraWeapons ?? ['iron_knuckle']).includes(id);
                        const selected = (save.lyraWeapon?.style ?? 'iron_knuckle') === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => onChangeLyraWeaponStyle(id)}
                            className={`p-3 rounded border text-left transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                              selected
                                ? 'bg-[#2B140C] border-[#F97316]'
                                : 'bg-[#131520] border-[#26293A] hover:border-[#8A7656]'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
                              <span>{st.name}</span>
                              <span className="font-mono-num text-[#F97316]">+{st.atkBonus} ATK</span>
                            </div>
                            <div className="text-[11px] text-[#94A3B8] mt-1">
                              {unlocked
                                ? st.subtitle
                                : `Terkunci · Beli di Pedagang Senjata NPC (${st.shopPrice}G)`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#B09567] mb-2.5">
                        1. Bentuk Dual Blade
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(Object.keys(BLADE_STYLES) as BladeStyleId[]).map((id) => {
                          const st = BLADE_STYLES[id];
                          const unlocked = save.unlockedBladeStyles.includes(id);
                          const selected = save.weapon.style === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              disabled={!unlocked}
                              onClick={() => onChangeWeaponStyle(id)}
                              className={`p-3 rounded border text-left transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                                selected
                                  ? 'bg-[#221536] border-[#C084FC]'
                                  : 'bg-[#131520] border-[#26293A] hover:border-[#8A7656]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
                                <span>{st.name}</span>
                                <span className="font-mono-num text-[#C084FC]">+{st.atkBonus} ATK</span>
                              </div>
                              <div className="text-[11px] text-[#94A3B8] mt-1">
                                {unlocked ? st.subtitle : `Terkunci · ${st.unlockNote}`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#B09567] mb-2.5">
                        2. Aura Energi Ungu Dual Blade
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {(Object.keys(BLADE_AURAS) as BladeAuraId[]).map((id) => {
                          const aura = BLADE_AURAS[id];
                          const selected = save.weapon.aura === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => onChangeWeaponAura(id)}
                              className={`p-2.5 rounded border text-left cursor-pointer ${
                                selected
                                  ? 'bg-[#221536] border-[#C084FC]'
                                  : 'bg-[#131520] border-[#26293A] hover:border-[#8A7656]'
                              }`}
                            >
                              <div
                                className="w-full h-2 rounded-sm mb-2"
                                style={{ backgroundColor: aura.glowHex }}
                              />
                              <div className="text-xs font-semibold text-[#F8FAFC] truncate">
                                {aura.name}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#B09567] mb-2.5">
                    {isLuna || isWitch || isLyra
                      ? '2. Rune Enchantment Senjata'
                      : '3. Rune Enchantment Senjata'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(Object.keys(WEAPON_ENCHANTS) as WeaponEnchantId[]).map((id) => {
                      const enc = WEAPON_ENCHANTS[id];
                      const selected = save.weapon.enchant === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onChangeWeaponEnchant(id)}
                          className={`p-3 rounded border text-left cursor-pointer ${
                            selected
                              ? 'bg-[#221536] border-[#C084FC]'
                              : 'bg-[#131520] border-[#26293A] hover:border-[#8A7656]'
                          }`}
                        >
                          <div className="text-xs font-bold text-[#F8FAFC]">{enc.name}</div>
                          <div className="text-[11px] text-[#C084FC] mt-0.5">{enc.effectText}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHARACTER SELECTION, UPGRADE + SKILL & MASTERY TREE */}
          {tab === 'skills' && (
            <div className="space-y-6">
              {/* Playable Character Switcher (Only Velvera starts unlocked; others unlock via Gacha) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['velvera', 'luna', 'lyra', 'witch'] as CharacterId[]).map((cId) => {
                  const charInfo = CHARACTER_ROSTER[cId];
                  const unlocked = isCharacterUnlocked(save, cId);
                  const active = unlocked && save.selectedCharacter === cId;
                  const awk =
                    cId === 'luna'
                      ? save.lunaAwakening ?? 0
                      : cId === 'witch'
                        ? save.witchAwakening ?? 0
                        : cId === 'lyra'
                          ? save.lyraAwakening
                          : save.velveraAwakening;
                  return (
                    <div
                      key={cId}
                      data-testid={`hero-card-${cId}`}
                      className={`p-3.5 rounded border text-left flex items-center gap-3.5 ${
                        active
                          ? 'bg-[#1B1830]'
                          : unlocked
                            ? 'bg-[#12131D] border-[#26293A] hover:border-[#8A7656]'
                            : 'bg-[#0E0F17] border-[#222536] opacity-85'
                      }`}
                      style={active ? { borderColor: charInfo.accentHex } : undefined}
                    >
                      <div className="relative w-14 h-14 rounded overflow-hidden bg-[#09090E] border border-[#334155] shrink-0">
                        <CleanPortrait
                          src={charInfo.portraitPath}
                          alt={charInfo.name}
                          removeSolidBg={cId === 'luna' || cId === 'witch'}
                          removeCheckerboard={cId === 'lyra'}
                          faceCrop={cId}
                          className={`w-full h-full object-cover ${!unlocked ? 'grayscale brightness-75' : ''}`}
                        />
                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#09090E]/55">
                            <Lock className="w-5 h-5 text-[#FACC15]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-base font-bold text-[#F8FAFC]">
                            {charInfo.name}
                          </span>
                          {unlocked ? (
                            <button
                              type="button"
                              data-testid={`hero-select-${cId}`}
                              disabled={active}
                              onClick={() => onSelectCharacter(cId)}
                              className={`px-2.5 py-0.5 rounded text-[11px] font-mono-num font-bold cursor-pointer disabled:cursor-default ${
                                active
                                  ? 'bg-[#1D1B32] border border-current'
                                  : 'bg-[#1C1F2E] hover:bg-[#2A2E45]'
                              }`}
                              style={{ color: charInfo.accentHex }}
                            >
                              {active ? (language === 'en' ? 'Active' : 'Dipakai') : (language === 'en' ? 'Select' : 'Pilih')} · A{awk}
                            </button>
                          ) : (
                            <span
                              data-testid={`hero-locked-${cId}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1A1C28] border border-[#8A7656]/55 text-[10px] font-bold text-[#FACC15]"
                            >
                              <Lock className="w-3 h-3" />
                              {t.heroLockedBadge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-[#B09567]">
                          {charInfo.weaponStyle}
                        </div>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5 line-clamp-2">
                          {charInfo.description}
                        </p>
                        {!unlocked && onOpenGachaForHero && (
                          <button
                            type="button"
                            data-testid={`hero-unlock-gacha-${cId}`}
                            onClick={() => onOpenGachaForHero(cId)}
                            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-[#7E22CE] hover:bg-[#9333EA] text-white cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{t.heroUnlockGachaBtn}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Base Character Level Upgrade (Starts at 100 HP) */}
              <div className="p-4 rounded border border-[#8A7656]/60 bg-[#12131D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#B09567]">
                    Peningkatan Level Tim (Berlaku Semua Karakter)
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#F8FAFC] mt-0.5">
                    {CHARACTER_ROSTER[save.selectedCharacter].name} · Level {save.characterLevel}/50
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono-num text-[#CBD5E1] mt-1">
                    <span>Max HP: <strong className="text-[#4ADE80]">{stats.maxHp}</strong> (+18/Lv)</span>
                    <span aria-hidden="true">·</span>
                    <span>Attack: <strong className="text-[#C084FC]">{stats.attack}</strong> (+{ATK_PER_CHAR_LEVEL * COMBAT_DAMAGE_SCALE}/Lv)</span>
                    <span aria-hidden="true">·</span>
                    <span>Speed: <strong className="text-[#FACC15]">{stats.attackSpeedMult.toFixed(2)}x</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={
                    save.characterLevel >= 50 ||
                    save.gold < charCost.gold ||
                    save.skillEssence < charCost.essence
                  }
                  onClick={onUpgradeCharacter}
                  className="px-4 py-2.5 text-xs font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] disabled:opacity-45 text-[#09090E] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {save.characterLevel >= 50
                    ? 'Level Karakter Maksimal'
                    : `Upgrade Lv.${save.characterLevel + 1} (${charCost.gold}G · ${charCost.essence} Essence)`}
                </button>
              </div>

              {/* Active Skills Equip (3 of 5) & Upgrade up to Lv.10 (Sanctum-only) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                      {language === 'en'
                        ? `Active Skills ${CHARACTER_ROSTER[save.selectedCharacter].name} (3/${getCharacterActiveSkills(save.selectedCharacter).length} Equipped · Max Lv.${MAX_ACTIVE_SKILL_LEVEL})`
                        : `Skill Aktif ${CHARACTER_ROSTER[save.selectedCharacter].name} (3/${getCharacterActiveSkills(save.selectedCharacter).length} Terpasang · Maks Lv.${MAX_ACTIVE_SKILL_LEVEL})`}
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      {language === 'en'
                        ? `Choose 3 of ${getCharacterActiveSkills(save.selectedCharacter).length} hero skills for Slots 1–3 and upgrade up to Lv.10 here. Sub-Skills drop inside stages.`
                        : `Pilih 3 dari ${getCharacterActiveSkills(save.selectedCharacter).length} skill karakter untuk Slot 1–3 dan tingkatkan hingga Lv.10 di sini. Sub-Skill muncul di dalam stage.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-[#141621] rounded">
                    {([0, 1, 2] as const).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSkillSlot(slot)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                          selectedSkillSlot === slot
                            ? 'bg-[#7E22CE] text-white'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        Edit Slot [{slot + 1}]
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getCharacterActiveSkills(save.selectedCharacter).map((skillId) => {
                    const def = ACTIVE_SKILLS[skillId];
                    const lv = save.skillLevels[skillId] ?? 0;
                    const activeBar =
                      save.selectedCharacter === 'luna'
                        ? save.lunaEquippedSkills
                        : save.selectedCharacter === 'witch'
                          ? save.witchEquippedSkills
                          : save.selectedCharacter === 'lyra'
                            ? save.lyraEquippedSkills
                            : save.equippedSkills;
                    const equippedIdx = activeBar.indexOf(skillId);
                    const upgCost = getActiveSkillUpgradeCost(lv);
                    const isMax = lv >= MAX_ACTIVE_SKILL_LEVEL;
                    const canUpgrade =
                      !isMax && save.gold >= upgCost.gold && save.skillEssence >= upgCost.essence;

                    return (
                      <div
                        key={skillId}
                        className="p-3.5 rounded border border-[#26293A] bg-[#12131D] flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#F8FAFC]">{def.name}</span>
                            <span className="font-mono-num font-bold" style={{ color: def.accentHex }}>
                              {lv > 0 ? `Lv.${lv}/${MAX_ACTIVE_SKILL_LEVEL}` : 'Belum Dibuka'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono-num text-[#CBD5E1] mt-0.5">
                            Tipe: {def.roleLabel} · CD {def.cooldown}s · {def.mpCost} MP
                          </div>
                          <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                            {def.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E2130]">
                          <button
                            type="button"
                            disabled={!canUpgrade}
                            onClick={() => onUpgradeActiveSkill(skillId)}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] disabled:opacity-40 text-[#09090E] cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isMax
                              ? 'Maks Lv.10'
                              : `${lv === 0 ? 'Buka' : 'Upgrade'} (${upgCost.gold}G · ${upgCost.essence}E)`}
                          </button>

                          <button
                            type="button"
                            disabled={lv <= 0 || equippedIdx === selectedSkillSlot}
                            onClick={() => onEquipSkill(selectedSkillSlot, skillId)}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded bg-[#1E2030] hover:bg-[#7E22CE] disabled:opacity-45 text-[#F8FAFC] cursor-pointer disabled:cursor-not-allowed"
                          >
                            {equippedIdx >= 0
                              ? `Terpasang [${equippedIdx + 1}]`
                              : `Pasang Slot ${selectedSkillSlot + 1}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Passive Mastery Tree */}
              <div className="border-t border-[#252838] pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                    Pohon Skill Pasif Demon
                  </h3>
                  <span className="font-mono-num text-xs font-bold text-[#C084FC]">
                    Tersedia: {save.skillEssence} Skill Essence
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PASSIVE_TREE.map((node) => {
                    const lv = save.passiveLevels[node.id] ?? 0;
                    const cost = node.costPerLevel + lv * 6;
                    const isMax = lv >= node.maxLevel;
                    return (
                      <div
                        key={node.id}
                        className="p-3.5 rounded border border-[#26293A] bg-[#12131D] flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-[#B09567] font-semibold">
                            <span>{node.branch}</span>
                            <span className="font-mono-num">
                              Lv.{lv}/{node.maxLevel}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-[#F8FAFC] mt-0.5">
                            {node.name}
                          </div>
                          <p className="text-[11px] text-[#94A3B8] mt-1">{node.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#1E2130]">
                          <span className="font-mono-num text-xs text-[#C084FC]">
                            {node.effectLabel(lv)}
                          </span>
                          <button
                            type="button"
                            disabled={isMax || save.skillEssence < cost}
                            onClick={() => onUpgradePassive(node.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] disabled:opacity-40 text-[#09090E] cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isMax ? 'Maks' : `Upgrade (${cost})`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BESTIARY MONSTER ENCYCLOPEDIA */}
          {tab === 'bestiary' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                  Bestiary Monster Katedral Abyssal
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Catat ras monster yang ditemui di dungeon, tingkat spawn, lore mereka, dan klaim hadiah penyelesaian entri.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BESTIARY_ENTRIES.map((entry) => {
                  const kills = save.bestiaryKills[entry.id] ?? 0;
                  const claimed = save.claimedBestiaryIds.includes(entry.id);
                  const canClaim = kills >= entry.targetKills && !claimed;
                  const pct = Math.min(100, (kills / entry.targetKills) * 100);

                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded border border-[#26293A] bg-[#12131D] flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5">
                        <MonsterPreviewCanvas monsterType={entry.id} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-display text-base font-bold text-[#F8FAFC] truncate">
                              {entry.name}
                            </h4>
                            <span className="font-mono-num text-[11px] font-semibold text-[#C084FC] whitespace-nowrap">
                              {entry.spawnRateLabel}
                            </span>
                          </div>
                          <p className="text-xs text-[#B8C0D2] leading-relaxed mt-1.5">
                            {kills > 0
                              ? entry.lore
                              : 'Belum pernah dikalahkan. Jelajahi dungeon untuk membuka catatan lore lengkap.'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#1E2130]">
                        <div className="flex items-center justify-between text-xs font-mono-num">
                          <span className="text-[#94A3B8]">
                            Terbunuh: <strong className="text-[#F8FAFC]">{kills}</strong> / {entry.targetKills}
                          </span>
                          <span className="text-[#FACC15]">
                            +{entry.rewardGems} Gems · +{entry.rewardGold}G
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#191B28] rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-[#A855F7]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={!canClaim}
                          onClick={() => onClaimBestiary(entry.id)}
                          className="w-full py-2 text-xs font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] disabled:bg-[#1E2030] disabled:text-[#64748B] text-[#09090E] cursor-pointer disabled:cursor-not-allowed"
                        >
                          {claimed
                            ? 'Hadiah Entri Diklaim'
                            : canClaim
                              ? `Klaim Hadiah (+${entry.rewardGems} Gems)`
                              : `Kalahkan ${entry.targetKills - kills} Lagi`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: DAILY LOGIN REWARDS & DAILY QUESTS */}
          {tab === 'daily' && (() => {
            const syncedDailySave = syncDailyQuestDate(save, todayKey);
            return (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                      Hadiah Login Harian (Mata Uang Premium)
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Login setiap hari untuk mengklaim Abyssal Gems, Gold, dan Forge Shards.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={nextDailyDay === null}
                    onClick={onClaimDaily}
                    className="px-5 py-2.5 text-xs font-bold rounded bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-45 text-[#09090E] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {nextDailyDay === null
                      ? 'Sudah Diklaim Hari Ini'
                      : `Klaim Hadiah Hari ${nextDailyDay}`}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {DAILY_LOGIN_REWARDS.map((reward) => {
                    const isClaimed = save.dailyLogin.claimedDays.includes(reward.day);
                    const isNext = nextDailyDay === reward.day;
                    return (
                      <div
                        key={reward.day}
                        className={`p-3.5 rounded border flex flex-col justify-between ${
                          isNext
                            ? 'bg-[#251839] border-[#FACC15]'
                            : isClaimed
                              ? 'bg-[#12141E] border-[#334155] opacity-75'
                              : 'bg-[#12131D] border-[#26293A]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#E2E8F0]">{reward.label}</span>
                          {isClaimed && <Check className="w-4 h-4 text-[#4ADE80]" />}
                        </div>
                        <div className="my-3">
                          <div className="font-mono-num text-lg font-bold text-[#C084FC]">
                            +{reward.gems}
                          </div>
                          <div className="text-[11px] text-[#CBD5E1]">Abyssal Gems</div>
                        </div>
                        <div className="font-mono-num text-[11px] text-[#94A3B8]">
                          +{reward.gold}G · +{reward.shards} Shards
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Daily Quests Panel */}
                <div className="pt-5 border-t border-[#252838] space-y-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                      {t.dailyQuestsTitle}
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{t.dailyQuestsSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {DAILY_QUESTS.map((quest) => {
                      const prog = syncedDailySave.dailyQuests.progress[quest.metric] ?? 0;
                      const claimed = syncedDailySave.dailyQuests.claimedIds.includes(quest.id);
                      const canClaim = !claimed && prog >= quest.target;
                      const pct = Math.min(100, (prog / quest.target) * 100);
                      return (
                        <div
                          key={quest.id}
                          data-testid={`daily-quest-card-${quest.id}`}
                          className={`p-4 rounded border flex flex-col justify-between gap-3 ${
                            canClaim
                              ? 'bg-[#1D152C] border-[#FACC15]'
                              : claimed
                                ? 'bg-[#10121B] border-[#26293A] opacity-75'
                                : 'bg-[#12131D] border-[#26293A]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-display text-sm font-bold text-[#F8FAFC]">
                                {language === 'en' ? quest.titleEn : quest.titleId}
                              </h4>
                              <p className="text-xs text-[#94A3B8] mt-0.5">
                                {language === 'en' ? quest.descEn : quest.descId}
                              </p>
                            </div>
                            <span className="font-mono-num text-xs font-bold text-[#C084FC] whitespace-nowrap">
                              {Math.min(prog, quest.target)}/{quest.target}
                            </span>
                          </div>

                          <div className="h-2 w-full bg-[#191B28] rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-[#A855F7]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="font-mono-num text-[11px] text-[#FACC15]">
                              +{quest.rewardGems} Gems · +{quest.rewardGold}G · +{quest.rewardEssence} Essence
                            </span>
                            <button
                              type="button"
                              data-testid={`daily-quest-claim-${quest.id}`}
                              disabled={!canClaim}
                              onClick={() => onClaimDailyQuest(quest.id)}
                              className="px-3.5 py-1.5 text-xs font-bold rounded bg-[#FACC15] hover:bg-[#FDE047] disabled:bg-[#1E2030] disabled:text-[#64748B] text-[#09090E] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {claimed ? t.dailyQuestClaimedBadge : t.dailyQuestClaimBtn}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 5: EVENT BANNER NOTIFICATIONS */}
          {tab === 'events' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                  Pemberitahuan Event Banner Baru
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Informasi resmi perilisan banner gacha baru dan bonus hadiah event.
                </p>
              </div>

              <div className="space-y-3">
                {EVENT_BANNERS.map((ev) => {
                  const claimed = save.claimedEventRewardIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded border border-[#2B2E3D] bg-[#12131D] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-[#C084FC]">
                          {ev.periodLabel} · {ev.subtitle}
                        </div>
                        <h4 className="font-display text-base font-bold text-[#F8FAFC]">
                          {ev.title}
                        </h4>
                        <p className="text-xs text-[#B8C0D2] leading-relaxed max-w-2xl">
                          {ev.description}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          disabled={claimed}
                          onClick={() => onClaimEvent(ev.id)}
                          className="px-4 py-2.5 text-xs font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] disabled:bg-[#1E2030] disabled:text-[#64748B] text-[#09090E] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {claimed
                            ? 'Hadiah Event Diklaim'
                            : `Klaim +${ev.rewardGems} Gems`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
