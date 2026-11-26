import React, { useRef, useState } from 'react';
import { Coins, Gem } from 'lucide-react';
import { getUiStrings } from '../game/i18n';
import { ACTIVE_SKILLS, CHARACTER_ROSTER } from '../game/progression';
import { formatKeyCodeLabel, normalizeMobileControls } from '../game/storage';
import type {
  ActiveSkillId,
  HudSnapshot,
  LanguageCode,
  LobbyInteractableKind,
  MobileControlButtonId,
  SaveData,
} from '../game/types';
import { CleanPortrait } from './CleanPortrait';
import {
  compactSkillRoleLabel,
  DashFantasyIcon,
  JumpFantasyIcon,
  LobbyBagSatchelIcon,
  LobbyCharacterEmblemIcon,
  LobbyDailyCalendarIcon,
  LobbyEventBellIcon,
  LobbyGachaPortalIcon,
  LobbySettingsRuneIcon,
  SkillFantasyIcon,
  StoneActionButton,
} from './FantasyActionUi';
import type { SanctumScope, SanctumTab } from './SanctumModal';

interface LobbyHudProps {
  hud: HudSnapshot;
  save: SaveData;
  equippedSkills: [ActiveSkillId, ActiveSkillId, ActiveSkillId];
  unreadEvents: number;
  dailyClaimable: boolean;
  showTouchControls: boolean;
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

const STONE_BAR_STYLE: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(22,24,36,0.94) 0%, rgba(11,12,19,0.96) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 14px rgba(0,0,0,0.5)',
};

const FORGED_ICON_BTN_BASE: React.CSSProperties = {
  background: 'linear-gradient(180deg, #1E2032 0%, #12131E 58%, #090A10 100%)',
};

function getLobbyPromptLabel(
  kind: LobbyInteractableKind,
  interactKey: string,
  lang: LanguageCode
): string {
  if (lang === 'en') {
    switch (kind) {
      case 'stage_portal':
        return `[${interactKey}] Enter Stage Portal`;
      case 'gacha_statue':
        return `[${interactKey}] Open Gacha Statue`;
      case 'weapon_shop':
        return `[${interactKey}] Weapon Merchant`;
      case 'enchant_portal':
        return `[${interactKey}] Enchant Room`;
      case 'enchant_altar':
        return `[${interactKey}] Enchant & Forge Altar`;
      case 'return_portal':
        return `[${interactKey}] Main Lobby`;
      case 'training_dummy':
        return 'Training Dummy · Auto Test';
    }
  }
  switch (kind) {
    case 'stage_portal':
      return `[${interactKey}] Masuk Portal Stage`;
    case 'gacha_statue':
      return `[${interactKey}] Buka Patung Gacha`;
    case 'weapon_shop':
      return `[${interactKey}] Pedagang Senjata`;
    case 'enchant_portal':
      return `[${interactKey}] Ruang Enchant`;
    case 'enchant_altar':
      return `[${interactKey}] Altar Enchant & Forge`;
    case 'return_portal':
      return `[${interactKey}] Lobi Utama`;
    case 'training_dummy':
      return 'Orang Sawah · Tes Damage';
  }
}

