export type GameScreenState = 'title' | 'lobby' | 'playing' | 'paused' | 'gameover';

export type LanguageCode = 'id' | 'en';

export type LobbyRoomId = 'main' | 'enchant';

export type CharacterId = 'luna' | 'velvera' | 'lyra' | 'witch';

export type MonsterType = 'goblin' | 'skeleton' | 'kelalawar' | 'zombie_knight';

export type BladeStyleId =
  | 'abyss_fang'
  | 'amethyst_crescent'
  | 'obsidian_claw'
  | 'eclipse_edge';

export type LyraWeaponId =
  | 'iron_knuckle'
  | 'crimson_wraps'
  | 'golden_cestus'
  | 'abyss_greaves';

export type WitchWeaponId =
  | 'raven_gnarled_staff'
  | 'amethyst_lantern_rod'
  | 'astral_crow_scepter'
  | 'eclipse_grimoire_staff';

export type ScytheWeaponId =
  | 'umbral_crescent_scythe'
  | 'crimson_reaper_scythe'
  | 'astral_eclipse_scythe'
  | 'void_cosmos_scythe';

export type BladeAuraId =
  | 'violet_abyss'
  | 'astral_amethyst'
  | 'void_orchid'
  | 'eclipse_silver';

export type WeaponEnchantId =
  | 'crit_edge'
  | 'swift_wind'
  | 'blood_pact'
  | 'void_burn';

export interface WeaponConfig {
  style: BladeStyleId;
  aura: BladeAuraId;
  enchant: WeaponEnchantId;
  forgeLevel: number; // 0 to 10
}

export interface LyraWeaponConfig {
  style: LyraWeaponId;
  forgeLevel: number; // 0 to 10
}

export interface WitchWeaponConfig {
  style: WitchWeaponId;
  forgeLevel: number; // 0 to 10
}

export interface LunaWeaponConfig {
  style: ScytheWeaponId;
  forgeLevel: number; // 0 to 10
}

export type ActiveSkillId =
  | 'luna_soul_harvest'
  | 'luna_umbral_rush'
  | 'luna_lunar_eclipse'
  | 'luna_phantom_scythe'
  | 'luna_abyssal_execution'
  | 'void_tempest'
  | 'phantom_blink'
  | 'abyssal_crescent'
  | 'demon_eclipse'
  | 'soul_rend'
  | 'lyra_fist_rush'
  | 'lyra_cyclone_kick'
  | 'lyra_aura_overdrive'
  | 'lyra_earthshaker_slam'
  | 'lyra_phoenix_uppercut'
  | 'witch_raven_arcana'
  | 'witch_starfall_meteor'
  | 'witch_void_vortex'
  | 'witch_arcane_lightning'
  | 'witch_chrono_nova';

export type SubSkillId =
  | 'sub_fireball'
  | 'sub_firetrap'
  | 'sub_icearrow'
  | 'sub_poison'
  | 'sub_lightning'
  | 'sub_shadow_kunai'
  | 'sub_meteor'
  | 'sub_frost_nova'
  | 'sub_shadow_blades'
  | 'sub_dark_chains'
  | 'sub_abyss_spear'
  | 'sub_blood_scythe'
  | 'sub_violet_thunder'
  | 'sub_shadow_spikes'
  | 'sub_razor_aura'
  | 'sub_crescent_boomerang'
  | 'sub_vertical_shockwave'
  | 'sub_cosmic_needles';

export interface ItemSubSkillComboDef {
  id: string;
  name: string;
  itemId: RunItemId;
  subSkillId: SubSkillId;
  bonusAtkPct: number;
  bonusSkillDmgPct: number;
  bonusCritPct: number;
  bonusMoveSpeedPct: number;
  bonusLifestealPct: number;
  shortBonus: string;
  accentHex: string;
}

export interface ActiveItemSubSkillCombo {
  def: ItemSubSkillComboDef;
  active: boolean;
  hasItem: boolean;
  hasSubSkill: boolean;
}

