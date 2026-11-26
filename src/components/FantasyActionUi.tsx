import React from 'react';
import type { ActiveSkillId, CharacterId } from '../game/types';

interface SkillIconProps {
  skillId: ActiveSkillId;
  className?: string;
}

export const SkillFantasyIcon: React.FC<SkillIconProps> = ({
  skillId,
  className = 'w-5 h-5',
}) => {
  switch (skillId) {
    case 'luna_soul_harvest':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 19L15 8M15 8C18.5 5 20.5 6.5 19.5 11.5C18.5 7.5 16 7 12.5 9.5L15 8Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 5.5C11.5 4.2 16 6.2 18 10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      );
    case 'luna_umbral_rush':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M3 16L13 6L11.5 12.5L21 8L11 18L12.5 11.5L3 16Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'luna_lunar_eclipse':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M15.5 4.5A7.5 7.5 0 1 0 19.5 16A6 6 0 1 1 15.5 4.5Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <circle cx="17.5" cy="7.5" r="1.4" fill="currentColor" />
        </svg>
      );
    case 'void_tempest':
    case 'demon_eclipse':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 12A8 8 0 0 1 18 6M20 12A8 8 0 0 1 6 18"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M8 8L16 16M16 8L8 16"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'phantom_blink':
    case 'witch_void_vortex':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2.5" />
          <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'abyssal_crescent':
    case 'soul_rend':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M5 18C7 10 12 6 19 5C14.5 9.5 13 13 13 19"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M10 19C12 13 15 10 20 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      );
    case 'luna_phantom_scythe':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 17C7 9 13 6 19.5 6.5C15.5 10 14 13.5 14.5 18.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <circle cx="17" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'luna_abyssal_execution':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3V19M6 9L12 16L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 20H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'lyra_fist_rush':
    case 'lyra_cyclone_kick':
    case 'lyra_aura_overdrive':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3L14.5 8.5L20 7.5L16.5 12.5L20.5 17L14 16L12 21L10 16L3.5 17L7.5 12.5L4 7.5L9.5 8.5L12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'lyra_earthshaker_slam':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 4V14M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 19L8 16.5L12 19L16 16.5L20 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'lyra_phoenix_uppercut':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 20V5M6.5 10.5L12 4.5L17.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 16.5C8 14.5 16 14.5 19 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'witch_arcane_lightning':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M13 3L6 13H12L10.5 21L18 11H12L13 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'witch_chrono_nova':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 7.5V12L15.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'witch_raven_arcana':
    case 'witch_starfall_meteor':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3L14.2 9.5L21 12L14.2 14.5L12 21L9.8 14.5L3 12L9.8 9.5L12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

