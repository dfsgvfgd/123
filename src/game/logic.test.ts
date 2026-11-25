import test from 'node:test';
import assert from 'node:assert/strict';
import type { SaveData } from './types';
import {
  createInitialSaveData,
  DEFAULT_KEYBINDINGS,
  DEFAULT_MOBILE_CONTROLS,
  hasExistingSaveData,
  persistSaveData,
} from './storage';
import {
  calculateSsrRate,
  claimDailyReward,
  claimEventBannerReward,
  DAILY_LOGIN_REWARDS,
  EVENT_BANNERS,
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  HARD_PITY_LIMIT,
  performSinglePull,
  performTenPull,
} from './gacha';
import {
  addRunInventoryItem,
  advanceSubStage,
  ALL_SUB_SKILL_IDS,
  BESTIARY_ENTRIES,
  BOSS_MAX_HP,
  claimBestiaryReward,
  computeBossBarState,
  computeItemSubSkillComboBonuses,
  computeItemSubSkillCombos,
  computeMonsterSilverDrop,
  computeRunItemBonuses,
  FIVE_CHEST_PROBABILITY,
  forgeWeapon,
  generateCatMerchantOffers,
  generateRoomMonsters,
  getCharacterActiveSkills,
  getRunItemScaledBonuses,
  getStageTheme,
  getStageWeather,
  getSubSkillScaledStats,
  ITEM_SUBSKILL_COMBOS,
  MAX_ACTIVE_SKILL_LEVEL,
  MAX_RUN_INVENTORY,
  MAX_RUN_ITEM_LEVEL,
  MAX_RUN_SUB_SKILLS,
  MAX_SUB_SKILL_LEVEL,
  NORMAL_MONSTER_BASE_HP,
  purchaseWeaponSkin,
  removeRunInventoryItem,
  replaceRunSubSkill,
  rollBossChestSkill,
  rollDungeonChestOffer,
  rollOrangeChestItem,
  rollPlayerSpawnX,
  rollPortalSide,
  rollPostStageSkillDraft,
  rollSupplyChestCount,
  rollSupplyChestHealPct,
  rollTombActiveSkill,
  RUN_ITEMS,
  shouldResetDummyMetrics,
  STAGE_BGM_NAMES,
  STAGE_BOSS_NAMES,
  SUB_SKILLS,
  upgradeCharacterActiveSkill,
  upgradeCharacterLevel,
  upgradePassiveNode,
} from './progression';
import {
  aabbOverlap,
  calculateSkillDamage,
  calculateSlashDamage,
  COMBAT_DAMAGE_SCALE,
  computePlayerStats,
} from './combatMath';
import {
  COMBO_CHAIN_WINDOW_SEC,
  COMBO_DECAY_WINDOW_SEC,
  computeComboTimerPct,
  createInitialComboChainState,
  CRITICAL_COMBO_INTERVAL,
  getSubSkillVfxScale,
  isCriticalComboMilestone,
  recordSkillChain,
  tickComboChain,
  toComboChainHud,
} from './comboChain';
import {
  getLobbyRoomProps,
  getLobbyRoomWidth,
  LOBBY_ENCHANT_W,
  LOBBY_GROUND_Y,
  LOBBY_MAIN_W,
} from './lobbyLayout';
import { SkillVfxPool } from '../engine/skillVfx';
import { getSanctumNavForScope, getScopeForSanctumTab } from './sanctumNav';
import { getStageLayout, getTerrainYFromSegments, validateStageLayout } from './stageLayouts';

test('gacha hard pity guarantees SSR Velvera at pull 80 and resets pity to 0', () => {
  const base = createInitialSaveData();
  const nearPity = { ...base, gems: 1000, pityCount: HARD_PITY_LIMIT - 1 };
  assert.equal(calculateSsrRate(HARD_PITY_LIMIT - 1), 1);

  const { nextSave, record } = performSinglePull(nearPity, { rng: () => 0.999, now: 1000 });
  assert.equal(record.rarity, 'SSR');
  assert.equal(record.itemId, 'char_velvera_ssr');
  assert.equal(nextSave.pityCount, 0);
  assert.equal(nextSave.gems, 1000 - GACHA_COST_SINGLE);
  assert.equal(nextSave.velveraAwakening, 1);
  assert.equal(nextSave.pullHistory.length, 1);
});

test('gacha 10-pull deducts 1600 gems, logs 10 pull history entries, and guarantees at least one SR/SSR', () => {
  const base = { ...createInitialSaveData(), gems: 2000 };
  const { nextSave, records } = performTenPull(base, { rng: () => 0.99, now: 5000 });
  assert.equal(records.length, 10);
  assert.equal(nextSave.gems, 2000 - GACHA_COST_TEN);
  assert.equal(nextSave.pullHistory.length, 10);
  assert.ok(records.some((r) => r.rarity === 'SR' || r.rarity === 'SSR'));
});

test('daily login awards modest premium gems (<=160/day) and prevents double claiming same day', () => {
  for (const reward of DAILY_LOGIN_REWARDS) {
    assert.ok(reward.gems <= 160);
  }
  const base = createInitialSaveData();
  const { nextSave, claimed } = claimDailyReward(base, '2026-11-19');
  assert.equal(claimed.day, 1);
  assert.equal(nextSave.gems, base.gems + claimed.gems);
  assert.deepEqual(nextSave.dailyLogin.claimedDays, [1]);

  assert.throws(() => claimDailyReward(nextSave, '2026-11-19'));

  const day2 = claimDailyReward(nextSave, '2026-11-20');
  assert.equal(day2.claimed.day, 2);
  assert.deepEqual(day2.nextSave.dailyLogin.claimedDays, [1, 2]);
});

