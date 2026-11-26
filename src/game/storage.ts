import type {
  CharacterId,
  DailyQuestState,
  Keybindings,
  MobileButtonConfig,
  MobileControlButtonId,
  MobileControlsSettings,
  SaveData,
} from './types';

export const SAVE_STORAGE_KEY = 'velvera_abyssal_slasher_save_v1';

export const DEFAULT_KEYBINDINGS: Keybindings = {
  left: 'KeyA',
  right: 'KeyD',
  jump: 'KeyW',
  down: 'KeyS',
  attack: 'KeyJ',
  dash: 'KeyK',
  skill1: 'Digit1',
  skill2: 'Digit2',
  skill3: 'Digit3',
  interact: 'KeyF',
  inventory: 'KeyI',
};

export const ALL_MOBILE_BUTTON_IDS: MobileControlButtonId[] = [
  'left',
  'down',
  'right',
  'jump',
  'dash',
  'skill1',
  'skill2',
  'skill3',
  'interact',
];

export const DEFAULT_MOBILE_BUTTON_CONFIG: MobileButtonConfig = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  opacity: 88,
};

export function createDefaultMobileButtons(
  baseOpacity = 88
): Record<MobileControlButtonId, MobileButtonConfig> {
  const op = Math.max(30, Math.min(100, Math.round(baseOpacity)));
  return {
    left: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
    down: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
    right: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
    jump: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
    dash: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
    skill1: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
    skill2: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
    skill3: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
    interact: { offsetX: 0, offsetY: 0, scale: 1, opacity: op },
  };
}

export const DEFAULT_MOBILE_CONTROLS: MobileControlsSettings = {
  opacity: 88,
  dpadOffsetX: 0,
  dpadOffsetY: 0,
  actionOffsetX: 0,
  actionOffsetY: 0,
  skillsOffsetX: 0,
  skillsOffsetY: 0,
  buttons: createDefaultMobileButtons(88),
};

export function normalizeMobileControls(
  raw?: Partial<MobileControlsSettings> | null
): MobileControlsSettings {
  const globalOpacity = Math.max(30, Math.min(100, Math.round(raw?.opacity ?? 88)));
  const defaults = createDefaultMobileButtons(globalOpacity);
  const rawButtons = raw?.buttons as Partial<Record<MobileControlButtonId, Partial<MobileButtonConfig>>> | undefined;
  const buttons = { ...defaults };
  for (const id of ALL_MOBILE_BUTTON_IDS) {
    const entry = rawButtons?.[id];
    buttons[id] = {
      offsetX: Math.max(-320, Math.min(320, Math.round(entry?.offsetX ?? 0))),
      offsetY: Math.max(-320, Math.min(320, Math.round(entry?.offsetY ?? 0))),
      scale: Math.max(0.5, Math.min(2.0, Number((entry?.scale ?? 1).toFixed(2)))),
      opacity: Math.max(30, Math.min(100, Math.round(entry?.opacity ?? globalOpacity))),
    };
  }
  return {
    opacity: globalOpacity,
    dpadOffsetX: Math.max(-260, Math.min(260, Math.round(raw?.dpadOffsetX ?? 0))),
    dpadOffsetY: Math.max(-260, Math.min(260, Math.round(raw?.dpadOffsetY ?? 0))),
    actionOffsetX: Math.max(-260, Math.min(260, Math.round(raw?.actionOffsetX ?? 0))),
    actionOffsetY: Math.max(-260, Math.min(260, Math.round(raw?.actionOffsetY ?? 0))),
    skillsOffsetX: Math.max(-260, Math.min(260, Math.round(raw?.skillsOffsetX ?? 0))),
    skillsOffsetY: Math.max(-260, Math.min(260, Math.round(raw?.skillsOffsetY ?? 0))),
    buttons,
  };
}

export function formatKeyCodeLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Space') return 'SPACE';
  if (code === 'ArrowLeft') return '◀';
  if (code === 'ArrowRight') return '▶';
  if (code === 'ArrowUp') return '▲';
  if (code === 'ArrowDown') return '▼';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
  return code.toUpperCase();
}

export function getTodayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createInitialDailyQuestsState(todayKey: string = getTodayDateKey()): DailyQuestState {
  return {
    dateKey: todayKey,
    progress: {
      kills: 0,
      stagesCleared: 0,
      pulls: 0,
      chestsOpened: 0,
    },
    claimedIds: [],
  };
}

export function isCharacterUnlocked(save: Pick<SaveData, 'lunaUnlocked' | 'velveraUnlocked' | 'lyraUnlocked' | 'witchUnlocked'>, id: CharacterId): boolean {
  if (id === 'luna') return Boolean(save.lunaUnlocked);
  if (id === 'lyra') return Boolean(save.lyraUnlocked);
  if (id === 'witch') return Boolean(save.witchUnlocked);
  return save.velveraUnlocked ?? true;
}