export const BasicAttackFantasyIcon: React.FC<{
  characterId: CharacterId;
  className?: string;
}> = ({ characterId, className = 'w-5 h-5' }) => {
  if (characterId === 'luna') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path
          d="M5 20L17 7M17 7C19.5 4.5 21 7 18.5 12.5C17 9 14.5 8.5 11.5 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (characterId === 'witch') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M5 20L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="6.5" r="2.8" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (characterId === 'lyra') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path
          d="M6 14H15L19 10L16 6H9L6 10V14ZM6 14L4 18M15 14L17 18"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 19L18 6M14 5L19 5L19 10M5 14L10 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const DashFantasyIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 8H14M6 12H19M3 16H12M15 8L20 12L15 16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const JumpFantasyIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 19V6M6 11L12 5L18 11"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 20H17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const BagFantasyIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M8 8V6A4 4 0 0 1 16 6V8M5 9H19L18 20H6L5 9Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path d="M10 13H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const LockFantasyIcon: React.FC<{ className?: string }> = ({
  className = 'w-3 h-3',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="6" y="11" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <path d="M9 11V8A3 3 0 0 1 15 8V11" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const LobbyCharacterEmblemIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Hooded dark fantasy cowl silhouette + crescent scythe crest */}
    <path
      d="M12 3.2C8.2 3.2 5.5 6.4 5.5 10.6L4.2 15.2L7.2 14.3C7.9 17 9.8 19.2 12 20.5C14.2 19.2 16.1 17 16.8 14.3L19.8 15.2L18.5 10.6C18.5 6.4 15.8 3.2 12 3.2Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path
      d="M8.8 10.2C9.6 8.3 10.7 7.4 12 7.4C13.3 7.4 14.4 8.3 15.2 10.2"
      stroke="#E9D5FF"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M9.6 12.2L10.8 13L9.6 13.6M14.4 12.2L13.2 13L14.4 13.6"
      stroke="#E9D5FF"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15.2V18.2M10.4 16.6H13.6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export const LobbySettingsRuneIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Forged dark-iron gear wheel with inner arcane diamond rune */}
    <path
      d="M10.3 3.2H13.7L14.3 5.5C15 5.8 15.6 6.1 16.2 6.6L18.4 5.7L20.1 8.6L18.3 10.2C18.4 10.8 18.5 11.4 18.5 12C18.5 12.6 18.4 13.2 18.3 13.8L20.1 15.4L18.4 18.3L16.2 17.4C15.6 17.9 15 18.2 14.3 18.5L13.7 20.8H10.3L9.7 18.5C9 18.2 8.4 17.9 7.8 17.4L5.6 18.3L3.9 15.4L5.7 13.8C5.6 13.2 5.5 12.6 5.5 12C5.5 11.4 5.6 10.8 5.7 10.2L3.9 8.6L5.6 5.7L7.8 6.6C8.4 6.1 9 5.8 9.7 5.5L10.3 3.2Z"
      fill="currentColor"
      fillOpacity="0.14"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinejoin="round"
    />
    <path
      d="M12 8.6L15.4 12L12 15.4L8.6 12L12 8.6Z"
      stroke="#E2E8F0"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="1.2" fill="#E2E8F0" />
  </svg>
);

export const LobbyGachaPortalIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Summoning crystal 4-pointed astral star & arcane portal halo */}
    <circle
      cx="12"
      cy="12"
      r="8.2"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeDasharray="3.2 2.4"
      opacity="0.7"
    />
    <path
      d="M12 3.4L14.1 9.9L20.6 12L14.1 14.1L12 20.6L9.9 14.1L3.4 12L9.9 9.9L12 3.4Z"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M12 8.4L13.1 10.9L15.6 12L13.1 13.1L12 15.6L10.9 13.1L8.4 12L10.9 10.9L12 8.4Z"
      fill="#F3E8FF"
    />
    <circle cx="18.2" cy="5.8" r="1.1" fill="#E9D5FF" />
  </svg>
);

export const LobbyBagSatchelIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Dark fantasy adventurer supply satchel / pouch with brass clasp */}
    <path
      d="M8.8 7.5V5.8C8.8 4.4 10.1 3.5 12 3.5C13.9 3.5 15.2 4.4 15.2 5.8V7.5"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
    />
    <path
      d="M5.2 8.6C5.2 7.7 5.9 7.2 6.8 7.2H17.2C18.1 7.2 18.8 7.7 18.8 8.6L19.6 18.2C19.7 19.3 18.9 20.2 17.8 20.2H6.2C5.1 20.2 4.3 19.3 4.4 18.2L5.2 8.6Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M5 10.5L12 13.4L19 10.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <rect
      x="10.4"
      y="11.8"
      width="3.2"
      height="3.6"
      rx="0.7"
      fill="#FEF08A"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export const LobbyEventBellIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 3.5V5M7.5 10.5A4.5 4.5 0 0 1 16.5 10.5C16.5 14 18 15.8 19.2 17H4.8C6 15.8 7.5 14 7.5 10.5Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <path d="M10 17.5A2 2 0 0 0 14 17.5" stroke="#FEF08A" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="17.8" cy="6.2" r="1.4" fill="#FACC15" />
  </svg>
);

