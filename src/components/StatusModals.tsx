import React from 'react';
import { Heart, Lock, Music, Settings, Skull, Swords, X } from 'lucide-react';
import { getUiStrings } from '../game/i18n';
import {
  formatRunItemStatSummary,
  formatSubSkillStatSummary,
  getSkillDef,
  isSubSkillId,
  MAX_SUB_SKILL_LEVEL,
  STAGE_BGM_NAMES,
  STAGE_BOSS_NAMES,
  STAGE_TITLES,
} from '../game/progression';
import type {
  AnySkillId,
  ChestChoiceOption,
  LanguageCode,
  RunSummary,
  SkillDraftOption,
  SubSkillId,
} from '../game/types';
import { RunItemIcon, SubSkillIcon } from './ItemSkillIcons';

interface SupplyChestOfferModalProps {
  offer: {
    chestIndex: number;
    options: ChestChoiceOption[];
  } | null;
  language?: LanguageCode;
  onPickOption: (option: ChestChoiceOption) => void;
  onSkip: () => void;
}

export const SupplyChestOfferModal: React.FC<SupplyChestOfferModalProps> = ({
  offer,
  language = 'id',
  onPickOption,
  onSkip,
}) => {
  if (!offer) return null;
  const t = getUiStrings(language);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 bg-[#05060A]/75"
      role="dialog"
      aria-modal="true"
      aria-label={t.chestModalTitle}
      data-testid="supply-chest-modal"
    >
      <div className="df-modal-frame w-full max-w-[700px] flex flex-col rounded-lg overflow-hidden shadow-2xl">
        <div className="df-modal-header shrink-0 flex items-center justify-between gap-2 px-3.5 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FB923C]">
              {t.chestModalTitle}
            </span>
            <span className="text-[11px] font-mono-num text-[#94A3B8] hidden sm:inline">· 1 / 4</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onSkip();
            }}
            aria-label={t.chestSkipBtn}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#E2E8F0] bg-[#1B1D2B] hover:bg-[#272A3D] border border-[#474D66] rounded cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t.chestSkipBtn}</span>
          </button>
        </div>

        <div className="p-2.5 sm:p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {offer.options.map((opt, idx) => {
            const isHeal = opt.kind === 'heal';
            const pctNum = opt.healPct ? Math.max(1, Math.min(45, Math.round(opt.healPct * 100))) : 25;
            const titleText =
              isHeal && language === 'en'
                ? `Elixir (${pctNum}%)`
                : isHeal
                  ? `Ramuan (${pctNum}%)`
                  : opt.title;
            const curLv = opt.currentLevel ?? 0;
            const nextLv = opt.nextLevel ?? 1;
            const lvTag = isHeal
              ? `+${pctNum}%`
              : opt.isMaxed
                ? 'MAX'
                : opt.isUpgrade
                  ? `Lv.${curLv}→${nextLv}`
                  : `Lv.1`;
            const statLine = isHeal
              ? `+${opt.healAmount ?? 0} HP`
              : opt.statSummary ??
                (opt.itemDef
                  ? formatRunItemStatSummary(
                      opt.itemDef.id,
                      opt.isUpgrade ? nextLv : 1,
                      language
                    )
                  : '');

            return (
              <button
                key={opt.uid}
                type="button"
                data-testid={`chest-choice-${idx}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onPickOption(opt);
                }}
                className="p-2.5 rounded border-2 bg-[#141622] hover:bg-[#1D1B30] text-left flex flex-col justify-between gap-2 cursor-pointer transition-colors"
                style={{ borderColor: opt.accentHex }}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <div
                      className="w-7 h-7 rounded bg-[#0B0C12] border flex items-center justify-center shrink-0"
                      style={{ borderColor: opt.accentHex }}
                    >
                      {isHeal ? (
                        <Heart className="w-4 h-4 text-[#4ADE80]" />
                      ) : opt.itemDef ? (
                        <RunItemIcon
                          itemId={opt.itemDef.id}
                          color={opt.accentHex}
                          className="w-4 h-4"
                        />
                      ) : (
                        <Heart className="w-4 h-4" style={{ color: opt.accentHex }} />
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded ${
                        opt.isUpgrade
                          ? 'bg-[#3B2609] text-[#FACC15]'
                          : opt.isMaxed
                            ? 'bg-[#292038] text-[#C084FC]'
                            : 'bg-[#09090E] text-[#CBD5E1]'
                      }`}
                    >
                      {lvTag}
                    </span>
                  </div>

                  <div className="font-display text-xs font-bold text-[#F8FAFC] leading-snug break-words min-h-[32px]">
                    {titleText}
                  </div>
                  <div
                    className="text-[11px] font-mono-num font-semibold leading-tight"
                    style={{ color: opt.accentHex }}
                  >
                    {statLine}
                  </div>
                </div>

                <div
                  className="w-full py-1 text-center text-[11px] font-bold rounded text-[#09090E]"
                  style={{ backgroundColor: opt.accentHex }}
                >
                  {opt.isUpgrade
                    ? language === 'en'
                      ? `Upgrade Lv.${nextLv}`
                      : `Naik Lv.${nextLv}`
                    : t.chestPickBtn}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface PauseModalProps {
  open: boolean;
  language?: LanguageCode;
  stage: number;
  subStage: number;
  onResume: () => void;
  onOpenSanctum: () => void;
  onOpenSettings: () => void;
  onRestart: () => void;
  onExitLobby?: () => void;
  onExitTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  open,
  language = 'id',
  stage,
  subStage,
  onResume,
  onOpenSanctum,
  onOpenSettings,
  onRestart,
  onExitLobby,
  onExitTitle,
}) => {
  if (!open) return null;
  const t = getUiStrings(language);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#05060A]/88"
      role="dialog"
      aria-modal="true"
      aria-label={t.pauseTitle}
    >
      <div className="df-modal-frame w-full max-w-sm rounded-lg p-6 text-center shadow-2xl">
        <div className="text-xs font-mono-num text-[#B09567] uppercase tracking-widest">
          {t.stageLabel} {stage}-{subStage}
        </div>
        <h2 className="font-display text-2xl font-bold text-[#F8FAFC] mt-1 mb-5">
          {t.pauseTitle}
        </h2>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onResume();
            }}
            className="w-full py-2.5 text-sm font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] text-[#09090E] cursor-pointer"
          >
            {t.pauseResume}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSanctum();
            }}
            className="w-full py-2.5 text-sm font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#F8FAFC] border border-[#2F3347] cursor-pointer"
          >
            {t.sanctumTitle}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#F8FAFC] border border-[#2F3347] cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#C084FC]" />
            <span>{t.pauseSettings}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            className="w-full py-2.5 text-sm font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#F8FAFC] border border-[#2F3347] cursor-pointer"
          >
            {t.pauseRestart}
          </button>
          {onExitLobby && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onExitLobby();
              }}
              className="w-full py-2.5 text-sm font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#E9D5FF] border border-[#8A7656]/50 cursor-pointer"
            >
              {t.pauseLobby}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onExitTitle();
            }}
            className="w-full py-2.5 text-sm font-semibold rounded text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
          >
            {language === 'en' ? 'Main Menu' : 'Menu Utama'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface StageSelectModalProps {
  open: boolean;
  language?: LanguageCode;
  highestStage: number;
  onSelectStage: (stage: number) => void;
  onClose: () => void;
}

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  open,
  language = 'id',
  highestStage,
  onSelectStage,
  onClose,
}) => {
  if (!open) return null;
  const t = getUiStrings(language);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#05060A]/90"
      role="dialog"
      aria-modal="true"
      aria-label={t.stageSelectTitle}
    >
      <div className="df-modal-frame w-full max-w-4xl max-h-[88vh] flex flex-col rounded-lg overflow-hidden shadow-2xl">
        <div className="df-modal-header flex items-center justify-between px-5 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#C084FC]">
              {t.stageSelectTitle}
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F8FAFC]">
              {t.stageSelectSubtitle}
            </h2>
          </div>

          <button
            type="button"
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

        <div className="p-5 overflow-y-auto abyss-scroll grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 10 }, (_, idx) => {
            const stageNum = idx + 1;
            const unlocked = stageNum <= Math.max(1, highestStage);
            const title = STAGE_TITLES[idx] ?? `Stage ${stageNum}`;
            const bossName = STAGE_BOSS_NAMES[idx] ?? `Boss ${stageNum}`;
            const bgmName = STAGE_BGM_NAMES[idx] ?? `Stage ${stageNum} Theme`;

            return (
              <button
                key={stageNum}
                type="button"
                disabled={!unlocked}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectStage(stageNum);
                }}
                className={`p-3.5 rounded-md border text-left flex items-center justify-between gap-3 ${
                  unlocked
                    ? 'bg-[#141622] hover:bg-[#1E1B32] border-[#383C54] hover:border-[#C084FC] cursor-pointer'
                    : 'bg-[#0B0C12] border-[#1E2030] opacity-55 cursor-not-allowed'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono-num font-bold">
                    <span className={unlocked ? 'text-[#C084FC]' : 'text-[#64748B]'}>
                      STAGE {stageNum}
                    </span>
                    <span className="text-[#475569]">·</span>
                    <span className="text-[#F8FAFC]">{title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#FECACA] mt-1">
                    <Skull className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Boss: {bossName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] mt-1">
                    <Music className="w-3 h-3 text-[#FACC15] shrink-0" />
                    <span>{bgmName}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#7E22CE] text-[#FFFFFF] text-xs font-bold">
                      <Swords className="w-3.5 h-3.5" />
                      <span>{t.stageEnterBtn}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#181A24] text-[#64748B] text-[11px] font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t.stageLocked}</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ChestModalProps {
  reward: {
    stage: number;
    skillId: AnySkillId;
    newLevel: number;
    autoEquipped: boolean;
    isSubSkill?: boolean;
    source?: 'boss' | 'tomb';
  } | null;
  language?: LanguageCode;
  onClose: () => void;
}

export const ChestRewardModal: React.FC<ChestModalProps> = ({
  reward,
  language = 'id',
  onClose,
}) => {
  if (!reward) return null;
  const t = getUiStrings(language);
  const skill = getSkillDef(reward.skillId);
  const isTomb = reward.source === 'tomb';
  const statSummary = isSubSkillId(reward.skillId)
    ? formatSubSkillStatSummary(reward.skillId, reward.newLevel, language)
    : skill.roleLabel;
  const isMax = reward.newLevel >= MAX_SUB_SKILL_LEVEL;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 bg-[#05060A]/70"
      role="dialog"
      aria-modal="true"
      aria-label={isTomb ? t.tombModalTitle : t.bossChestModalTitle}
      data-testid="chest-reward-modal"
    >
      <div
        className={`df-modal-frame w-full max-w-[330px] rounded-lg p-4 text-center shadow-2xl border-2 ${
          isTomb ? '!border-[#A855F7]/85' : '!border-[#FACC15]/80'
        }`}
      >
        <div
          className={`text-[10px] font-bold uppercase tracking-widest ${
            isTomb ? 'text-[#C084FC]' : 'text-[#FACC15]'
          }`}
        >
          {isTomb
            ? `${t.tombModalTitle} · S${reward.stage}`
            : `${t.bossChestModalTitle} · ${reward.stage}-5`}
        </div>

        {isSubSkillId(reward.skillId) && (
          <div
            className="mx-auto mt-2.5 w-11 h-11 rounded bg-[#0A0B12] border flex items-center justify-center"
            style={{ borderColor: skill.accentHex }}
          >
            <SubSkillIcon
              skillId={reward.skillId}
              color={skill.accentHex}
              className="w-6 h-6"
            />
          </div>
        )}

        <h2 className="font-display text-lg font-bold text-[#F8FAFC] mt-2">
          {skill.name}
        </h2>

        <div className="mt-1.5 flex items-center justify-center gap-1.5 font-mono-num text-[11px] font-bold">
          <span
            className="px-2 py-0.5 rounded bg-[#141622] border border-[#2C3044]"
            style={{ color: skill.accentHex }}
          >
            Lv.{reward.newLevel}/{MAX_SUB_SKILL_LEVEL}
            {isMax ? ' MAX' : ''}
          </span>
        </div>

        <div className="mt-2 font-mono-num text-xs font-semibold text-[#CBD5E1]">
          {statSummary}
        </div>

        {!isTomb && (
          <div className="mt-2.5 py-1.5 px-2.5 bg-[#141622] rounded font-mono-num text-[11px] text-[#FDE047]">
            +160 Gems · +{350 + reward.stage * 90} Gold
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onClose();
          }}
          className={`w-full mt-3 py-2 text-xs font-bold rounded text-[#09090E] cursor-pointer ${
            isTomb
              ? 'bg-[#C084FC] hover:bg-[#D8B4FE]'
              : 'bg-[#FACC15] hover:bg-[#FDE047]'
          }`}
        >
          {t.continueNextStage}
        </button>
      </div>
    </div>
  );
};

interface StageDraftModalProps {
  draft: {
    nextStage: number;
    nextSubStage: number;
    options: SkillDraftOption[];
  } | null;
  language?: LanguageCode;
  onSelect: (option: SkillDraftOption) => void;
}

export const StageDraftModal: React.FC<StageDraftModalProps> = ({
  draft,
  language = 'id',
  onSelect,
}) => {
  if (!draft) return null;
  const t = getUiStrings(language);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#05060A]/90"
      role="dialog"
      aria-modal="true"
      aria-label={t.draftTitle}
    >
      <div className="df-modal-frame w-full max-w-3xl rounded-lg p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-xs font-mono-num uppercase tracking-widest text-[#C084FC]">
            {t.stageLabel} {draft.nextStage}-{draft.nextSubStage}
          </div>
          <h2 className="font-display text-2xl font-bold text-[#F8FAFC] mt-1">
            {t.draftTitle}
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">{t.draftSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {draft.options.map((opt) => {
            const kindLabel =
              opt.kind === 'sub'
                ? t.draftSubSkillBadge
                : opt.kind === 'temp_buff'
                  ? t.draftBuffBadge
                  : t.draftPassiveBadge;
            const kindColor =
              opt.kind === 'sub'
                ? 'text-[#F97316]'
                : opt.kind === 'temp_buff'
                  ? 'text-[#38BDF8]'
                  : 'text-[#FACC15]';

            return (
              <button
                key={`${opt.kind}-${opt.id}`}
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelect(opt);
                }}
                className="p-4 rounded-md border border-[#32364C] hover:border-[#C084FC] bg-[#141622] hover:bg-[#1C1830] text-left flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono-num font-bold mb-2">
                    <span className={kindColor}>{kindLabel}</span>
                    <span className="text-[#94A3B8]">
                      {opt.kind === 'temp_buff' ? 'Run' : `Lv.${opt.nextLevel}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {opt.kind === 'sub' && (
                      <div className="w-7 h-7 rounded bg-[#0A0B12] border border-[#F97316]/60 flex items-center justify-center shrink-0">
                        <SubSkillIcon
                          skillId={opt.id as SubSkillId}
                          color="#F97316"
                          className="w-4 h-4"
                        />
                      </div>
                    )}
                    <div className="font-display text-base font-bold text-[#F8FAFC]">
                      {opt.name}
                    </div>
                  </div>
                  {opt.roleLabel && (
                    <div className="text-[10px] font-mono-num font-semibold text-[#94A3B8] mt-1">
                      {opt.roleLabel}
                    </div>
                  )}
                  <p className="text-xs text-[#B8C0D2] mt-2 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <div className="w-full py-2 text-center text-xs font-bold rounded bg-[#7E22CE] text-[#FFFFFF]">
                  {t.chestPickBtn}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface EndRunModalProps {
  summary: RunSummary | null;
  language?: LanguageCode;
  bestScore: number;
  onPlayAgain: () => void;
  onOpenSanctum: () => void;
  onExitLobby?: () => void;
  onExitTitle: () => void;
}

export const EndRunModal: React.FC<EndRunModalProps> = ({
  summary,
  language = 'id',
  bestScore,
  onPlayAgain,
  onOpenSanctum,
  onExitLobby,
  onExitTitle,
}) => {
  if (!summary) return null;
  const t = getUiStrings(language);
  const isVictory = summary.outcome === 'victory';

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#05060A]/90"
      role="dialog"
      aria-modal="true"
      aria-label={isVictory ? t.victoryTitle : t.defeatTitle}
    >
      <div className="df-modal-frame w-full max-w-md rounded-lg p-6 text-center shadow-2xl">
        <div
          className={`text-xs font-bold uppercase tracking-widest ${
            isVictory ? 'text-[#FACC15]' : 'text-[#EF4444]'
          }`}
        >
          {t.stageLabel} {summary.stageReached}-{summary.subStageReached}
        </div>
        <h2 className="font-display text-2xl font-bold text-[#F8FAFC] mt-1 mb-5">
          {isVictory ? t.victoryTitle : t.defeatTitle}
        </h2>

        <div className="grid grid-cols-3 gap-2.5 mb-4 text-left">
          <div className="p-3 bg-[#141622] rounded border border-[#26293A]">
            <div className="text-[11px] text-[#94A3B8]">{t.runStatsScore}</div>
            <div className="font-mono-num text-sm font-bold text-[#F8FAFC]">
              {summary.score.toLocaleString('id-ID')}
            </div>
            <div className="font-mono-num text-[10px] text-[#B09567]">
              Max {Math.max(bestScore, summary.score).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="p-3 bg-[#141622] rounded border border-[#26293A]">
            <div className="text-[11px] text-[#94A3B8]">{t.runStatsKills}</div>
            <div className="font-mono-num text-sm font-bold text-[#C084FC]">
              {summary.kills}
            </div>
            <div className="font-mono-num text-[10px] text-[#94A3B8]">
              {summary.clearTimeSec}s
            </div>
          </div>
          <div className="p-3 bg-[#141622] rounded border border-[#26293A]">
            <div className="text-[11px] text-[#94A3B8]">{t.stageLabel}</div>
            <div className="font-mono-num text-sm font-bold text-[#F8FAFC]">
              {isVictory
                ? '10-5'
                : summary.bossHpRemainingPct > 0
                  ? `${summary.bossHpRemainingPct}%`
                  : `S${summary.stageReached}-${summary.subStageReached}`}
            </div>
          </div>
        </div>

        <div className="py-2 px-3 mb-5 bg-[#141622] rounded font-mono-num text-xs text-[#CBD5E1]">
          {t.runStatsRewards}: +{summary.gemsEarned} Gems · +{summary.goldEarned} Gold · +
          {summary.shardsEarned} Shards · +{summary.essenceEarned} Essence
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onPlayAgain();
            }}
            className="w-full py-2.5 text-sm font-bold rounded bg-[#C084FC] hover:bg-[#D8B4FE] text-[#09090E] cursor-pointer"
          >
            {t.retryStageBtn}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSanctum();
            }}
            className="w-full py-2.5 text-sm font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#F8FAFC] border border-[#2F3347] cursor-pointer"
          >
            {t.sanctumTitle}
          </button>
          {onExitLobby && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onExitLobby();
              }}
              className="w-full py-2.5 text-sm font-semibold rounded bg-[#181A28] hover:bg-[#23263A] text-[#E9D5FF] border border-[#8A7656]/50 cursor-pointer"
            >
              {t.returnLobbyBtn}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onExitTitle();
            }}
            className="w-full py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
          >
            {language === 'en' ? 'Main Menu' : 'Menu Utama'}
          </button>
        </div>
      </div>
    </div>
  );
};
