import {
  BLADE_STYLES,
  computeItemSubSkillComboBonuses,
  computeRunItemBonuses,
  getSkillDef,
  LUNA_SCYTHE_STYLES,
  LYRA_WEAPON_STYLES,
  WEAPON_ENCHANTS,
  WITCH_WEAPON_STYLES,
} from './progression';
import type { AnySkillId, CharacterId, RunInventoryEntry, RunSubSkillEntry, SaveData } from './types';

/**
 * Re-calibrated damage multiplier so Lv.1 skills remain effective against
 * 10,000 HP regular monsters and 99,999 HP bosses without changing Lv.1 maxHp = 100.
 */
export const COMBAT_DAMAGE_SCALE = 58;
export const ATK_PER_CHAR_LEVEL = 1;

/**
 * Basic attack ratio scales Lv.1 basic slashes/strikes/bolts into the tens-to-hundreds
 * range (~45-430 dmg, never thousands at Lv.1) while growing smoothly from Lv.1 to Lv.50.
 */
export const BASIC_ATTACK_DAMAGE_RATIO = 0.085;

export function getCharacterBasicAttackFactor(characterId?: CharacterId): number {
  switch (characterId) {
    case 'lyra':
      return 0.62;
    case 'witch':
      return 0.66;
    case 'velvera':
      return 0.84;
    case 'luna':
      return 1.04;
    default:
      return 0.84;
  }
}

export function getBasicAttackComboMultiplier(
  characterId: CharacterId | undefined,
  comboStep: number
): number {
  const step = Math.max(1, Math.min(3, Math.floor(comboStep || 1)));
  if (characterId === 'lyra') {
    return step === 3 ? 1.38 : step === 2 ? 0.92 : 0.72;
  }
  if (characterId === 'witch') {
    return step === 3 ? 1.28 : step === 2 ? 0.96 : 0.78;
  }
  if (characterId === 'luna') {
    return step === 3 ? 1.52 : step === 2 ? 1.1 : 0.84;
  }
  return step === 3 ? 1.45 : step === 2 ? 1.04 : 0.8;
}

export interface DerivedPlayerStats {
  maxHp: number;
  maxMp: number;
  mpRegenPerSec: number;
  attack: number;
  critChance: number;
  critMultiplier: number;
  attackSpeedMult: number;
  moveSpeedMult: number;
  cooldownReduction: number;
  skillDamageMult: number;
  lifestealPct: number;
  killHeal: number;
  voidBurnDps: number;
  hasDoubleJump: boolean;
}

export interface RunTempBuffState {
  atkPct: number;
  speedPct: number;
  critPct: number;
  maxHpFlat: number;
}

