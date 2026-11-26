import type {
  CharacterId,
  DailyQuestDef,
  DailyQuestId,
  DailyQuestMetric,
  DailyRewardDef,
  EventBannerNotice,
  GachaPoolItem,
  PullRecord,
  SaveData,
} from './types';
import { createInitialDailyQuestsState } from './storage';

export const GACHA_COST_SINGLE = 160;
export const GACHA_COST_TEN = 1600;
export const HARD_PITY_LIMIT = 80;
export const SOFT_PITY_START = 65;

export const FEATURED_LUNA: GachaPoolItem = {
  id: 'char_luna_ssr',
  name: 'Luna · Umbral Scythe',
  rarity: 'SSR',
  category: 'Character',
  description:
    'Pembunuh berkerudung gelap bersenjata sabit kosmik ungu-kebiruan. Meningkatkan Umbral Awakening (+12% ATK & Crit DMG per tingkat).',
  atkBonus: 26,
  hpBonus: 120,
};

export const FEATURED_CHARACTER: GachaPoolItem = {
  id: 'char_velvera_ssr',
  name: 'Velvera · Abyssal Demon',
  rarity: 'SSR',
  category: 'Character',
  description:
    'Ras Demon pengguna Dual Blade berenergi ungu. Membuka atau meningkatkan Demon Awakening (+12% ATK & Crit DMG per tingkat).',
  atkBonus: 25,
  hpBonus: 120,
};

export const FEATURED_LYRA: GachaPoolItem = {
  id: 'char_lyra_ssr',
  name: 'Lyra · Crimson Striker',
  rarity: 'SSR',
  category: 'Character',
  description:
    'Petarung martial tangan & kaki dengan aura menyala emas-merah. Meningkatkan Martial Awakening (+12% ATK & Crit DMG per tingkat).',
  atkBonus: 25,
  hpBonus: 120,
};

export const FEATURED_WITCH: GachaPoolItem = {
  id: 'char_witch_ssr',
  name: 'Seraphina · Astral Raven Witch',
  rarity: 'SSR',
  category: 'Character',
  description:
    'Penyihir bintang & gagak berlantern ungu. Meningkatkan Astral Awakening (+12% ATK & Crit DMG per tingkat).',
  atkBonus: 24,
  hpBonus: 115,
};

export const GACHA_STANDARD_POOL: GachaPoolItem[] = [
  {
    id: 'skin_amethyst_crescent',
    name: 'Amethyst Crescent Blades',
    rarity: 'SR',
    category: 'Weapon Skin',
    description: 'Bentuk Dual Blade sabit amethyst tajam dengan tebasan ungu lebih luas.',
    atkBonus: 14,
  },
  {
    id: 'skin_eclipse_edge',
    name: 'Eclipse Silver Twin Edge',
    rarity: 'SR',
    category: 'Weapon Skin',
    description: 'Dual Blade perak-obsidian selaras rambut perak Velvera.',
    atkBonus: 16,
  },
  {
    id: 'rune_abyssal_horn',
    name: 'Rune: Obsidian Horn Crest',
    rarity: 'SR',
    category: 'Demon Rune',
    description: 'Kristal tanduk ungu yang memperkuat Damage Skill sebesar +15%.',
    atkBonus: 10,
  },
  {
    id: 'rune_shadow_feather',
    name: 'Rune: Feathered Mantle',
    rarity: 'R',
    category: 'Demon Rune',
    description: 'Bulu mantel obsidian penambah Max HP & kecepatan gerak ringan.',
    hpBonus: 45,
  },
  {
    id: 'rune_violet_claw',
    name: 'Rune: Violet Claw Ember',
    rarity: 'R',
    category: 'Demon Rune',
    description: 'Percikan energi cakar ungu yang menambah serangan dasar.',
    atkBonus: 6,
  },
  {
    id: 'rune_cathedral_ash',
    name: 'Rune: Cathedral Ash',
    rarity: 'R',
    category: 'Demon Rune',
    description: 'Abu reruntuhan katedral yang mempercepat regenerasi MP.',
    hpBonus: 30,
  },
];