export interface CatMerchantOffer {
  uid: string;
  kind: 'item' | 'sub_skill';
  priceSilver: number;
  itemDef?: RunItemDef;
  subSkillDef?: SubSkillDef;
  currentLevel: number;
  nextLevel: number;
  isMaxed: boolean;
  purchased: boolean;
}

export type AnySkillId = ActiveSkillId | SubSkillId;

export type SkillChainTag =
  | 'blink'
  | 'aoe'
  | 'wave'
  | 'fire'
  | 'ice'
  | 'poison'
  | 'lightning';

export type ElementalEffectType = 'burn' | 'freeze' | 'poison';

export interface ActiveSkillDef {
  id: ActiveSkillId;
  name: string;
  roleLabel: string;
  chainTag: SkillChainTag;
  description: string;
  cooldown: number;
  mpCost: number;
  basePower: number;
  accentHex: string;
  owner?: CharacterId;
}

export interface SubSkillDef {
  id: SubSkillId;
  name: string;
  roleLabel: string;
  chainTag: SkillChainTag;
  element: ElementalEffectType;
  description: string;
  cooldown: number;
  mpCost: number;
  basePower: number;
  accentHex: string;
  range: number;
}

export interface RunSubSkillEntry {
  id: SubSkillId;
  level: number;
}

export type RunItemId =
  | 'boots_double_jump'
  | 'boots_swift'
  | 'boots_shadow_step'
  | 'ring_crimson'
  | 'ring_storm_spark'
  | 'charm_crit'
  | 'amulet_arcane'
  | 'tome_starlight'
  | 'fang_vampire'
  | 'orb_frost_heart'
  | 'crest_berserker'
  | 'cloak_vitality';

export interface RunItemDef {
  id: RunItemId;
  name: string;
  category: 'Sepatu' | 'Aksesoris';
  description: string;
  accentHex: string;
  grantsDoubleJump?: boolean;
  moveSpeedBonus?: number;
  atkBonus?: number;
  critBonus?: number;
  skillDmgBonus?: number;
  maxHpBonus?: number;
  lifestealBonus?: number;
}

export interface RunInventoryEntry {
  uid: string;
  id: RunItemId;
  level: number;
}

export interface ItemSynergyDef {
  id: string;
  name: string;
  requiredItems: [RunItemId, RunItemId];
  bonusText: string;
  accentHex: string;
  atkBonus?: number;
  moveSpeedBonus?: number;
  critBonus?: number;
  skillDmgBonus?: number;
  maxHpBonus?: number;
  lifestealBonus?: number;
}

export interface ChestChoiceOption {
  uid: string;
  kind: 'heal' | 'item';
  title: string;
  subtitle: string;
  statSummary?: string;
  accentHex: string;
  healPct?: number;
  healAmount?: number;
  itemId?: RunItemId;
  currentLevel?: number;
  nextLevel?: number;
  isUpgrade?: boolean;
  isMaxed?: boolean;
  itemDef?: RunItemDef;
}

export type RunTempBuffId =
  | 'run_atk_boost'
  | 'run_speed_boost'
  | 'run_crit_boost'
  | 'run_hp_surge';

export type PassiveNodeId =
  | 'demon_vigor'
  | 'twin_precision'
  | 'abyss_haste'
  | 'shadow_leech'
  | 'horn_resonance'
  | 'fatal_surge';

export interface PassiveNodeDef {
  id: PassiveNodeId;
  name: string;
  branch: 'Demon Blood' | 'Twin Blade' | 'Abyssal Void';
  description: string;
  maxLevel: number;
  costPerLevel: number;
  effectLabel: (level: number) => string;
}

export type GachaRarity = 'SSR' | 'SR' | 'R';

export interface GachaPoolItem {
  id: string;
  name: string;
  rarity: GachaRarity;
  category: 'Character' | 'Weapon Skin' | 'Demon Rune';
  description: string;
  atkBonus?: number;
  hpBonus?: number;
}

export interface PullRecord {
  id: string;
  pullIndex: number;
  itemId: string;
  name: string;
  rarity: GachaRarity;
  category: GachaPoolItem['category'];
  isDuplicate: boolean;
  gemsSpent: number;
  timestamp: number;
}

