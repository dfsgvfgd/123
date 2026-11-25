import React, { useState } from 'react';
import { LogOut, Play, RotateCcw, Settings } from 'lucide-react';
import { getUiStrings } from '../game/i18n';
import type { LanguageCode } from '../game/types';

interface TitleScreenProps {
  hasSave: boolean;
  language?: LanguageCode;
  onPlayNewGame: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
}

interface TabletButtonProps {
  label: string;
  subLabel?: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isPrimary?: boolean;
  isDangerHover?: boolean;
  dataStart?: boolean;
}

const BasaltTabletButton: React.FC<TabletButtonProps> = ({
  label,
  subLabel,
  icon,
  onClick,
  disabled = false,
  isPrimary = false,
  isDangerHover = false,
  dataStart,
}) => {
  return (
    <button
      type="button"
      data-start={dataStart ? 'true' : undefined}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
      className={`group relative w-full h-[64px] flex items-center text-left transition-transform duration-150 select-none ${
        disabled
          ? 'opacity-65 cursor-not-allowed'
          : 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5'
      }`}
    >
      {/* Backlit Runic Glow Aura behind basalt tablet frame */}
      <div
        className={`pointer-events-none absolute -inset-1.5 rounded-[10px] transition-opacity duration-200 ${
          isPrimary
            ? 'rune-aura-bright opacity-95'
            : disabled
              ? 'opacity-15'
              : isDangerHover
                ? 'opacity-40 group-hover:opacity-80'
                : 'opacity-45 group-hover:opacity-90'
        }`}
        style={{
          background: isPrimary
            ? 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.56) 0%, rgba(126, 34, 206, 0.24) 55%, rgba(0, 0, 0, 0) 80%)'
            : isDangerHover
              ? 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.25) 0%, rgba(185, 28, 28, 0.16) 55%, rgba(0, 0, 0, 0) 80%)'
              : 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.34) 0%, rgba(76, 29, 149, 0.14) 58%, rgba(0, 0, 0, 0) 82%)',
        }}
      />

      {/* Sculpted Basalt Heater-Shield / Stone Tablet SVG Silhouette + Corroded Iron Border + Rivets + Carved Runes */}
      <svg
        viewBox="0 0 320 68"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)]"
      >
        <defs>
          <linearGradient id={`basaltGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPrimary ? '#272436' : '#1E1D28'} />
            <stop offset="48%" stopColor={isPrimary ? '#1B1926' : '#15151E'} />
            <stop offset="100%" stopColor="#0D0D14" />
          </linearGradient>
          <linearGradient id={`ironRim-${label}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isPrimary ? '#9333EA' : '#6A657A'} />
            <stop offset="35%" stopColor="#464352" />
            <stop offset="70%" stopColor={isPrimary ? '#A855F7' : '#575264'} />
            <stop offset="100%" stopColor="#2A2833" />
          </linearGradient>
        </defs>

        {/* Outer Chipped Basalt & Heater-Shield Bevel */}
        <path
          d="M 10,4 L 78,2 L 83,5 L 236,4 L 242,2 L 310,5 L 317,13 L 315,44 L 306,57 L 160,66 L 14,57 L 5,44 L 3,13 Z"
          fill={`url(#ironRim-${label})`}
          stroke="#07070B"
          strokeWidth="2"
        />

        {/* Carved Inner Dark Basalt Slab */}
        <path
          d="M 13,8 L 238,8 L 306,9 L 312,15 L 310,42 L 302,53 L 160,61 L 18,53 L 10,42 L 8,15 Z"
          fill={`url(#basaltGrad-${label})`}
          stroke={isPrimary ? '#C084FC' : '#3C394A'}
          strokeWidth={isPrimary ? '1.35' : '1'}
          strokeOpacity={isPrimary ? '0.78' : '0.7'}
        />

        {/* Subtle Weathering Fissures & Chipped Stone Grooves */}
        <path
          d="M 74,9 L 78,19 L 72,24 M 258,52 L 253,42 L 260,36"
          fill="none"
          stroke="#0A0A10"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M 18,12 L 302,12"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        {/* Glowing Engraved Arcane Runes Flanking Tablet */}
        <g
          fill="none"
          stroke={isPrimary ? '#E879F9' : '#9333EA'}
          strokeWidth="1.3"
          strokeOpacity={isPrimary ? '0.85' : disabled ? '0.2' : '0.45'}
        >
          <path d="M 278,22 L 284,29 L 278,36 M 284,21 L 284,38 M 292,24 L 296,30 L 292,36" />
          <path d="M 17,24 L 13,30 L 17,36" />
        </g>

        {/* Corroded Iron Corner Rivets */}
        {[
          [16, 14],
          [304, 14],
          [18, 46],
          [302, 46],
        ].map(([rx, ry], idx) => (
          <g key={idx}>
            <circle cx={rx} cy={ry} r="2.7" fill="#111018" />
            <circle cx={rx} cy={ry} r="1.7" fill={isPrimary ? '#C4B5FD' : '#78718A'} />
          </g>
        ))}
      </svg>

      {/* Left Glowing Cosmic-Violet Emblem + Etched Metallic Silver-White Cinzel Label */}
      <div className="relative z-10 w-full flex items-center justify-between px-6 pb-1">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
              isPrimary
                ? 'bg-[#2B174A]/90 border-[#C084FC]/85 text-[#E9D5FF] shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                : isDangerHover
                  ? 'bg-[#191525]/90 border-[#5B4F78]/70 text-[#C084FC] group-hover:border-[#EF4444]/75 group-hover:text-[#FCA5A5]'
                  : 'bg-[#171424]/90 border-[#524B6B]/75 text-[#C084FC] group-hover:border-[#A855F7]/80 group-hover:text-[#E9D5FF]'
            }`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <span
              className={`block font-display text-sm sm:text-[15px] font-bold tracking-[0.12em] uppercase truncate hud-stroke ${
                isPrimary
                  ? 'text-[#F8FAFC] group-hover:text-[#F5D0FE]'
                  : isDangerHover
                    ? 'text-[#E2E8F0] group-hover:text-[#FECACA]'
                    : 'text-[#E2E8F0] group-hover:text-[#F8FAFC]'
              }`}
            >
              {label}
            </span>
            {subLabel && (
              <span className="block text-[10px] font-medium tracking-wide text-[#94A3B8] -mt-0.5">
                {subLabel}
              </span>
            )}
          </div>
        </div>

        {/* Carved Diamond Etch Indicator */}
        <span
          className={`w-2 h-2 rotate-45 border shrink-0 mr-5 transition-colors ${
            isPrimary
              ? 'bg-[#C084FC] border-[#F5D0FE] shadow-[0_0_8px_rgba(216,180,254,0.9)]'
              : 'bg-[#3B2E58] border-[#6D5B94] group-hover:bg-[#A855F7]'
          }`}
        />
      </div>
    </button>
  );
};

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSave,
  language = 'id',
  onPlayNewGame,
  onContinue,
  onOpenSettings,
}) => {
  const [exitOverlayOpen, setExitOverlayOpen] = useState(false);
  const t = getUiStrings(language);

  const handleExit = () => {
    setExitOverlayOpen(true);
    try {
      window.close();
    } catch {
      // Browsers block window.close on non-script-opened tabs; exit overlay handles it cleanly
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-center items-center overflow-hidden bg-[#07070B]">
      {/* Fantasy Temple Full-Bleed Backdrop (No Character Image) */}
      <img
        src="./src/assets/images/fantasy_temple_title_1795155984946.jpg"
        alt="Kuil Suci Fantasy"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-85 select-none pointer-events-none"
      />

      {/* Atmospheric Vignette Scrims */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 44%, rgba(7,7,11,0.18) 0%, rgba(7,7,11,0.72) 64%, rgba(7,7,11,0.95) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,7,11,0.72) 0%, rgba(7,7,11,0.16) 35%, rgba(7,7,11,0.35) 70%, rgba(7,7,11,0.92) 100%)',
        }}
      />

      {/* Top-Right Subtle BETA Version Tag */}
      <div
        data-testid="title-beta-badge"
        className="absolute top-3.5 right-4 z-10 px-2.5 py-1 rounded border border-[#8A7656]/80 bg-[#12131E]/95 font-mono-num text-[10px] font-bold tracking-[0.2em] text-[#FACC15] shadow-md"
      >
        {t.betaTag} v0.9
      </div>

      {/* Centered Sanctuary Title & 4 Carved Basalt Stone Tablet / Heater-Shield Menu Buttons */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
        <div className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#D4B475] mb-2 hud-stroke">
          Fantasy Temple · 2D Dungeon Slasher
        </div>

        <h1 className="font-display text-5xl sm:text-6xl font-extrabold tracking-[0.14em] text-[#F8FAFC] drop-shadow-[0_6px_24px_rgba(0,0,0,0.9)]">
          VELVERA
        </h1>
        <div className="font-display text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-[#C084FC] mt-2 mb-7 hud-stroke">
          Abyssal Sanctuary
        </div>

        <div className="w-full max-w-[310px] flex flex-col gap-3">
          <BasaltTabletButton
            dataStart
            isPrimary
            label={language === 'en' ? 'Play New Game' : 'Main Baru'}
            icon={<Play className="w-4 h-4 fill-current" />}
            onClick={onPlayNewGame}
          />

          <BasaltTabletButton
            disabled={!hasSave}
            label={language === 'en' ? 'Continue' : 'Lanjutkan'}
            subLabel={
              !hasSave
                ? language === 'en'
                  ? 'No save data yet'
                  : 'Belum ada save game'
                : undefined
            }
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={onContinue}
          />

          <BasaltTabletButton
            label={t.settings}
            icon={<Settings className="w-4 h-4" />}
            onClick={onOpenSettings}
          />

          <BasaltTabletButton
            isDangerHover
            label={language === 'en' ? 'Exit' : 'Keluar'}
            icon={<LogOut className="w-4 h-4" />}
            onClick={handleExit}
          />
        </div>
      </div>

      {/* Clean Exit Screen Overlay */}
      {exitOverlayOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060A]/95"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'en' ? 'Exit Game' : 'Keluar Permainan'}
        >
          <div className="w-full max-w-sm bg-[#0E0F17] border border-[#8A7656]/70 rounded-lg p-6 text-center shadow-2xl">
            <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
              {language === 'en' ? 'Session Closed' : 'Permainan Ditutup'}
            </h2>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
              {language === 'en'
                ? 'Thank you for visiting the Abyssal Sanctuary. Your progress is saved automatically.'
                : 'Terima kasih telah mengunjungi Kuil Abyssal. Progres tersimpan otomatis di browser Anda.'}
            </p>
            <button
              type="button"
              onClick={() => setExitOverlayOpen(false)}
              className="w-full mt-5 py-2.5 text-xs font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] text-[#09090E] cursor-pointer"
            >
              {language === 'en' ? 'Back to Title' : 'Kembali ke Menu Utama'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