export const DAILY_LOGIN_REWARDS: DailyRewardDef[] = [
  { day: 1, label: 'Hari 1', gems: 30, gold: 400, shards: 6 },
  { day: 2, label: 'Hari 2', gems: 40, gold: 550, shards: 8 },
  { day: 3, label: 'Hari 3', gems: 50, gold: 700, shards: 10 },
  { day: 4, label: 'Hari 4', gems: 65, gold: 900, shards: 12 },
  { day: 5, label: 'Hari 5', gems: 80, gold: 1100, shards: 15 },
  { day: 6, label: 'Hari 6', gems: 100, gold: 1400, shards: 18 },
  { day: 7, label: 'Hari 7', gems: 160, gold: 2200, shards: 30 },
];

export const EVENT_BANNERS: EventBannerNotice[] = [
  {
    id: 'event_velvera_launch_2026',
    title: 'Event Banner Baru: Kuartet Pahlawan Abyssal',
    subtitle: 'Rate-Up SSR Luna (Sabit), Seraphina (Penyihir), Velvera & Lyra',
    description:
      'Banner eksklusif kini hadir untuk Luna bersenjata Sabit kosmik, penyihir Seraphina, Velvera, dan Lyra! Jaminan SSR pada tarikan ke-80 (Pity) dengan Soft Pity mulai tarikan ke-65. Duplikat meningkatkan Awakening hingga Lv.6.',
    periodLabel: 'Berlangsung · Musim Abyssal III',
    rewardGems: 800,
    isNew: true,
  },
  {
    id: 'event_10_stage_conquest',
    title: 'Misi Penaklukan 10 Stage Dungeon',
    subtitle: 'Peti Harta, Set Aksesoris & Sub-Skill Otomatis',
    description:
      'Taklukkan monster dan Boss dari Stage 1-1 hingga 10-5. Buka 3-5 Peti Oranye berisi pilihan item aksesoris sinergi, serta kalahkan Boss multi-bar untuk Sub-Skill otomatis.',
    periodLabel: 'Aktif · Permanen',
    rewardGems: 320,
    isNew: true,
  },
];

export function calculateSsrRate(currentPity: number): number {
  if (currentPity + 1 >= HARD_PITY_LIMIT) {
    return 1;
  }
  const baseRate = 0.016; // 1.6%
  if (currentPity + 1 >= SOFT_PITY_START) {
    const extraSteps = currentPity + 1 - SOFT_PITY_START + 1;
    return Math.min(1, baseRate + extraSteps * 0.06);
  }
  return baseRate;
}