test('event banner reward grants gems once and marks event as seen', () => {
  const base = createInitialSaveData();
  const banner = EVENT_BANNERS[0];
  const updated = claimEventBannerReward(base, banner.id);
  assert.equal(updated.gems, base.gems + banner.rewardGems);
  assert.ok(updated.seenEventIds.includes(banner.id));

  const secondClaim = claimEventBannerReward(updated, banner.id);
  assert.equal(secondClaim.gems, updated.gems);
});

test('10-stage dungeon progression advances 1-1..1-5 -> 2-1..10-5 -> completion', () => {
  assert.deepEqual(advanceSubStage(1, 1), { nextStage: 1, nextSubStage: 2, dungeonCompleted: false });
  assert.deepEqual(advanceSubStage(1, 5), { nextStage: 2, nextSubStage: 1, dungeonCompleted: false });
  assert.deepEqual(advanceSubStage(9, 5), { nextStage: 10, nextSubStage: 1, dungeonCompleted: false });
  assert.deepEqual(advanceSubStage(10, 5), { nextStage: 10, nextSubStage: 5, dungeonCompleted: true });
});

test('portal side, random player spawn, and 20-35 monster pool behave properly', () => {
  assert.equal(rollPortalSide(() => 0.1), 'left');
  assert.equal(rollPortalSide(() => 0.9), 'right');

  const spawnLeft = rollPlayerSpawnX(3600, () => 0);
  const spawnRight = rollPlayerSpawnX(3600, () => 0.999);
  assert.ok(spawnLeft >= 160 && spawnRight <= 3440);

  const stage1Monsters = generateRoomMonsters(1, 1, () => 0.5);
  const stage10Monsters = generateRoomMonsters(10, 4, () => 0.5);
  assert.ok(stage1Monsters.length >= 20 && stage1Monsters.length <= 35);
  assert.ok(stage10Monsters.length >= 20 && stage10Monsters.length <= 35);
  for (const m of stage1Monsters) {
    assert.ok(['goblin', 'skeleton', 'kelalawar', 'zombie_knight'].includes(m));
  }
});

test('initial HP is 100 and character level upgrade increases Max HP and ATK', () => {
  const base = createInitialSaveData();
  const initialStats = computePlayerStats(base);
  assert.equal(initialStats.maxHp, 100);

  const rich = { ...base, gold: 1000, skillEssence: 100 };
  const upgraded = upgradeCharacterLevel(rich);
  assert.equal(upgraded.characterLevel, 2);
  const upgradedStats = computePlayerStats(upgraded);
  assert.equal(upgradedStats.maxHp, 118);
  assert.ok(upgradedStats.attack > initialStats.attack);
});

test('stage-only sub-skills from tombs/chests and post-stage draft never grant character active skills', () => {
  assert.equal(Math.round(rollSupplyChestHealPct(() => 0) * 100), 1);
  assert.equal(Math.round(rollSupplyChestHealPct(() => 0.9999) * 100), 45);

  const base = createInitialSaveData();
  const draft = rollPostStageSkillDraft(base, [], () => 0.5);
  assert.equal(draft.length, 3);
  assert.ok(draft.some((d) => d.kind === 'sub'));
  assert.ok(draft.some((d) => d.kind === 'temp_buff'));
  assert.ok(draft.some((d) => d.kind === 'passive'));
  assert.equal(draft.some((d) => (d.kind as string) === 'active'), false);

  const tomb = rollTombActiveSkill([], () => 0.3);
  assert.ok(ALL_SUB_SKILL_IDS.includes(tomb.skillId));
  assert.equal(tomb.isSubSkill, true);
  assert.equal(tomb.autoEquipped, true);
  assert.equal(tomb.newLevel, 1);

  const tombUpgrade = rollTombActiveSkill([{ id: tomb.skillId, level: 2 }], () => 0.0);
  assert.ok(tombUpgrade.newLevel >= 1 && tombUpgrade.newLevel <= 5);
});

test('character active skills upgrade strictly via Sanctum up to Lv.10 and throw past Lv.10', () => {
  let save = { ...createInitialSaveData(), gold: 50000, skillEssence: 5000 };
  assert.equal(MAX_ACTIVE_SKILL_LEVEL, 10);
  for (let lv = 1; lv < 10; lv++) {
    save = upgradeCharacterActiveSkill(save, 'void_tempest');
    assert.equal(save.skillLevels.void_tempest, lv + 1);
  }
  assert.throws(() => upgradeCharacterActiveSkill(save, 'void_tempest'));
});

test('weapon shop NPC purchases Dual Blade for Velvera and Gauntlet & Greaves for Lyra', () => {
  const base = { ...createInitialSaveData(), gold: 10000 };
  const withVelveraBlade = purchaseWeaponSkin(base, 'velvera', 'amethyst_crescent');
  assert.equal(withVelveraBlade.weapon.style, 'amethyst_crescent');
  assert.ok(withVelveraBlade.unlockedBladeStyles.includes('amethyst_crescent'));
  assert.ok(withVelveraBlade.gold < base.gold);

  const withLyraWeapon = purchaseWeaponSkin(withVelveraBlade, 'lyra', 'crimson_wraps');
  assert.equal(withLyraWeapon.lyraWeapon.style, 'crimson_wraps');
  assert.ok(withLyraWeapon.unlockedLyraWeapons.includes('crimson_wraps'));

  const lyraStats = computePlayerStats({ ...withLyraWeapon, selectedCharacter: 'lyra' });
  const defaultLyraStats = computePlayerStats({ ...base, selectedCharacter: 'lyra' });
  assert.ok(lyraStats.attack > defaultLyraStats.attack);
});

