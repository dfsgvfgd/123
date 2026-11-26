import React, { useEffect, useRef, useState } from 'react';
import {
  Footprints,
  Gem,
  Pause,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CHAIN_TAG_LABELS,
  CRITICAL_COMBO_INTERVAL,
  isCriticalComboMilestone,
} from '../game/comboChain';
import { getUiStrings } from '../game/i18n';
import {
  ACTIVE_SKILLS,
  CHARACTER_ROSTER,
  MAX_RUN_INVENTORY,
  STAGE_TITLES,
} from '../game/progression';
import { formatKeyCodeLabel, normalizeMobileControls } from '../game/storage';
import type {
  ActiveSkillId,
  HudSnapshot,
  Keybindings,
  LanguageCode,
  MobileControlButtonId,
  MobileControlsSettings,
} from '../game/types';
import { CleanPortrait } from './CleanPortrait';
import {
  BagFantasyIcon,
  compactSkillRoleLabel,
  DashFantasyIcon,
  JumpFantasyIcon,
  SkillFantasyIcon,
  StoneActionButton,
} from './FantasyActionUi';
import { SilverCoinIcon, SubSkillIcon } from './ItemSkillIcons';
import type { SanctumScope, SanctumTab } from './SanctumModal';

interface DungeonHudProps {
  hud: HudSnapshot;
  equippedSkills: [ActiveSkillId, ActiveSkillId, ActiveSkillId];
  keybindings: Keybindings;
  language: LanguageCode;
  mobileControls: MobileControlsSettings;
  lunaAwakening: number;
  velveraAwakening: number;
  lyraAwakening: number;
  witchAwakening: number;
  gems: number;
  muted: boolean;
  showTouchControls: boolean;
  onToggleMute: () => void;
  onToggleAutoCombat: () => void;
  onPause: () => void;
  onOpenSettings: () => void;
  onOpenSanctum: (tab: SanctumTab, scope?: SanctumScope) => void;
  onOpenInventory: () => void;
  onTouchMove: (dir: -1 | 0 | 1) => void;
  onTouchDown: (active: boolean) => void;
  onTouchJumpStart: () => void;
  onTouchJumpEnd: () => void;
  onTouchDash: () => void;
  onTouchSkill: (slot: 0 | 1 | 2) => void;
  onTouchInteract: () => void;
}

const STONE_CARD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(22,24,36,0.92) 0%, rgba(11,12,19,0.94) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 18px rgba(0,0,0,0.55)',
};

// 5-Layer Boss HP Colors (Top layer x5 -> Bottom layer x1)
const BOSS_LAYER_COLORS: Record<number, string> = {
  5: '#A855F7', // Abyssal Purple
  4: '#3B82F6', // Arcane Blue
  3: '#22C55E', // Venom Green
  2: '#F97316', // Ember Orange
  1: '#EF4444', // Crimson Red
};

function getLayerColor(layer: number): string {
  if (layer <= 1) return BOSS_LAYER_COLORS[1];
  if (layer >= 5) return BOSS_LAYER_COLORS[5];
  return BOSS_LAYER_COLORS[layer] ?? '#EF4444';
}