export function createInitialSaveData(): SaveData {
  const todayKey = getTodayDateKey();
  return {
    gems: 2400,
    gold: 600,
    forgeShards: 18,
    skillEssence: 35,
    selectedCharacter: 'velvera',
    lunaUnlocked: false,
    lunaAwakening: 0,
    velveraUnlocked: true,
    velveraAwakening: 0,
    lyraUnlocked: false,
    lyraAwakening: 0,
    witchUnlocked: false,
    witchAwakening: 0,
    pityCount: 0,
    totalPulls: 0,
    pullHistory: [],
    lunaWeapon: {
      style: 'umbral_crescent_scythe',
      forgeLevel: 0,
    },
    unlockedLunaWeapons: ['umbral_crescent_scythe'],
    weapon: {
      style: 'abyss_fang',
      aura: 'violet_abyss',
      enchant: 'crit_edge',
      forgeLevel: 0,
    },
    unlockedBladeStyles: ['abyss_fang'],
    lyraWeapon: {
      style: 'iron_knuckle',
      forgeLevel: 0,
    },
    unlockedLyraWeapons: ['iron_knuckle'],
    witchWeapon: {
      style: 'raven_gnarled_staff',
      forgeLevel: 0,
    },
    unlockedWitchWeapons: ['raven_gnarled_staff'],
    lunaEquippedSkills: ['luna_soul_harvest', 'luna_umbral_rush', 'luna_lunar_eclipse'],
    equippedSkills: ['void_tempest', 'phantom_blink', 'abyssal_crescent'],
    lyraEquippedSkills: ['lyra_fist_rush', 'lyra_cyclone_kick', 'lyra_aura_overdrive'],
    witchEquippedSkills: ['witch_raven_arcana', 'witch_starfall_meteor', 'witch_void_vortex'],
    skillLevels: {
      luna_soul_harvest: 1,
      luna_umbral_rush: 1,
      luna_lunar_eclipse: 1,
      luna_phantom_scythe: 0,
      luna_abyssal_execution: 0,
      void_tempest: 1,
      phantom_blink: 1,
      abyssal_crescent: 1,
      demon_eclipse: 0,
      soul_rend: 0,
      lyra_fist_rush: 1,
      lyra_cyclone_kick: 1,
      lyra_aura_overdrive: 1,
      lyra_earthshaker_slam: 0,
      lyra_phoenix_uppercut: 0,
      witch_raven_arcana: 1,
      witch_starfall_meteor: 1,
      witch_void_vortex: 1,
      witch_arcane_lightning: 0,
      witch_chrono_nova: 0,
    },
    passiveLevels: {
      demon_vigor: 0,
      twin_precision: 0,
      abyss_haste: 0,
      shadow_leech: 0,
      horn_resonance: 0,
      fatal_surge: 0,
    },
    dailyLogin: {
      claimedDays: [],
      lastClaimDate: null,
    },
    dailyQuests: createInitialDailyQuestsState(todayKey),
    seenEventIds: [],
    claimedEventRewardIds: [],
    characterLevel: 1,
    bestiaryKills: {
      goblin: 0,
      skeleton: 0,
      kelalawar: 0,
      zombie_knight: 0,
    },
    claimedBestiaryIds: [],
    highestStage: 1,
    bestScore: 0,
    language: 'id',
    audioSettings: {
      masterVolume: 80,
      bgmVolume: 70,
      sfxVolume: 85,
      muted: false,
    },
    mobileControls: normalizeMobileControls(DEFAULT_MOBILE_CONTROLS),
    keybindings: { ...DEFAULT_KEYBINDINGS },
  };
}