test('Orange Chest stage inventory holds max 5 distinct items, levels duplicates up to Lv.3 even at 5/5 full, and supports discard', () => {
  const save = createInitialSaveData();
  const fiveDistinct = [
    'boots_swift',
    'ring_crimson',
    'charm_crit',
    'cloak_vitality',
    'orb_frost_heart',
  ] as const;
  let inv = [] as ReturnType<typeof addRunInventoryItem>['next'];
  for (let i = 0; i < MAX_RUN_INVENTORY; i++) {
    const res = addRunInventoryItem(inv, fiveDistinct[i], `u_${i}`);
    assert.equal(res.added, true);
    assert.equal(res.newLevel, 1);
    inv = res.next;
  }
  assert.equal(inv.length, 5);

  // Adding a 6th DIFFERENT item fails bag capacity
  const overflow = addRunInventoryItem(inv, 'boots_double_jump', 'u_over');
  assert.equal(overflow.added, false);

  // Adding a DUPLICATE item already in the full 5/5 bag upgrades in-place (Lv.1 -> Lv.2 -> Lv.3 MAX)
  const upLv2 = addRunInventoryItem(inv, 'boots_swift', 'u_dup_2');
  assert.equal(upLv2.added, true);
  assert.equal(upLv2.upgraded, true);
  assert.equal(upLv2.newLevel, 2);
  assert.equal(upLv2.next.length, 5);

  const upLv3 = addRunInventoryItem(upLv2.next, 'boots_swift', 'u_dup_3');
  assert.equal(upLv3.added, true);
  assert.equal(upLv3.upgraded, true);
  assert.equal(upLv3.newLevel, MAX_RUN_ITEM_LEVEL);

  const capped = addRunInventoryItem(upLv3.next, 'boots_swift', 'u_dup_4');
  assert.equal(capped.added, false);
  assert.equal(capped.maxed, true);

  // Verify scaled bonuses reflect Lv.3 upgrades
  const lv1Swift = getRunItemScaledBonuses('boots_swift', 1);
  const lv3Swift = getRunItemScaledBonuses('boots_swift', 3);
  assert.ok(lv3Swift.moveSpeedBonus > lv1Swift.moveSpeedBonus * 2);

  // Discarding a slot allows picking up Double Jump Boots
  const trimmed = removeRunInventoryItem(upLv3.next, 'u_4');
  const withDoubleJump = addRunInventoryItem(trimmed, 'boots_double_jump', 'u_dj');
  assert.equal(withDoubleJump.added, true);
  assert.equal(withDoubleJump.next.length, 5);

  const bonuses = computeRunItemBonuses(withDoubleJump.next);
  assert.equal(bonuses.hasDoubleJump, true);
  assert.ok(bonuses.moveSpeedBonus > 0.45);

  const derived = computePlayerStats(save, withDoubleJump.next);
  assert.equal(derived.hasDoubleJump, true);
  assert.ok(derived.moveSpeedMult > computePlayerStats(save).moveSpeedMult);

  const rolled = rollOrangeChestItem([], () => 0.1);
  assert.equal(rolled.id, RUN_ITEMS.boots_double_jump.id);
});

test('bestiary completion reward requires target kills and prevents double claim', () => {
  const base = createInitialSaveData();
  const target = BESTIARY_ENTRIES[0].targetKills;
  assert.throws(() => claimBestiaryReward(base, 'goblin'));

  const completed = {
    ...base,
    bestiaryKills: { ...base.bestiaryKills, goblin: target },
  };
  const rewarded = claimBestiaryReward(completed, 'goblin');
  assert.equal(rewarded.gems, base.gems + BESTIARY_ENTRIES[0].rewardGems);
  assert.throws(() => claimBestiaryReward(rewarded, 'goblin'));
});

test('all 10 stage themes & weather vary by stage', () => {
  const motifs = new Set<string>();
  for (let s = 1; s <= 10; s++) {
    motifs.add(getStageTheme(s).motif);
  }
  assert.equal(motifs.size, 10);

  assert.equal(getStageWeather(1).type, 'violet_embers');
  assert.equal(getStageWeather(4).type, 'ash_mist');
  assert.equal(getStageWeather(6).type, 'spectral_fog');
  assert.equal(getStageWeather(8).type, 'amethyst_rain');
  assert.equal(getStageWeather(10).type, 'abyssal_storm');
});

test('weapon forging, passive skill tree, boss chest sub-skill, and combat math work accurately', () => {
  let save: SaveData = {
    ...createInitialSaveData(),
    selectedCharacter: 'velvera',
    gold: 5000,
    forgeShards: 200,
    skillEssence: 100,
  };
  save = forgeWeapon(save);
  save = forgeWeapon(save);
  assert.equal(save.weapon.forgeLevel, 2);
  assert.ok(save.unlockedBladeStyles.includes('amethyst_crescent'));

  save = upgradePassiveNode(save, 'twin_precision');
  const stats = computePlayerStats(save);
  assert.ok(stats.attack > 30);

  const slash = calculateSlashDamage(stats, 1.2, () => 0.01);
  assert.equal(slash.isCrit, true);
  assert.ok(slash.damage > stats.attack);

  const chest = rollBossChestSkill([], () => 0.8);
  assert.ok(ALL_SUB_SKILL_IDS.includes(chest.skillId));
  assert.equal(chest.newLevel, 1);

  assert.equal(aabbOverlap({ x: 0, y: 0, w: 20, h: 20 }, { x: 10, y: 10, w: 20, h: 20 }), true);
  assert.equal(aabbOverlap({ x: 0, y: 0, w: 20, h: 20 }, { x: 25, y: 0, w: 20, h: 20 }), false);
});

