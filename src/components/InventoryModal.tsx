import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Backpack,
  Footprints,
  Link2,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  getItemCategoryLabel,
  getSubSkillElementLabel,
  getUiStrings,
} from '../game/i18n';
import {
  computeActiveSynergies,
  computeItemSubSkillCombos,
  formatRunItemStatSummary,
  formatSubSkillStatSummary,
  MAX_RUN_INVENTORY,
  MAX_RUN_ITEM_LEVEL,
  MAX_RUN_SUB_SKILLS,
  MAX_SUB_SKILL_LEVEL,
  RUN_ITEMS,
  SUB_SKILLS,
} from '../game/progression';
import type {
  ActiveItemSubSkillCombo,
  LanguageCode,
  RunInventoryEntry,
  RunItemDef,
  RunSubSkillEntry,
  SubSkillId,
} from '../game/types';
import { RunItemIcon, SubSkillIcon } from './ItemSkillIcons';

export interface PendingSubSkillOffer {
  skillId: SubSkillId;
  newLevel: number;
  source: 'tomb' | 'boss';
}

interface InventoryModalProps {
  open: boolean;
  language: LanguageCode;
  runSubSkills: RunSubSkillEntry[];
  inventory: RunInventoryEntry[];
  pendingDropItem: RunItemDef | null;
  pendingSubSkill?: PendingSubSkillOffer | null;
  activeItemSubCombos?: ActiveItemSubSkillCombo[];
  hasDoubleJump: boolean;
  onClose: () => void;
  onDiscardItem: (uid: string) => void;
  onReplaceWithPending: (uidToReplace: string) => void;
  onReplaceSubSkill?: (slotIndex: number) => void;
  onSkipPending: () => void;
  onSkipPendingSubSkill?: () => void;
}

type SelectedSlot =
  | { category: 'sub'; index: number }
  | { category: 'item'; index: number }
  | null;