export function computePlayerStats(
  save: SaveData,
  runInventory: RunInventoryEntry[] = [],
  runBuffs: RunTempBuffState = { atkPct: 0, speedPct: 0, critPct: 0, maxHpFlat: 0 },
  runSubSkills: RunSubSkillEntry[] = []
): DerivedPlayerStats {
  const isLuna = save.selectedCharacter === 'luna';
  const isLyra = save.selectedCharacter === 'lyra';
  const isWitch = save.selectedCharacter === 'witch';
  const lunaStyle =
    LUNA_SCYTHE_STYLES[save.lunaWeapon?.style ?? 'umbral_crescent_scythe'] ??
    LUNA_SCYTHE_STYLES.umbral_crescent_scythe;
  const velveraStyle = BLADE_STYLES[save.weapon.style] ?? BLADE_STYLES.abyss_fang;
  const lyraStyle =
    LYRA_WEAPON_STYLES[save.lyraWeapon?.style ?? 'iron_knuckle'] ?? LYRA_WEAPON_STYLES.iron_knuckle;
  const witchStyle =
    WITCH_WEAPON_STYLES[save.witchWeapon?.style ?? 'raven_gnarled_staff'] ??
    WITCH_WEAPON_STYLES.raven_gnarled_staff;
  const activeWeapon = isLuna
    ? lunaStyle
    : isWitch
      ? witchStyle
      : isLyra
        ? lyraStyle
        : velveraStyle;

  const enchant = WEAPON_ENCHANTS[save.weapon.enchant] ?? WEAPON_ENCHANTS.crit_edge;
  const activeForgeLv = isLuna
    ? (save.lunaWeapon?.forgeLevel ?? 0)
    : isWitch
      ? (save.witchWeapon?.forgeLevel ?? 0)
      : isLyra
        ? (save.lyraWeapon?.forgeLevel ?? 0)
        : save.weapon.forgeLevel;
  const forgeBonusAtk = activeForgeLv * 6;
  const activeAwakening = isLuna
    ? (save.lunaAwakening ?? 0)
    : isWitch
      ? (save.witchAwakening ?? 0)
      : isLyra
        ? (save.lyraAwakening ?? 0)
        : save.velveraAwakening;
  const awakeningMult = 1 + activeAwakening * 0.12;

  const vigorLv = save.passiveLevels.demon_vigor ?? 0;
  const hornLv = save.passiveLevels.horn_resonance ?? 0;
  const precisionLv = save.passiveLevels.twin_precision ?? 0;
  const hasteLv = save.passiveLevels.abyss_haste ?? 0;
  const leechLv = save.passiveLevels.shadow_leech ?? 0;
  const surgeLv = save.passiveLevels.fatal_surge ?? 0;

  const itemBonuses = computeRunItemBonuses(runInventory);
  const comboBonuses = computeItemSubSkillComboBonuses(runInventory, runSubSkills);

  const charLv = Math.max(1, save.characterLevel ?? 1);
  const maxHp = Math.round(
    100 +
      (charLv - 1) * 18 +
      vigorLv * 30 +
      activeAwakening * 25 +
      itemBonuses.maxHpBonus +
      runBuffs.maxHpFlat
  );
  const maxMp = (isWitch ? 130 : isLuna ? 115 : 100) + hornLv * 8;
  const mpRegenPerSec = (isWitch ? 7.8 : isLuna ? 6.4 : 5.5) + hornLv * 0.6;

  const baseAtk =
    20 +
    (charLv - 1) * ATK_PER_CHAR_LEVEL +
    activeWeapon.atkBonus +
    forgeBonusAtk +
    precisionLv * 5 +
    itemBonuses.atkBonus;
  const attack = Math.round(
    baseAtk * awakeningMult * (1 + runBuffs.atkPct + comboBonuses.atkPct) * COMBAT_DAMAGE_SCALE
  );

  const critChance = Math.min(
    0.85,
    0.12 +
      activeWeapon.critBonus +
      enchant.critBonus +
      precisionLv * 0.02 +
      (isLyra ? 0.04 : isLuna ? 0.03 : isWitch ? 0.03 : 0) +
      itemBonuses.critBonus +
      runBuffs.critPct +
      comboBonuses.critPct
  );
  const critMultiplier = 1.6 + surgeLv * 0.12 + activeAwakening * 0.08;

  const attackSpeedMult =
    1 +
    activeWeapon.speedBonus +
    enchant.speedBonus +
    hasteLv * 0.04 +
    (isLyra ? 0.12 : isLuna ? 0.02 : 0) +
    runBuffs.speedPct;
  const moveSpeedMult =
    1 +
    enchant.speedBonus * 0.5 +
    hasteLv * 0.04 +
    (isLyra ? 0.08 : isLuna ? 0.04 : isWitch ? 0.03 : 0) +
    itemBonuses.moveSpeedBonus +
    runBuffs.speedPct +
    comboBonuses.moveSpeedPct;
  const cooldownReduction = Math.min(0.45, hasteLv * 0.04 + (isWitch ? 0.06 : isLuna ? 0.04 : 0));
  const witchStaffSkillBonus = isWitch ? witchStyle.skillDmgBonus + 0.12 : 0;
  const lunaScytheSkillBonus = isLuna ? 0.08 : 0;
  const skillDamageMult =
    1 +
    hornLv * 0.08 +
    witchStaffSkillBonus +
    lunaScytheSkillBonus +
    itemBonuses.skillDmgBonus +
    comboBonuses.skillDmgPct;

  return {
    maxHp,
    maxMp,
    mpRegenPerSec,
    attack,
    critChance,
    critMultiplier,
    attackSpeedMult,
    moveSpeedMult,
    cooldownReduction,
    skillDamageMult,
    lifestealPct: enchant.lifestealPct + itemBonuses.lifestealBonus + comboBonuses.lifestealPct,
    killHeal: leechLv * 6,
    voidBurnDps: enchant.voidBurnDps * COMBAT_DAMAGE_SCALE,
    hasDoubleJump: itemBonuses.hasDoubleJump,
  };
}

export function calculateSlashDamage(
  stats: DerivedPlayerStats,
  comboMultiplier: number,
  rng: () => number = Math.random,
  extraDamageMult = 1,
  characterId?: CharacterId
): { damage: number; isCrit: boolean } {
  const isCrit = rng() < stats.critChance;
  const variance = 0.94 + rng() * 0.12;
  const charFactor = getCharacterBasicAttackFactor(characterId);
  const raw =
    stats.attack *
    BASIC_ATTACK_DAMAGE_RATIO *
    charFactor *
    comboMultiplier *
    extraDamageMult *
    variance *
    (isCrit ? stats.critMultiplier : 1);
  return { damage: Math.max(1, Math.round(raw)), isCrit };
}

export function calculateSkillDamage(
  stats: DerivedPlayerStats,
  skillId: AnySkillId,
  skillLevel: number,
  rng: () => number = Math.random,
  extraDamageMult = 1
): { damage: number; isCrit: boolean } {
  const def = getSkillDef(skillId);
  const clampedLv = Math.max(1, Math.min(10, skillLevel));
  const levelScale = 1 + (clampedLv - 1) * 0.24;
  const isCrit = rng() < Math.min(0.95, stats.critChance + 0.06);
  const raw =
    stats.attack *
    def.basePower *
    levelScale *
    stats.skillDamageMult *
    extraDamageMult *
    (isCrit ? stats.critMultiplier : 1);
  return { damage: Math.max(1, Math.round(raw)), isCrit };
}

export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