test('Lv.1 character active skills and chest sub-skills deal modest damage and scale up to Lv.10', () => {
  const base = createInitialSaveData();
  const stats = computePlayerStats(base);

  const lv1Active = calculateSkillDamage(stats, 'void_tempest', 1, () => 0.99);
  const lv10Active = calculateSkillDamage(stats, 'void_tempest', 10, () => 0.99);
  assert.ok(lv1Active.damage <= Math.round(stats.attack * 1.15));
  assert.ok(lv10Active.damage >= Math.round(lv1Active.damage * 2.5));

  for (const subId of ALL_SUB_SKILL_IDS) {
    assert.ok(SUB_SKILLS[subId].basePower < 0.85);
    const lv1Sub = calculateSkillDamage(stats, subId, 1, () => 0.99);
    const lv5Sub = calculateSkillDamage(stats, subId, 5, () => 0.99);
    assert.ok(lv1Sub.damage <= stats.attack);
    assert.ok(lv5Sub.damage > lv1Sub.damage);
  }
});

test('Combo Chain system tracks consecutive skills, triggers buffs, and expires outside window', () => {
  const chain = createInitialComboChainState();

  const step1 = recordSkillChain(chain, 'blink', 10.0);
  assert.equal(step1.triggeredBuff, null);
  assert.deepEqual(step1.nextState.sequence, ['blink']);

  const step2 = recordSkillChain(step1.nextState, 'aoe', 11.2);
  assert.ok(step2.triggeredBuff);
  assert.equal(step2.triggeredBuff.name, 'Serbuan Kilat');
  assert.equal(step2.triggeredBuff.atkSpeedBonus, 0.28);

  const step3 = recordSkillChain(step2.nextState, 'fire', 12.5);
  assert.ok(step3.triggeredBuff);
  assert.equal(step3.triggeredBuff.name, 'Resonansi Tri-Skill');
  assert.equal(step3.triggeredBuff.damageBonus, 0.25);

  const thermal1 = recordSkillChain(createInitialComboChainState(), 'fire', 20.0);
  const thermal2 = recordSkillChain(thermal1.nextState, 'ice', 21.0);
  assert.equal(thermal2.triggeredBuff?.name, 'Kejutan Termal');

  const ticked = tickComboChain(thermal2.nextState, 2.0, 23.0);
  assert.equal(ticked.activeBuffName, 'Kejutan Termal');
  assert.ok(ticked.buffRemainingSec > 2.5);

  const expired = tickComboChain(ticked, 4.0, 20.0 + COMBO_CHAIN_WINDOW_SEC + 5.0);
  assert.equal(expired.activeBuffName, null);
  assert.equal(expired.sequence.length, 0);
  assert.equal(toComboChainHud(expired, 30.0).activeBuffName, null);
});

test('Lyra character has faster martial stats, dedicated active skill pool, and Lyra gacha banner works', () => {
  const base = createInitialSaveData();
  const velveraStats = computePlayerStats(base);
  const lyraSave = { ...base, selectedCharacter: 'lyra' as const };
  const lyraStats = computePlayerStats(lyraSave);

  assert.equal(lyraStats.maxHp, 100);
  assert.ok(lyraStats.attackSpeedMult > velveraStats.attackSpeedMult);
  assert.ok(lyraStats.moveSpeedMult > velveraStats.moveSpeedMult);
  assert.ok(lyraStats.critChance > velveraStats.critChance);

  const lyraSkills = getCharacterActiveSkills('lyra');
  assert.deepEqual(lyraSkills, ['lyra_fist_rush', 'lyra_cyclone_kick', 'lyra_aura_overdrive']);

  const nearPity = { ...lyraSave, gems: 1000, pityCount: HARD_PITY_LIMIT - 1 };
  const { nextSave, record } = performSinglePull(nearPity, {
    rng: () => 0.999,
    now: 2000,
    bannerId: 'lyra',
  });
  assert.equal(record.rarity, 'SSR');
  assert.equal(record.itemId, 'char_lyra_ssr');
  assert.equal(nextSave.lyraAwakening, 1);
  assert.equal(nextSave.pityCount, 0);
});

test('all 10 stage bosses, per-stage BGM labels, keybindings, and non-persistent sub-skills match specification', () => {
  assert.deepEqual(STAGE_BOSS_NAMES, [
    'Slime King',
    'Goblin King',
    'Black Knight',
    'Laba-Laba & Kelelawar Mata Satu',
    'Mermaid Queen',
    'Manusia Ular',
    'Lizar',
    'Golem',
    'Naga',
    'GOD',
  ]);
  assert.equal(STAGE_BGM_NAMES.length, 10);
  assert.equal(new Set(STAGE_BGM_NAMES).size, 10);

  const initial = createInitialSaveData();
  assert.equal(initial.selectedCharacter, 'luna');
  assert.deepEqual(initial.audioSettings, {
    masterVolume: 80,
    bgmVolume: 70,
    sfxVolume: 85,
    muted: false,
  });
  assert.deepEqual(initial.keybindings, DEFAULT_KEYBINDINGS);
  assert.equal('subSkill1' in initial.keybindings, false);
  assert.equal('subSkill2' in initial.keybindings, false);
  assert.equal('equippedSubSkills' in initial, false);
  assert.equal('subSkillLevels' in initial, false);
  persistSaveData(initial);
  assert.equal(hasExistingSaveData(), false);
});