export function performSinglePull(
  save: SaveData,
  options: { rng?: () => number; now?: number; guaranteeSr?: boolean; bannerId?: CharacterId } = {}
): { nextSave: SaveData; record: PullRecord; item: GachaPoolItem } {
  const rng = options.rng ?? Math.random;
  const now = options.now ?? Date.now();
  const bannerId = options.bannerId ?? 'velvera';

  if (save.gems < GACHA_COST_SINGLE) {
    throw new Error('Abyssal Gems tidak cukup untuk tarikan gacha.');
  }

  const ssrRate = calculateSsrRate(save.pityCount);
  const roll = rng();

  let chosen: GachaPoolItem;
  let nextPity = save.pityCount + 1;

  if (roll < ssrRate) {
    chosen =
      bannerId === 'luna'
        ? FEATURED_LUNA
        : bannerId === 'witch'
          ? FEATURED_WITCH
          : bannerId === 'lyra'
            ? FEATURED_LYRA
            : FEATURED_CHARACTER;
    nextPity = 0;
  } else {
    const srPool = GACHA_STANDARD_POOL.filter((i) => i.rarity === 'SR');
    const rPool = GACHA_STANDARD_POOL.filter((i) => i.rarity === 'R');
    const srThreshold = options.guaranteeSr ? 1.0 : 0.14;
    if (rng() < srThreshold && srPool.length > 0) {
      chosen = srPool[Math.floor(rng() * srPool.length) % srPool.length];
    } else {
      chosen = rPool[Math.floor(rng() * rPool.length) % rPool.length];
    }
  }

  const isDuplicate =
    chosen.id === FEATURED_LUNA.id
      ? save.lunaUnlocked
      : chosen.id === FEATURED_CHARACTER.id
        ? save.velveraUnlocked
        : chosen.id === FEATURED_LYRA.id
          ? save.lyraUnlocked
          : chosen.id === FEATURED_WITCH.id
            ? save.witchUnlocked
            : chosen.id === 'skin_amethyst_crescent'
              ? save.unlockedBladeStyles.includes('amethyst_crescent')
              : chosen.id === 'skin_eclipse_edge'
                ? save.unlockedBladeStyles.includes('eclipse_edge')
                : false;

  let nextUnlockedStyles = [...save.unlockedBladeStyles];
  if (chosen.id === 'skin_amethyst_crescent' && !nextUnlockedStyles.includes('amethyst_crescent')) {
    nextUnlockedStyles.push('amethyst_crescent');
  }
  if (chosen.id === 'skin_eclipse_edge' && !nextUnlockedStyles.includes('eclipse_edge')) {
    nextUnlockedStyles.push('eclipse_edge');
  }

  const nextLunaAwakening =
    chosen.id === FEATURED_LUNA.id && isDuplicate
      ? Math.min(6, (save.lunaAwakening ?? 0) + 1)
      : (save.lunaAwakening ?? 0);

  const nextVelveraAwakening =
    chosen.id === FEATURED_CHARACTER.id && isDuplicate
      ? Math.min(6, save.velveraAwakening + 1)
      : save.velveraAwakening;

  const nextLyraAwakening =
    chosen.id === FEATURED_LYRA.id && isDuplicate
      ? Math.min(6, save.lyraAwakening + 1)
      : save.lyraAwakening;

  const nextWitchAwakening =
    chosen.id === FEATURED_WITCH.id && isDuplicate
      ? Math.min(6, (save.witchAwakening ?? 0) + 1)
      : (save.witchAwakening ?? 0);

  const bonusShards = isDuplicate ? (chosen.rarity === 'SSR' ? 40 : chosen.rarity === 'SR' ? 12 : 4) : 0;
  const bonusEssence = chosen.rarity === 'R' ? 8 : chosen.rarity === 'SR' ? 18 : 40;

  const pullIndex = save.totalPulls + 1;
  const record: PullRecord = {
    id: `pull_${now}_${pullIndex}`,
    pullIndex,
    itemId: chosen.id,
    name: chosen.name,
    rarity: chosen.rarity,
    category: chosen.category,
    isDuplicate,
    gemsSpent: GACHA_COST_SINGLE,
    timestamp: now,
  };

  const nextSave: SaveData = {
    ...save,
    gems: save.gems - GACHA_COST_SINGLE,
    forgeShards: save.forgeShards + bonusShards,
    skillEssence: save.skillEssence + bonusEssence,
    lunaUnlocked: Boolean(save.lunaUnlocked) || chosen.id === FEATURED_LUNA.id,
    lunaAwakening: nextLunaAwakening,
    velveraUnlocked: save.velveraUnlocked || chosen.id === FEATURED_CHARACTER.id,
    velveraAwakening: nextVelveraAwakening,
    lyraUnlocked: save.lyraUnlocked || chosen.id === FEATURED_LYRA.id,
    lyraAwakening: nextLyraAwakening,
    witchUnlocked: Boolean(save.witchUnlocked) || chosen.id === FEATURED_WITCH.id,
    witchAwakening: nextWitchAwakening,
    pityCount: nextPity,
    totalPulls: pullIndex,
    unlockedBladeStyles: nextUnlockedStyles,
    pullHistory: [record, ...save.pullHistory].slice(0, 200),
  };

  return { nextSave, record, item: chosen };
}