export const DungeonHud: React.FC<DungeonHudProps> = ({
  hud,
  equippedSkills,
  keybindings,
  language,
  mobileControls,
  lunaAwakening,
  velveraAwakening,
  lyraAwakening,
  witchAwakening,
  gems,
  muted,
  showTouchControls,
  onToggleMute,
  onToggleAutoCombat,
  onPause,
  onOpenSettings,
  onOpenSanctum,
  onOpenInventory,
  onTouchMove,
  onTouchDown,
  onTouchJumpStart,
  onTouchJumpEnd,
  onTouchDash,
  onTouchSkill,
  onTouchInteract,
}) => {
  const t = getUiStrings(language);
  const normalizedMc = normalizeMobileControls(mobileControls);

  const leftPointersRef = useRef<Set<number>>(new Set());
  const rightPointersRef = useRef<Set<number>>(new Set());
  const downPointersRef = useRef<Set<number>>(new Set());
  const [dpadPressed, setDpadPressed] = useState<{ left: boolean; down: boolean; right: boolean }>({
    left: false,
    down: false,
    right: false,
  });

  const syncMoveDirection = () => {
    const hasL = leftPointersRef.current.size > 0;
    const hasR = rightPointersRef.current.size > 0;
    setDpadPressed({
      left: hasL,
      down: downPointersRef.current.size > 0,
      right: hasR,
    });
    if (hasL && !hasR) onTouchMove(-1);
    else if (hasR && !hasL) onTouchMove(1);
    else onTouchMove(0);
  };

  const getBtnStyle = (id: MobileControlButtonId): React.CSSProperties => {
    const cfg = normalizedMc.buttons[id];
    return {
      opacity: Math.max(0.3, Math.min(1, cfg.opacity / 100)),
      transform: `translate(${cfg.offsetX}px, ${cfg.offsetY}px) scale(${cfg.scale})`,
      transformOrigin: 'center center',
    };
  };

  const prevComboRef = useRef<number>(hud.combo);
  const [criticalPulseCount, setCriticalPulseCount] = useState(0);
  const [criticalPulseActive, setCriticalPulseActive] = useState(false);

  useEffect(() => {
    const prev = prevComboRef.current;
    prevComboRef.current = hud.combo;
    const reachedExactMultiple =
      hud.combo > 0 && hud.combo % CRITICAL_COMBO_INTERVAL === 0 && prev !== hud.combo;
    if (reachedExactMultiple || isCriticalComboMilestone(prev, hud.combo, CRITICAL_COMBO_INTERVAL)) {
      setCriticalPulseCount((c) => c + 1);
      setCriticalPulseActive(true);
      window.dispatchEvent(
        new CustomEvent('dungeon:screen-shake', {
          detail: {
            combo: hud.combo,
            intensity: 0.55,
            durationMs: 320,
          },
        })
      );
    } else if (hud.combo === 0) {
      setCriticalPulseActive(false);
    }
  }, [hud.combo]);

  useEffect(() => {
    if (!criticalPulseActive) return;
    const timer = window.setTimeout(() => setCriticalPulseActive(false), 950);
    return () => window.clearTimeout(timer);
  }, [criticalPulseActive, criticalPulseCount]);

  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const mpPct = Math.max(0, Math.min(100, (hud.mp / Math.max(1, hud.maxMp)) * 100));

  const totalBars = Math.max(1, hud.bossTotalBars || 5);
  const layersLeft = Math.max(0, hud.bossBarsRemaining);
  const layerFillPct =
    hud.bossBarMaxHp > 0
      ? Math.max(0, Math.min(100, (hud.bossBarHp / hud.bossBarMaxHp) * 100))
      : hud.bossMaxHp > 0
        ? Math.max(0, Math.min(100, (hud.bossHp / hud.bossMaxHp) * 100))
        : 0;
  const currentLayerColor = getLayerColor(layersLeft);
  const underLayerColor = layersLeft > 1 ? getLayerColor(layersLeft - 1) : '#18131B';

  const charMeta = CHARACTER_ROSTER[hud.characterId] ?? CHARACTER_ROSTER.luna;
  const isLuna = hud.characterId === 'luna';
  const isLyra = hud.characterId === 'lyra';
  const isWitch = hud.characterId === 'witch';
  const activeAwakening = isLuna
    ? lunaAwakening
    : isWitch
      ? witchAwakening
      : isLyra
        ? lyraAwakening
        : velveraAwakening;

  const mpColorHex = isLuna
    ? '#818CF8'
    : isLyra
      ? '#F97316'
      : isWitch
        ? '#C084FC'
        : '#A855F7';

  const mm = hud.minimap;
  const chain = hud.comboChain;
  const invCount = hud.runInventory?.length ?? 0;

  const skillKeys = [
    formatKeyCodeLabel(keybindings.skill1),
    formatKeyCodeLabel(keybindings.skill2),
    formatKeyCodeLabel(keybindings.skill3),
  ];
  const interactKey = formatKeyCodeLabel(keybindings.interact);
  const invKey = formatKeyCodeLabel(keybindings.inventory);
  const dashKey = formatKeyCodeLabel(keybindings.dash);

  const renderBossBar = (compact: boolean) => (
    <div
      data-testid={compact ? 'boss-hp-bar-mobile' : 'boss-hp-bar'}
      className={`relative ${compact ? 'w-full max-w-md px-3 py-1.5' : 'w-full max-w-[384px] px-3 lg:px-4 py-1.5 lg:py-2'} border-2 border-[#B91C1C]/90 rounded-[7px]`}
      style={{
        background: 'linear-gradient(180deg, rgba(30,14,18,0.94) 0%, rgba(12,7,11,0.96) 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(254,202,202,0.18), inset 0 0 14px rgba(185,28,28,0.22), 0 8px 22px rgba(0,0,0,0.72)',
      }}
    >
      {/* Forged crimson corner studs */}
      <span aria-hidden="true" className="absolute top-1 left-1 w-1 h-1 rounded-xs bg-[#FACC15]/80" />
      <span aria-hidden="true" className="absolute top-1 right-1 w-1 h-1 rounded-xs bg-[#FACC15]/80" />
      <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-1 py-0.5 rounded-[3px] bg-[#7F1D1D] border border-[#EF4444]/75 text-[9px] font-extrabold uppercase tracking-wider text-[#FECACA] shrink-0">
            {t.bossBadge}
          </span>
          <span className="font-display font-bold text-[#FCA5A5] truncate hud-stroke">
            {hud.bossName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 font-mono-num">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#F8FAFC] hud-stroke">
            {hud.bossHp.toLocaleString('id-ID')}/{hud.bossMaxHp.toLocaleString('id-ID')}
          </span>
          <span
            className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-extrabold text-[#09090E]"
            style={{ backgroundColor: currentLayerColor }}
          >
            x{layersLeft}
          </span>
        </div>
      </div>

      {/* Stacked 5-Layer HP Bar */}
      <div
        className="relative h-2.5 sm:h-3 w-full border border-[#5C262E] rounded-[2px] overflow-hidden"
        style={{ backgroundColor: underLayerColor }}
      >
        <div
          className="h-full transition-[width] duration-75"
          style={{
            width: `${layerFillPct}%`,
            backgroundColor: currentLayerColor,
            boxShadow: `0 0 8px ${currentLayerColor}88`,
          }}
        />
      </div>

      {/* 5-Layer Pip Indicators */}
      <div className="mt-1 flex items-center gap-1">
        {Array.from({ length: totalBars }, (_, i) => {
          const layerIdx = i + 1;
          const active = layerIdx <= layersLeft;
          return (
            <span
              key={`boss-layer-${layerIdx}`}
              className="h-1 flex-1 rounded-[1px]"
              style={{
                backgroundColor: active ? getLayerColor(layerIdx) : 'rgba(51,65,85,0.45)',
              }}
            />
          );
        })}
      </div>
    </div>
  );

  const renderUtilityButtons = (compact = false) => (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <button
        type="button"
        tabIndex={-1}
        data-testid={compact ? undefined : 'toggle-auto'}
        onClick={(e) => {
          e.currentTarget.blur();
          onToggleAutoCombat();
        }}
        aria-label={hud.autoCombat ? t.autoOn : t.autoOff}
        className={`px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-[5px] border-2 text-[10px] sm:text-[11px] font-mono-num font-bold cursor-pointer whitespace-nowrap ${
          hud.autoCombat
            ? 'bg-[#1D1530] border-[#A855F7] text-[#E9D5FF]'
            : 'bg-[#0F1018] border-[#35394D] text-[#94A3B8]'
        }`}
      >
        {hud.autoCombat ? t.autoOn : t.autoOff}
      </button>

      <button
        type="button"
        tabIndex={-1}
        data-testid={compact ? 'hud-bag-btn-mobile' : 'hud-bag-btn'}
        onClick={(e) => {
          e.currentTarget.blur();
          onOpenInventory();
        }}
        aria-label={`${t.bag} (${invCount}/${MAX_RUN_INVENTORY})`}
        title={`${t.bag} [${invKey}]`}
        className="flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-[#141622] border-2 border-[#F97316]/80 hover:border-[#FB923C] rounded-[5px] text-[10px] sm:text-[11px] font-mono-num font-bold text-[#FDBA74] cursor-pointer shrink-0"
      >
        <BagFantasyIcon className="w-3.5 h-3.5 text-[#F97316]" />
        <span>
          {invCount}/{MAX_RUN_INVENTORY}
        </span>
      </button>

      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.currentTarget.blur();
          onOpenSanctum('weapon', 'weapon');
        }}
        aria-label="Sanctum"
        title="Sanctum"
        className="p-1.5 sm:p-2 bg-[#141622] border-2 border-[#5D5343] hover:border-[#A855F7] rounded-[5px] text-[#E8EEF5] cursor-pointer shrink-0"
      >
        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C084FC]" />
      </button>

      <button
        type="button"
        tabIndex={-1}
        data-testid={compact ? 'hud-settings-btn-mobile' : 'hud-settings-btn'}
        onClick={(e) => {
          e.currentTarget.blur();
          onOpenSettings();
        }}
        aria-label={t.settings}
        title={t.settings}
        className="p-1.5 sm:p-2 bg-[#141622] border-2 border-[#3C4157] hover:border-[#A855F7] rounded-[5px] text-[#E8EEF5] cursor-pointer shrink-0"
      >
        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#CBD5E1]" />
      </button>

      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.currentTarget.blur();
          onToggleMute();
        }}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="p-1.5 sm:p-2 bg-[#141622] border-2 border-[#3C4157] hover:border-[#A855F7] rounded-[5px] text-[#E8EEF5] cursor-pointer shrink-0"
      >
        {muted ? (
          <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
      </button>

      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.currentTarget.blur();
          onPause();
        }}
        aria-label="Pause"
        className="p-1.5 sm:p-2 bg-[#141622] border-2 border-[#3C4157] hover:border-[#A855F7] rounded-[5px] text-[#E8EEF5] cursor-pointer shrink-0"
      >
        <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  );

  const renderBuffChips = () => (
    <>
      {hud.hasDoubleJump && (
        <div className="inline-flex items-center gap-1 bg-[#082F49]/90 border border-[#38BDF8]/70 rounded px-1.5 py-0.5 text-[10px] font-mono-num font-bold text-[#BAE6FD] whitespace-nowrap">
          <Footprints className="w-3 h-3 text-[#38BDF8]" />
          <span>{t.doubleJumpBadge}</span>
        </div>
      )}

      {hud.auraOverdriveSec > 0 && (
        <div className="bg-[#431407]/90 border border-[#F97316] rounded px-1.5 py-0.5 text-[10px] font-mono-num font-bold text-[#FDBA74] whitespace-nowrap">
          Overdrive · {hud.auraOverdriveSec.toFixed(1)}s
        </div>
      )}

      {chain && (chain.sequence.length > 0 || chain.activeBuffName) && (
        <div
          data-testid="combo-chain-hud"
          className="bg-[#0D0E16]/92 border border-[#FACC15]/55 rounded px-1.5 py-0.5 text-[10px] font-mono-num flex flex-wrap items-center gap-1.5"
        >
          {chain.sequence.length > 0 && (
            <span className="text-[#E2E8F0] whitespace-nowrap">
              {chain.sequence.map((tag) => CHAIN_TAG_LABELS[tag]).join('→')} · {chain.windowRemainingSec}s
            </span>
          )}
          {chain.activeBuffName && (
            <span className="text-[#4ADE80] font-bold whitespace-nowrap">
              +{chain.atkSpeedBonusPct}% SPD +{chain.damageBonusPct}% DMG · {chain.buffRemainingSec}s
            </span>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between safe-hud-inset sm:p-3.5 md:p-4">
      {/* Low HP edge danger warning */}
      {hpPct <= 30 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 80px rgba(220, 38, 38, 0.35)',
          }}
        />
      )}

      {/* Top Section */}
      <div className="flex flex-col gap-1.5">
        {/* Top Row: Left Vitality · Center Stage/Boss · Right Minimap & Stone Controls */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          {/* Top-Left: Active Character Forged-Stone Vitality Plate */}
          <div className="pointer-events-auto flex flex-col gap-1.5 min-w-0">
            <div
              className="flex items-center gap-2 sm:gap-2.5 border-2 border-[#5D5343] rounded-[6px] px-2 py-1.5 sm:px-3 sm:py-2"
              style={STONE_CARD_STYLE}
            >
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-[4px] overflow-hidden shrink-0 bg-[#12131D] border-2"
                style={{ borderColor: charMeta.accentHex }}
              >
                <CleanPortrait
                  src={charMeta.portraitPath}
                  alt={charMeta.name}
                  removeSolidBg={isLuna || isWitch}
                  removeCheckerboard={isLyra}
                  faceCrop={hud.characterId}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-[96px] sm:min-w-[136px] lg:min-w-[170px]">
                <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1 gap-1.5">
                  <span className="font-display font-bold text-[#F8FAFC] tracking-wide truncate">
                    {charMeta.name} {activeAwakening > 0 ? `A${activeAwakening}` : ''}
                  </span>
                  <span className="font-mono-num text-[10px] sm:text-[11px] text-[#E2E8F0] shrink-0">
                    {hud.hp}/{hud.maxHp}
                  </span>
                </div>
                <div className="h-2 sm:h-2.5 w-full bg-[#191B26] border border-[#2C2F42] rounded-[2px] overflow-hidden mb-1">
                  <div
                    className="h-full bg-[#DC2626]"
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-1.5 flex-1 bg-[#191B26] rounded-[2px] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${mpPct}%`,
                        backgroundColor: mpColorHex,
                      }}
                    />
                  </div>
                  <span
                    className="font-mono-num text-[10px] shrink-0 font-bold"
                    style={{ color: mpColorHex }}
                  >
                    MP {hud.mp}
                  </span>
                </div>
              </div>
            </div>

            {/* Silver Counter + Active Sub-Skill Icons beneath Vitality Plate */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div
                data-testid="hud-silver-counter"
                aria-label={`${t.silverLabel} ${hud.silver}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[#94A3B8]/65 bg-[#0E1019]/95 text-[11px] font-mono-num font-bold text-[#F1F5F9]"
              >
                <SilverCoinIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{hud.silver.toLocaleString('id-ID')}</span>
                <span className="text-[9px] text-[#94A3B8] uppercase hidden sm:inline">
                  {t.silverLabel}
                </span>
              </div>

              {(hud.runSubSkills ?? []).map((sub) => (
                <div
                  key={sub.id}
                  title={`Sub-Skill Lv.${sub.level}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-[#3B3354] bg-[#12101E]/95 text-[10px] font-mono-num font-bold text-[#E9D5FF]"
                >
                  <SubSkillIcon skillId={sub.id} color="#C084FC" className="w-3 h-3 shrink-0" />
                  <span>{sub.level}</span>
                </div>
              ))}
            </div>

            {/* Desktop Concise Buff Chips beneath left vitality plate */}
            <div className="hidden md:flex flex-wrap items-center gap-1 max-w-[270px]">
              {renderBuffChips()}
            </div>
          </div>

          {/* Top-Center Desktop: 5-Layer Boss HP Bar or Chiseled Stone Stage Header */}
          <div className="hidden md:flex flex-col items-center flex-1 min-w-0 px-2">
            {hud.isBossRoom && hud.bossName ? (
              renderBossBar(false)
            ) : (
              <div
                className="text-center px-3.5 py-1.5 border-2 border-[#3C4157] rounded-[6px] max-w-full"
                style={STONE_CARD_STYLE}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="font-display text-xs lg:text-sm font-bold text-[#F8FAFC] hud-stroke truncate">
                    {t.stageLabel} {hud.stage}-{hud.subStage} · {STAGE_TITLES[hud.stage - 1]}
                  </span>
                  <span
                    data-testid="hud-beta-badge"
                    className="px-1.5 py-0.5 rounded bg-[#241A33] border border-[#8A7656]/75 font-mono-num text-[9px] font-bold tracking-wider text-[#FACC15] shrink-0"
                  >
                    {t.betaTag}
                  </span>
                </div>
                <div className="font-mono-num text-[11px] text-[#C084FC]">
                  {hud.monstersAlive} {t.enemiesCount}
                </div>
              </div>
            )}
          </div>

          {/* Top-Right: Obsidian Stone Minimap + Desktop Utility Stone Buttons */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5 shrink-0">
            <div
              data-testid="hud-minimap"
              aria-label="Minimap"
              className="border-2 border-[#5D5343] rounded-[6px] p-1.5 w-[134px] sm:w-[210px]"
              style={STONE_CARD_STYLE}
            >
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono-num text-[#CBD5E1] mb-1 px-0.5">
                <span className="font-semibold text-[#E2E8F0]">
                  S{hud.stage}-{hud.subStage}
                </span>
                <span className="hidden sm:inline text-[#94A3B8]">
                  {hud.score.toLocaleString('id-ID')}
                </span>
                <span className="inline-flex items-center gap-1 text-[#C084FC] font-semibold">
                  <Gem className="w-3 h-3" />
                  {gems.toLocaleString('id-ID')}
                </span>
              </div>

              <svg
                viewBox={`0 0 ${mm.worldW} ${mm.worldH}`}
                className="w-full h-[36px] sm:h-[52px] block rounded-sm bg-[#05060A]/75"
                role="img"
                aria-label="Stage Minimap"
              >
                {mm.floorSegments.map((seg, idx) => (
                  <rect
                    key={`fl-${idx}`}
                    x={seg.x1}
                    y={seg.y}
                    width={Math.max(10, seg.x2 - seg.x1)}
                    height={mm.worldH - seg.y}
                    fill="rgba(71, 85, 105, 0.35)"
                    stroke="rgba(148, 163, 184, 0.55)"
                    strokeWidth={10}
                  />
                ))}

                {mm.platforms.map((plat, idx) => (
                  <rect
                    key={`pl-${idx}`}
                    x={plat.x}
                    y={plat.y}
                    width={plat.w}
                    height={18}
                    rx={4}
                    fill="rgba(148, 163, 184, 0.65)"
                  />
                ))}

                {mm.supplyChests.map((ch, idx) => (
                  <rect
                    key={`sc-${idx}`}
                    x={ch.x - 28}
                    y={ch.y - 42}
                    width={56}
                    height={42}
                    rx={6}
                    fill={ch.opened ? 'rgba(71, 85, 105, 0.5)' : '#FB923C'}
                    stroke="#09090E"
                    strokeWidth={8}
                  />
                ))}

                <polygon
                  points={`${mm.tomb.x},${mm.tomb.y - 62} ${mm.tomb.x + 34},${mm.tomb.y - 28} ${mm.tomb.x},${mm.tomb.y + 6} ${mm.tomb.x - 34},${mm.tomb.y - 28}`}
                  fill={mm.tomb.opened ? 'rgba(71, 85, 105, 0.45)' : '#A855F7'}
                  stroke="#F8FAFC"
                  strokeWidth={6}
                />

                {mm.bossChest && (
                  <rect
                    x={mm.bossChest.x - 34}
                    y={mm.bossChest.y - 52}
                    width={68}
                    height={52}
                    rx={6}
                    fill={mm.bossChest.opened ? 'rgba(100,116,139,0.5)' : '#FACC15'}
                    stroke="#09090E"
                    strokeWidth={8}
                  />
                )}

                {mm.catMerchant && (
                  <g>
                    <circle
                      cx={mm.catMerchant.x}
                      cy={mm.catMerchant.y - 38}
                      r={48}
                      fill="rgba(226, 232, 240, 0.25)"
                    />
                    <circle
                      cx={mm.catMerchant.x}
                      cy={mm.catMerchant.y - 38}
                      r={28}
                      fill="#F8FAFC"
                      stroke="#38BDF8"
                      strokeWidth={10}
                    />
                  </g>
                )}

                {mm.portal && (
                  <g>
                    <circle
                      cx={mm.portal.x}
                      cy={mm.portal.y - 52}
                      r={62}
                      fill="rgba(232, 121, 249, 0.25)"
                    />
                    <ellipse
                      cx={mm.portal.x}
                      cy={mm.portal.y - 52}
                      rx={32}
                      ry={52}
                      fill="#E879F9"
                      stroke="#F8FAFC"
                      strokeWidth={8}
                    />
                  </g>
                )}

                <circle
                  cx={mm.playerX}
                  cy={mm.playerY - 40}
                  r={40}
                  fill={charMeta.accentHex}
                  stroke="#FFFFFF"
                  strokeWidth={14}
                />
              </svg>
            </div>

            {/* Utility Buttons Row beneath Minimap on Desktop only */}
            <div className="hidden md:flex">{renderUtilityButtons(false)}</div>
          </div>
        </div>

        {/* Mobile Row 2: Compact Stage/Enemy Pill (left) + Utility Buttons Row (right) - Zero overlap on 390px */}
        <div className="md:hidden pointer-events-auto flex items-center justify-between gap-1.5 w-full">
          <div
            data-testid="hud-mobile-stage-pill"
            className="bg-[#0D0E16]/90 border border-[#3E4257] rounded px-1.5 py-0.5 text-[10px] font-mono-num text-[#E2E8F0] whitespace-nowrap shrink-0"
          >
            S{hud.stage}-{hud.subStage} · {hud.monstersAlive} {t.enemiesCount}
          </div>
          <div data-testid="hud-mobile-utility-row" className="shrink-0">
            {renderUtilityButtons(true)}
          </div>
        </div>

        {/* Mobile Buff Chips beneath Row 2 */}
        <div className="md:hidden flex flex-wrap items-center gap-1 w-full">
          {renderBuffChips()}
        </div>

        {/* Mobile Boss 5-Layer HP Bar */}
        {hud.isBossRoom && hud.bossName && (
          <div className="md:hidden flex justify-center w-full">{renderBossBar(true)}</div>
        )}
      </div>

      {/* Transient Stage / Boss / Loot Announcement Banner */}
      {hud.inRunBanner && (
        <div
          className="self-center px-5 py-1.5 border-2 border-[#A855F7]/75 rounded-[6px]"
          style={STONE_CARD_STYLE}
        >
          <p className="font-display text-sm sm:text-base md:text-lg font-bold tracking-wider text-[#F3E8FF] text-center">
            {hud.inRunBanner}
          </p>
        </div>
      )}

      {/* Visually Prominent Combo Counter with Depleting Timer Bar & Critical 50x Pulse */}
      {hud.combo >= 1 && hud.comboTimerPct > 0 && (
        <div className="self-start sm:self-end pl-1 sm:pl-0 sm:pr-2 md:pr-5 my-auto">
          <div
            key={criticalPulseActive ? `crit-${criticalPulseCount}` : 'combo-steady'}
            data-testid="hud-combo-counter"
            data-critical={criticalPulseActive ? 'true' : 'false'}
            aria-label={`${hud.combo}x Combo`}
            className={`relative min-w-[126px] sm:min-w-[156px] px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-[6px] border-2 text-right transition-colors ${
              criticalPulseActive ? 'critical-combo-pulse' : ''
            }`}
            style={{
              ...STONE_CARD_STYLE,
              borderColor: criticalPulseActive
                ? '#FEF08A'
                : hud.combo >= 50
                  ? '#FACC15'
                  : hud.combo >= 25
                    ? '#FACC15'
                    : hud.combo >= 10
                      ? '#F97316'
                      : charMeta.accentHex,
              boxShadow: criticalPulseActive
                ? '0 0 28px rgba(250, 204, 21, 0.72), 0 0 18px rgba(192, 132, 252, 0.6)'
                : hud.combo >= 10
                  ? `0 6px 20px rgba(0,0,0,0.65), 0 0 14px ${hud.combo >= 25 ? 'rgba(250,204,21,0.28)' : 'rgba(249,115,22,0.24)'}`
                  : '0 6px 18px rgba(0,0,0,0.6)',
            }}
          >
            {criticalPulseActive && (
              <div
                data-testid="hud-critical-combo-badge"
                className="mb-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FACC15]/20 border border-[#FEF08A]/80 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#FEF08A] hud-stroke"
              >
                <Sparkles className="w-2.5 h-2.5 text-[#FACC15]" />
                <span>{language === 'en' ? 'CRITICAL COMBO!' : 'KOMBO KRITIS!'}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#CBD5E1] hud-stroke">
                {criticalPulseActive
                  ? language === 'en'
                    ? 'Critical!'
                    : 'Kritis!'
                  : hud.combo >= 25
                    ? 'Abyssal'
                    : hud.combo >= 10
                      ? language === 'en'
                        ? 'Frenzy'
                        : 'Amukan'
                      : language === 'en'
                        ? 'Combo'
                        : 'Kombo'}
              </span>
              <span
                className="font-mono-num text-2xl sm:text-3xl font-extrabold leading-none hud-stroke"
                style={{
                  color: criticalPulseActive
                    ? '#FEF08A'
                    : hud.combo >= 25
                      ? '#FDE047'
                      : charMeta.accentHex,
                }}
              >
                {hud.combo}x
              </span>
            </div>

            <div
              className="mt-1.5 h-2 w-full rounded-full bg-[#07080D] border border-[#2C3147] overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.max(0, Math.min(100, Math.round(hud.comboTimerPct * 100)))}
            >
              <div
                data-testid="hud-combo-timer-bar"
                className="h-full rounded-full transition-[width] duration-75 ease-linear"
                style={{
                  width: `${Math.max(0, Math.min(100, Math.round(hud.comboTimerPct * 100)))}%`,
                  background:
                    hud.comboTimerPct < 0.35
                      ? 'linear-gradient(90deg, #DC2626 0%, #F97316 100%)'
                      : hud.combo >= 25
                        ? 'linear-gradient(90deg, #F59E0B 0%, #FEF08A 100%)'
                        : `linear-gradient(90deg, ${charMeta.accentHex} 0%, #FDE047 100%)`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row: Forged Semi-Transparent Multi-Touch Dark-Fantasy Controls */}
      {showTouchControls ? (
        <div className="flex items-end justify-between w-full gap-2">
          {/* Left Stone D-Pad: Left, Down, Right (Multi-Touch PointerEvents) */}
          <div
            data-testid="dungeon-touch-dpad"
            className="pointer-events-auto flex items-center gap-2"
          >
            <button
              type="button"
              tabIndex={-1}
              data-testid="dungeon-dpad-left"
              onPointerDown={(e) => {
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                leftPointersRef.current.add(e.pointerId);
                syncMoveDirection();
              }}
              onPointerUp={(e) => {
                leftPointersRef.current.delete(e.pointerId);
                syncMoveDirection();
              }}
              onPointerCancel={(e) => {
                leftPointersRef.current.delete(e.pointerId);
                syncMoveDirection();
              }}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={language === 'en' ? 'Move Left' : 'Gerak Kiri'}
              className={`mobile-dpad-btn w-12 h-12 rounded-[8px] border-2 font-bold text-lg flex items-center justify-center transition-transform ${
                dpadPressed.left
                  ? 'border-[#FACC15] bg-[#2D1A44]/90 text-[#FEF08A] scale-95 shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                  : 'border-[#6B5B45]/90 bg-[#141624]/82 text-[#F8FAFC]'
              }`}
              style={{
                ...getBtnStyle('left'),
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              ◀
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="dungeon-dpad-down"
              onPointerDown={(e) => {
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                downPointersRef.current.add(e.pointerId);
                setDpadPressed((p) => ({ ...p, down: true }));
                onTouchDown(true);
              }}
              onPointerUp={(e) => {
                downPointersRef.current.delete(e.pointerId);
                const active = downPointersRef.current.size > 0;
                setDpadPressed((p) => ({ ...p, down: active }));
                onTouchDown(active);
              }}
              onPointerCancel={(e) => {
                downPointersRef.current.delete(e.pointerId);
                const active = downPointersRef.current.size > 0;
                setDpadPressed((p) => ({ ...p, down: active }));
                onTouchDown(active);
              }}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={language === 'en' ? 'Drop Down' : 'Turun'}
              className={`mobile-dpad-btn w-12 h-12 rounded-[8px] border-2 font-bold text-lg flex items-center justify-center transition-transform ${
                dpadPressed.down
                  ? 'border-[#FACC15] bg-[#2D1A44]/90 text-[#FEF08A] scale-95 shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                  : 'border-[#6B5B45]/90 bg-[#141624]/82 text-[#CBD5E1]'
              }`}
              style={{
                ...getBtnStyle('down'),
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              ▼
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="dungeon-dpad-right"
              onPointerDown={(e) => {
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                rightPointersRef.current.add(e.pointerId);
                syncMoveDirection();
              }}
              onPointerUp={(e) => {
                rightPointersRef.current.delete(e.pointerId);
                syncMoveDirection();
              }}
              onPointerCancel={(e) => {
                rightPointersRef.current.delete(e.pointerId);
                syncMoveDirection();
              }}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={language === 'en' ? 'Move Right' : 'Gerak Kanan'}
              className={`mobile-dpad-btn w-12 h-12 rounded-[8px] border-2 font-bold text-lg flex items-center justify-center transition-transform ${
                dpadPressed.right
                  ? 'border-[#FACC15] bg-[#2D1A44]/90 text-[#FEF08A] scale-95 shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                  : 'border-[#6B5B45]/90 bg-[#141624]/82 text-[#F8FAFC]'
              }`}
              style={{
                ...getBtnStyle('right'),
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              ▶
            </button>
          </div>

          {/* Right Action Cluster: Interact + Skills [1][2][3] + Dash + Jump */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            {hud.nearInteractable && (
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-interact-btn"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onTouchInteract();
                }}
                onContextMenu={(e) => e.preventDefault()}
                style={getBtnStyle('interact')}
                className="mobile-interact-btn px-3.5 h-9 rounded-[6px] bg-[#FACC15] border-2 border-[#FEF08A] text-[#09090E] font-bold text-[11px] shadow-lg"
              >
                {language === 'en'
                  ? hud.nearInteractable === 'chest'
                    ? 'Open Skill Chest'
                    : hud.nearInteractable === 'tomb'
                      ? 'Inspect Tomb'
                      : hud.nearInteractable === 'supply'
                        ? 'Open Supply Chest'
                        : hud.nearInteractable === 'cat_merchant'
                          ? 'White Cat Shop'
                          : 'Enter Portal'
                  : hud.nearInteractable === 'chest'
                    ? 'Buka Peti Skill'
                    : hud.nearInteractable === 'tomb'
                      ? 'Periksa Makam'
                      : hud.nearInteractable === 'supply'
                        ? 'Buka Peti Oranye'
                        : hud.nearInteractable === 'cat_merchant'
                          ? 'Toko Kucing Putih'
                          : 'Masuk Portal'}
              </button>
            )}

            <div
              data-testid="dungeon-touch-skills"
              className="flex items-start gap-2 flex-nowrap justify-end"
            >
              {equippedSkills.map((skillId, idx) => {
                const def = ACTIVE_SKILLS[skillId];
                const cd = hud.skillCooldowns[idx];
                const maxCd = hud.skillMaxCooldowns[idx] ?? def.cooldown;
                const state = cd > 0 ? 'cooldown' : hud.mp < def.mpCost ? 'locked' : 'ready';
                const btnId = (`skill${idx + 1}`) as MobileControlButtonId;
                return (
                  <StoneActionButton
                    key={`${skillId}-${idx}`}
                    size="sm"
                    controlClass="mobile-skill-btn"
                    fireOnPointerDown
                    onClick={() => onTouchSkill(idx as 0 | 1 | 2)}
                    ariaLabel={`Skill ${idx + 1}: ${def.name} (${def.roleLabel})`}
                    title={`${def.name} · ${def.mpCost} MP`}
                    accentHex={def.accentHex}
                    state={state}
                    cooldownSec={cd}
                    maxCooldownSec={maxCd}
                    keyBadge={`${idx + 1}`}
                    subBadge={`${def.mpCost}`}
                    roleLabel={compactSkillRoleLabel(def.roleLabel)}
                    wrapperStyle={getBtnStyle(btnId)}
                  >
                    <SkillFantasyIcon skillId={skillId} className="w-4 h-4" />
                  </StoneActionButton>
                );
              })}
            </div>

            <div
              data-testid="dungeon-touch-action"
              className="flex items-start gap-2"
            >
              <StoneActionButton
                size="sm"
                controlClass="mobile-dash-btn"
                fireOnPointerDown
                onClick={onTouchDash}
                ariaLabel={t.dash}
                accentHex="#B09567"
                state={hud.dashCooldown > 0 ? 'cooldown' : 'ready'}
                cooldownSec={hud.dashCooldown}
                maxCooldownSec={1.4}
                roleLabel={t.dash}
                wrapperStyle={getBtnStyle('dash')}
              >
                <DashFantasyIcon className="w-4 h-4" />
              </StoneActionButton>

              <StoneActionButton
                size="sm"
                controlClass="mobile-jump-btn"
                onClick={onTouchJumpStart}
                onPressStart={onTouchJumpStart}
                onPressEnd={onTouchJumpEnd}
                ariaLabel={t.jump}
                accentHex="#38BDF8"
                state="ready"
                roleLabel={t.jump}
                wrapperStyle={getBtnStyle('jump')}
              >
                <JumpFantasyIcon className="w-4 h-4" />
              </StoneActionButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div
            className="text-[11px] text-[#94A3B8] px-3 py-1.5 rounded-[5px] border border-[#34384B]"
            style={STONE_CARD_STYLE}
          >
            {language === 'en'
              ? `${formatKeyCodeLabel(keybindings.left)}/${formatKeyCodeLabel(keybindings.right)} Move · ${formatKeyCodeLabel(keybindings.jump)} Jump · ${formatKeyCodeLabel(keybindings.down)} Drop · ${dashKey} Dash · ${invKey} Bag · ${interactKey} Interact`
              : `${formatKeyCodeLabel(keybindings.left)}/${formatKeyCodeLabel(keybindings.right)} Gerak · ${formatKeyCodeLabel(keybindings.jump)} Lompat · ${formatKeyCodeLabel(keybindings.down)} Turun · ${dashKey} Dash · ${invKey} Tas · ${interactKey} Interaksi`}
          </div>

          <div className="pointer-events-auto flex items-end gap-3">
            {hud.nearInteractable && (
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-interact-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTouchInteract();
                }}
                className="mb-3 px-4 py-2 rounded-[5px] bg-[#FACC15] hover:bg-[#FDE047] border-2 border-[#FEF08A] text-[#09090E] font-bold text-xs cursor-pointer shadow-lg"
              >
                {language === 'en'
                  ? hud.nearInteractable === 'chest'
                    ? `[${interactKey}] Open Skill Chest`
                    : hud.nearInteractable === 'tomb'
                      ? `[${interactKey}] Inspect Tomb`
                      : hud.nearInteractable === 'supply'
                        ? `[${interactKey}] Open Supply Chest`
                        : hud.nearInteractable === 'cat_merchant'
                          ? `[${interactKey}] White Cat Shop`
                          : `[${interactKey}] Enter Portal`
                  : hud.nearInteractable === 'chest'
                    ? `[${interactKey}] Buka Peti Skill`
                    : hud.nearInteractable === 'tomb'
                      ? `[${interactKey}] Periksa Makam Skill`
                      : hud.nearInteractable === 'supply'
                        ? `[${interactKey}] Buka Peti Oranye`
                        : hud.nearInteractable === 'cat_merchant'
                          ? `[${interactKey}] Toko Kucing Putih`
                          : `[${interactKey}] Masuk Portal`}
              </button>
            )}

            <div className="flex items-start gap-2.5">
              {/* Character Active Skills [1][2][3] ONLY (Auto Basic Attack, NO manual Serang / NO [4][5]) */}
              {equippedSkills.map((skillId, idx) => {
                const def = ACTIVE_SKILLS[skillId];
                const cd = hud.skillCooldowns[idx];
                const maxCd = hud.skillMaxCooldowns[idx] ?? def.cooldown;
                const state = cd > 0 ? 'cooldown' : hud.mp < def.mpCost ? 'locked' : 'ready';
                return (
                  <StoneActionButton
                    key={`${skillId}-${idx}`}
                    onClick={() => onTouchSkill(idx as 0 | 1 | 2)}
                    ariaLabel={`Skill ${idx + 1}: ${def.name} (${def.roleLabel})`}
                    title={`${def.name} · ${def.mpCost} MP`}
                    accentHex={def.accentHex}
                    state={state}
                    cooldownSec={cd}
                    maxCooldownSec={maxCd}
                    keyBadge={skillKeys[idx]}
                    subBadge={`${def.mpCost}MP`}
                    roleLabel={compactSkillRoleLabel(def.roleLabel)}
                  >
                    <SkillFantasyIcon skillId={skillId} className="w-5 h-5" />
                  </StoneActionButton>
                );
              })}

              {/* Dash Stone Button */}
              <StoneActionButton
                onClick={onTouchDash}
                ariaLabel={`Dash [${dashKey}]`}
                title={`Dash [${dashKey}]`}
                accentHex="#B09567"
                state={hud.dashCooldown > 0 ? 'cooldown' : 'ready'}
                cooldownSec={hud.dashCooldown}
                maxCooldownSec={1.4}
                keyBadge={dashKey}
                subBadge={language === 'en' ? 'Ready' : 'Siap'}
                roleLabel={t.dash}
              >
                <DashFantasyIcon className="w-5 h-5" />
              </StoneActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