test('Luna (hooded scythe) and Seraphina (witch) have dedicated skills, weapons, forge unlocks, and gacha banners', () => {
  const base = createInitialSaveData();
  assert.deepEqual(getCharacterActiveSkills('luna'), [
    'luna_soul_harvest',
    'luna_umbral_rush',
    'luna_lunar_eclipse',
  ]);
  assert.deepEqual(getCharacterActiveSkills('witch'), [
    'witch_raven_arcana',
    'witch_starfall_meteor',
    'witch_void_vortex',
  ]);

  const rich = {
    ...base,
    gems: 5000,
    gold: 20000,
    forgeShards: 120,
    skillEssence: 200,
  };

  // Luna scythe shop purchase & forge unlock
  const lunaBought = purchaseWeaponSkin(rich, 'luna', 'astral_eclipse_scythe');
  assert.equal(lunaBought.lunaWeapon.style, 'astral_eclipse_scythe');
  assert.ok(lunaBought.unlockedLunaWeapons.includes('astral_eclipse_scythe'));

  let lunaForged: SaveData = { ...rich, selectedCharacter: 'luna' };
  lunaForged = forgeWeapon(lunaForged);
  lunaForged = forgeWeapon(lunaForged);
  assert.equal(lunaForged.lunaWeapon.forgeLevel, 2);
  assert.ok(lunaForged.unlockedLunaWeapons.includes('crimson_reaper_scythe'));

  // Witch staff shop purchase & forge unlock
  const witchBought = purchaseWeaponSkin(rich, 'witch', 'amethyst_lantern_rod');
  assert.equal(witchBought.witchWeapon.style, 'amethyst_lantern_rod');
  assert.ok(witchBought.unlockedWitchWeapons.includes('amethyst_lantern_rod'));

  let witchForged: SaveData = { ...rich, selectedCharacter: 'witch' };
  witchForged = forgeWeapon(witchForged);
  witchForged = forgeWeapon(witchForged);
  assert.equal(witchForged.witchWeapon.forgeLevel, 2);
  assert.ok(witchForged.unlockedWitchWeapons.includes('amethyst_lantern_rod'));

  // Gacha SSR banner pulls for Luna & Witch
  const nearPityLuna = { ...rich, pityCount: HARD_PITY_LIMIT - 1 };
  const lunaPull = performSinglePull(nearPityLuna, {
    rng: () => 0.999,
    now: 3000,
    bannerId: 'luna',
  });
  assert.equal(lunaPull.record.rarity, 'SSR');
  assert.equal(lunaPull.record.itemId, 'char_luna_ssr');
  assert.equal(lunaPull.nextSave.lunaAwakening, 1);

  const nearPityWitch = { ...rich, pityCount: HARD_PITY_LIMIT - 1 };
  const witchPull = performSinglePull(nearPityWitch, {
    rng: () => 0.999,
    now: 4000,
    bannerId: 'witch',
  });
  assert.equal(witchPull.record.rarity, 'SSR');
  assert.equal(witchPull.record.itemId, 'char_witch_ssr');
  assert.equal(witchPull.nextSave.witchAwakening, 1);
});

test('supply chest offer returns 4 choices (1 heal 1%-45% + 3 distinct items), boss bar has 5 layers, sub-skill cap is 4, and dummy resets at 8s', () => {
  const offer = rollDungeonChestOffer([], 200, () => 0.5);
  assert.equal(offer.length, 4);
  const heals = offer.filter((o) => o.kind === 'heal');
  const items = offer.filter((o) => o.kind === 'item');
  assert.equal(heals.length, 1);
  assert.equal(items.length, 3);
  assert.ok((heals[0].healPct ?? 0) >= 0.01 && (heals[0].healPct ?? 0) <= 0.45);
  assert.equal(new Set(items.map((i) => i.itemDef?.id)).size, 3);

  // Strictly 5-layer Boss HP bar calculations
  assert.deepEqual(computeBossBarState(500, 500, 5), {
    hp: 500,
    maxHp: 500,
    barHp: 100,
    barMaxHp: 100,
    barsRemaining: 5,
    totalBars: 5,
  });
  assert.deepEqual(computeBossBarState(401, 500, 5), {
    hp: 401,
    maxHp: 500,
    barHp: 1,
    barMaxHp: 100,
    barsRemaining: 5,
    totalBars: 5,
  });
  assert.deepEqual(computeBossBarState(400, 500, 5), {
    hp: 400,
    maxHp: 500,
    barHp: 100,
    barMaxHp: 100,
    barsRemaining: 4,
    totalBars: 5,
  });
  assert.deepEqual(computeBossBarState(50, 500, 5), {
    hp: 50,
    maxHp: 500,
    barHp: 50,
    barMaxHp: 100,
    barsRemaining: 1,
    totalBars: 5,
  });
  assert.deepEqual(computeBossBarState(0, 500, 5), {
    hp: 0,
    maxHp: 500,
    barHp: 0,
    barMaxHp: 100,
    barsRemaining: 0,
    totalBars: 5,
  });

  // Sub-skill cap of 4 slots (max Lv.3): duplicate sub-skills upgrade in-place even when 4/4 full, unequipped triggers swap
  assert.equal(MAX_RUN_SUB_SKILLS, 4);
  assert.equal(MAX_SUB_SKILL_LEVEL, 3);
  const fullFourSubs = [
    { id: 'sub_fireball' as const, level: 1 },
    { id: 'sub_icearrow' as const, level: 1 },
    { id: 'sub_poison' as const, level: 1 },
    { id: 'sub_lightning' as const, level: 1 },
  ];
  const rolledFromFull = rollBossChestSkill(fullFourSubs, () => 0.25);
  assert.ok(fullFourSubs.some((s) => s.id === rolledFromFull.skillId));
  assert.equal(rolledFromFull.autoEquipped, false);
  assert.equal(rolledFromFull.newLevel, 2);

  // Rolling a duplicate (index 0: sub_fireball) upgrades in-place without needing swap
  const tombDupFromFull = rollTombActiveSkill(fullFourSubs, () => 0.0);
  assert.equal(tombDupFromFull.needsSwap, false);
  assert.equal(tombDupFromFull.skillId, 'sub_fireball');
  assert.equal(tombDupFromFull.newLevel, 2);

  // Rolling an unequipped sub-skill when 4/4 full still triggers swap
  const tombNewFromFull = rollTombActiveSkill(fullFourSubs, () => 0.95);
  assert.equal(tombNewFromFull.needsSwap, true);
  assert.equal(tombNewFromFull.autoEquipped, false);
  assert.equal(fullFourSubs.some((s) => s.id === tombNewFromFull.skillId), false);
  const swappedSubs = replaceRunSubSkill(fullFourSubs, 2, tombNewFromFull.skillId, tombNewFromFull.newLevel);
  assert.equal(swappedSubs.length, 4);
  assert.equal(swappedSubs[2].id, tombNewFromFull.skillId);

  // 8-second Orang Sawah idle reset
  assert.equal(shouldResetDummyMetrics(-1, 20), false);
  assert.equal(shouldResetDummyMetrics(10, 17.9), false);
  assert.equal(shouldResetDummyMetrics(10, 18), true);

  // Default language & mobile layout offsets
  const save = createInitialSaveData();
  assert.equal(save.language, 'id');
  assert.deepEqual(save.mobileControls, DEFAULT_MOBILE_CONTROLS);
  assert.equal(DEFAULT_MOBILE_CONTROLS.skillsOffsetX, 0);
  assert.equal(DEFAULT_MOBILE_CONTROLS.dpadOffsetX, 0);
  assert.equal(DEFAULT_MOBILE_CONTROLS.actionOffsetX, 0);
});