export function performTenPull(
  save: SaveData,
  options: { rng?: () => number; now?: number; bannerId?: CharacterId } = {}
): { nextSave: SaveData; records: PullRecord[] } {
  const rng = options.rng ?? Math.random;
  const baseNow = options.now ?? Date.now();

  if (save.gems < GACHA_COST_TEN) {
    throw new Error('Abyssal Gems tidak cukup untuk 10x tarikan gacha.');
  }

  let current = save;
  const records: PullRecord[] = [];
  let hasSrOrBetter = false;

  for (let i = 0; i < 10; i++) {
    const forceSr = i === 9 && !hasSrOrBetter;
    const res = performSinglePull(current, {
      rng,
      now: baseNow + i,
      guaranteeSr: forceSr,
      bannerId: options.bannerId,
    });
    current = res.nextSave;
    records.push(res.record);
    if (res.record.rarity === 'SR' || res.record.rarity === 'SSR') {
      hasSrOrBetter = true;
    }
  }

  return { nextSave: current, records };
}

export function getNextClaimableDailyDay(save: SaveData, todayKey: string): number | null {
  if (save.dailyLogin.lastClaimDate === todayKey) {
    return null;
  }
  const claimedCount = save.dailyLogin.claimedDays.length;
  if (claimedCount >= DAILY_LOGIN_REWARDS.length) {
    return 1; // Cycle resets after Day 7
  }
  return claimedCount + 1;
}

export function claimDailyReward(
  save: SaveData,
  todayKey: string
): { nextSave: SaveData; claimed: DailyRewardDef } {
  const nextDay = getNextClaimableDailyDay(save, todayKey);
  if (nextDay === null) {
    throw new Error('Hadiah login harian hari ini sudah diklaim.');
  }

  const rewardDef = DAILY_LOGIN_REWARDS.find((d) => d.day === nextDay) ?? DAILY_LOGIN_REWARDS[0];
  const resetCycle = save.dailyLogin.claimedDays.length >= DAILY_LOGIN_REWARDS.length;
  const nextClaimedDays = resetCycle ? [nextDay] : [...save.dailyLogin.claimedDays, nextDay];

  const nextSave: SaveData = {
    ...save,
    gems: save.gems + rewardDef.gems,
    gold: save.gold + rewardDef.gold,
    forgeShards: save.forgeShards + rewardDef.shards,
    dailyLogin: {
      claimedDays: nextClaimedDays,
      lastClaimDate: todayKey,
    },
  };

  return { nextSave, claimed: rewardDef };
}

export function claimEventBannerReward(save: SaveData, eventId: string): SaveData {
  const notice = EVENT_BANNERS.find((b) => b.id === eventId);
  if (!notice) return save;
  const alreadyClaimed = save.claimedEventRewardIds.includes(eventId);
  const alreadySeen = save.seenEventIds.includes(eventId);

  return {
    ...save,
    gems: alreadyClaimed ? save.gems : save.gems + notice.rewardGems,
    seenEventIds: alreadySeen ? save.seenEventIds : [...save.seenEventIds, eventId],
    claimedEventRewardIds: alreadyClaimed
      ? save.claimedEventRewardIds
      : [...save.claimedEventRewardIds, eventId],
  };
}

export function getUnreadEventCount(save: SaveData): number {
  return EVENT_BANNERS.filter(
    (b) => !save.seenEventIds.includes(b.id) || !save.claimedEventRewardIds.includes(b.id)
  ).length;
}