export const LobbyDailyCalendarIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="4.5"
      y="5.5"
      width="15"
      height="14.5"
      rx="2"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path d="M8.5 3.5V6.8M15.5 3.5V6.8M4.5 10H19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path
      d="M9.5 14.5L11.3 16.3L15 12.6"
      stroke="#FEF08A"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function compactSkillRoleLabel(roleLabel: string): string {
  const map: Record<string, string> = {
    'Sabit · Lifesteal': 'Lifesteal',
    'Dash Tebas': 'Dash Tebas',
    'AoE Gerhana': 'Gerhana',
    'Sabit Bumerang': 'Bumerang',
    'Eksekusi Sabit': 'Eksekusi',
    'Dash Pukulan': 'Pukulan',
    'AoE Tendang': 'Tendang',
    'Buff · AoE': 'Overdrive',
    'Hantam Tanah': 'Hantaman',
    'Uppercut Api': 'Uppercut',
    'AoE Hujan': 'Hujan AoE',
    'Hisap Blink': 'Vortex',
    'Rantai Petir': 'Petir',
    'Nova · Heal': 'Chrono',
  };
  return map[roleLabel] ?? roleLabel;
}

interface StoneActionButtonProps {
  onClick: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
  fireOnPointerDown?: boolean;
  ariaLabel: string;
  title?: string;
  accentHex: string;
  state: 'ready' | 'cooldown' | 'locked';
  cooldownSec?: number;
  maxCooldownSec?: number;
  keyBadge?: string;
  subBadge?: string;
  roleLabel: string;
  size?: 'sm' | 'md';
  controlClass?: string;
  wrapperStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Beveled dark forged-stone & iron action control button with multi-touch PointerEvent tracking,
 * crisp Ready / Cooldown / Locked states, and optional per-button scale/offset styling.
 */
export const StoneActionButton: React.FC<StoneActionButtonProps> = ({
  onClick,
  onPressStart,
  onPressEnd,
  fireOnPointerDown = false,
  ariaLabel,
  title,
  accentHex,
  state,
  cooldownSec = 0,
  maxCooldownSec = 1,
  keyBadge,
  subBadge,
  roleLabel,
  size = 'md',
  controlClass = '',
  wrapperStyle,
  children,
}) => {
  const [pressed, setPressed] = React.useState(false);
  const activePointerIdRef = React.useRef<number | null>(null);
  const pointerTriggeredRef = React.useRef(false);

  const isReady = state === 'ready';
  const isCooldown = state === 'cooldown';
  const isLocked = state === 'locked';
  const cdRatio = isCooldown
    ? Math.max(0.08, Math.min(1, cooldownSec / Math.max(0.5, maxCooldownSec)))
    : 0;

  const boxSize = size === 'sm' ? 'w-11 h-11' : 'w-13 h-13 sm:w-14 sm:h-14';
  const labelWidth = size === 'sm' ? 'max-w-[66px]' : 'max-w-[78px]';

  const releasePointer = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;
    activePointerIdRef.current = null;
    setPressed(false);
    onPressEnd?.();
  };