export interface DailyRewardDef {
  day: number;
  label: string;
  gems: number;
  gold: number;
  shards: number;
}

export interface EventBannerNotice {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  periodLabel: string;
  rewardGems: number;
  isNew: boolean;
}

export type DailyQuestId =
  | 'dq_kill_mobs'
  | 'dq_clear_stages'
  | 'dq_gacha_pulls'
  | 'dq_open_chests';

export type DailyQuestMetric = 'kills' | 'stagesCleared' | 'pulls' | 'chestsOpened';

export interface DailyQuestDef {
  id: DailyQuestId;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  metric: DailyQuestMetric;
  target: number;
  rewardGems: number;
  rewardGold: number;
  rewardEssence: number;
}

export interface DailyQuestState {
  dateKey: string;
  progress: Record<DailyQuestMetric, number>;
  claimedIds: DailyQuestId[];
}

export interface AudioSettings {
  masterVolume: number; // 0..100
  bgmVolume: number; // 0..100
  sfxVolume: number; // 0..100
  muted: boolean;
}

export type MobileControlButtonId =
  | 'left'
  | 'down'
  | 'right'
  | 'jump'
  | 'dash'
  | 'skill1'
  | 'skill2'
  | 'skill3'
  | 'interact';

export interface MobileButtonConfig {
  offsetX: number; // -320..320 px
  offsetY: number; // -320..320 px
  scale: number; // 0.5..2.0
  opacity: number; // 30..100 %
}

export interface MobileControlsSettings {
  opacity: number; // 30..100 global fallback
  dpadOffsetX: number; // legacy group offset (-260..260 px)
  dpadOffsetY: number;
  actionOffsetX: number;
  actionOffsetY: number;
  skillsOffsetX: number;
  skillsOffsetY: number;
  buttons: Record<MobileControlButtonId, MobileButtonConfig>;
}

export type KeyActionId =
  | 'left'
  | 'right'
  | 'jump'
  | 'down'
  | 'attack'
  | 'dash'
  | 'skill1'
  | 'skill2'
  | 'skill3'
  | 'interact'
  | 'inventory';

export type Keybindings = Record<KeyActionId, string>;

export interface SaveData {
  gems: number; // Mata uang premium (untuk Gacha)
  gold: number; // Untuk Upgrade & Toko Senjata
  forgeShards: number;
  skillEssence: number;
  selectedCharacter: CharacterId;
  lunaUnlocked: boolean;
  lunaAwakening: number; // 0 to 6
  velveraUnlocked: boolean;
  velveraAwakening: number; // 0 to 6
  lyraUnlocked: boolean;
  lyraAwakening: number; // 0 to 6
  witchUnlocked: boolean;
  witchAwakening: number; // 0 to 6
  pityCount: number; // 0 to 80
  totalPulls: number;
  pullHistory: PullRecord[];
  lunaWeapon: LunaWeaponConfig;
  unlockedLunaWeapons: ScytheWeaponId[];
  weapon: WeaponConfig;
  unlockedBladeStyles: BladeStyleId[];
  lyraWeapon: LyraWeaponConfig;
  unlockedLyraWeapons: LyraWeaponId[];
  witchWeapon: WitchWeaponConfig;
  unlockedWitchWeapons: WitchWeaponId[];
  lunaEquippedSkills: [ActiveSkillId, ActiveSkillId, ActiveSkillId];
  equippedSkills: [ActiveSkillId, ActiveSkillId, ActiveSkillId];
  lyraEquippedSkills: [ActiveSkillId, ActiveSkillId, ActiveSkillId];
  witchEquippedSkills: [ActiveSkillId, ActiveSkillId, ActiveSkillId];
  skillLevels: Record<ActiveSkillId, number>; // Lv 1..10 (sanctum-only upgrade)
  passiveLevels: Record<PassiveNodeId, number>;
  dailyLogin: {
    claimedDays: number[]; // e.g., [1, 2]
    lastClaimDate: string | null; // YYYY-MM-DD
  };
  dailyQuests: DailyQuestState;
  seenEventIds: string[];
  claimedEventRewardIds: string[];
  characterLevel: number; // Starts at 1 (100 base HP)
  bestiaryKills: Record<MonsterType, number>;
  claimedBestiaryIds: MonsterType[];
  highestStage: number; // 1..10
  bestScore: number;
  language: LanguageCode;
  audioSettings: AudioSettings;
  mobileControls: MobileControlsSettings;
  keybindings: Keybindings;
}

