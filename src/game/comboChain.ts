import type { ComboChainHudSnapshot, SkillChainTag } from './types';

export const COMBO_CHAIN_WINDOW_SEC = 4.5;
export const COMBO_DECAY_WINDOW_SEC = 2.8;
export const CRITICAL_COMBO_INTERVAL = 50;

export function isCriticalComboMilestone(
  prevCombo: number,
  nextCombo: number,
  interval = CRITICAL_COMBO_INTERVAL
): boolean {
  if (interval <= 0 || nextCombo < interval) return false;
  return Math.floor(nextCombo / interval) > Math.floor(Math.max(0, prevCombo) / interval);
}

export function getSubSkillVfxScale(skillLevel: number): {
  radiusMult: number;
  streakCount: number;
  auraAlpha: number;
} {
  const lv = Math.max(1, Math.min(3, Math.floor(skillLevel || 1)));
  if (lv === 3) {
    return { radiusMult: 1.32, streakCount: 3, auraAlpha: 0.92 };
  }
  if (lv === 2) {
    return { radiusMult: 1.15, streakCount: 2, auraAlpha: 0.82 };
  }
  return { radiusMult: 1.0, streakCount: 1, auraAlpha: 0.72 };
}

export function computeComboTimerPct(
  comboHits: number,
  comboDecayTimer: number,
  windowSec = COMBO_DECAY_WINDOW_SEC
): number {
  if (comboHits <= 0 || comboDecayTimer <= 0 || windowSec <= 0) return 0;
  return Math.max(0, Math.min(1, comboDecayTimer / windowSec));
}

export interface ComboChainState {
  sequence: SkillChainTag[];
  lastSkillTime: number;
  activeBuffName: string | null;
  buffRemainingSec: number;
  atkSpeedBonus: number;
  damageBonus: number;
}

export interface ComboChainTriggerResult {
  nextState: ComboChainState;
  triggeredBuff: {
    name: string;
    atkSpeedBonus: number;
    damageBonus: number;
    durationSec: number;
  } | null;
}

export const CHAIN_TAG_LABELS: Record<SkillChainTag, string> = {
  blink: 'Blink',
  aoe: 'AoE',
  wave: 'Gelombang',
  fire: 'Api',
  ice: 'Es',
  poison: 'Racun',
  lightning: 'Petir',
};

export function createInitialComboChainState(): ComboChainState {
  return {
    sequence: [],
    lastSkillTime: -999,
    activeBuffName: null,
    buffRemainingSec: 0,
    atkSpeedBonus: 0,
    damageBonus: 0,
  };
}

export function tickComboChain(
  state: ComboChainState,
  dt: number,
  nowSec: number
): ComboChainState {
  const windowExpired = state.sequence.length > 0 && nowSec - state.lastSkillTime > COMBO_CHAIN_WINDOW_SEC;
  const nextBuffRem = Math.max(0, state.buffRemainingSec - dt);

  return {
    sequence: windowExpired ? [] : state.sequence,
    lastSkillTime: windowExpired ? -999 : state.lastSkillTime,
    activeBuffName: nextBuffRem > 0 ? state.activeBuffName : null,
    buffRemainingSec: nextBuffRem,
    atkSpeedBonus: nextBuffRem > 0 ? state.atkSpeedBonus : 0,
    damageBonus: nextBuffRem > 0 ? state.damageBonus : 0,
  };
}

export function recordSkillChain(
  state: ComboChainState,
  tag: SkillChainTag,
  nowSec: number
): ComboChainTriggerResult {
  const withinWindow = state.sequence.length > 0 && nowSec - state.lastSkillTime <= COMBO_CHAIN_WINDOW_SEC;
  const seq = withinWindow ? [...state.sequence, tag].slice(-3) : [tag];

  let triggeredBuff: ComboChainTriggerResult['triggeredBuff'] = null;

  // Check 3-skill distinct resonance first
  if (seq.length === 3 && new Set(seq).size === 3) {
    triggeredBuff = {
      name: 'Resonansi Tri-Skill',
      atkSpeedBonus: 0.3,
      damageBonus: 0.25,
      durationSec: 6.0,
    };
  } else if (seq.length >= 2) {
    const prev = seq[seq.length - 2];
    const curr = seq[seq.length - 1];

    if (prev === 'blink' && curr === 'aoe') {
      triggeredBuff = {
        name: 'Serbuan Kilat',
        atkSpeedBonus: 0.28,
        damageBonus: 0.08,
        durationSec: 5.0,
      };
    } else if (
      (prev === 'aoe' && curr === 'wave') ||
      (prev === 'wave' && curr === 'aoe')
    ) {
      triggeredBuff = {
        name: 'Gelombang Abyssal',
        atkSpeedBonus: 0.1,
        damageBonus: 0.25,
        durationSec: 5.0,
      };
    } else if (
      (prev === 'fire' && curr === 'ice') ||
      (prev === 'ice' && curr === 'fire')
    ) {
      triggeredBuff = {
        name: 'Kejutan Termal',
        atkSpeedBonus: 0.12,
        damageBonus: 0.3,
        durationSec: 5.0,
      };
    } else if (
      (prev === 'lightning' && (curr === 'ice' || curr === 'fire')) ||
      ((prev === 'ice' || prev === 'fire') && curr === 'lightning')
    ) {
      triggeredBuff = {
        name: 'Badai Overcharge',
        atkSpeedBonus: 0.26,
        damageBonus: 0.24,
        durationSec: 5.5,
      };
    } else if (
      (prev === 'poison' && curr === 'fire') ||
      (prev === 'fire' && curr === 'poison')
    ) {
      triggeredBuff = {
        name: 'Ledakan Racun Api',
        atkSpeedBonus: 0.16,
        damageBonus: 0.26,
        durationSec: 5.0,
      };
    } else if (
      (prev === 'blink' || prev === 'aoe' || prev === 'wave') &&
      (curr === 'fire' || curr === 'ice' || curr === 'poison' || curr === 'lightning')
    ) {
      triggeredBuff = {
        name: 'Rantai Elemen',
        atkSpeedBonus: 0.22,
        damageBonus: 0.15,
        durationSec: 4.5,
      };
    }
  }

  const nextState: ComboChainState = {
    sequence: triggeredBuff && seq.length === 3 ? [] : seq,
    lastSkillTime: triggeredBuff && seq.length === 3 ? -999 : nowSec,
    activeBuffName: triggeredBuff ? triggeredBuff.name : state.activeBuffName,
    buffRemainingSec: triggeredBuff ? triggeredBuff.durationSec : state.buffRemainingSec,
    atkSpeedBonus: triggeredBuff ? triggeredBuff.atkSpeedBonus : state.atkSpeedBonus,
    damageBonus: triggeredBuff ? triggeredBuff.damageBonus : state.damageBonus,
  };

  return { nextState, triggeredBuff };
}

export function toComboChainHud(
  state: ComboChainState,
  nowSec: number
): ComboChainHudSnapshot {
  const windowRemainingSec =
    state.sequence.length > 0
      ? Math.max(0, COMBO_CHAIN_WINDOW_SEC - (nowSec - state.lastSkillTime))
      : 0;

  return {
    sequence: windowRemainingSec > 0 ? state.sequence : [],
    windowRemainingSec: Number(windowRemainingSec.toFixed(1)),
    activeBuffName: state.buffRemainingSec > 0 ? state.activeBuffName : null,
    buffRemainingSec: Number(state.buffRemainingSec.toFixed(1)),
    atkSpeedBonusPct: Math.round(state.atkSpeedBonus * 100),
    damageBonusPct: Math.round(state.damageBonus * 100),
  };
}
