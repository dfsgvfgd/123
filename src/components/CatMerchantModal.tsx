import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, Sparkles, X } from 'lucide-react';
import { getWhiteCatNpcSprite } from '../engine/pixelSprites';
import { getItemCategoryLabel, getSubSkillElementLabel, getUiStrings } from '../game/i18n';
import {
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
  CatMerchantOffer,
  LanguageCode,
  RunInventoryEntry,
  RunSubSkillEntry,
} from '../game/types';
import { RunItemIcon, SilverCoinIcon, SubSkillIcon } from './ItemSkillIcons';

interface CatMerchantModalProps {
  open: boolean;
  language: LanguageCode;
  silver: number;
  offers: CatMerchantOffer[];
  inventory: RunInventoryEntry[];
  runSubSkills: RunSubSkillEntry[];
  onBuyOffer: (
    offerUid: string
  ) => { status: 'bought' | 'insufficient_silver' | 'bag_full' | 'skills_full' | 'invalid'; offer?: CatMerchantOffer };
  onSwapItem: (uidToRemove: string, offerUid: string) => void;
  onSwapSubSkill: (slotIndex: number, offerUid: string) => void;
  onClose: () => void;
}

export const CatMerchantModal: React.FC<CatMerchantModalProps> = ({
  open,
  language,
  silver,
  offers,
  inventory,
  runSubSkills,
  onBuyOffer,
  onSwapItem,
  onSwapSubSkill,
  onClose,
}) => {
  const t = getUiStrings(language);
  const catCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [swapPending, setSwapPending] = useState<{
    mode: 'item' | 'sub_skill';
    offer: CatMerchantOffer;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSwapPending(null);
      setFeedback(null);
      return;
    }
    const canvas = catCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const spr = getWhiteCatNpcSprite(0);
    const scale = Math.min((canvas.width - 8) / spr.width, (canvas.height - 8) / spr.height);
    const dw = Math.round(spr.width * scale);
    const dh = Math.round(spr.height * scale);
    ctx.drawImage(
      spr,
      Math.round((canvas.width - dw) * 0.5),
      Math.round((canvas.height - dh) * 0.5),
      dw,
      dh
    );
  }, [open]);

  if (!open) return null;

  const handleBuyClick = (e: React.MouseEvent<HTMLButtonElement>, offer: CatMerchantOffer) => {
    e.currentTarget.blur();
    setFeedback(null);
    const res = onBuyOffer(offer.uid);
    if (res.status === 'insufficient_silver') {
      setFeedback(
        language === 'en'
          ? `Not enough Silver (need ${offer.priceSilver} Silver).`
          : `Silver belum cukup (butuh ${offer.priceSilver} Silver).`
      );
    } else if (res.status === 'bag_full') {
      setSwapPending({ mode: 'item', offer });
    } else if (res.status === 'skills_full') {
      setSwapPending({ mode: 'sub_skill', offer });
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-[#05060A]/88"
      role="dialog"
      aria-modal="true"
      aria-label={t.catShopTitle}
      data-testid="cat-merchant-modal"
    >
      <div className="df-modal-frame w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="df-modal-header shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3 min-w-0">
            <canvas
              ref={catCanvasRef}
              width={56}
              height={56}
              className="pixelated rounded border border-[#94A3B8]/55 bg-[#0A0C14] shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#E2E8F0]">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>{language === 'en' ? 'STAGE MERCHANT' : 'PEDAGANG MISTERIUS STAGE'}</span>
              </div>
              <h2 className="font-display text-base sm:text-xl font-bold text-[#F8FAFC]">
                {t.catShopTitle}
              </h2>
              <p className="text-[11px] text-[#94A3B8]">{t.catShopSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div
              data-testid="cat-shop-silver-balance"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#090B12] border border-[#94A3B8]/65"
            >
              <SilverCoinIcon className="w-4 h-4 shrink-0" />
              <span className="font-mono-num text-sm font-bold text-[#F1F5F9]">
                {silver.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] font-semibold text-[#94A3B8]">{t.silverLabel}</span>
            </div>

            <button
              type="button"
              data-testid="cat-shop-close-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onClose();
              }}
              aria-label={t.closeBtn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E2E8F0] bg-[#1B1D2B] hover:bg-[#272A3D] border border-[#474D66] rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>{t.closeBtn}</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto abyss-scroll p-4 sm:p-5 space-y-4">
          {feedback && (
            <div className="px-3.5 py-2 rounded border border-[#EF4444]/70 bg-[#2C1016] text-xs font-semibold text-[#FECACA]">
              {feedback}
            </div>
          )}

          {swapPending ? (
            <div className="space-y-3" data-testid="cat-swap-panel">
              <div className="p-3.5 rounded-md border border-[#FACC15]/70 bg-[#1B160B] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#FACC15]">
                    {swapPending.mode === 'item'
                      ? language === 'en'
                        ? `Item Bag Full (${MAX_RUN_INVENTORY}/${MAX_RUN_INVENTORY}) — Pick 1 slot to replace`
                        : `Tas Item Penuh (${MAX_RUN_INVENTORY}/${MAX_RUN_INVENTORY}) — Pilih 1 slot untuk ditukar`
                      : language === 'en'
                        ? `Sub-Skill Full (${MAX_RUN_SUB_SKILLS}/${MAX_RUN_SUB_SKILLS}) — Pick 1 slot to replace`
                        : `Slot Sub-Skill Penuh (${MAX_RUN_SUB_SKILLS}/${MAX_RUN_SUB_SKILLS}) — Pilih 1 slot untuk ditukar`}
                  </div>
                  <div className="font-display text-sm font-bold text-[#F8FAFC] mt-0.5">
                    {swapPending.offer.itemDef?.name ?? swapPending.offer.subSkillDef?.name} ·{' '}
                    <span className="font-mono-num text-[#E2E8F0]">
                      {swapPending.offer.priceSilver} {t.silverLabel}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setSwapPending(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#181A28] hover:bg-[#24283D] text-[#F8FAFC] border border-[#474D66] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.bagCancelReturnBtn}</span>
                </button>
              </div>

              {swapPending.mode === 'item' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {inventory.map((entry) => {
                    const def = RUN_ITEMS[entry.id];
                    return (
                      <button
                        key={entry.uid}
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onSwapItem(entry.uid, swapPending.offer.uid);
                          setSwapPending(null);
                        }}
                        className="p-3 rounded border border-[#383B52] hover:border-[#F97316] bg-[#141622] hover:bg-[#1E1713] text-left flex items-center justify-between gap-2.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded bg-[#0B0C12] border flex items-center justify-center shrink-0"
                            style={{ borderColor: def.accentHex }}
                          >
                            <RunItemIcon itemId={def.id} color={def.accentHex} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#F8FAFC]">{def.name}</div>
                            <div className="text-[10px] font-mono-num text-[#FDBA74]">
                              Lv.{entry.level ?? 1}/{MAX_RUN_ITEM_LEVEL}
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F97316] text-[#09090E] text-[11px] font-bold shrink-0">
                          <RefreshCw className="w-3 h-3" />
                          <span>{t.bagSwapBtn}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {runSubSkills.map((entry, idx) => {
                    const def = SUB_SKILLS[entry.id];
                    return (
                      <button
                        key={`${entry.id}-${idx}`}
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onSwapSubSkill(idx, swapPending.offer.uid);
                          setSwapPending(null);
                        }}
                        className="p-3 rounded border border-[#383B52] hover:border-[#C084FC] bg-[#141622] hover:bg-[#201634] text-left flex items-center justify-between gap-2.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded bg-[#0B0C12] border flex items-center justify-center shrink-0"
                            style={{ borderColor: def.accentHex }}
                          >
                            <SubSkillIcon skillId={def.id} color={def.accentHex} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#F8FAFC]">{def.name}</div>
                            <div className="text-[10px] font-mono-num text-[#E9D5FF]">
                              Lv.{entry.level}/{MAX_SUB_SKILL_LEVEL}
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C084FC] text-[#09090E] text-[11px] font-bold shrink-0">
                          <RefreshCw className="w-3 h-3" />
                          <span>{t.bagSwapBtn}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : offers.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#94A3B8]">{t.catShopEmpty}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {offers.map((offer, idx) => {
                const isItem = offer.kind === 'item' && offer.itemDef;
                const accentHex = offer.itemDef?.accentHex ?? offer.subSkillDef?.accentHex ?? '#C084FC';
                const title = offer.itemDef?.name ?? offer.subSkillDef?.name ?? '';
                const categoryBadge = isItem
                  ? `${t.catShopItemTag} · ${getItemCategoryLabel(offer.itemDef!.category, language)}`
                  : `${t.catShopSubSkillTag} · ${getSubSkillElementLabel(offer.subSkillDef!, language)}`;
                const statSummary = isItem
                  ? formatRunItemStatSummary(offer.itemDef!.id, offer.nextLevel, language)
                  : formatSubSkillStatSummary(offer.subSkillDef!.id, offer.nextLevel, language);
                const desc = offer.itemDef?.description ?? offer.subSkillDef?.description ?? '';
                const canAfford = silver >= offer.priceSilver;

                return (
                  <div
                    key={offer.uid}
                    data-testid={`cat-offer-${idx}`}
                    className={`p-3.5 rounded-md border-2 flex flex-col justify-between gap-3 ${
                      offer.purchased
                        ? 'bg-[#0F111A] border-[#2A2E40] opacity-65'
                        : 'bg-[#141624] border-[#3E4259]'
                    }`}
                    style={!offer.purchased ? { borderColor: `${accentHex}AA` } : undefined}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded bg-[#0A0B12] border flex items-center justify-center shrink-0"
                            style={{ borderColor: accentHex }}
                          >
                            {isItem ? (
                              <RunItemIcon
                                itemId={offer.itemDef!.id}
                                color={accentHex}
                                className="w-5 h-5"
                              />
                            ) : (
                              <SubSkillIcon
                                skillId={offer.subSkillDef!.id}
                                color={accentHex}
                                className="w-5 h-5"
                              />
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                              {categoryBadge}
                            </div>
                            <h3 className="font-display text-sm font-bold text-[#F8FAFC] leading-snug">
                              {title}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono-num font-bold px-2 py-0.5 rounded shrink-0 ${
                            offer.isMaxed
                              ? 'bg-[#2B203D] text-[#C084FC]'
                              : offer.currentLevel > 0
                                ? 'bg-[#3B2609] text-[#FACC15]'
                                : 'bg-[#0A0B12] text-[#CBD5E1]'
                          }`}
                        >
                          {offer.isMaxed
                            ? 'MAX'
                            : offer.currentLevel > 0
                              ? `Lv.${offer.currentLevel}→${offer.nextLevel}`
                              : 'Lv.1'}
                        </span>
                      </div>

                      <div
                        className="text-xs font-mono-num font-semibold"
                        style={{ color: accentHex }}
                      >
                        {statSummary}
                      </div>
                      <p className="text-[11px] text-[#B8C0D2] leading-relaxed">{desc}</p>
                    </div>

                    <button
                      type="button"
                      disabled={offer.purchased || offer.isMaxed || !canAfford}
                      onClick={(e) => handleBuyClick(e, offer)}
                      className={`w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
                        offer.purchased
                          ? 'bg-[#1A1C2A] text-[#4ADE80] border border-[#4ADE80]/40'
                          : offer.isMaxed
                            ? 'bg-[#1A1C2A] text-[#94A3B8]'
                            : canAfford
                              ? 'text-[#09090E] hover:brightness-110'
                              : 'bg-[#191B28] text-[#64748B] border border-[#2C3044]'
                      }`}
                      style={
                        !offer.purchased && !offer.isMaxed && canAfford
                          ? { backgroundColor: accentHex }
                          : undefined
                      }
                    >
                      {offer.purchased ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.catShopSoldBadge}</span>
                        </>
                      ) : offer.isMaxed ? (
                        <span>MAX</span>
                      ) : (
                        <>
                          <SilverCoinIcon className="w-3.5 h-3.5" />
                          <span className="font-mono-num">
                            {t.catShopBuyBtn} · {offer.priceSilver} {t.silverLabel}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