test('SkillVfxPool tracks player sustain/drain endpoints, wraps ring buffer, and expires cleanly', () => {
  const vfx = new SkillVfxPool(3);
  vfx.spawn({
    kind: 'drain_tendril',
    x: 400,
    y: 300,
    tx: 100,
    ty: 300,
    facing: 1,
    radius: 40,
    angle: 0,
    maxLife: 0.5,
    color: '#C026D3',
    coreColor: '#E9D5FF',
    accentColor: '#4ADE80',
    orbitCount: 3,
    followPlayer: false,
    trackTargetToPlayer: true,
  });
  vfx.spawn({
    kind: 'sustain_pulse',
    x: 100,
    y: 300,
    tx: 100,
    ty: 300,
    facing: 1,
    radius: 56,
    angle: 0,
    maxLife: 0.8,
    color: '#A855F7',
    coreColor: '#F0FDF4',
    accentColor: '#4ADE80',
    orbitCount: 4,
    followPlayer: true,
    trackTargetToPlayer: false,
  });

  vfx.update(0.2, 220, 280);
  assert.equal(vfx.items[0].active, true);
  assert.equal(vfx.items[0].x, 400); // source stays at enemy
  assert.equal(vfx.items[0].tx, 220); // drain target tracks moving player
  assert.equal(vfx.items[0].ty, 280);

  assert.equal(vfx.items[1].active, true);
  assert.equal(vfx.items[1].x, 220); // sustain pulse follows player
  assert.equal(vfx.items[1].y, 280);

  // Advance past drain expiry
  vfx.update(0.35, 260, 280);
  assert.equal(vfx.items[0].active, false);
  assert.equal(vfx.items[1].active, true);

  // Ring buffer wraps cleanly without allocating
  for (let i = 0; i < 4; i++) {
    vfx.spawn({
      kind: 'eclipse_dome',
      x: 500 + i * 10,
      y: 300,
      tx: 500,
      ty: 300,
      facing: 1,
      radius: 170,
      angle: 0,
      maxLife: 0.6,
      color: '#818CF8',
      coreColor: '#E0F2FE',
      accentColor: '#38BDF8',
      orbitCount: 8,
      followPlayer: false,
      trackTargetToPlayer: false,
    });
  }
  assert.equal(vfx.items.length, 3);
  vfx.clear();
  assert.equal(vfx.items.some((item) => item.active), false);
});

test('Sanctum menu scopes strictly separate Character+Event, Gacha+Daily, and Enchant Weapon flows', () => {
  const charNav = getSanctumNavForScope('character');
  assert.deepEqual(charNav.primaryTabs, ['skills', 'weapon']);
  assert.equal(charNav.sideTab, 'events');
  assert.equal(charNav.primaryTabs.includes('gacha'), false);
  assert.equal(charNav.primaryTabs.includes('daily'), false);
  assert.equal(charNav.primaryTabs.includes('bestiary'), false);

  const gachaNav = getSanctumNavForScope('gacha');
  assert.deepEqual(gachaNav.primaryTabs, ['gacha']);
  assert.equal(gachaNav.sideTab, 'daily');
  assert.equal(gachaNav.primaryTabs.includes('skills'), false);
  assert.equal(gachaNav.primaryTabs.includes('weapon'), false);
  assert.equal(gachaNav.primaryTabs.includes('bestiary'), false);

  const weaponNav = getSanctumNavForScope('weapon');
  assert.deepEqual(weaponNav.primaryTabs, ['weapon']);
  assert.equal(weaponNav.sideTab, null);

  assert.equal(getScopeForSanctumTab('skills'), 'character');
  assert.equal(getScopeForSanctumTab('events'), 'character');
  assert.equal(getScopeForSanctumTab('gacha'), 'gacha');
  assert.equal(getScopeForSanctumTab('daily'), 'gacha');
  assert.equal(getScopeForSanctumTab('weapon'), 'weapon');
});

