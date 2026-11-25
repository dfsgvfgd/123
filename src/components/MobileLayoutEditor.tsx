import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, Move, RotateCcw, X } from 'lucide-react';
import { getUiStrings } from '../game/i18n';
import { DEFAULT_MOBILE_CONTROLS } from '../game/storage';
import type { LanguageCode, MobileControlsSettings } from '../game/types';
import { DashFantasyIcon, JumpFantasyIcon } from './FantasyActionUi';

interface MobileLayoutEditorProps {
  open: boolean;
  language: LanguageCode;
  initialSettings: MobileControlsSettings;
  onSave: (next: MobileControlsSettings) => void;
  onClose: () => void;
}

type ClusterKey = 'dpad' | 'skills' | 'action';

interface DragState {
  cluster: ClusterKey;
  startClientX: number;
  startClientY: number;
  origOffsetX: number;
  origOffsetY: number;
}

function clampOffset(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export const MobileLayoutEditor: React.FC<MobileLayoutEditorProps> = ({
  open,
  language,
  initialSettings,
  onSave,
  onClose,
}) => {
  const t = getUiStrings(language);
  const [draft, setDraft] = useState<MobileControlsSettings>(initialSettings);
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (open) {
      setDraft({ ...DEFAULT_MOBILE_CONTROLS, ...initialSettings });
      setDragState(null);
    }
  }, [open, initialSettings]);

  useEffect(() => {
    if (!dragState) return;
    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startClientX;
      const dy = e.clientY - dragState.startClientY;
      setDraft((prev) => {
        if (dragState.cluster === 'dpad') {
          return {
            ...prev,
            dpadOffsetX: clampOffset(dragState.origOffsetX + dx, -40, 320),
            dpadOffsetY: clampOffset(dragState.origOffsetY + dy, -360, 40),
          };
        }
        if (dragState.cluster === 'skills') {
          return {
            ...prev,
            skillsOffsetX: clampOffset(dragState.origOffsetX + dx, -320, 40),
            skillsOffsetY: clampOffset(dragState.origOffsetY + dy, -320, 80),
          };
        }
        return {
          ...prev,
          actionOffsetX: clampOffset(dragState.origOffsetX + dx, -320, 40),
          actionOffsetY: clampOffset(dragState.origOffsetY + dy, -360, 40),
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

  const touchOpacity = Math.max(0.3, Math.min(1, (draft.opacity ?? 88) / 100));

  const startDrag = (cluster: ClusterKey) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const origOffsetX =
      cluster === 'dpad'
        ? draft.dpadOffsetX
        : cluster === 'skills'
          ? draft.skillsOffsetX
          : draft.actionOffsetX;
    const origOffsetY =
      cluster === 'dpad'
        ? draft.dpadOffsetY
        : cluster === 'skills'
          ? draft.skillsOffsetY
          : draft.actionOffsetY;
    setDragState({
      cluster,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origOffsetX,
      origOffsetY,
    });
  };

  return (
    <div
      data-testid="mobile-layout-editor"
      role="dialog"
      aria-modal="true"
      aria-label={t.settingsCustomButtonsTitle}
      className="fixed inset-0 z-[60] bg-[#05060A]/82 select-none overflow-hidden"
    >
      {/* Subtle Dungeon Grid Guide */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Floating Toolbar */}
      <div className="relative z-10 max-w-xl mx-auto mt-3 px-3">
        <div className="bg-[#0E0F17]/95 border-2 border-[#8A7656] rounded-lg px-4 py-3 shadow-2xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Move className="w-4 h-4 text-[#F97316] shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-sm sm:text-base font-bold text-[#F8FAFC] truncate">
                  {t.settingsCustomButtonsTitle}
                </h2>
                <p className="text-[11px] text-[#94A3B8]">{t.settingsCustomButtonsHint}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#232638]">
            <label className="flex items-center gap-2 text-[11px] text-[#CBD5E1]">
              <span>{t.settingsOpacity}</span>
              <input
                type="range"
                min={30}
                max={100}
                value={draft.opacity}
                aria-label={t.settingsOpacity}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, opacity: Number(e.target.value) }))
                }
                className="w-24 sm:w-28 accent-[#FACC15] cursor-pointer"
              />
              <span className="font-mono-num font-bold text-[#FACC15] w-8 text-right">
                {draft.opacity}%
              </span>
            </label>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                data-testid="mobile-editor-reset"
                onClick={() => setDraft({ ...DEFAULT_MOBILE_CONTROLS })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded bg-[#181A28] hover:bg-[#23263A] text-[#FACC15] border border-[#383C52] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.settingsResetDefault}</span>
              </button>

              <button
                type="button"
                data-testid="mobile-editor-cancel"
                onClick={onClose}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#CBD5E1] border border-[#383C52] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.settingsCancelBtn}</span>
              </button>

              <button
                type="button"
                data-testid="mobile-editor-save"
                onClick={() => {
                  onSave(draft);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] text-[#09090E] cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.settingsSaveLayoutBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Cluster 1: D-Pad (Left / Down / Right) */}
      <div
        data-testid="drag-cluster-dpad"
        onPointerDown={startDrag('dpad')}
        style={{
          touchAction: 'none',
          opacity: touchOpacity,
          transform: `translate(${draft.dpadOffsetX}px, ${draft.dpadOffsetY}px)`,
        }}
        className={`fixed bottom-3 left-3 p-2 rounded-lg border-2 border-dashed cursor-grab active:cursor-grabbing ${
          dragState?.cluster === 'dpad'
            ? 'border-[#38BDF8] bg-[#082F49]/60'
            : 'border-[#38BDF8]/65 bg-[#0B0C14]/55'
        }`}
      >
        <div className="text-[9px] font-mono-num font-bold uppercase tracking-wider text-[#38BDF8] mb-1 text-center">
          D-Pad ({draft.dpadOffsetX}, {draft.dpadOffsetY})
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-[6px] border-2 border-[#475569] bg-[#141724] flex items-center justify-center text-[#F8FAFC]">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <div className="w-12 h-12 rounded-[6px] border-2 border-[#475569] bg-[#141724] flex items-center justify-center text-[#94A3B8]">
            <ArrowDown className="w-4 h-4" />
          </div>
          <div className="w-12 h-12 rounded-[6px] border-2 border-[#475569] bg-[#141724] flex items-center justify-center text-[#F8FAFC]">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Draggable Cluster 2: Skills 1 / 2 / 3 */}
      <div
        data-testid="drag-cluster-skills"
        onPointerDown={startDrag('skills')}
        style={{
          touchAction: 'none',
          opacity: touchOpacity,
          transform: `translate(${draft.skillsOffsetX}px, ${draft.skillsOffsetY}px)`,
        }}
        className={`fixed bottom-[94px] right-3 p-2 rounded-lg border-2 border-dashed cursor-grab active:cursor-grabbing ${
          dragState?.cluster === 'skills'
            ? 'border-[#C084FC] bg-[#2E1065]/60'
            : 'border-[#C084FC]/65 bg-[#0B0C14]/55'
        }`}
      >
        <div className="text-[9px] font-mono-num font-bold uppercase tracking-wider text-[#C084FC] mb-1 text-center">
          Skill 1–3 ({draft.skillsOffsetX}, {draft.skillsOffsetY})
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="w-12 h-12 rounded-[6px] border-2 border-[#818CF8] bg-[#141724] flex flex-col items-center justify-center"
            >
              <span className="font-mono-num text-xs font-bold text-[#F8FAFC]">{slot}</span>
              <span className="text-[9px] text-[#94A3B8]">Skill</span>
            </div>
          ))}
        </div>
      </div>

      {/* Draggable Cluster 3: Action (Dash / Jump) */}
      <div
        data-testid="drag-cluster-action"
        onPointerDown={startDrag('action')}
        style={{
          touchAction: 'none',
          opacity: touchOpacity,
          transform: `translate(${draft.actionOffsetX}px, ${draft.actionOffsetY}px)`,
        }}
        className={`fixed bottom-3 right-3 p-2 rounded-lg border-2 border-dashed cursor-grab active:cursor-grabbing ${
          dragState?.cluster === 'action'
            ? 'border-[#4ADE80] bg-[#052E16]/60'
            : 'border-[#4ADE80]/65 bg-[#0B0C14]/55'
        }`}
      >
        <div className="text-[9px] font-mono-num font-bold uppercase tracking-wider text-[#4ADE80] mb-1 text-center">
          {t.dash} / {t.jump} ({draft.actionOffsetX}, {draft.actionOffsetY})
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-[6px] border-2 border-[#B09567] bg-[#141724] flex flex-col items-center justify-center text-[#F8FAFC]">
            <DashFantasyIcon className="w-4 h-4 text-[#B09567]" />
            <span className="text-[9px] font-bold">{t.dash}</span>
          </div>
          <div className="w-12 h-12 rounded-[6px] border-2 border-[#38BDF8] bg-[#141724] flex flex-col items-center justify-center text-[#F8FAFC]">
            <JumpFantasyIcon className="w-4 h-4 text-[#38BDF8]" />
            <span className="text-[9px] font-bold">{t.jump}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