export const LobbyHud: React.FC<LobbyHudProps> = ({
  hud,
  save,
  equippedSkills,
  unreadEvents,
  dailyClaimable,
  showTouchControls,
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
  const lang = save.language ?? 'id';
  const t = getUiStrings(lang);
  const mc = normalizeMobileControls(save.mobileControls);

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
    const cfg = mc.buttons[id];
    return {
      opacity: Math.max(0.3, Math.min(1, cfg.opacity / 100)),
      transform: `translate(${cfg.offsetX}px, ${cfg.offsetY}px) scale(${cfg.scale})`,
      transformOrigin: 'center center',
    };
  };

  const charMeta = CHARACTER_ROSTER[save.selectedCharacter] ?? CHARACTER_ROSTER.velvera;
  const isLuna = save.selectedCharacter === 'luna';
  const isLyra = save.selectedCharacter === 'lyra';
  const isWitch = save.selectedCharacter === 'witch';
  const kb = save.keybindings;
  const skillKeys = [
    formatKeyCodeLabel(kb.skill1),
    formatKeyCodeLabel(kb.skill2),
    formatKeyCodeLabel(kb.skill3),
  ];
  const dashKey = formatKeyCodeLabel(kb.dash);
  const interactKey = formatKeyCodeLabel(kb.interact);

  const showDummyBar = hud.dummyMaxHit > 0 || hud.dummyLastHit > 0 || hud.dummyDps > 0;
  const hasEventAlert = unreadEvents > 0;
  const hasDailyAlert = dailyClaimable;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between safe-hud-inset sm:p-4">
      {/* Top Bar: Left Currencies + Active Hero Badge · Right 2x2 Dark Fantasy Icon-Only Grid */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left Cluster: Strictly Diamond, Gold, and Hero Profile Badge */}
        <div
          data-testid="lobby-top-left"
          className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0"
        >
          <div
            aria-label={`Gems ${save.gems}`}
            className="flex items-center gap-1 sm:gap-1.5 border-2 border-[#7E22CE]/65 rounded-[5px] px-2 py-1 sm:px-2.5 sm:py-1.5"
            style={STONE_BAR_STYLE}
          >
            <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C084FC] shrink-0" />
            <span className="font-mono-num text-[11px] sm:text-sm font-bold text-[#F3E8FF] leading-none">
              {save.gems.toLocaleString('id-ID')}
            </span>
          </div>

          <div
            aria-label={`Gold ${save.gold}`}
            className="flex items-center gap-1 sm:gap-1.5 border-2 border-[#8A7656]/75 rounded-[5px] px-2 py-1 sm:px-2.5 sm:py-1.5"
            style={STONE_BAR_STYLE}
          >
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FACC15] shrink-0" />
            <span className="font-mono-num text-[11px] sm:text-sm font-bold text-[#FEF08A] leading-none">
              {save.gold.toLocaleString('id-ID')}
            </span>
          </div>

          <button
            type="button"
            data-testid="lobby-profile-badge"
            onClick={() => onOpenSanctum('skills')}
            className="flex items-center gap-1.5 sm:gap-2 border-2 border-[#5D5343] hover:border-[#C084FC] rounded-[5px] px-2 py-0.5 sm:px-2.5 sm:py-1 text-left cursor-pointer"
            style={STONE_BAR_STYLE}
            aria-label={`${charMeta.name} Lv.${save.characterLevel}`}
          >
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-[3px] overflow-hidden bg-[#12131D] border shrink-0"
              style={{ borderColor: charMeta.accentHex }}
            >
              <CleanPortrait
                src={charMeta.portraitPath}
                alt={charMeta.name}
                removeSolidBg={isLuna || isWitch}
                removeCheckerboard={isLyra}
                faceCrop={save.selectedCharacter}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-[#F8FAFC] whitespace-nowrap">
              <span>{charMeta.name}</span>
              <span className="font-mono-num text-[10px] sm:text-[11px] text-[#C084FC]">
                Lv.{save.characterLevel}
              </span>
            </div>
          </button>
        </div>

        {/* Top-Right Cluster: Compact 2x3 Dark Fantasy Icon Grid (Event beside Karakter, Harian beside Gacha) */}
        <div
          data-testid="lobby-top-right-grid"
          className="pointer-events-auto grid grid-cols-3 gap-1.5 shrink-0"
        >
          {/* Row 1 Col 1: Event (directly beside Character) */}
          <button
            type="button"
            data-testid="lobby-event-btn"
            onClick={() => onOpenSanctum('events', 'events')}
            aria-label={t.lobbyEventBtn}
            title={t.lobbyEventBtn}
            className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-[6px] border-2 border-[#8A7656]/85 hover:border-[#FACC15] flex items-center justify-center text-[#FACC15] transition-transform active:scale-95 cursor-pointer"
            style={{
              ...FORGED_ICON_BTN_BASE,
              boxShadow:
                'inset 0 1px 0 rgba(254,240,138,0.16), inset 0 -2px 0 rgba(0,0,0,0.72), 0 4px 12px rgba(0,0,0,0.55)',
            }}
          >
            <span aria-hidden="true" className="absolute top-0.5 left-0.5 w-1 h-1 rounded-xs bg-[#D4B475]/80" />
            <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-xs bg-[#D4B475]/80" />
            {hasEventAlert && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FACC15] border border-[#09090E]"
              />
            )}
            <LobbyEventBellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Row 1 Col 2: Character (Skills, Hero Switch, Passives) */}
          <button
            type="button"
            data-testid="lobby-character-btn"
            onClick={() => onOpenSanctum('skills', 'character')}
            aria-label={t.lobbyCharacterBtn}
            title={t.lobbyCharacterBtn}
            className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-[6px] border-2 border-[#7E22CE]/80 hover:border-[#C084FC] flex items-center justify-center text-[#C084FC] transition-transform active:scale-95 cursor-pointer"
            style={{
              ...FORGED_ICON_BTN_BASE,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -2px 0 rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.55)',
            }}
          >
            <span aria-hidden="true" className="absolute top-0.5 left-0.5 w-1 h-1 rounded-xs bg-[#D4B475]/80" />
            <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-xs bg-[#D4B475]/80" />
            <LobbyCharacterEmblemIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Row 1 Col 3: Settings */}
          <button
            type="button"
            data-testid="lobby-settings-btn"
            onClick={onOpenSettings}
            aria-label={t.lobbySettingBtn}
            title={t.lobbySettingBtn}
            className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-[6px] border-2 border-[#475569]/85 hover:border-[#94A3B8] flex items-center justify-center text-[#94A3B8] transition-transform active:scale-95 cursor-pointer"
            style={{
              ...FORGED_ICON_BTN_BASE,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.55)',
            }}
          >
            <span aria-hidden="true" className="absolute top-0.5 left-0.5 w-1 h-1 rounded-xs bg-[#64748B]" />
            <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-xs bg-[#64748B]" />
            <LobbySettingsRuneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Row 2 Col 1: Daily (directly beside Gacha) */}
          <button
            type="button"
            data-testid="lobby-daily-btn"
            onClick={() => onOpenSanctum('daily', 'daily')}
            aria-label={t.lobbyDailyBtn}
            title={t.lobbyDailyBtn}
            className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-[6px] border-2 border-[#38BDF8]/75 hover:border-[#7DD3FC] flex items-center justify-center text-[#38BDF8] transition-transform active:scale-95 cursor-pointer"
            style={{
              ...FORGED_ICON_BTN_BASE,
              boxShadow:
                'inset 0 1px 0 rgba(186,230,253,0.16), inset 0 -2px 0 rgba(0,0,0,0.72), 0 4px 12px rgba(0,0,0,0.55)',
            }}
          >
            <span aria-hidden="true" className="absolute top-0.5 left-0.5 w-1 h-1 rounded-xs bg-[#38BDF8]/80" />
            <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-xs bg-[#38BDF8]/80" />
            {hasDailyAlert && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FACC15] border border-[#09090E]"
              />
            )}
            <LobbyDailyCalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Row 2 Col 2: Gacha */}
          <button
            type="button"
            data-testid="lobby-gacha-btn"
            onClick={() => onOpenSanctum('gacha', 'gacha')}
            aria-label={t.lobbyGachaBtn}
            title={t.lobbyGachaBtn}
            className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-[6px] border-2 border-[#9333EA]/85 hover:border-[#E879F9] flex items-center justify-center text-[#D8B4FE] transition-transform active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, #27173D 0%, #160D26 60%, #0B0714 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(233,213,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.75), 0 0 12px rgba(147,51,234,0.35)',
            }}
          >
            <span aria-hidden="true" className="absolute top-0.5 left-0.5 w-1 h-1 rounded-xs bg-[#C084FC]" />
            <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-xs bg-[#C084FC]" />
            <LobbyGachaPortalIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Row 2 Col 3: Bag / Tas */}
          <button
            type="button"
            data-testid="lobby-bag-btn"
            onClick={onOpenInventory}
            aria-label={t.bag}
            title={t.bag}
            className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-[6px] border-2 border-[#8A7656]/85 hover:border-[#FACC15] flex items-center justify-center text-[#D4B475] transition-transform active:scale-95 cursor-pointer"
            style={{
              ...FORGED_ICON_BTN_BASE,
              boxShadow:
                'inset 0 1px 0 rgba(254,240,138,0.14), inset 0 -2px 0 rgba(0,0,0,0.72), 0 4px 12px rgba(0,0,0,0.55)',
            }}
          >
            <span aria-hidden="true" className="absolute top-0.5 left-0.5 w-1 h-1 rounded-xs bg-[#D4B475]" />
            <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-xs bg-[#D4B475]" />
            <LobbyBagSatchelIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Orang Sawah DPS / Damage Test Readout (Auto-hides after 15s inactivity) */}
      <div className="flex justify-center pointer-events-none">
        {showDummyBar && (
          <div
            data-testid="lobby-dummy-bar"
            className="border-2 border-[#8A7656] rounded-[5px] px-3.5 py-1.5 flex items-center gap-4 text-xs shadow-lg"
            style={STONE_BAR_STYLE}
          >
            <span className="font-bold text-[#FACC15]">{t.lobbyDummyLabel}</span>
            <span className="font-mono-num text-[#E2E8F0]">
              {t.lobbyDummyHit}: <strong className="text-[#FFFFFF]">{hud.dummyLastHit}</strong>
            </span>
            <span className="font-mono-num text-[#E2E8F0]">
              {t.lobbyDummyMax}: <strong className="text-[#C084FC]">{hud.dummyMaxHit}</strong>
            </span>
            <span className="font-mono-num text-[#E2E8F0]">
              {t.lobbyDummyDps}: <strong className="text-[#38BDF8]">{hud.dummyDps}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls: Forged Semi-Transparent Multi-Touch Dark-Fantasy Controls */}
      {showTouchControls ? (
        <div className="flex items-end justify-between w-full gap-2">
          {/* Left Stone D-Pad (Multi-Touch PointerEvents) */}
          <div
            data-testid="lobby-touch-dpad"
            className="pointer-events-auto flex items-center gap-2"
          >
            <button
              type="button"
              tabIndex={-1}
              data-testid="lobby-dpad-left"
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
              aria-label={lang === 'en' ? 'Move Left' : 'Gerak Kiri'}
              className={`mobile-dpad-btn w-12 h-12 rounded-[8px] border-2 font-bold text-lg flex items-center justify-center transition-transform ${
                dpadPressed.left
                  ? 'border-[#FACC15] bg-[#2D1A44]/90 text-[#FEF08A] scale-95 shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                  : 'border-[#6B5B45]/90 bg-[#141624]/82 text-[#F8FAFC]'
              }`}
              style={getBtnStyle('left')}
            >
              ◀
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="lobby-dpad-down"
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
              aria-label={lang === 'en' ? 'Drop Down' : 'Turun'}
              className={`mobile-dpad-btn w-12 h-12 rounded-[8px] border-2 font-bold text-lg flex items-center justify-center transition-transform ${
                dpadPressed.down
                  ? 'border-[#FACC15] bg-[#2D1A44]/90 text-[#FEF08A] scale-95 shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                  : 'border-[#6B5B45]/90 bg-[#141624]/82 text-[#CBD5E1]'
              }`}
              style={getBtnStyle('down')}
            >
              ▼
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="lobby-dpad-right"
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
              aria-label={lang === 'en' ? 'Move Right' : 'Gerak Kanan'}
              className={`mobile-dpad-btn w-12 h-12 rounded-[8px] border-2 font-bold text-lg flex items-center justify-center transition-transform ${
                dpadPressed.right
                  ? 'border-[#FACC15] bg-[#2D1A44]/90 text-[#FEF08A] scale-95 shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                  : 'border-[#6B5B45]/90 bg-[#141624]/82 text-[#F8FAFC]'
              }`}
              style={getBtnStyle('right')}
            >
              ▶
            </button>
          </div>

          {/* Right: Skills + Dash + Jump + Interact */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            {hud.nearLobbyObject && hud.nearLobbyObject !== 'training_dummy' && (
              <button
                type="button"
                tabIndex={-1}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onTouchInteract();
                }}
                onContextMenu={(e) => e.preventDefault()}
                style={getBtnStyle('interact')}
                className="mobile-interact-btn px-3.5 h-9 rounded-[6px] bg-[#FACC15] border-2 border-[#FEF08A] text-[#09090E] font-bold text-[11px] shadow-lg"
              >
                {hud.nearLobbyObject === 'weapon_shop'
                  ? lang === 'en'
                    ? 'Merchant'
                    : 'Pedagang'
                  : t.lobbyInteractBtn}
              </button>
            )}

            <div
              data-testid="lobby-touch-skills"
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
              data-testid="lobby-touch-action"
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
            style={STONE_BAR_STYLE}
          >
            {lang === 'en'
              ? `${formatKeyCodeLabel(kb.left)}/${formatKeyCodeLabel(kb.right)} Move · ${formatKeyCodeLabel(kb.jump)} Jump · ${formatKeyCodeLabel(kb.down)} Drop · ${skillKeys.join('/')} Skill · ${dashKey} Dash · ${interactKey} Interact`
              : `${formatKeyCodeLabel(kb.left)}/${formatKeyCodeLabel(kb.right)} Gerak · ${formatKeyCodeLabel(kb.jump)} Lompat · ${formatKeyCodeLabel(kb.down)} Turun · ${skillKeys.join('/')} Skill · ${dashKey} Dash · ${interactKey} Interaksi`}
          </div>

          <div className="pointer-events-auto flex items-end gap-3">
            {hud.nearLobbyObject && hud.nearLobbyObject !== 'training_dummy' && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTouchInteract();
                }}
                className="px-4 py-2 mb-3 rounded-[5px] bg-[#FACC15] hover:bg-[#FDE047] border-2 border-[#FEF08A] text-[#09090E] font-bold text-xs cursor-pointer shadow-lg"
              >
                {getLobbyPromptLabel(hud.nearLobbyObject, interactKey, lang)}
              </button>
            )}

            <div className="flex items-start gap-2.5">
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

              <StoneActionButton
                onClick={onTouchDash}
                ariaLabel={`Dash [${dashKey}]`}
                accentHex="#B09567"
                state={hud.dashCooldown > 0 ? 'cooldown' : 'ready'}
                cooldownSec={hud.dashCooldown}
                maxCooldownSec={1.4}
                keyBadge={dashKey}
                subBadge={lang === 'en' ? 'Ready' : 'Siap'}
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