export const InventoryModal: React.FC<InventoryModalProps> = ({
  open,
  language,
  runSubSkills,
  inventory,
  pendingDropItem,
  pendingSubSkill = null,
  activeItemSubCombos,
  hasDoubleJump,
  onClose,
  onDiscardItem,
  onReplaceWithPending,
  onReplaceSubSkill,
  onSkipPending,
  onSkipPendingSubSkill,
}) => {
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>(null);
  const t = getUiStrings(language);

  useEffect(() => {
    if (open) {
      if (scrollBodyRef.current) {
        scrollBodyRef.current.scrollTop = 0;
      }
      if (pendingSubSkill && runSubSkills.length > 0) {
        setSelectedSlot({ category: 'sub', index: 0 });
      } else if (pendingDropItem && inventory.length > 0) {
        setSelectedSlot({ category: 'item', index: 0 });
      } else if (inventory.length > 0) {
        setSelectedSlot({ category: 'item', index: 0 });
      } else if (runSubSkills.length > 0) {
        setSelectedSlot({ category: 'sub', index: 0 });
      } else {
        setSelectedSlot(null);
      }
    }
  }, [open, pendingDropItem, pendingSubSkill, inventory.length, runSubSkills.length]);

  if (!open) return null;

  const isItemSwapMode = pendingDropItem !== null;
  const isSubSwapMode = pendingSubSkill !== null;
  const isAnySwapMode = isItemSwapMode || isSubSwapMode;
  const activeSynergies = computeActiveSynergies(inventory);
  const combos = activeItemSubCombos ?? computeItemSubSkillCombos(inventory, runSubSkills);

  const selectedSubEntry =
    selectedSlot?.category === 'sub' ? runSubSkills[selectedSlot.index] ?? null : null;
  const selectedItemEntry =
    selectedSlot?.category === 'item' ? inventory[selectedSlot.index] ?? null : null;

  const handleCancelOrClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (isSubSwapMode && onSkipPendingSubSkill) {
      onSkipPendingSubSkill();
      return;
    }
    if (isItemSwapMode) {
      onSkipPending();
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-2.5 sm:p-4 bg-[#05060A]/90"
      role="dialog"
      aria-modal="true"
      aria-label={t.bagTitle}
    >
      <div className="df-modal-frame w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="df-modal-header shrink-0 flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-[#1B1D2C] border border-[#F97316]/60 flex items-center justify-center shrink-0">
              <Backpack className="w-4 h-4 text-[#F97316]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#F8FAFC]">
                {t.bagTitle} ·{' '}
                <span className="font-mono-num">
                  {runSubSkills.length}/{MAX_RUN_SUB_SKILLS} &amp; {inventory.length}/
                  {MAX_RUN_INVENTORY}
                </span>
              </h2>
              <p className="text-[11px] text-[#94A3B8]">{t.bagSubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelOrClose}
            aria-label={isAnySwapMode ? t.bagCancelReturnBtn : t.closeBtn}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E2E8F0] bg-[#1C1F2E] hover:bg-[#272A3D] border border-[#474D66] rounded cursor-pointer"
          >
            {isAnySwapMode ? <ArrowLeft className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{isAnySwapMode ? t.bagCancelReturnBtn : t.closeBtn}</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          ref={scrollBodyRef}
          className="flex-1 min-h-0 overflow-y-auto abyss-scroll p-4 sm:p-5 space-y-4"
        >
          {(hasDoubleJump || activeSynergies.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {hasDoubleJump && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#38BDF8]/60 bg-[#082F49]/55 text-xs text-[#BAE6FD]">
                  <Footprints className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <strong className="text-[#38BDF8]">{t.doubleJumpBadge}</strong>
                </div>
              )}
              {activeSynergies.map((syn) => (
                <div
                  key={syn.id}
                  className="px-2.5 py-1 rounded border text-xs bg-[#181628]"
                  style={{ borderColor: syn.accentHex }}
                >
                  <span className="font-bold text-[#F8FAFC]">{syn.name}: </span>
                  <span className="font-mono-num" style={{ color: syn.accentHex }}>
                    {syn.bonusText}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Full-Item-Category Swap Banner (5/5 -> Replace or Batal / Kembali) */}
          {isItemSwapMode && pendingDropItem && (
            <div
              data-testid="item-swap-banner"
              className="p-3.5 rounded-md border border-[#F97316] bg-[#2D1408]/75 space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FB923C]">
                  {t.bagSwapBanner}
                </span>
                <span className="text-[11px] font-mono-num px-2 py-0.5 rounded bg-[#09090E] text-[#FACC15]">
                  {getItemCategoryLabel(pendingDropItem.category, language)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RunItemIcon
                  itemId={pendingDropItem.id}
                  color={pendingDropItem.accentHex}
                  className="w-4 h-4 shrink-0"
                />
                <div className="font-display text-sm font-bold text-[#F8FAFC]">
                  {pendingDropItem.name}
                </div>
              </div>
              <p className="text-xs text-[#E2E8F0]">{pendingDropItem.description}</p>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  data-testid="cancel-item-swap-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSkipPending();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#181A28] hover:bg-[#23263A] text-[#F8FAFC] border border-[#474D66] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.bagCancelReturnBtn}</span>
                </button>
              </div>
            </div>
          )}

          {/* Full-SubSkill-Category Swap Banner (4/4 -> Replace or Batal / Kembali) */}
          {isSubSwapMode && pendingSubSkill && (
            <div
              data-testid="subskill-swap-banner"
              className="p-3.5 rounded-md border border-[#A855F7] bg-[#211036]/80 space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC]">
                  {t.bagSubSkillSwapBanner}
                </span>
                <span className="text-[11px] font-mono-num px-2 py-0.5 rounded bg-[#09090E] text-[#E9D5FF]">
                  {getSubSkillElementLabel(SUB_SKILLS[pendingSubSkill.skillId], language)} · Lv.{pendingSubSkill.newLevel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SubSkillIcon
                  skillId={pendingSubSkill.skillId}
                  color={SUB_SKILLS[pendingSubSkill.skillId].accentHex}
                  className="w-4 h-4 shrink-0"
                />
                <div className="font-display text-sm font-bold text-[#F8FAFC]">
                  {SUB_SKILLS[pendingSubSkill.skillId].name}
                </div>
              </div>
              <p className="text-xs text-[#E2E8F0]">
                {SUB_SKILLS[pendingSubSkill.skillId].description}
              </p>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  data-testid="cancel-subskill-swap-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSkipPendingSubSkill?.();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#181A28] hover:bg-[#23263A] text-[#F8FAFC] border border-[#474D66] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.bagCancelReturnBtn}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2-Column Side-by-Side Stage Bag Layout */}
          <div
            data-testid="stage-bag-columns"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
          >
            {/* LEFT COLUMN: KATEGORI SUB-SKILL (2x2 Grid, 4 Slots) */}
            <section
              aria-label={t.bagSubSkillCategory}
              data-testid="bag-subskill-column"
              className={`rounded-md border p-3.5 space-y-3 bg-[#11121C] ${
                isSubSwapMode ? 'border-[#A855F7]' : 'border-[#2B2F42]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C084FC]">
                  {t.bagSubSkillCategory}
                </h3>
                <span className="font-mono-num text-xs font-bold text-[#CBD5E1]">
                  {runSubSkills.length}/{MAX_RUN_SUB_SKILLS}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: MAX_RUN_SUB_SKILLS }).map((_, idx) => {
                  const entry = runSubSkills[idx];
                  const def = entry ? SUB_SKILLS[entry.id] : null;
                  const isSelected =
                    selectedSlot?.category === 'sub' && selectedSlot.index === idx;
                  return (
                    <button
                      key={`sub-slot-${idx}`}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        setSelectedSlot({ category: 'sub', index: idx });
                      }}
                      aria-label={
                        def && entry
                          ? `${def.name} Lv.${entry.level}`
                          : `${t.bagSlotLabel} ${idx + 1} · ${t.bagEmptyLabel}`
                      }
                      className={`min-h-[90px] px-2.5 py-2 rounded border text-left flex flex-col justify-between gap-1.5 transition-colors cursor-pointer ${
                        def && entry
                          ? isSelected
                            ? 'bg-[#201736] border-[#C084FC] ring-1 ring-[#C084FC]/50'
                            : isSubSwapMode
                              ? 'bg-[#1B142E] border-[#A855F7]/70 hover:border-[#C084FC]'
                              : 'bg-[#151624] border-[#383B52] hover:border-[#C084FC]'
                          : isSelected
                            ? 'bg-[#141522] border-[#64748B]'
                            : 'bg-[#0C0D14] border-dashed border-[#2A2D3E] hover:border-[#475569]'
                      }`}
                    >
                      {def && entry ? (
                        <>
                          <div className="flex items-center justify-between w-full gap-1">
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center bg-[#0D0E16] border shrink-0"
                              style={{ borderColor: def.accentHex }}
                            >
                              <SubSkillIcon
                                skillId={entry.id}
                                color={def.accentHex}
                                className="w-4 h-4 sm:w-5 sm:h-5"
                              />
                            </div>
                            <span
                              className={`text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                entry.level >= MAX_SUB_SKILL_LEVEL
                                  ? 'bg-[#3B2609] text-[#FACC15]'
                                  : 'bg-[#0D0E16] text-[#E9D5FF]'
                              }`}
                            >
                              Lv.{entry.level}
                              {entry.level >= MAX_SUB_SKILL_LEVEL ? ' MAX' : ''}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-[#F8FAFC] leading-snug break-words">
                            {def.name}
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-1 opacity-70">
                          <Sparkles className="w-4 h-4 text-[#64748B]" />
                          <span className="text-[10px] font-mono-num text-[#64748B]">
                            {t.bagSlotLabel} {idx + 1} · {t.bagEmptyLabel}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* RIGHT COLUMN: KATEGORI ITEM (Balanced 3 + 2 Grid, 5 Slots) */}
            <section
              aria-label={t.bagItemCategory}
              data-testid="bag-item-column"
              className={`rounded-md border p-3.5 space-y-3 bg-[#11121C] ${
                isItemSwapMode ? 'border-[#F97316]' : 'border-[#2B2F42]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FB923C]">
                  {t.bagItemCategory}
                </h3>
                <span className="font-mono-num text-xs font-bold text-[#CBD5E1]">
                  {inventory.length}/{MAX_RUN_INVENTORY}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Array.from({ length: MAX_RUN_INVENTORY }).map((_, idx) => {
                  const entry = inventory[idx];
                  const def = entry ? RUN_ITEMS[entry.id] : null;
                  const isSelected =
                    selectedSlot?.category === 'item' && selectedSlot.index === idx;
                  return (
                    <button
                      key={entry ? entry.uid : `item-slot-${idx}`}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        setSelectedSlot({ category: 'item', index: idx });
                      }}
                      aria-label={
                        def
                          ? def.name
                          : `${t.bagSlotLabel} ${idx + 1} · ${t.bagEmptyLabel}`
                      }
                      className={`min-h-[90px] px-2.5 py-2 rounded border text-left flex flex-col justify-between gap-1.5 transition-colors cursor-pointer ${
                        def
                          ? isSelected
                            ? 'bg-[#26160E] border-[#FB923C] ring-1 ring-[#FB923C]/50'
                            : isItemSwapMode
                              ? 'bg-[#1E1410] border-[#F97316]/70 hover:border-[#FB923C]'
                              : 'bg-[#151624] border-[#383B52] hover:border-[#FB923C]'
                          : isSelected
                            ? 'bg-[#141522] border-[#64748B]'
                            : 'bg-[#0C0D14] border-dashed border-[#2A2D3E] hover:border-[#475569]'
                      }`}
                    >
                      {def && entry ? (
                        <>
                          <div className="flex items-center justify-between w-full gap-1">
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center bg-[#0D0E16] border shrink-0"
                              style={{ borderColor: def.accentHex }}
                            >
                              <RunItemIcon
                                itemId={def.id}
                                color={def.accentHex}
                                className="w-4 h-4 sm:w-5 sm:h-5"
                              />
                            </div>
                            <span
                              className={`text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                (entry.level ?? 1) >= MAX_RUN_ITEM_LEVEL
                                  ? 'bg-[#3B2609] text-[#FACC15]'
                                  : 'bg-[#0D0E16] text-[#FDBA74]'
                              }`}
                            >
                              Lv.{entry.level ?? 1}
                              {(entry.level ?? 1) >= MAX_RUN_ITEM_LEVEL ? ' MAX' : ''}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-[#F8FAFC] leading-snug break-words">
                            {def.name}
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-1 opacity-70">
                          <Backpack className="w-4 h-4 text-[#64748B]" />
                          <span className="text-[10px] font-mono-num text-[#64748B]">
                            {t.bagSlotLabel} {idx + 1} · {t.bagEmptyLabel}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* SLOT DETAIL INSPECTOR */}
          <div className="rounded-md border border-[#34384E] bg-[#131522] p-3.5 min-h-[76px] flex flex-col justify-center">
            {selectedSubEntry ? (
              (() => {
                const sub = SUB_SKILLS[selectedSubEntry.id];
                const slotIdx = selectedSlot?.index ?? 0;
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded flex items-center justify-center bg-[#0D0E16] border shrink-0"
                        style={{ borderColor: sub.accentHex }}
                      >
                        <SubSkillIcon skillId={sub.id} color={sub.accentHex} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-bold text-[#F8FAFC]">
                            {sub.name}
                          </span>
                          <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#23193B] text-[#E9D5FF]">
                            Lv.{selectedSubEntry.level}/{MAX_SUB_SKILL_LEVEL}
                            {selectedSubEntry.level >= MAX_SUB_SKILL_LEVEL ? ' MAX' : ''} ·{' '}
                            {getSubSkillElementLabel(sub, language)}
                          </span>
                        </div>
                        <p className="text-xs font-mono-num text-[#CBD5E1] mt-1">
                          {formatSubSkillStatSummary(sub.id, selectedSubEntry.level, language)}
                        </p>
                      </div>
                    </div>

                    {isSubSwapMode && onReplaceSubSkill && (
                      <button
                        type="button"
                        data-testid="confirm-subskill-swap-btn"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onReplaceSubSkill(slotIdx);
                        }}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded bg-[#A855F7] hover:bg-[#C084FC] text-[#FFFFFF] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t.bagSwapBtn}</span>
                      </button>
                    )}
                  </div>
                );
              })()
            ) : selectedItemEntry ? (
              (() => {
                const def = RUN_ITEMS[selectedItemEntry.id];
                const lv = selectedItemEntry.level ?? 1;
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded flex items-center justify-center bg-[#0D0E16] border shrink-0"
                        style={{ borderColor: def.accentHex }}
                      >
                        <RunItemIcon itemId={def.id} color={def.accentHex} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-bold text-[#F8FAFC]">
                            {def.name}
                          </span>
                          <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#231914] text-[#FDBA74]">
                            Lv.{lv}/{MAX_RUN_ITEM_LEVEL}
                            {lv >= MAX_RUN_ITEM_LEVEL ? ' MAX' : ''} ·{' '}
                            {getItemCategoryLabel(def.category, language)}
                          </span>
                        </div>
                        <p className="text-xs font-mono-num text-[#CBD5E1] mt-1">
                          {formatRunItemStatSummary(def.id, lv, language)}
                        </p>
                      </div>
                    </div>

                    {isItemSwapMode ? (
                      <button
                        type="button"
                        data-testid="confirm-item-swap-btn"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onReplaceWithPending(selectedItemEntry.uid);
                        }}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded bg-[#F97316] hover:bg-[#FB923C] text-[#09090E] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t.bagSwapBtn}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onDiscardItem(selectedItemEntry.uid);
                          setSelectedSlot(null);
                        }}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#2A141A] hover:bg-[#431B24] text-[#FCA5A5] border border-[#EF4444]/50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.bagDiscardBtn}</span>
                      </button>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center text-xs text-[#94A3B8]">
                {selectedSlot?.category === 'sub'
                  ? t.bagEmptySubSkillHint
                  : selectedSlot?.category === 'item'
                    ? t.bagEmptyItemHint
                    : t.bagSelectPrompt}
              </div>
            )}
          </div>

          {/* COMPACT ITEM & SUB-SKILL COMBO PANEL */}
          <section
            data-testid="bag-combo-panel"
            aria-label={t.bagComboPanelTitle}
            className="rounded-md border border-[#3E3548] bg-[#10111B] p-3 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#FACC15]" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#E2E8F0]">
                  {t.bagComboPanelTitle}
                </h3>
              </div>
              <span className="text-[10px] text-[#94A3B8]">{t.bagComboLockedHint}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {combos.map((c) => {
                const itemDef = RUN_ITEMS[c.def.itemId];
                const subDef = SUB_SKILLS[c.def.subSkillId];
                return (
                  <div
                    key={c.def.id}
                    data-active={c.active ? 'true' : 'false'}
                    className={`px-2.5 py-2 rounded border text-[11px] flex flex-col justify-between gap-1 ${
                      c.active
                        ? 'bg-[#1D162E] border-[#FACC15]/80'
                        : 'bg-[#0C0D15] border-[#232638] opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-[#F8FAFC] leading-tight">{c.def.name}</span>
                      {c.active && (
                        <span className="text-[9px] font-mono-num font-extrabold px-1.5 py-0.5 rounded bg-[#FACC15] text-[#09090E] shrink-0">
                          {t.bagComboActiveBadge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#CBD5E1]">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                          c.hasItem
                            ? 'bg-[#171B2A] border-[#4ADE80]/60 text-[#F8FAFC]'
                            : 'bg-[#090A10] border-[#252838] text-[#64748B]'
                        }`}
                      >
                        <RunItemIcon
                          itemId={itemDef.id}
                          color={c.hasItem ? itemDef.accentHex : '#64748B'}
                          className="w-3 h-3 shrink-0"
                        />
                        <span>{itemDef.name}</span>
                      </span>
                      <span className="text-[#64748B]">+</span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                          c.hasSubSkill
                            ? 'bg-[#1D162C] border-[#C084FC]/65 text-[#F8FAFC]'
                            : 'bg-[#090A10] border-[#252838] text-[#64748B]'
                        }`}
                      >
                        <SubSkillIcon
                          skillId={subDef.id}
                          color={c.hasSubSkill ? subDef.accentHex : '#64748B'}
                          className="w-3 h-3 shrink-0"
                        />
                        <span>{subDef.name}</span>
                      </span>
                    </div>

                    <div
                      className="font-mono-num text-[10px] font-semibold"
                      style={{ color: c.active ? c.def.accentHex : '#94A3B8' }}
                    >
                      {c.def.shortBonus}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
