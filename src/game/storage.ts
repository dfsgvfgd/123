import type { Keybindings, MobileControlsSettings, SaveData } from './types';

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

export const DEFAULT_MOBILE_CONTROLS: MobileControlsSettings = {
  opacity: 88,
  dpadOffsetX: 0,
  dpadOffsetY: 0,
  actionOffsetX: 0,
  actionOffsetY: 0,
  skillsOffsetX: 0,
  skillsOffsetY: 0,
};

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

export function createInitialSaveData(): SaveData {
  return {
    gems: 480,
    gold: 600,
    forgeShards: 18,
    skillEssence: 35,
    selectedCharacter: 'luna',
    lunaUnlocked: true,
    lunaAwakening: 0,
    velveraUnlocked: true,
    velveraAwakening: 0,
    lyraUnlocked: true,
    lyraAwakening: 0,
    witchUnlocked: true,
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
      void_tempest: 1,
      phantom_blink: 1,
      abyssal_crescent: 1,
      demon_eclipse: 0,
      soul_rend: 0,
      lyra_fist_rush: 1,
      lyra_cyclone_kick: 1,
      lyra_aura_overdrive: 1,
      witch_raven_arcana: 1,
      witch_starfall_meteor: 1,
      witch_void_vortex: 1,
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
    mobileControls: { ...DEFAULT_MOBILE_CONTROLS },
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

    const selectedCharacter =
      parsed.selectedCharacter === 'luna'
        ? 'luna'
        : parsed.selectedCharacter === 'witch'
          ? 'witch'
          : parsed.selectedCharacter === 'lyra'
            ? 'lyra'
            : 'velvera';

    return {
      ...fallback,
      ...parsed,
      selectedCharacter,
      language: parsed.language === 'en' ? 'en' : 'id',
      lunaWeapon: { ...fallback.lunaWeapon, ...(parsed.lunaWeapon ?? {}) },
      weapon: { ...fallback.weapon, ...(parsed.weapon ?? {}) },
      lyraWeapon: { ...fallback.lyraWeapon, ...(parsed.lyraWeapon ?? {}) },
      witchWeapon: { ...fallback.witchWeapon, ...(parsed.witchWeapon ?? {}) },
      skillLevels: { ...fallback.skillLevels, ...(parsed.skillLevels ?? {}) },
      passiveLevels: { ...fallback.passiveLevels, ...(parsed.passiveLevels ?? {}) },
      dailyLogin: { ...fallback.dailyLogin, ...(parsed.dailyLogin ?? {}) },
      bestiaryKills: { ...fallback.bestiaryKills, ...(parsed.bestiaryKills ?? {}) },
      audioSettings: { ...fallback.audioSettings, ...(parsed.audioSettings ?? {}) },
      mobileControls: { ...DEFAULT_MOBILE_CONTROLS, ...(parsed.mobileControls ?? {}) },
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