test('SkillVfxPool updates Luna cast activation effects (inward_motes, launch_flash, cast_eclipse_ring)', () => {
  const vfx = new SkillVfxPool(6);
  vfx.spawn({
    kind: 'inward_motes',
    x: 100,
    y: 200,
    tx: 100,
    ty: 200,
    facing: 1,
    radius: 74,
    angle: 0,
    maxLife: 0.32,
    color: '#9333EA',
    coreColor: '#F5D0FE',
    accentColor: '#4ADE80',
    orbitCount: 8,
    followPlayer: true,
    trackTargetToPlayer: false,
  });
  vfx.spawn({
    kind: 'launch_flash',
    x: 100,
    y: 200,
    tx: 100,
    ty: 200,
    facing: 1,
    radius: 52,
    angle: 0,
    maxLife: 0.22,
    color: '#38BDF8',
    coreColor: '#E0F2FE',
    accentColor: '#A855F7',
    orbitCount: 4,
    followPlayer: false,
    trackTargetToPlayer: false,
  });
  vfx.spawn({
    kind: 'cast_eclipse_ring',
    x: 134,
    y: 192,
    tx: 134,
    ty: 192,
    facing: 1,
    radius: 86,
    angle: 0,
    maxLife: 0.22,
    color: '#818CF8',
    coreColor: '#E0F2FE',
    accentColor: '#38BDF8',
    orbitCount: 8,
    followPlayer: false,
    trackTargetToPlayer: false,
  });

  vfx.update(0.1, 150, 200);
  assert.equal(vfx.items[0].active, true);
  assert.equal(vfx.items[0].x, 150); // inward_motes follows caster
  assert.equal(vfx.items[1].active, true);
  assert.equal(vfx.items[1].x, 100); // launch_flash stays at dash origin
  assert.equal(vfx.items[2].active, true);

  vfx.update(0.25, 180, 200);
  assert.equal(vfx.items[0].active, false);
  assert.equal(vfx.items[1].active, false);
  assert.equal(vfx.items[2].active, false);
});

test('all 50 dungeon stage layouts have distinct multi-tier architecture, valid jump reachability, and scaled Lv.3 sub-skills', () => {
  const templates = new Set<string>();
  for (let stage = 1; stage <= 10; stage++) {
    for (let subStage = 1; subStage <= 5; subStage++) {
      const layout = getStageLayout(stage, subStage);
      const check = validateStageLayout(layout);
      assert.equal(check.valid, true, `Layout ${stage}-${subStage} invalid: ${check.errors.join(', ')}`);
      templates.add(layout.templateId);

      // Verify terrain lookup matches segments across edges
      const midY = getTerrainYFromSegments(layout.floorSegments, layout.worldW * 0.5);
      assert.ok(midY >= 600 && midY <= 860);
    }
  }
  // Distinct non-boss and boss templates exist across consecutive stages
  assert.ok(templates.size >= 8);
  assert.notEqual(getStageLayout(1, 1).templateId, getStageLayout(1, 2).templateId);
  assert.notEqual(getStageLayout(1, 2).templateId, getStageLayout(1, 3).templateId);
  assert.notEqual(getStageLayout(1, 1).templateId, getStageLayout(2, 1).templateId);

  // Scaled sub-skills strengthen cooldown, range, and damage from Lv.1 to Lv.3 MAX
  const lv1 = getSubSkillScaledStats('sub_fireball', 1);
  const lv2 = getSubSkillScaledStats('sub_fireball', 2);
  const lv3 = getSubSkillScaledStats('sub_fireball', 3);
  assert.ok(lv2.cooldown < lv1.cooldown && lv3.cooldown < lv2.cooldown);
  assert.ok(lv2.range > lv1.range && lv3.range > lv2.range);
  assert.ok(lv2.damageMult > lv1.damageMult && lv3.damageMult > lv2.damageMult);

  // Supply chest offer marks held < Lv.3 items as upgrades and hides Lv.3 MAX items
  const maxedAndOwned = [
    { uid: 'a', id: 'boots_swift' as const, level: 3 },
    { uid: 'b', id: 'ring_crimson' as const, level: 1 },
  ];
  const offer = rollDungeonChestOffer(maxedAndOwned, 120, () => 0.4);
  assert.equal(offer.length, 4);
  assert.equal(offer.some((o) => o.itemId === 'boots_swift'), false);
});

test('combo timer percentage depletes proportionally and lobby/enchant rooms expand with merchant relocated left-facing in enchant', () => {
  assert.equal(computeComboTimerPct(0, 2.0), 0);
  assert.equal(computeComboTimerPct(5, 0), 0);
  assert.equal(computeComboTimerPct(5, COMBO_DECAY_WINDOW_SEC), 1);
  assert.equal(computeComboTimerPct(5, COMBO_DECAY_WINDOW_SEC * 0.5), 0.5);
  assert.equal(computeComboTimerPct(12, COMBO_DECAY_WINDOW_SEC + 1), 1);

  assert.equal(getLobbyRoomWidth('main'), LOBBY_MAIN_W);
  assert.equal(getLobbyRoomWidth('enchant'), LOBBY_ENCHANT_W);
  assert.ok(LOBBY_MAIN_W >= 2400);
  assert.ok(LOBBY_ENCHANT_W >= 2200);

  const mainProps = getLobbyRoomProps('main', 'id');
  assert.equal(mainProps.some((p) => p.kind === 'weapon_shop'), false);
  assert.equal(mainProps.some((p) => p.kind === 'gacha_statue'), true);
  assert.equal(mainProps.some((p) => p.kind === 'training_dummy'), true);
  assert.equal(mainProps.some((p) => p.kind === 'stage_portal'), true);
  assert.equal(mainProps.some((p) => p.kind === 'enchant_portal'), true);

  const enchantProps = getLobbyRoomProps('enchant', 'id');
  const merchant = enchantProps.find((p) => p.kind === 'weapon_shop');
  const altar = enchantProps.find((p) => p.kind === 'enchant_altar');
  assert.ok(merchant);
  assert.ok(altar);
  assert.equal(merchant.facing, -1); // Faces left toward room center & altar
  assert.ok(merchant.x > altar.x);
  assert.equal(enchantProps.length, 4);
  assert.deepEqual(
    enchantProps.map((p) => p.kind),
    ['return_portal', 'enchant_altar', 'weapon_shop', 'training_dummy']
  );
  assert.equal(enchantProps.every((p) => p.y === LOBBY_GROUND_Y), true);
});