export function hasExistingSaveData(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    return window.localStorage.getItem(SAVE_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function resetSaveData(): SaveData {
  const fresh = createInitialSaveData();
  persistSaveData(fresh);
  return fresh;
}

export function loadSaveData(): SaveData {
  const fallback = createInitialSaveData();
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveData>;

    const unlocks = {
      lunaUnlocked: Boolean(parsed.lunaUnlocked),
      velveraUnlocked: parsed.velveraUnlocked ?? true,
      lyraUnlocked: Boolean(parsed.lyraUnlocked),
      witchUnlocked: Boolean(parsed.witchUnlocked),
    };

    const candidateChar: CharacterId =
      parsed.selectedCharacter === 'luna'
        ? 'luna'
        : parsed.selectedCharacter === 'witch'
          ? 'witch'
          : parsed.selectedCharacter === 'lyra'
            ? 'lyra'
            : 'velvera';
    const selectedCharacter: CharacterId = isCharacterUnlocked(unlocks, candidateChar)
      ? candidateChar
      : 'velvera';

    const todayKey = getTodayDateKey();
    const parsedQuests = parsed.dailyQuests;
    const dailyQuests: DailyQuestState =
      parsedQuests && parsedQuests.dateKey === todayKey
        ? {
            dateKey: todayKey,
            progress: {
              kills: Math.max(0, Number(parsedQuests.progress?.kills ?? 0)),
              stagesCleared: Math.max(0, Number(parsedQuests.progress?.stagesCleared ?? 0)),
              pulls: Math.max(0, Number(parsedQuests.progress?.pulls ?? 0)),
              chestsOpened: Math.max(0, Number(parsedQuests.progress?.chestsOpened ?? 0)),
            },
            claimedIds: Array.isArray(parsedQuests.claimedIds) ? parsedQuests.claimedIds : [],
          }
        : createInitialDailyQuestsState(todayKey);

    return {
      ...fallback,
      ...parsed,
      ...unlocks,
      selectedCharacter,
      language: parsed.language === 'en' ? 'en' : 'id',
      lunaWeapon: { ...fallback.lunaWeapon, ...(parsed.lunaWeapon ?? {}) },
      weapon: { ...fallback.weapon, ...(parsed.weapon ?? {}) },
      lyraWeapon: { ...fallback.lyraWeapon, ...(parsed.lyraWeapon ?? {}) },
      witchWeapon: { ...fallback.witchWeapon, ...(parsed.witchWeapon ?? {}) },
      skillLevels: { ...fallback.skillLevels, ...(parsed.skillLevels ?? {}) },
      passiveLevels: { ...fallback.passiveLevels, ...(parsed.passiveLevels ?? {}) },
      dailyLogin: { ...fallback.dailyLogin, ...(parsed.dailyLogin ?? {}) },
      dailyQuests,
      bestiaryKills: { ...fallback.bestiaryKills, ...(parsed.bestiaryKills ?? {}) },
      audioSettings: { ...fallback.audioSettings, ...(parsed.audioSettings ?? {}) },
      mobileControls: normalizeMobileControls(parsed.mobileControls),
      keybindings: { ...DEFAULT_KEYBINDINGS, ...(parsed.keybindings ?? {}) },
      claimedBestiaryIds: Array.isArray(parsed.claimedBestiaryIds)
        ? parsed.claimedBestiaryIds
        : [],
      pullHistory: Array.isArray(parsed.pullHistory) ? parsed.pullHistory : [],
      unlockedLunaWeapons: Array.isArray(parsed.unlockedLunaWeapons)
        ? parsed.unlockedLunaWeapons
        : fallback.unlockedLunaWeapons,
      unlockedBladeStyles: Array.isArray(parsed.unlockedBladeStyles)
        ? parsed.unlockedBladeStyles
        : fallback.unlockedBladeStyles,
      unlockedLyraWeapons: Array.isArray(parsed.unlockedLyraWeapons)
        ? parsed.unlockedLyraWeapons
        : fallback.unlockedLyraWeapons,
      unlockedWitchWeapons: Array.isArray(parsed.unlockedWitchWeapons)
        ? parsed.unlockedWitchWeapons
        : fallback.unlockedWitchWeapons,
      lunaEquippedSkills:
        Array.isArray(parsed.lunaEquippedSkills) && parsed.lunaEquippedSkills.length === 3
          ? (parsed.lunaEquippedSkills as SaveData['lunaEquippedSkills'])
          : fallback.lunaEquippedSkills,
      equippedSkills:
        Array.isArray(parsed.equippedSkills) && parsed.equippedSkills.length === 3
          ? (parsed.equippedSkills as SaveData['equippedSkills'])
          : fallback.equippedSkills,
      lyraEquippedSkills:
        Array.isArray(parsed.lyraEquippedSkills) && parsed.lyraEquippedSkills.length === 3
          ? (parsed.lyraEquippedSkills as SaveData['lyraEquippedSkills'])
          : fallback.lyraEquippedSkills,
      witchEquippedSkills:
        Array.isArray(parsed.witchEquippedSkills) && parsed.witchEquippedSkills.length === 3
          ? (parsed.witchEquippedSkills as SaveData['witchEquippedSkills'])
          : fallback.witchEquippedSkills,
      seenEventIds: Array.isArray(parsed.seenEventIds) ? parsed.seenEventIds : [],
      claimedEventRewardIds: Array.isArray(parsed.claimedEventRewardIds)
        ? parsed.claimedEventRewardIds
        : [],
    };
  } catch {
    return fallback;
  }
}

export function persistSaveData(save: SaveData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // Ensure stage-only sub-skills are never accidentally saved
    const cleanSave = { ...save } as Record<string, unknown>;
    delete cleanSave.equippedSubSkills;
    delete cleanSave.subSkillLevels;
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(cleanSave));
  } catch {
    // Ignore storage quota errors
  }
}
