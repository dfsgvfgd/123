import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, Move, RotateCcw, X } from 'lucide-react';
import { getUiStrings } from '../game/i18n';
import {
  ALL_MOBILE_BUTTON_IDS,
  DEFAULT_MOBILE_CONTROLS,
  normalizeMobileControls,
} from '../game/storage';
import type {
  LanguageCode,
  MobileButtonConfig,
  MobileControlButtonId,
  MobileControlsSettings,
} from '../game/types';
import { DashFantasyIcon, JumpFantasyIcon } from './FantasyActionUi';

interface MobileLayoutEditorProps {
  open: boolean;
  language: LanguageCode;
  initialSettings: MobileControlsSettings;
  onSave: (next: MobileControlsSettings) => void;
  onClose: () => void;
}

interface DragState {
  buttonId: MobileControlButtonId;
  startClientX: number;
  startClientY: number;
  origOffsetX: number;
  origOffsetY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getButtonDisplayName(id: MobileControlButtonId, lang: LanguageCode): string {
  const en: Record<MobileControlButtonId, string> = {
    left: 'Move Left',
    down: 'Drop Down',
    right: 'Move Right',
    jump: 'Jump',
    dash: 'Dash',
    skill1: 'Skill 1',
    skill2: 'Skill 2',
    skill3: 'Skill 3',
    interact: 'Interact',
  };
  const idMap: Record<MobileControlButtonId, string> = {
    left: 'Kiri',
    down: 'Turun',
    right: 'Kanan',
    jump: 'Lompat',
    dash: 'Dash',
    skill1: 'Skill 1',
    skill2: 'Skill 2',
    skill3: 'Skill 3',
    interact: 'Interaksi',
  };
  return lang === 'en' ? en[id] : idMap[id];
}

// Base anchor CSS positions matching LobbyHud & DungeonHud ergonomics on 844x390 landscape
const BUTTON_BASE_POS: Record<MobileControlButtonId, React.CSSProperties> = {
  left: { bottom: '14px', left: '14px' },
  down: { bottom: '14px', left: '72px' },
  right: { bottom: '14px', left: '130px' },
  interact: { bottom: '86px', left: '72px' },
  skill1: { bottom: '84px', right: '146px' },
  skill2: { bottom: '84px', right: '82px' },
  skill3: { bottom: '84px', right: '18px' },
  dash: { bottom: '14px', right: '82px' },
  jump: { bottom: '14px', right: '18px' },
};

export const MobileLayoutEditor: React.FC<MobileLayoutEditorProps> = ({
  open,
  language,
  initialSettings,
  onSave,
  onClose,
}) => {
  const t = getUiStrings(language);
  const [draft, setDraft] = useState<MobileControlsSettings>(() =>
    normalizeMobileControls(initialSettings)
  );
  const [selectedBtn, setSelectedBtn] = useState<MobileControlButtonId>('jump');
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(normalizeMobileControls(initialSettings));
      setSelectedBtn('jump');
      setDragState(null);
    }
  }, [open, initialSettings]);

  useEffect(() => {
    if (!dragState) return;
    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startClientX;
      const dy = e.clientY - dragState.startClientY;
      setDraft((prev) => {
        const current = prev.buttons[dragState.buttonId];
        return {
          ...prev,
          buttons: {
            ...prev.buttons,
            [dragState.buttonId]: {
              ...current,
              offsetX: Math.round(clamp(dragState.origOffsetX + dx, -360, 360)),
              offsetY: Math.round(clamp(dragState.origOffsetY + dy, -300, 120)),
            },
          },
        };
      });
    };

    const onPointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [dragState]);

  if (!open) return null;

  const selectedCfg: MobileButtonConfig = draft.buttons[selectedBtn];

  const updateSelectedButton = (patch: Partial<MobileButtonConfig>) => {
    setDraft((prev) => ({
      ...prev,
      buttons: {
        ...prev.buttons,
        [selectedBtn]: {
          ...prev.buttons[selectedBtn],
          ...patch,
        },
      },
    }));
  };

  const applyOpacityToAll = () => {
    const targetOpacity = selectedCfg.opacity;
    setDraft((prev) => {
      const nextButtons = { ...prev.buttons };
      for (const id of ALL_MOBILE_BUTTON_IDS) {
        nextButtons[id] = { ...nextButtons[id], opacity: targetOpacity };
      }
      return {
        ...prev,
        opacity: targetOpacity,
        buttons: nextButtons,
      };
    });
  };

  const startDrag =
    (buttonId: MobileControlButtonId) => (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedBtn(buttonId);
      const cfg = draft.buttons[buttonId];
      setDragState({
        buttonId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origOffsetX: cfg.offsetX,
        origOffsetY: cfg.offsetY,
      });
    };

  const renderGlyph = (id: MobileControlButtonId) => {
    switch (id) {
      case 'left':
        return <ArrowLeft className="w-5 h-5" />;
      case 'down':
        return <ArrowDown className="w-4 h-4" />;
      case 'right':
        return <ArrowRight className="w-5 h-5" />;
      case 'dash':
        return <DashFantasyIcon className="w-4 h-4 text-[#B09567]" />;
      case 'jump':
        return <JumpFantasyIcon className="w-4 h-4 text-[#38BDF8]" />;
      case 'skill1':
        return <span className="font-mono-num text-xs font-extrabold text-[#C084FC]">S1</span>;
      case 'skill2':
        return <span className="font-mono-num text-xs font-extrabold text-[#38BDF8]">S2</span>;
      case 'skill3':
        return <span className="font-mono-num text-xs font-extrabold text-[#FACC15]">S3</span>;
      case 'interact':
        return <span className="font-mono-num text-[10px] font-extrabold text-[#FACC15]">INT</span>;
    }
  };

  return (
    <div
      data-testid="mobile-layout-editor"
      role="dialog"
      aria-modal="true"
      aria-label={t.settingsCustomButtonsTitle}
      className="fixed inset-0 z-[60] bg-[#05060A]/86 select-none overflow-hidden"
    >
      {/* Dungeon Alignment Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Top Floating Customizer Toolbar */}
      <div className="relative z-10 max-w-2xl mx-auto mt-2 px-3">
        <div className="bg-[#0E0F17]/95 border-2 border-[#8A7656] rounded-lg px-3.5 py-2.5 shadow-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Move className="w-4 h-4 text-[#F97316] shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-sm font-bold text-[#F8FAFC] truncate">
                  {t.settingsCustomButtonsTitle}
                </h2>
                <p className="text-[10px] text-[#94A3B8] truncate">
                  {t.settingsCustomButtonsHint}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                data-testid="mobile-editor-reset"
                onClick={() => setDraft(normalizeMobileControls(DEFAULT_MOBILE_CONTROLS))}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded bg-[#181A28] hover:bg-[#23263A] text-[#FACC15] border border-[#383C52] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.settingsResetDefault}</span>
              </button>

              <button
                type="button"
                data-testid="mobile-editor-cancel"
                onClick={onClose}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#CBD5E1] border border-[#383C52] cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{t.settingsCancelBtn}</span>
              </button>

              <button
                type="button"
                data-testid="mobile-editor-save"
                onClick={() => {
                  onSave(normalizeMobileControls(draft));
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] text-[#09090E] cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>{t.settingsSaveLayoutBtn}</span>
              </button>
            </div>
          </div>

          {/* Selected Button Info + Per-Button Scale & Opacity Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#232638] text-[11px]">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161826] border border-[#383C52]">
              <span className="text-[#94A3B8]">{t.settingsSelectedButton}:</span>
              <strong data-testid="mobile-editor-selected-name" className="text-[#FACC15]">
                {getButtonDisplayName(selectedBtn, language)}
              </strong>
              <span className="font-mono-num text-[10px] text-[#94A3B8]">
                ({selectedCfg.offsetX}, {selectedCfg.offsetY})
              </span>
            </div>

            <label className="flex items-center gap-1.5 text-[#CBD5E1]">
              <span>{t.settingsButtonScale}</span>
              <input
                type="range"
                data-testid="mobile-editor-scale-slider"
                min={50}
                max={200}
                value={Math.round(selectedCfg.scale * 100)}
                aria-label={t.settingsButtonScale}
                onChange={(e) =>
                  updateSelectedButton({ scale: clamp(Number(e.target.value) / 100, 0.5, 2) })
                }
                className="w-20 sm:w-24 accent-[#C084FC] cursor-pointer"
              />
              <span className="font-mono-num font-bold text-[#C084FC] w-9 text-right">
                {Math.round(selectedCfg.scale * 100)}%
              </span>
            </label>

            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1.5 text-[#CBD5E1]">
                <span>{t.settingsOpacity}</span>
                <input
                  type="range"
                  data-testid="mobile-editor-opacity-slider"
                  min={30}
                  max={100}
                  value={selectedCfg.opacity}
                  aria-label={t.settingsOpacity}
                  onChange={(e) =>
                    updateSelectedButton({ opacity: clamp(Number(e.target.value), 30, 100) })
                  }
                  className="w-20 sm:w-24 accent-[#FACC15] cursor-pointer"
                />
                <span className="font-mono-num font-bold text-[#FACC15] w-8 text-right">
                  {selectedCfg.opacity}%
                </span>
              </label>
              <button
                type="button"
                onClick={applyOpacityToAll}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#1B1D2C] hover:bg-[#272A3F] text-[#E2E8F0] border border-[#383C52] cursor-pointer"
              >
                {t.settingsApplyAllOpacity}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 9 Individually Selectable & Draggable Buttons */}
      {ALL_MOBILE_BUTTON_IDS.map((id) => {
        const cfg = draft.buttons[id];
        const isSelected = selectedBtn === id;
        const isDragging = dragState?.buttonId === id;
        const basePos = BUTTON_BASE_POS[id];
        const label = getButtonDisplayName(id, language);

        return (
          <button
            key={id}
            type="button"
            data-testid={`drag-btn-${id}`}
            aria-label={label}
            onPointerDown={startDrag(id)}
            style={{
              ...basePos,
              opacity: clamp(cfg.opacity / 100, 0.3, 1),
              transform: `translate(${cfg.offsetX}px, ${cfg.offsetY}px) scale(${cfg.scale})`,
              transformOrigin: 'center center',
            }}
            className={`mobile-control-btn fixed w-12 h-12 rounded-[8px] border-2 flex flex-col items-center justify-center gap-0.5 cursor-grab active:cursor-grabbing transition-shadow ${
              isDragging
                ? 'z-30 border-[#FACC15] bg-[#2D1A44]/90 shadow-[0_0_18px_rgba(250,204,21,0.6)]'
                : isSelected
                  ? 'z-20 border-[#C084FC] bg-[#1E1930]/90 shadow-[0_0_14px_rgba(192,132,252,0.5)]'
                  : 'z-10 border-[#6B5B45]/85 bg-[#121420]/85 hover:border-[#94A3B8]'
            }`}
          >
            {renderGlyph(id)}
            <span className="text-[8px] font-bold uppercase tracking-tight text-[#E2E8F0] leading-none">
              {label.split(' ').pop()}
            </span>
          </button>
        );
      })}
    </div>
  );
};