export type StageWeatherType =
  | 'violet_embers'
  | 'ash_mist'
  | 'spectral_fog'
  | 'amethyst_rain'
  | 'abyssal_storm';

export interface BestiaryEntryDef {
  id: MonsterType;
  name: string;
  spawnRateLabel: string;
  targetKills: number;
  lore: string;
  rewardGems: number;
  rewardGold: number;
}

export interface SkillDraftOption {
  kind: 'sub' | 'passive' | 'temp_buff';
  id: SubSkillId | PassiveNodeId | RunTempBuffId;
  name: string;
  roleLabel?: string;
  description: string;
  nextLevel: number;
}

export interface MinimapSnapshot {
  worldW: number;
  worldH: number;
  playerX: number;
  playerY: number;
  portal: { x: number; y: number } | null;
  bossChest: { x: number; y: number; opened: boolean } | null;
  tomb: { x: number; y: number; opened: boolean };
  catMerchant?: { x: number; y: number } | null;
  supplyChests: Array<{ x: number; y: number; opened: boolean }>;
  platforms: Array<{ x: number; y: number; w: number }>;
  floorSegments: Array<{ x1: number; x2: number; y: number }>;
}

export type LobbyInteractableKind =
  | 'stage_portal'
  | 'gacha_statue'
  | 'weapon_shop'
  | 'enchant_portal'
  | 'enchant_altar'
  | 'return_portal'
  | 'training_dummy';

export interface ComboChainHudSnapshot {
  sequence: SkillChainTag[];
  windowRemainingSec: number;
  activeBuffName: string | null;
  buffRemainingSec: number;
  atkSpeedBonusPct: number;
  damageBonusPct: number;
}

export interface HudSnapshot {
  characterId: CharacterId;
  lobbyRoom: LobbyRoomId;
  nearLobbyObject: LobbyInteractableKind | null;
  dummyLastHit: number;
  dummyMaxHit: number;
  dummyDps: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  silver: number;
  stage: number; // 1..10
  subStage: number; // 1..5
  isBossRoom: boolean;
  bossName: string | null;
  bossHp: number;
  bossMaxHp: number;
  bossBarHp: number;
  bossBarMaxHp: number;
  bossBarsRemaining: number;
  bossTotalBars: number;
  monstersAlive: number;
  portalReady: boolean;
  portalSpawnProgress: number;
  portalSide: 'left' | 'right' | null;
  chestReady: boolean;
  chestOpened: boolean;
  nearInteractable: 'portal' | 'chest' | 'tomb' | 'supply' | 'cat_merchant' | null;
  autoCombat: boolean;
  auraOverdriveSec: number;
  hasDoubleJump: boolean;
  combo: number;
  comboTimerPct: number;
  comboChain: ComboChainHudSnapshot;
  score: number;
  kills: number;
  elapsedSec: number;
  skillCooldowns: [number, number, number];
  skillMaxCooldowns: [number, number, number];
  runSubSkills: RunSubSkillEntry[];
  subSkillCooldowns: number[];
  subSkillMaxCooldowns: number[];
  runInventory: RunInventoryEntry[];
  activeSynergies: ItemSynergyDef[];
  activeItemSubCombos: ActiveItemSubSkillCombo[];
  dashCooldown: number;
  inRunBanner: string | null;
  minimap: MinimapSnapshot;
}

export interface RunSummary {
  outcome: 'victory' | 'defeat';
  stageReached: number;
  subStageReached: number;
  score: number;
  kills: number;
  clearTimeSec: number;
  bossHpRemainingPct: number;
  gemsEarned: number;
  goldEarned: number;
  shardsEarned: number;
  essenceEarned: number;
}