export const DAILY_QUESTS: DailyQuestDef[] = [
  {
    id: 'dq_kill_mobs',
    titleId: 'Pemburu Katedral',
    titleEn: 'Cathedral Slayer',
    descId: 'Kalahkan 20 monster di dalam dungeon.',
    descEn: 'Defeat 20 monsters inside the dungeon.',
    metric: 'kills',
    target: 20,
    rewardGems: 160,
    rewardGold: 500,
    rewardEssence: 10,
  },
  {
    id: 'dq_clear_stages',
    titleId: 'Penjelajah Lorong',
    titleEn: 'Chamber Explorer',
    descId: 'Selesaikan 3 ruangan stage dungeon.',
    descEn: 'Clear 3 dungeon stage chambers.',
    metric: 'stagesCleared',
    target: 3,
    rewardGems: 200,
    rewardGold: 700,
    rewardEssence: 15,
  },
  {
    id: 'dq_open_chests',
    titleId: 'Pemburu Harta',
    titleEn: 'Treasure Seeker',
    descId: 'Buka 3 peti perbekalan atau makam di stage.',
    descEn: 'Open 3 supply chests or tombs in stages.',
    metric: 'chestsOpened',
    target: 3,
    rewardGems: 160,
    rewardGold: 450,
    rewardEssence: 12,
  },
  {
    id: 'dq_gacha_pulls',
    titleId: 'Panggilan Astral',
    titleEn: 'Astral Summoner',
    descId: 'Lakukan 1 kali tarikan Summon Gacha.',
    descEn: 'Perform 1 Summon Gacha pull.',
    metric: 'pulls',
    target: 1,
    rewardGems: 240,
    rewardGold: 600,
    rewardEssence: 15,
  },
];

export function syncDailyQuestDate(save: SaveData, todayKey: string): SaveData {
  if (save.dailyQuests && save.dailyQuests.dateKey === todayKey) {
    return save;
  }
  return {
    ...save,
    dailyQuests: createInitialDailyQuestsState(todayKey),
  };
}

export function trackDailyQuestProgress(
  save: SaveData,
  metric: DailyQuestMetric,
  amount = 1,
  todayKey: string
): SaveData {
  const synced = syncDailyQuestDate(save, todayKey);
  const currentVal = synced.dailyQuests.progress[metric] ?? 0;
  return {
    ...synced,
    dailyQuests: {
      ...synced.dailyQuests,
      progress: {
        ...synced.dailyQuests.progress,
        [metric]: currentVal + Math.max(0, amount),
      },
    },
  };
}

export function claimDailyQuestReward(
  save: SaveData,
  questId: DailyQuestId,
  todayKey: string
): { nextSave: SaveData; quest: DailyQuestDef } {
  const synced = syncDailyQuestDate(save, todayKey);
  const quest = DAILY_QUESTS.find((q) => q.id === questId);
  if (!quest) {
    throw new Error('Misi harian tidak ditemukan.');
  }
  if (synced.dailyQuests.claimedIds.includes(questId)) {
    throw new Error('Hadiah misi harian sudah diklaim.');
  }
  const prog = synced.dailyQuests.progress[quest.metric] ?? 0;
  if (prog < quest.target) {
    throw new Error('Progres misi harian belum selesai.');
  }
  return {
    quest,
    nextSave: {
      ...synced,
      gems: synced.gems + quest.rewardGems,
      gold: synced.gold + quest.rewardGold,
      skillEssence: synced.skillEssence + quest.rewardEssence,
      dailyQuests: {
        ...synced.dailyQuests,
        claimedIds: [...synced.dailyQuests.claimedIds, questId],
      },
    },
  };
}

export function getClaimableDailyQuestCount(save: SaveData, todayKey: string): number {
  const synced = syncDailyQuestDate(save, todayKey);
  return DAILY_QUESTS.filter(
    (q) =>
      !synced.dailyQuests.claimedIds.includes(q.id) &&
      (synced.dailyQuests.progress[q.metric] ?? 0) >= q.target
  ).length;
}