  return (
    <div
      className="flex flex-col items-center gap-0.5 select-none"
      style={wrapperStyle}
    >
      <button
        type="button"
        tabIndex={-1}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Synthetic events may not support capture
          }
          activePointerIdRef.current = e.pointerId;
          setPressed(true);
          if (onPressStart) {
            pointerTriggeredRef.current = true;
            onPressStart();
          } else if (fireOnPointerDown) {
            pointerTriggeredRef.current = true;
            onClick();
          }
        }}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          e.currentTarget.blur();
          if (pointerTriggeredRef.current) {
            pointerTriggeredRef.current = false;
            return;
          }
          onClick();
        }}
        title={title ?? ariaLabel}
        aria-label={ariaLabel}
        className={`mobile-control-btn ${controlClass} relative ${boxSize} rounded-[7px] border-2 flex flex-col items-center justify-center overflow-hidden transition-transform cursor-pointer ${
          pressed ? 'scale-92' : 'active:scale-95'
        }`}
        style={{
          background: pressed
            ? 'linear-gradient(180deg, rgba(48,38,76,0.92) 0%, rgba(22,19,36,0.95) 100%)'
            : isReady
              ? 'linear-gradient(180deg, rgba(37,40,61,0.86) 0%, rgba(21,23,36,0.88) 55%, rgba(13,14,22,0.92) 100%)'
              : isCooldown
                ? 'linear-gradient(180deg, rgba(19,21,32,0.82) 0%, rgba(9,10,16,0.88) 100%)'
                : 'linear-gradient(180deg, rgba(16,17,25,0.78) 0%, rgba(7,8,13,0.85) 100%)',
          borderColor: pressed ? '#FACC15' : isReady ? accentHex : isCooldown ? '#474D66' : '#262938',
          boxShadow: pressed
            ? `inset 0 0 10px ${accentHex}66, 0 0 14px rgba(250, 204, 21, 0.5)`
            : isReady
              ? `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.7), 0 0 10px ${accentHex}40`
              : 'inset 0 2px 4px rgba(0,0,0,0.85)',
        }}
      >
        {/* Corner Forged Iron Rivets */}
        <span
          aria-hidden="true"
          className="absolute top-0.5 left-0.5 w-1 h-1 rounded-xs"
          style={{ backgroundColor: isReady ? '#D4B475' : '#33384D' }}
        />
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 w-1 h-1 rounded-xs"
          style={{ backgroundColor: isReady ? '#D4B475' : '#33384D' }}
        />

        {/* Cooldown Radial-Curtain Fill */}
        {isCooldown && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 bg-[#040509]/82 border-t border-[#94A3B8]/40 pointer-events-none"
            style={{ height: `${Math.round(cdRatio * 100)}%` }}
          />
        )}

        {/* Keycap Top-Left */}
        {keyBadge && (
          <span
            className="absolute top-0.5 left-1.5 font-mono-num text-[9px] font-bold leading-none z-10"
            style={{ color: isReady ? '#F8FAFC' : '#64748B' }}
          >
            {keyBadge}
          </span>
        )}

        {/* Center Icon */}
        <div
          className="relative z-10 flex items-center justify-center"
          style={{
            color: isReady ? accentHex : isCooldown ? '#94A3B8' : '#475569',
            opacity: isLocked ? 0.55 : isCooldown ? 0.45 : 1,
          }}
        >
          {children}
        </div>

        {/* Bottom Status / MP / CD Overlay */}
        {isCooldown ? (
          <span className="relative z-10 font-mono-num text-[11px] font-extrabold text-[#F8FAFC] leading-none mt-0.5 hud-stroke">
            {cooldownSec.toFixed(1)}s
          </span>
        ) : isLocked ? (
          <span className="relative z-10 inline-flex items-center gap-0.5 font-mono-num text-[9px] font-bold text-[#F87171] leading-none mt-0.5">
            <LockFantasyIcon className="w-2.5 h-2.5" />
            {subBadge ?? 'MP'}
          </span>
        ) : subBadge ? (
          <span className="relative z-10 font-mono-num text-[9px] font-bold text-[#CBD5E1] leading-none mt-0.5">
            {subBadge}
          </span>
        ) : null}
      </button>

      <span
        className={`text-[9px] sm:text-[10px] font-semibold text-center ${labelWidth} truncate hud-stroke ${
          isReady ? 'text-[#E2E8F0]' : isCooldown ? 'text-[#94A3B8]' : 'text-[#64748B]'
        }`}
      >
        {roleLabel}
      </span>
    </div>
  );
};