test('critical combo milestone triggers strictly on multiples of 50 and sub-skill VFX scales across Lv.1-Lv.3', () => {
  assert.equal(CRITICAL_COMBO_INTERVAL, 50);
  assert.equal(isCriticalComboMilestone(0, 1), false);
  assert.equal(isCriticalComboMilestone(48, 49), false);
  assert.equal(isCriticalComboMilestone(49, 50), true);
  assert.equal(isCriticalComboMilestone(50, 50), false);
  assert.equal(isCriticalComboMilestone(50, 51), false);
  assert.equal(isCriticalComboMilestone(98, 100), true);
  assert.equal(isCriticalComboMilestone(149, 150), true);
  assert.equal(isCriticalComboMilestone(200, 199), false);

  const lv1 = getSubSkillVfxScale(1);
  const lv2 = getSubSkillVfxScale(2);
  const lv3 = getSubSkillVfxScale(3);
  assert.equal(lv1.radiusMult, 1);
  assert.ok(lv2.radiusMult > lv1.radiusMult);
  assert.ok(lv3.radiusMult > lv2.radiusMult);
  assert.ok(lv2.streakCount >= lv1.streakCount);
  assert.ok(lv3.streakCount > lv1.streakCount);
  assert.ok(lv3.auraAlpha > lv1.auraAlpha);
  assert.deepEqual(getSubSkillVfxScale(99), lv3);
});

test('re-scaled 10,000 mob HP and 99,999 boss HP stay balanced with player damage and 30% 5-chest rule', () => {
  assert.equal(NORMAL_MONSTER_BASE_HP, 10000);
  assert.equal(BOSS_MAX_HP, 99999);
  assert.equal(FIVE_CHEST_PROBABILITY, 0.3);
  assert.ok(COMBAT_DAMAGE_SCALE >= 40);

  const stats = computePlayerStats(createInitialSaveData());
  assert.equal(stats.maxHp, 100);
  const slash = calculateSlashDamage(stats, 1.0, () => 0.5);
  assert.ok(slash.damage >= 1200 && slash.damage <= 4000);

  const bossBars = computeBossBarState(99999, BOSS_MAX_HP, 5);
  assert.equal(bossBars.barsRemaining, 5);
  assert.equal(bossBars.hp, 99999);

  // Verify 30% probability of 5 chests
  assert.equal(rollSupplyChestCount(5, () => 0.1), 5);
  assert.equal(rollSupplyChestCount(5, () => 0.29), 5);
  const nonFive = rollSupplyChestCount(5, () => 0.5);
  assert.ok(nonFive === 3 || nonFive === 4);

  // Verify grounded lower portal spots and cat merchant spot across all layouts
  for (let stage = 1; stage <= 10; stage++) {
    for (let sub = 1; sub <= 5; sub++) {
      const layout = getStageLayout(stage, sub);
      assert.ok(layout.lowerPortalSpots.length >= 2);
      assert.ok(layout.catMerchantSpot.x > 100 && layout.catMerchantSpot.y > 500);
    }
  }
});

test('18 sub-skills, Item + Sub-Skill combos, Silver drops, and White Cat shop offers work coherently', () => {
  assert.equal(ALL_SUB_SKILL_IDS.length, 18);
  assert.equal(ITEM_SUBSKILL_COMBOS.length, 6);

  for (const id of ALL_SUB_SKILL_IDS) {
    assert.ok(SUB_SKILLS[id], `Missing sub-skill definition: ${id}`);
    assert.ok(SUB_SKILLS[id].basePower < 0.85);
  }

  const inv = [{ uid: 'i1', id: 'amulet_arcane' as const, level: 1 }];
  const subs = [{ id: 'sub_violet_thunder' as const, level: 2 }];
  const combos = computeItemSubSkillCombos(inv, subs);
  const active = combos.filter((c) => c.active);
  assert.equal(active.length, 1);
  assert.equal(active[0].def.id, 'combo_arcane_thunder');

  const bonus = computeItemSubSkillComboBonuses(inv, subs);
  assert.ok(bonus.skillDmgPct > 0.2);

  const save = createInitialSaveData();
  const baseStats = computePlayerStats(save, inv, undefined, []);
  const comboStats = computePlayerStats(save, inv, undefined, subs);
  assert.ok(comboStats.attack > baseStats.attack);
  assert.ok(comboStats.skillDamageMult > baseStats.skillDamageMult);

  assert.ok(computeMonsterSilverDrop('goblin', 1) > 0);
  assert.ok(computeMonsterSilverDrop('boss', 3) > computeMonsterSilverDrop('goblin', 3));

  const offers = generateCatMerchantOffers(3, inv, subs, () => 0.37);
  assert.equal(offers.length, 4);
  assert.equal(offers.filter((o) => o.kind === 'item').length, 2);
  assert.equal(offers.filter((o) => o.kind === 'sub_skill').length, 2);
  assert.ok(offers.every((o) => o.priceSilver > 0));
});


