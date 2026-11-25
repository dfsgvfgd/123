import type {
  ActiveItemSubSkillCombo,
  ActiveSkillDef,
  ActiveSkillId,
  AnySkillId,
  BestiaryEntryDef,
  BladeAuraId,
  BladeStyleId,
  CatMerchantOffer,
  CharacterId,
  ChestChoiceOption,
  ItemSubSkillComboDef,
  ItemSynergyDef,
  LanguageCode,
  LyraWeaponId,
  MonsterType,
  PassiveNodeDef,
  PassiveNodeId,
  RunInventoryEntry,
  RunItemDef,
  RunItemId,
  RunSubSkillEntry,
  RunTempBuffId,
  SaveData,
  ScytheWeaponId,
  SkillDraftOption,
  StageWeatherType,
  SubSkillDef,
  SubSkillId,
  WeaponEnchantId,
  WitchWeaponId,
} from './types';

export const MAX_ACTIVE_SKILL_LEVEL = 10;
export const MAX_SUB_SKILL_LEVEL = 3;
export const MAX_RUN_ITEM_LEVEL = 3;
export const MAX_RUN_SUB_SKILLS = 4;
export const MAX_RUN_INVENTORY = 5;

export const NORMAL_MONSTER_BASE_HP = 10000;
export const BOSS_MAX_HP = 99999;
export const FIVE_CHEST_PROBABILITY = 0.3;

export function rollSupplyChestCount(
  maxSpots = 5,
  rng: () => number = Math.random
): number {
  const safeMax = Math.max(1, maxSpots);
  if (safeMax >= 5 && rng() < FIVE_CHEST_PROBABILITY) {
    return 5;
  }
  return Math.min(safeMax, 3 + Math.floor(rng() * 2));
}

export function computeMonsterSilverDrop(
  kind: MonsterType | 'boss' | 'boss_bat',
  stage: number
): number {
  if (kind === 'boss') return 180 + stage * 45;
  if (kind === 'boss_bat') return 65 + stage * 18;
  if (kind === 'zombie_knight') return 26 + stage * 6;
  return 16 + stage * 4;
}

export const CHARACTER_ROSTER: Record<
  CharacterId,
  {
    id: CharacterId;
    name: string;
    title: string;
    weaponStyle: string;
    description: string;
    portraitPath: string;
    accentHex: string;
  }
> = {
  luna: {
    id: 'luna',
    name: 'Luna',
    title: 'Umbral Scythe Reaper',
    weaponStyle: 'Pembantai Berkerudung · Sabit Ungu-Kebiruan',
    description: 'Kesatria berkerudung gelap bersenjata sabit energi kosmik ungu-kebiruan dengan tebasan sabit lebar.',
    portraitPath: './assets/aistudio/image_c1506c91.png',
    accentHex: '#818CF8',
  },
  velvera: {
    id: 'velvera',
    name: 'Velvera',
    title: 'Abyssal Dual Blade',
    weaponStyle: 'Ras Demon · Dual Blade Ungu',
    description: 'Prajurit iblis bertanduk dengan tebasan ganda berkecepatan tinggi dan energi ungu.',
    portraitPath: './assets/aistudio/image_8d900556.png',
    accentHex: '#C084FC',
  },
  lyra: {
    id: 'lyra',
    name: 'Lyra',
    title: 'Crimson Martial Striker',
    weaponStyle: 'Petarung Martial · Tangan & Kaki',
    description: 'Petarung lincah ber-gauntlet besi yang bertarung memakai pukulan tangan, tendangan kaki, dan aura menyala.',
    portraitPath: './assets/aistudio/image_4705966c.png',
    accentHex: '#F97316',
  },
  witch: {
    id: 'witch',
    name: 'Seraphina',
    title: 'Astral Raven Witch',
    weaponStyle: 'Penyihir Sihir · Tongkat Lentera Gagak',
    description: 'Penyihir agung bertopi bintang dengan tongkat gagak berlantern ungu yang memanggil hujan bintang dan pusaran abyss.',
    portraitPath: './assets/aistudio/image_ca1bb698.png',
    accentHex: '#A855F7',
  },
};

export interface LunaScytheDef {
  id: ScytheWeaponId;
  name: string;
  subtitle: string;
  atkBonus: number;
  critBonus: number;
  speedBonus: number;
  shopPrice: number;
  bladeDark: string;
  bladeMid: string;
  bladeGlow: string;
  bladeCore: string;
  shaftHex: string;
}

export const LUNA_SCYTHE_ART_PATH = './assets/aistudio/image_17f3af36.png';

export const LUNA_SCYTHE_STYLES: Record<ScytheWeaponId, LunaScytheDef> = {
  umbral_crescent_scythe: {
    id: 'umbral_crescent_scythe',
    name: 'Umbral Crescent Scythe',
    subtitle: 'Sabit sabit energi kosmik ungu-kebiruan bawaan Luna',
    atkBonus: 13,
    critBonus: 0.05,
    speedBonus: 0.01,
    shopPrice: 0,
    bladeDark: '#1E1B4B',
    bladeMid: '#4338CA',
    bladeGlow: '#A855F7',
    bladeCore: '#38BDF8',
    shaftHex: '#2E2A44',
  },
  crimson_reaper_scythe: {
    id: 'crimson_reaper_scythe',
    name: 'Crimson Nightfall Scythe',
    subtitle: 'Sabit penuai malam bermata crimson-violet dengan tarikan jiwa',
    atkBonus: 21,
    critBonus: 0.09,
    speedBonus: 0.05,
    shopPrice: 1950,
    bladeDark: '#3B0764',
    bladeMid: '#9D174D',
    bladeGlow: '#EC4899',
    bladeCore: '#C084FC',
    shaftHex: '#331A2D',
  },
  astral_eclipse_scythe: {
    id: 'astral_eclipse_scythe',
    name: 'Astral Nebula Scythe',
    subtitle: 'Sabit sabit bintang galaksi berkecepatan tinggi dengan crit tajam',
    atkBonus: 26,
    critBonus: 0.13,
    speedBonus: 0.09,
    shopPrice: 3600,
    bladeDark: '#1E1B4B',
    bladeMid: '#0284C7',
    bladeGlow: '#818CF8',
    bladeCore: '#7DD3FC',
    shaftHex: '#1F2937',
  },
  void_cosmos_scythe: {
    id: 'void_cosmos_scythe',
    name: 'Void Cosmos Greatscythe',
    subtitle: 'Sabit agung gerhana berinti supernova ungu-biru',
    atkBonus: 32,
    critBonus: 0.15,
    speedBonus: 0.11,
    shopPrice: 5900,
    bladeDark: '#0F172A',
    bladeMid: '#5B21B6',
    bladeGlow: '#C084FC',
    bladeCore: '#38BDF8',
    shaftHex: '#18181B',
  },
};

export interface DualBladeWeaponDef {
  id: BladeStyleId;
  name: string;
  subtitle: string;
  atkBonus: number;
  critBonus: number;
  speedBonus: number;
  shopPrice: number;
  unlockNote: string;
}

export const BLADE_STYLES: Record<BladeStyleId, DualBladeWeaponDef> = {
  abyss_fang: {
    id: 'abyss_fang',
    name: 'Abyssal Twin Fang',
    subtitle: 'Dual Blade iblis klasik milik Velvera',
    atkBonus: 12,
    critBonus: 0.05,
    speedBonus: 0,
    shopPrice: 0,
    unlockNote: 'Bawaan Awal',
  },
  amethyst_crescent: {
    id: 'amethyst_crescent',
    name: 'Amethyst Crescent',
    subtitle: 'Bilah sabit kembar dengan jangkauan tebasan lebar',
    atkBonus: 20,
    critBonus: 0.08,
    speedBonus: 0.05,
    shopPrice: 1850,
    unlockNote: 'Beli di Toko NPC Portal Kanan (1.850G) atau Forge Lv.2',
  },
  obsidian_claw: {
    id: 'obsidian_claw',
    name: 'Obsidian Gauntlet Claws',
    subtitle: 'Dual Blade cakar ungu sangat cepat dengan crit tinggi',
    atkBonus: 19,
    critBonus: 0.14,
    speedBonus: 0.12,
    shopPrice: 3200,
    unlockNote: 'Beli di Toko NPC Portal Kanan (3.200G) atau Forge Lv.3',
  },
  eclipse_edge: {
    id: 'eclipse_edge',
    name: 'Eclipse Silver Edge',
    subtitle: 'Dual Blade perak-obsidian peningkat damage skill demon',
    atkBonus: 28,
    critBonus: 0.11,
    speedBonus: 0.09,
    shopPrice: 5400,
    unlockNote: 'Beli di Toko NPC Portal Kanan (5.400G) atau Forge Lv.5',
  },
};

export interface LyraWeaponDef {
  id: LyraWeaponId;
  name: string;
  subtitle: string;
  atkBonus: number;
  critBonus: number;
  speedBonus: number;
  shopPrice: number;
  gauntletLight: string;
  gauntletDark: string;
  bootLight: string;
  bootTrim: string;
  auraHex: string;
}

export const LYRA_WEAPON_STYLES: Record<LyraWeaponId, LyraWeaponDef> = {
  iron_knuckle: {
    id: 'iron_knuckle',
    name: 'Iron Martial Knuckle',
    subtitle: 'Gauntlet besi & sepatu kulit petarung bawaan Lyra',
    atkBonus: 12,
    critBonus: 0.05,
    speedBonus: 0.04,
    shopPrice: 0,
    gauntletLight: '#8E7D6B',
    gauntletDark: '#4F4238',
    bootLight: '#5A483D',
    bootTrim: '#C8A66C',
    auraHex: '#F97316',
  },
  crimson_wraps: {
    id: 'crimson_wraps',
    name: 'Crimson Wyrm Wraps',
    subtitle: 'Balutan tangan merah & pelindung kaki gesit penuh bara',
    atkBonus: 20,
    critBonus: 0.09,
    speedBonus: 0.1,
    shopPrice: 1850,
    gauntletLight: '#DC2626',
    gauntletDark: '#7F1D1D',
    bootLight: '#991B1B',
    bootTrim: '#FACC15',
    auraHex: '#EF4444',
  },
  golden_cestus: {
    id: 'golden_cestus',
    name: 'Solar Bronze Cestus',
    subtitle: 'Cestus perunggu surya & greaves bersayap penambah daya hantam',
    atkBonus: 25,
    critBonus: 0.12,
    speedBonus: 0.09,
    shopPrice: 3400,
    gauntletLight: '#FACC15',
    gauntletDark: '#92400E',
    bootLight: '#B45309',
    bootTrim: '#FEF08A',
    auraHex: '#F59E0B',
  },
  abyss_greaves: {
    id: 'abyss_greaves',
    name: 'Abyssal Fang Greaves',
    subtitle: 'Sarung tangan naga obsidian & sepatu tendangan badai',
    atkBonus: 30,
    critBonus: 0.15,
    speedBonus: 0.14,
    shopPrice: 5600,
    gauntletLight: '#A855F7',
    gauntletDark: '#2E1065',
    bootLight: '#3B0764',
    bootTrim: '#E9D5FF',
    auraHex: '#C084FC',
  },
};

export interface WitchWeaponDef {
  id: WitchWeaponId;
  name: string;
  subtitle: string;
  atkBonus: number;
  critBonus: number;
  speedBonus: number;
  skillDmgBonus: number;
  shopPrice: number;
  staffWood: string;
  lanternGlow: string;
  ribbonHex: string;
}

export const WITCH_WEAPON_STYLES: Record<WitchWeaponId, WitchWeaponDef> = {
  raven_gnarled_staff: {
    id: 'raven_gnarled_staff',
    name: 'Gnarled Raven Lantern Staff',
    subtitle: 'Tongkat akar purba bertengger gagak & lentera ungu bawaan Seraphina',
    atkBonus: 11,
    critBonus: 0.06,
    speedBonus: 0.02,
    skillDmgBonus: 0.08,
    shopPrice: 0,
    staffWood: '#5C4332',
    lanternGlow: '#C084FC',
    ribbonHex: '#9333EA',
  },
  amethyst_lantern_rod: {
    id: 'amethyst_lantern_rod',
    name: 'Amethyst Censer Rod',
    subtitle: 'Tongkat pendupaan kristal amethyst peningkat daya ledak sihir',
    atkBonus: 19,
    critBonus: 0.09,
    speedBonus: 0.06,
    skillDmgBonus: 0.18,
    shopPrice: 2100,
    staffWood: '#4C1D95',
    lanternGlow: '#E879F9',
    ribbonHex: '#D946EF',
  },
  astral_crow_scepter: {
    id: 'astral_crow_scepter',
    name: 'Astral Starlight Scepter',
    subtitle: 'Tongkat bintang langit ungu dengan rantai mantra berkecepatan tinggi',
    atkBonus: 24,
    critBonus: 0.13,
    speedBonus: 0.1,
    skillDmgBonus: 0.25,
    shopPrice: 3800,
    staffWood: '#312E81',
    lanternGlow: '#FACC15',
    ribbonHex: '#A78BFA',
  },
  eclipse_grimoire_staff: {
    id: 'eclipse_grimoire_staff',
    name: 'Eclipse Grimoire Greatstaff',
    subtitle: 'Tongkat agung gerhana abyss dengan inti bintang kekal',
    atkBonus: 31,
    critBonus: 0.15,
    speedBonus: 0.11,
    skillDmgBonus: 0.34,
    shopPrice: 6200,
    staffWood: '#1E1B4B',
    lanternGlow: '#F472B6',
    ribbonHex: '#C084FC',
  },
};

export const BLADE_AURAS: Record<
  BladeAuraId,
  {
    id: BladeAuraId;
    name: string;
    coreHex: string;
    glowHex: string;
    trailHex: string;
  }
> = {
  violet_abyss: {
    id: 'violet_abyss',
    name: 'Violet Abyss',
    coreHex: '#E9D5FF',
    glowHex: '#A855F7',
    trailHex: '#7E22CE',
  },
  astral_amethyst: {
    id: 'astral_amethyst',
    name: 'Astral Amethyst',
    coreHex: '#F5D0FE',
    glowHex: '#C084FC',
    trailHex: '#9333EA',
  },
  void_orchid: {
    id: 'void_orchid',
    name: 'Void Orchid',
    coreHex: '#FCE7F3',
    glowHex: '#D946EF',
    trailHex: '#86198F',
  },
  eclipse_silver: {
    id: 'eclipse_silver',
    name: 'Silver Eclipse',
    coreHex: '#F8FAFC',
    glowHex: '#A78BFA',
    trailHex: '#5B21B6',
  },
};

export const WEAPON_ENCHANTS: Record<
  WeaponEnchantId,
  {
    id: WeaponEnchantId;
    name: string;
    effectText: string;
    critBonus: number;
    speedBonus: number;
    lifestealPct: number;
    voidBurnDps: number;
  }
> = {
  crit_edge: {
    id: 'crit_edge',
    name: 'Rune Ketajaman Fatal',
    effectText: '+14% Peluang Crit Senjata',
    critBonus: 0.14,
    speedBonus: 0,
    lifestealPct: 0,
    voidBurnDps: 0,
  },
  swift_wind: {
    id: 'swift_wind',
    name: 'Rune Kecepatan Bayangan',
    effectText: '+18% Kecepatan Serangan & Gerak',
    critBonus: 0.03,
    speedBonus: 0.18,
    lifestealPct: 0,
    voidBurnDps: 0,
  },
  blood_pact: {
    id: 'blood_pact',
    name: 'Rune Pakta Darah Iblis',
    effectText: 'Serap 6% HP dari setiap serangan',
    critBonus: 0.04,
    speedBonus: 0.04,
    lifestealPct: 0.06,
    voidBurnDps: 0,
  },
  void_burn: {
    id: 'void_burn',
    name: 'Rune Nyala Api Ungu',
    effectText: 'Membakar musuh dengan Void Flame',
    critBonus: 0.06,
    speedBonus: 0.05,
    lifestealPct: 0,
    voidBurnDps: 10,
  },
};

// Character Active Skills (Player-triggered or Auto ON; Lv.1..10 upgraded in Sanctum only!)
export const ACTIVE_SKILLS: Record<ActiveSkillId, ActiveSkillDef> = {
  luna_soul_harvest: {
    id: 'luna_soul_harvest',
    name: 'Soul Harvest',
    roleLabel: 'Sabit · Lifesteal',
    chainTag: 'aoe',
    description: 'Ayunan sabit kosmik dua lapis yang menuai jiwa musuh serta memulihkan HP Luna.',
    cooldown: 4.8,
    mpCost: 16,
    basePower: 0.92,
    accentHex: '#A855F7',
    owner: 'luna',
  },
  luna_umbral_rush: {
    id: 'luna_umbral_rush',
    name: 'Umbral Rush',
    roleLabel: 'Dash Tebas',
    chainTag: 'blink',
    description: 'Melesat menembus barisan musuh sambil meninggalkan jejak bayangan ungu-biru dan tebasan sabit.',
    cooldown: 4.2,
    mpCost: 14,
    basePower: 0.88,
    accentHex: '#38BDF8',
    owner: 'luna',
  },
  luna_lunar_eclipse: {
    id: 'luna_lunar_eclipse',
    name: 'Lunar Eclipse',
    roleLabel: 'AoE Gerhana',
    chainTag: 'wave',
    description: 'Memanggil segel gerhana ungu-kebiruan yang menghujankan bilah bulan sabit dan gelombang kejut.',
    cooldown: 7.4,
    mpCost: 24,
    basePower: 1.06,
    accentHex: '#818CF8',
    owner: 'luna',
  },
  void_tempest: {
    id: 'void_tempest',
    name: 'Void Tempest',
    roleLabel: 'AoE',
    chainTag: 'aoe',
    description: 'Putaran Dual Blade ungu yang mencabik seluruh monster di sekitar Velvera.',
    cooldown: 5.5,
    mpCost: 18,
    basePower: 0.85,
    accentHex: '#A855F7',
    owner: 'velvera',
  },
  phantom_blink: {
    id: 'phantom_blink',
    name: 'Phantom Blink Slash',
    roleLabel: 'Blink',
    chainTag: 'blink',
    description: 'Menghilang menembus musuh ke depan dan meninggalkan ledakan tebasan ungu.',
    cooldown: 4.5,
    mpCost: 15,
    basePower: 0.92,
    accentHex: '#C084FC',
    owner: 'velvera',
  },
  abyssal_crescent: {
    id: 'abyssal_crescent',
    name: 'Abyssal Crescent Wave',
    roleLabel: 'Gelombang',
    chainTag: 'wave',
    description: 'Melepaskan dua gelombang sabit energi ungu menembus barisan musuh.',
    cooldown: 5.0,
    mpCost: 16,
    basePower: 0.82,
    accentHex: '#9333EA',
    owner: 'velvera',
  },
  demon_eclipse: {
    id: 'demon_eclipse',
    name: 'Demon Wings: Eclipse',
    roleLabel: 'AoE Hujan',
    chainTag: 'aoe',
    description: 'Membentangkan sayap iblis lalu menghujankan tombak kristal ungu di arena.',
    cooldown: 9.0,
    mpCost: 28,
    basePower: 1.05,
    accentHex: '#D946EF',
    owner: 'velvera',
  },
  soul_rend: {
    id: 'soul_rend',
    name: 'Soul Rend Barrage',
    roleLabel: 'Serbuan',
    chainTag: 'wave',
    description: 'Kombo cakar ungu beruntun yang memulihkan HP saat mengenai target.',
    cooldown: 7.0,
    mpCost: 22,
    basePower: 0.96,
    accentHex: '#E879F9',
    owner: 'velvera',
  },
  lyra_fist_rush: {
    id: 'lyra_fist_rush',
    name: 'Aura Fist Barrage',
    roleLabel: 'Dash Pukulan',
    chainTag: 'blink',
    description: 'Menghujamkan rentetan pukulan cepat berlapis aura tangan merah-emas ke depan.',
    cooldown: 4.5,
    mpCost: 15,
    basePower: 0.86,
    accentHex: '#F97316',
    owner: 'lyra',
  },
  lyra_cyclone_kick: {
    id: 'lyra_cyclone_kick',
    name: 'Cyclone Heel Kick',
    roleLabel: 'AoE Tendang',
    chainTag: 'aoe',
    description: 'Tendangan putar melambung dengan aura kaki menyala yang menghempas musuh sekitar.',
    cooldown: 5.2,
    mpCost: 18,
    basePower: 0.94,
    accentHex: '#FACC15',
    owner: 'lyra',
  },
  lyra_aura_overdrive: {
    id: 'lyra_aura_overdrive',
    name: 'Martial Aura Overdrive',
    roleLabel: 'Buff · AoE',
    chainTag: 'aoe',
    description: 'Menyalakan aura menyala di kedua tangan dan kaki selama 8 detik (+30% Speed & gelombang kejut).',
    cooldown: 10.0,
    mpCost: 26,
    basePower: 1.0,
    accentHex: '#EF4444',
    owner: 'lyra',
  },
  witch_raven_arcana: {
    id: 'witch_raven_arcana',
    name: 'Raven Lantern Swarm',
    roleLabel: 'Proyektil',
    chainTag: 'wave',
    description: 'Melepaskan kawanan gagak bayangan & orb lentera amethyst yang meledak menembus musuh.',
    cooldown: 4.4,
    mpCost: 16,
    basePower: 0.88,
    accentHex: '#C084FC',
    owner: 'witch',
  },
  witch_starfall_meteor: {
    id: 'witch_starfall_meteor',
    name: 'Astral Starfall',
    roleLabel: 'AoE Hujan',
    chainTag: 'aoe',
    description: 'Memanggil pilar cahaya & hujan bintang amethyst dari langit yang menghantam area luas.',
    cooldown: 6.2,
    mpCost: 22,
    basePower: 1.02,
    accentHex: '#FACC15',
    owner: 'witch',
  },
  witch_void_vortex: {
    id: 'witch_void_vortex',
    name: 'Abyssal Singularity',
    roleLabel: 'Hisap Blink',
    chainTag: 'blink',
    description: 'Membuka pusaran gravitasi ungu yang menarik musuh sambil Seraphina mundur berkedip aman.',
    cooldown: 5.8,
    mpCost: 19,
    basePower: 0.94,
    accentHex: '#E879F9',
    owner: 'witch',
  },
};

// Stage-only Sub-Skills from Boss Chests & Ancient Tombs (never saved persistently, Max Lv.3, Auto-attacks in range!)
export const SUB_SKILLS: Record<SubSkillId, SubSkillDef> = {
  sub_fireball: {
    id: 'sub_fireball',
    name: 'Fire Ball',
    roleLabel: 'Api · Burn',
    chainTag: 'fire',
    element: 'burn',
    description: 'Otomatis menembakkan bola api ke musuh dalam jangkauan dan memicu Burn.',
    cooldown: 4.8,
    mpCost: 0,
    basePower: 0.7,
    accentHex: '#F97316',
    range: 460,
  },
  sub_firetrap: {
    id: 'sub_firetrap',
    name: 'Trap Api',
    roleLabel: 'Trap · Burn',
    chainTag: 'fire',
    element: 'burn',
    description: 'Otomatis memasang perangkap api di bawah musuh terdekat yang meledak memicu Burn.',
    cooldown: 5.5,
    mpCost: 0,
    basePower: 0.76,
    accentHex: '#EF4444',
    range: 360,
  },
  sub_icearrow: {
    id: 'sub_icearrow',
    name: 'Panah Es',
    roleLabel: 'Es · Freeze',
    chainTag: 'ice',
    element: 'freeze',
    description: 'Otomatis meluncurkan panah es menembus musuh dan membekukan gerak mereka (Freeze).',
    cooldown: 4.4,
    mpCost: 0,
    basePower: 0.64,
    accentHex: '#38BDF8',
    range: 480,
  },
  sub_poison: {
    id: 'sub_poison',
    name: 'Kabut Racun',
    roleLabel: 'Racun · DoT',
    chainTag: 'poison',
    element: 'poison',
    description: 'Otomatis menyebarkan kabut racun di sekitar musuh untuk mengikis HP terus-menerus.',
    cooldown: 6.0,
    mpCost: 0,
    basePower: 0.56,
    accentHex: '#4ADE80',
    range: 380,
  },
  sub_lightning: {
    id: 'sub_lightning',
    name: 'Chain Lightning',
    roleLabel: 'Petir · Rantai',
    chainTag: 'lightning',
    element: 'burn',
    description: 'Otomatis menyambar petir berantai hingga ke 4 musuh sekaligus di dalam jangkauan.',
    cooldown: 4.6,
    mpCost: 0,
    basePower: 0.74,
    accentHex: '#FACC15',
    range: 440,
  },
  sub_shadow_kunai: {
    id: 'sub_shadow_kunai',
    name: 'Belati Bayangan',
    roleLabel: 'Tembus · Crit',
    chainTag: 'wave',
    element: 'poison',
    description: 'Otomatis melemparkan 3 belati bayangan beruntun ke arah musuh terdekat.',
    cooldown: 3.8,
    mpCost: 0,
    basePower: 0.52,
    accentHex: '#C084FC',
    range: 450,
  },
  sub_meteor: {
    id: 'sub_meteor',
    name: 'Hujan Meteor',
    roleLabel: 'AoE · Bakar',
    chainTag: 'fire',
    element: 'burn',
    description: 'Otomatis menjatuhkan meteor pijar dari langit tepat di posisi monster dalam jarak serang.',
    cooldown: 6.4,
    mpCost: 0,
    basePower: 0.82,
    accentHex: '#FB923C',
    range: 430,
  },
  sub_frost_nova: {
    id: 'sub_frost_nova',
    name: 'Ledakan Nova Es',
    roleLabel: 'AoE · Beku',
    chainTag: 'ice',
    element: 'freeze',
    description: 'Otomatis melepaskan cincin kristal es di sekitar karakter saat monster mendekat.',
    cooldown: 5.4,
    mpCost: 0,
    basePower: 0.68,
    accentHex: '#67E8F9',
    range: 290,
  },
  sub_shadow_blades: {
    id: 'sub_shadow_blades',
    name: 'Bilah Bayangan Berputar',
    roleLabel: 'Putar · Iris',
    chainTag: 'aoe',
    element: 'poison',
    description: 'Memanggil bilah sabit bayangan berputar mengelilingi karakter dan menebas musuh sekitar.',
    cooldown: 4.5,
    mpCost: 0,
    basePower: 0.62,
    accentHex: '#A855F7',
    range: 250,
  },
  sub_dark_chains: {
    id: 'sub_dark_chains',
    name: 'Rantai Pengikat Gelap',
    roleLabel: 'Ikat · Tarik',
    chainTag: 'blink',
    element: 'freeze',
    description: 'Meluncurkan rantai bayangan yang menjerat musuh, memperlambat gerak, dan menarik ke jarak tebas.',
    cooldown: 5.2,
    mpCost: 0,
    basePower: 0.64,
    accentHex: '#818CF8',
    range: 420,
  },
  sub_abyss_spear: {
    id: 'sub_abyss_spear',
    name: 'Tombak Kristal Jurang',
    roleLabel: 'Tembus · Jauh',
    chainTag: 'wave',
    element: 'freeze',
    description: 'Menembakkan tombak kristal jurang berkecepatan tinggi yang menembus barisan monster.',
    cooldown: 4.1,
    mpCost: 0,
    basePower: 0.78,
    accentHex: '#38BDF8',
    range: 520,
  },
  sub_blood_scythe: {
    id: 'sub_blood_scythe',
    name: 'Ledakan Sabit Darah',
    roleLabel: 'Darah · Drain',
    chainTag: 'aoe',
    element: 'burn',
    description: 'Memicu ledakan sabit crimson pada musuh terdekat dan menyerap sebagian HP kembali.',
    cooldown: 5.6,
    mpCost: 0,
    basePower: 0.76,
    accentHex: '#F43F5E',
    range: 340,
  },
  sub_violet_thunder: {
    id: 'sub_violet_thunder',
    name: 'Sambaran Petir Ungu',
    roleLabel: 'Petir · Langit',
    chainTag: 'lightning',
    element: 'burn',
    description: 'Menurunkan pilar petir ungu vertikal langsung dari langit ke kepala target.',
    cooldown: 4.9,
    mpCost: 0,
    basePower: 0.8,
    accentHex: '#D946EF',
    range: 450,
  },
  sub_shadow_spikes: {
    id: 'sub_shadow_spikes',
    name: 'Duri Bayangan Lantai',
    roleLabel: 'Duri · Tanah',
    chainTag: 'poison',
    element: 'poison',
    description: 'Menumbuhkan deretan duri bayangan runcing dari lantai batu tepat di bawah kaki musuh.',
    cooldown: 4.7,
    mpCost: 0,
    basePower: 0.72,
    accentHex: '#9333EA',
    range: 380,
  },
  sub_razor_aura: {
    id: 'sub_razor_aura',
    name: 'Aura Pemotong',
    roleLabel: 'Aura · Iris',
    chainTag: 'aoe',
    element: 'burn',
    description: 'Mengaktifkan cincin aura silet energi ungu-emas yang mengiris musuh di jarak dekat.',
    cooldown: 4.3,
    mpCost: 0,
    basePower: 0.65,
    accentHex: '#F59E0B',
    range: 240,
  },
  sub_crescent_boomerang: {
    id: 'sub_crescent_boomerang',
    name: 'Bumerang Sabit',
    roleLabel: 'Lempar · Balik',
    chainTag: 'wave',
    element: 'poison',
    description: 'Melempar sabit bulan sabit berputar yang menebas maju lalu berbalik kembali ke arah karakter.',
    cooldown: 4.4,
    mpCost: 0,
    basePower: 0.66,
    accentHex: '#E879F9',
    range: 470,
  },
  sub_vertical_shockwave: {
    id: 'sub_vertical_shockwave',
    name: 'Gelombang Kejut Vertikal',
    roleLabel: 'Kejut · Tinggi',
    chainTag: 'wave',
    element: 'burn',
    description: 'Mengirim pilar gelombang kejut energi vertikal tinggi yang menyapu monster darat & udara.',
    cooldown: 5.0,
    mpCost: 0,
    basePower: 0.75,
    accentHex: '#FB923C',
    range: 460,
  },
  sub_cosmic_needles: {
    id: 'sub_cosmic_needles',
    name: 'Hujan Jarum Kosmik',
    roleLabel: 'Hujan · Jarum',
    chainTag: 'lightning',
    element: 'freeze',
    description: 'Menghujani arena dengan jarum energi kosmik tajam dari berbagai sudut ke arah musuh.',
    cooldown: 4.2,
    mpCost: 0,
    basePower: 0.54,
    accentHex: '#C084FC',
    range: 480,
  },
};

export const ALL_SUB_SKILL_IDS: SubSkillId[] = [
  'sub_fireball',
  'sub_firetrap',
  'sub_icearrow',
  'sub_poison',
  'sub_lightning',
  'sub_shadow_kunai',
  'sub_meteor',
  'sub_frost_nova',
  'sub_shadow_blades',
  'sub_dark_chains',
  'sub_abyss_spear',
  'sub_blood_scythe',
  'sub_violet_thunder',
  'sub_shadow_spikes',
  'sub_razor_aura',
  'sub_crescent_boomerang',
  'sub_vertical_shockwave',
  'sub_cosmic_needles',
];

export const RUN_ITEMS: Record<RunItemId, RunItemDef> = {
  boots_double_jump: {
    id: 'boots_double_jump',
    name: 'Sepatu Sayap Ganda',
    category: 'Sepatu',
    description: 'Memberikan kemampuan Double Jump di udara & +8% Kecepatan Gerak.',
    accentHex: '#38BDF8',
    grantsDoubleJump: true,
    moveSpeedBonus: 0.08,
  },
  boots_swift: {
    id: 'boots_swift',
    name: 'Sepatu Kilat Angin',
    category: 'Sepatu',
    description: 'Mempercepat lari dan kelincahan melompat sebesar +22% Move Speed.',
    accentHex: '#FACC15',
    moveSpeedBonus: 0.22,
  },
  boots_shadow_step: {
    id: 'boots_shadow_step',
    name: 'Sepatu Langkah Bayangan',
    category: 'Sepatu',
    description: 'Menambah +14% Move Speed dan +6% Peluang Critical Hit.',
    accentHex: '#A78BFA',
    moveSpeedBonus: 0.14,
    critBonus: 0.06,
  },
  ring_crimson: {
    id: 'ring_crimson',
    name: 'Cincin Amukan Merah',
    category: 'Aksesoris',
    description: 'Menambah +12 Attack dasar selama berada di dalam stage.',
    accentHex: '#EF4444',
    atkBonus: 12,
  },
  ring_storm_spark: {
    id: 'ring_storm_spark',
    name: 'Cincin Percikan Badai',
    category: 'Aksesoris',
    description: 'Menambah +8 Attack dan +16% Damage Skill selama run.',
    accentHex: '#38BDF8',
    atkBonus: 8,
    skillDmgBonus: 0.16,
  },
  charm_crit: {
    id: 'charm_crit',
    name: 'Jimat Mata Elang',
    category: 'Aksesoris',
    description: 'Meningkatkan Peluang Critical Hit sebesar +12% selama run.',
    accentHex: '#F97316',
    critBonus: 0.12,
  },
  amulet_arcane: {
    id: 'amulet_arcane',
    name: 'Kalung Mana Suci',
    category: 'Aksesoris',
    description: 'Meningkatkan Damage Skill +18% selama pertarungan stage.',
    accentHex: '#C084FC',
    skillDmgBonus: 0.18,
  },
  tome_starlight: {
    id: 'tome_starlight',
    name: 'Grimoire Bintang Jatuh',
    category: 'Aksesoris',
    description: 'Memperkuat Damage Skill +22% dan +5% Peluang Critical.',
    accentHex: '#E879F9',
    skillDmgBonus: 0.22,
    critBonus: 0.05,
  },
  fang_vampire: {
    id: 'fang_vampire',
    name: 'Taring Penghisap Darah',
    category: 'Aksesoris',
    description: 'Menyerap +4% HP dari setiap serangan dan +8 Attack.',
    accentHex: '#F43F5E',
    atkBonus: 8,
    lifestealBonus: 0.04,
  },
  orb_frost_heart: {
    id: 'orb_frost_heart',
    name: 'Kristal Jantung Es',
    category: 'Aksesoris',
    description: 'Menambah +50 Max HP dan +10% Damage Skill.',
    accentHex: '#67E8F9',
    maxHpBonus: 50,
    skillDmgBonus: 0.1,
  },
  crest_berserker: {
    id: 'crest_berserker',
    name: 'Lencana Amukan Titan',
    category: 'Aksesoris',
    description: 'Menambah +15 Attack & +8% Peluang Critical Hit.',
    accentHex: '#FB923C',
    atkBonus: 15,
    critBonus: 0.08,
  },
  cloak_vitality: {
    id: 'cloak_vitality',
    name: 'Jubah Darah Besi',
    category: 'Aksesoris',
    description: 'Menambah +45 Max HP dan ketahanan bertahan di stage tinggi.',
    accentHex: '#4ADE80',
    maxHpBonus: 45,
  },
};

export const ALL_RUN_ITEM_IDS: RunItemId[] = [
  'boots_double_jump',
  'boots_swift',
  'boots_shadow_step',
  'ring_crimson',
  'ring_storm_spark',
  'charm_crit',
  'amulet_arcane',
  'tome_starlight',
  'fang_vampire',
  'orb_frost_heart',
  'crest_berserker',
  'cloak_vitality',
];

export const ITEM_SYNERGIES: ItemSynergyDef[] = [
  {
    id: 'synergy_wind_dancer',
    name: 'Set Penari Angin',
    requiredItems: ['boots_double_jump', 'boots_swift'],
    bonusText: '+15% Move Speed · +14 ATK',
    accentHex: '#38BDF8',
    moveSpeedBonus: 0.15,
    atkBonus: 14,
  },
  {
    id: 'synergy_crimson_predator',
    name: 'Set Pemangsa Darah',
    requiredItems: ['ring_crimson', 'fang_vampire'],
    bonusText: '+5% Lifesteal · +20 ATK',
    accentHex: '#F43F5E',
    lifestealBonus: 0.05,
    atkBonus: 20,
  },
  {
    id: 'synergy_astral_witch',
    name: 'Set Resonansi Bintang',
    requiredItems: ['amulet_arcane', 'tome_starlight'],
    bonusText: '+28% Skill DMG · +8% Crit',
    accentHex: '#E879F9',
    skillDmgBonus: 0.28,
    critBonus: 0.08,
  },
  {
    id: 'synergy_frost_titan',
    name: 'Set Benteng Abadi',
    requiredItems: ['cloak_vitality', 'orb_frost_heart'],
    bonusText: '+95 Max HP · +14 ATK',
    accentHex: '#4ADE80',
    maxHpBonus: 95,
    atkBonus: 14,
  },
  {
    id: 'synergy_thunder_assassin',
    name: 'Set Bayangan Halilintar',
    requiredItems: ['charm_crit', 'crest_berserker'],
    bonusText: '+14% Crit · +15% Move Speed · +12 ATK',
    accentHex: '#FACC15',
    critBonus: 0.14,
    moveSpeedBonus: 0.15,
    atkBonus: 12,
  },
];

export function computeActiveSynergies(inventory: RunInventoryEntry[]): ItemSynergyDef[] {
  const held = new Set(inventory.map((e) => e.id));
  return ITEM_SYNERGIES.filter(
    (syn) => held.has(syn.requiredItems[0]) && held.has(syn.requiredItems[1])
  );
}

export const ITEM_SUBSKILL_COMBOS: ItemSubSkillComboDef[] = [
  {
    id: 'combo_blood_reap',
    name: 'Sumpah Sabit Darah',
    itemId: 'fang_vampire',
    subSkillId: 'sub_blood_scythe',
    bonusAtkPct: 0.14,
    bonusSkillDmgPct: 0.16,
    bonusCritPct: 0,
    bonusMoveSpeedPct: 0,
    bonusLifestealPct: 0.04,
    shortBonus: '+14% ATK · +16% Skill · +4% Drain',
    accentHex: '#F43F5E',
  },
  {
    id: 'combo_arcane_thunder',
    name: 'Kalung Petir Astral',
    itemId: 'amulet_arcane',
    subSkillId: 'sub_violet_thunder',
    bonusAtkPct: 0.08,
    bonusSkillDmgPct: 0.24,
    bonusCritPct: 0.05,
    bonusMoveSpeedPct: 0,
    bonusLifestealPct: 0,
    shortBonus: '+24% Skill · +8% ATK · +5% Crit',
    accentHex: '#D946EF',
  },
  {
    id: 'combo_frost_spear',
    name: 'Tombak Jantung Beku',
    itemId: 'orb_frost_heart',
    subSkillId: 'sub_abyss_spear',
    bonusAtkPct: 0.12,
    bonusSkillDmgPct: 0.18,
    bonusCritPct: 0.06,
    bonusMoveSpeedPct: 0,
    bonusLifestealPct: 0,
    shortBonus: '+12% ATK · +18% Skill · +6% Crit',
    accentHex: '#38BDF8',
  },
  {
    id: 'combo_shadow_blade_step',
    name: 'Tarian Bilah Bayangan',
    itemId: 'boots_shadow_step',
    subSkillId: 'sub_shadow_blades',
    bonusAtkPct: 0.1,
    bonusSkillDmgPct: 0.14,
    bonusCritPct: 0.08,
    bonusMoveSpeedPct: 0.12,
    bonusLifestealPct: 0,
    shortBonus: '+12% SPD · +8% Crit · +10% ATK',
    accentHex: '#A855F7',
  },
  {
    id: 'combo_titan_shockwave',
    name: 'Hantaman Titan Api',
    itemId: 'crest_berserker',
    subSkillId: 'sub_vertical_shockwave',
    bonusAtkPct: 0.18,
    bonusSkillDmgPct: 0.15,
    bonusCritPct: 0.06,
    bonusMoveSpeedPct: 0,
    bonusLifestealPct: 0,
    shortBonus: '+18% ATK · +15% Skill · +6% Crit',
    accentHex: '#FB923C',
  },
  {
    id: 'combo_starlight_needles',
    name: 'Tome Jarum Kosmik',
    itemId: 'tome_starlight',
    subSkillId: 'sub_cosmic_needles',
    bonusAtkPct: 0.08,
    bonusSkillDmgPct: 0.22,
    bonusCritPct: 0.08,
    bonusMoveSpeedPct: 0,
    bonusLifestealPct: 0,
    shortBonus: '+22% Skill · +8% Crit · +8% ATK',
    accentHex: '#E879F9',
  },
];

export function computeItemSubSkillCombos(
  inventory: RunInventoryEntry[],
  runSubSkills: RunSubSkillEntry[]
): ActiveItemSubSkillCombo[] {
  const heldItems = new Set(inventory.map((i) => i.id));
  const heldSubs = new Set(runSubSkills.map((s) => s.id));
  return ITEM_SUBSKILL_COMBOS.map((def) => {
    const hasItem = heldItems.has(def.itemId);
    const hasSubSkill = heldSubs.has(def.subSkillId);
    return {
      def,
      hasItem,
      hasSubSkill,
      active: hasItem && hasSubSkill,
    };
  });
}

export function computeItemSubSkillComboBonuses(
  inventory: RunInventoryEntry[],
  runSubSkills: RunSubSkillEntry[]
): {
  atkPct: number;
  skillDmgPct: number;
  critPct: number;
  moveSpeedPct: number;
  lifestealPct: number;
  activeCombos: ActiveItemSubSkillCombo[];
} {
  const combos = computeItemSubSkillCombos(inventory, runSubSkills);
  const res = {
    atkPct: 0,
    skillDmgPct: 0,
    critPct: 0,
    moveSpeedPct: 0,
    lifestealPct: 0,
    activeCombos: combos.filter((c) => c.active),
  };
  for (const c of res.activeCombos) {
    res.atkPct += c.def.bonusAtkPct;
    res.skillDmgPct += c.def.bonusSkillDmgPct;
    res.critPct += c.def.bonusCritPct;
    res.moveSpeedPct += c.def.bonusMoveSpeedPct;
    res.lifestealPct += c.def.bonusLifestealPct;
  }
  return res;
}

export function generateCatMerchantOffers(
  stage: number,
  inventory: RunInventoryEntry[],
  runSubSkills: RunSubSkillEntry[],
  rng: () => number = Math.random
): CatMerchantOffer[] {
  const offers: CatMerchantOffer[] = [];
  const itemLevels: Partial<Record<RunItemId, number>> = {};
  for (const entry of inventory) {
    itemLevels[entry.id] = Math.max(itemLevels[entry.id] ?? 0, entry.level ?? 1);
  }
  const subLevels: Partial<Record<SubSkillId, number>> = {};
  for (const s of runSubSkills) {
    subLevels[s.id] = Math.max(subLevels[s.id] ?? 0, s.level);
  }

  const itemCandidates = ALL_RUN_ITEM_IDS.filter((id) => (itemLevels[id] ?? 0) < MAX_RUN_ITEM_LEVEL)
    .sort(() => rng() - 0.5)
    .slice(0, 2);
  const finalItems = itemCandidates.length >= 2
    ? itemCandidates
    : [...ALL_RUN_ITEM_IDS].sort(() => rng() - 0.5).slice(0, 2);

  for (const itemId of finalItems) {
    const def = RUN_ITEMS[itemId];
    const curLv = itemLevels[itemId] ?? 0;
    const isMaxed = curLv >= MAX_RUN_ITEM_LEVEL;
    const nextLv = isMaxed ? MAX_RUN_ITEM_LEVEL : curLv + 1;
    const priceSilver = 80 + stage * 18 + curLv * 45;
    offers.push({
      uid: `cat_item_${itemId}_${Math.floor(rng() * 1e6)}`,
      kind: 'item',
      priceSilver,
      itemDef: def,
      currentLevel: curLv,
      nextLevel: nextLv,
      isMaxed,
      purchased: false,
    });
  }

  const subCandidates = ALL_SUB_SKILL_IDS.filter((id) => (subLevels[id] ?? 0) < MAX_SUB_SKILL_LEVEL)
    .sort(() => rng() - 0.5)
    .slice(0, 2);
  const finalSubs = subCandidates.length >= 2
    ? subCandidates
    : [...ALL_SUB_SKILL_IDS].sort(() => rng() - 0.5).slice(0, 2);

  for (const subId of finalSubs) {
    const def = SUB_SKILLS[subId];
    const curLv = subLevels[subId] ?? 0;
    const isMaxed = curLv >= MAX_SUB_SKILL_LEVEL;
    const nextLv = isMaxed ? MAX_SUB_SKILL_LEVEL : curLv + 1;
    const priceSilver = 95 + stage * 22 + curLv * 55;
    offers.push({
      uid: `cat_sub_${subId}_${Math.floor(rng() * 1e6)}`,
      kind: 'sub_skill',
      priceSilver,
      subSkillDef: def,
      currentLevel: curLv,
      nextLevel: nextLv,
      isMaxed,
      purchased: false,
    });
  }

  return offers;
}

export interface RunItemBonuses {
  hasDoubleJump: boolean;
  moveSpeedBonus: number;
  atkBonus: number;
  critBonus: number;
  skillDmgBonus: number;
  maxHpBonus: number;
  lifestealBonus: number;
  activeSynergies: ItemSynergyDef[];
}

const RUN_ITEM_LEVEL_MULT: Record<number, number> = {
  1: 1,
  2: 1.65,
  3: 2.35,
};

export function getRunItemScaledBonuses(
  itemId: RunItemId,
  level = 1
): {
  grantsDoubleJump: boolean;
  moveSpeedBonus: number;
  atkBonus: number;
  critBonus: number;
  skillDmgBonus: number;
  maxHpBonus: number;
  lifestealBonus: number;
} {
  const def = RUN_ITEMS[itemId];
  if (!def) {
    return {
      grantsDoubleJump: false,
      moveSpeedBonus: 0,
      atkBonus: 0,
      critBonus: 0,
      skillDmgBonus: 0,
      maxHpBonus: 0,
      lifestealBonus: 0,
    };
  }
  const lv = Math.max(1, Math.min(MAX_RUN_ITEM_LEVEL, Math.round(level)));
  const mult = RUN_ITEM_LEVEL_MULT[lv] ?? 1;
  return {
    grantsDoubleJump: Boolean(def.grantsDoubleJump),
    moveSpeedBonus: def.moveSpeedBonus ? Number((def.moveSpeedBonus * mult).toFixed(3)) : 0,
    atkBonus: def.atkBonus ? Math.round(def.atkBonus * mult) : 0,
    critBonus: def.critBonus ? Number((def.critBonus * mult).toFixed(3)) : 0,
    skillDmgBonus: def.skillDmgBonus ? Number((def.skillDmgBonus * mult).toFixed(3)) : 0,
    maxHpBonus: def.maxHpBonus ? Math.round(def.maxHpBonus * mult) : 0,
    lifestealBonus: def.lifestealBonus ? Number((def.lifestealBonus * mult).toFixed(3)) : 0,
  };
}

export function formatRunItemStatSummary(
  itemId: RunItemId,
  level = 1,
  language: LanguageCode = 'id'
): string {
  const scaled = getRunItemScaledBonuses(itemId, level);
  const parts: string[] = [];
  if (scaled.grantsDoubleJump) parts.push('Double Jump');
  if (scaled.atkBonus > 0) parts.push(`+${scaled.atkBonus} ATK`);
  if (scaled.maxHpBonus > 0) parts.push(`+${scaled.maxHpBonus} HP`);
  if (scaled.moveSpeedBonus > 0) {
    parts.push(`+${Math.round(scaled.moveSpeedBonus * 100)}% ${language === 'en' ? 'SPD' : 'SPD'}`);
  }
  if (scaled.critBonus > 0) parts.push(`+${Math.round(scaled.critBonus * 100)}% Crit`);
  if (scaled.skillDmgBonus > 0) parts.push(`+${Math.round(scaled.skillDmgBonus * 100)}% Skill`);
  if (scaled.lifestealBonus > 0) parts.push(`+${Math.round(scaled.lifestealBonus * 100)}% Drain`);
  return parts.join(' · ');
}

export function getSubSkillScaledStats(
  skillId: SubSkillId,
  level = 1
): { cooldown: number; range: number; damageMult: number } {
  const def = SUB_SKILLS[skillId];
  const lv = Math.max(1, Math.min(MAX_SUB_SKILL_LEVEL, Math.round(level)));
  const cdMult = lv === 1 ? 1 : lv === 2 ? 0.88 : 0.76;
  const dmgMult = lv === 1 ? 1 : lv === 2 ? 1.24 : 1.48;
  const rangeAdd = lv === 1 ? 0 : lv === 2 ? 32 : 68;
  return {
    cooldown: Number((def.cooldown * cdMult).toFixed(1)),
    range: def.range + rangeAdd,
    damageMult: dmgMult,
  };
}

export function formatSubSkillStatSummary(
  skillId: SubSkillId,
  level = 1,
  language: LanguageCode = 'id'
): string {
  const def = SUB_SKILLS[skillId];
  const stats = getSubSkillScaledStats(skillId, level);
  const dmgPct = Math.round(def.basePower * stats.damageMult * 100);
  const elMap: Record<SubSkillDef['element'], [string, string]> = {
    burn: ['Api', 'Burn'],
    freeze: ['Beku', 'Freeze'],
    poison: ['Racun', 'Poison'],
    shadow: ['Bayangan', 'Shadow'],
    blood: ['Darah', 'Blood'],
    thunder: ['Petir', 'Thunder'],
  };
  const pair = elMap[def.element] ?? ['Racun', 'Poison'];
  const el = language === 'en' ? pair[1] : pair[0];
  return `${el} · ${dmgPct}% ATK · CD ${stats.cooldown}s`;
}

export function computeRunItemBonuses(inventory: RunInventoryEntry[]): RunItemBonuses {
  const activeSynergies = computeActiveSynergies(inventory);
  const result: RunItemBonuses = {
    hasDoubleJump: false,
    moveSpeedBonus: 0,
    atkBonus: 0,
    critBonus: 0,
    skillDmgBonus: 0,
    maxHpBonus: 0,
    lifestealBonus: 0,
    activeSynergies,
  };
  for (const entry of inventory) {
    const scaled = getRunItemScaledBonuses(entry.id, entry.level ?? 1);
    if (scaled.grantsDoubleJump) result.hasDoubleJump = true;
    result.moveSpeedBonus += scaled.moveSpeedBonus;
    result.atkBonus += scaled.atkBonus;
    result.critBonus += scaled.critBonus;
    result.skillDmgBonus += scaled.skillDmgBonus;
    result.maxHpBonus += scaled.maxHpBonus;
    result.lifestealBonus += scaled.lifestealBonus;
  }
  for (const syn of activeSynergies) {
    result.moveSpeedBonus += syn.moveSpeedBonus ?? 0;
    result.atkBonus += syn.atkBonus ?? 0;
    result.critBonus += syn.critBonus ?? 0;
    result.skillDmgBonus += syn.skillDmgBonus ?? 0;
    result.maxHpBonus += syn.maxHpBonus ?? 0;
    result.lifestealBonus += syn.lifestealBonus ?? 0;
  }
  return result;
}

export function rollOrangeChestItem(
  currentInventory: RunInventoryEntry[],
  rng: () => number = Math.random
): RunItemDef {
  const hasDoubleJump = currentInventory.some((i) => i.id === 'boots_double_jump');
  if (!hasDoubleJump && rng() < 0.36) {
    return RUN_ITEMS.boots_double_jump;
  }
  const pickedId = ALL_RUN_ITEM_IDS[Math.floor(rng() * ALL_RUN_ITEM_IDS.length) % ALL_RUN_ITEM_IDS.length];
  return RUN_ITEMS[pickedId];
}

// Opens an Orange Supply Chest -> presents strictly 4 choices (1 random Heal 1%-45% Max HP + 3 distinct Accessories/Boots), pick 1!
export function rollDungeonChestOffer(
  currentInventory: RunInventoryEntry[],
  maxHp: number,
  rng: () => number = Math.random
): ChestChoiceOption[] {
  const options: ChestChoiceOption[] = [];
  const levelMap: Partial<Record<RunItemId, number>> = {};
  for (const entry of currentInventory) {
    levelMap[entry.id] = Math.max(levelMap[entry.id] ?? 0, entry.level ?? 1);
  }

  // Strictly 1 Heal choice (1% to 45% of Max HP)
  const healPct = rollSupplyChestHealPct(rng);
  const healAmount = Math.max(1, Math.round(maxHp * healPct));
  const pctLabel = Math.max(1, Math.min(45, Math.round(healPct * 100)));
  options.push({
    uid: `chest_heal_0_${Math.floor(rng() * 1e6)}`,
    kind: 'heal',
    title: `Ramuan Pemulihan (${pctLabel}%)`,
    subtitle: `Pulihkan +${healAmount} HP (${pctLabel}% Max HP) seketika.`,
    statSummary: `+${healAmount} HP (${pctLabel}% Max)`,
    accentHex: '#4ADE80',
    healPct,
    healAmount,
  });

  // Strictly 3 distinct Accessory/Boots choices (skipping MAX Lv.3 items unless pool < 3)
  const usedItemIds = new Set<RunItemId>();
  const nonMaxedPool = ALL_RUN_ITEM_IDS.filter((id) => (levelMap[id] ?? 0) < MAX_RUN_ITEM_LEVEL);
  const candidatePool = nonMaxedPool.length >= 3 ? nonMaxedPool : ALL_RUN_ITEM_IDS;
  const hasDoubleJump = (levelMap.boots_double_jump ?? 0) > 0;
  const shuffledPool = [...candidatePool].sort(() => rng() - 0.5);

  const pushItemOption = (itemId: RunItemId, suffix: string) => {
    const def = RUN_ITEMS[itemId];
    const currentLevel = levelMap[itemId] ?? 0;
    const isMaxed = currentLevel >= MAX_RUN_ITEM_LEVEL;
    const nextLevel = Math.min(MAX_RUN_ITEM_LEVEL, currentLevel + 1);
    const isUpgrade = currentLevel > 0 && !isMaxed;
    usedItemIds.add(itemId);
    options.push({
      uid: `chest_item_${suffix}_${Math.floor(rng() * 1e6)}`,
      kind: 'item',
      title: def.name,
      subtitle: def.description,
      statSummary: formatRunItemStatSummary(itemId, isUpgrade ? nextLevel : Math.max(1, currentLevel)),
      accentHex: def.accentHex,
      itemId,
      currentLevel,
      nextLevel,
      isUpgrade,
      isMaxed,
      itemDef: def,
    });
  };

  if (!hasDoubleJump && rng() < 0.45 && options.length < 4 && !usedItemIds.has('boots_double_jump')) {
    pushItemOption('boots_double_jump', 'dj');
  }

  for (const itemId of shuffledPool) {
    if (options.length >= 4) break;
    if (usedItemIds.has(itemId)) continue;
    pushItemOption(itemId, itemId);
  }

  return options.slice(0, 4);
}

export function addRunInventoryItem(
  inventory: RunInventoryEntry[],
  itemId: RunItemId,
  uid: string
): {
  next: RunInventoryEntry[];
  added: boolean;
  upgraded: boolean;
  maxed: boolean;
  newLevel: number;
} {
  const existingIdx = inventory.findIndex((item) => item.id === itemId);
  if (existingIdx >= 0) {
    const currentLv = Math.max(1, inventory[existingIdx].level ?? 1);
    if (currentLv >= MAX_RUN_ITEM_LEVEL) {
      return {
        next: inventory,
        added: false,
        upgraded: false,
        maxed: true,
        newLevel: MAX_RUN_ITEM_LEVEL,
      };
    }
    const nextLv = currentLv + 1;
    const next = inventory.map((entry, idx) =>
      idx === existingIdx ? { ...entry, level: nextLv } : entry
    );
    return {
      next,
      added: true,
      upgraded: true,
      maxed: false,
      newLevel: nextLv,
    };
  }

  if (inventory.length >= MAX_RUN_INVENTORY) {
    return { next: inventory, added: false, upgraded: false, maxed: false, newLevel: 1 };
  }
  return {
    next: [...inventory, { uid, id: itemId, level: 1 }],
    added: true,
    upgraded: false,
    maxed: false,
    newLevel: 1,
  };
}

export function removeRunInventoryItem(
  inventory: RunInventoryEntry[],
  uid: string
): RunInventoryEntry[] {
  return inventory.filter((item) => item.uid !== uid);
}

export function isSubSkillId(id: string): id is SubSkillId {
  return id in SUB_SKILLS;
}

export function getSkillDef(id: AnySkillId): ActiveSkillDef | SubSkillDef {
  if (isSubSkillId(id)) {
    return SUB_SKILLS[id];
  }
  return ACTIVE_SKILLS[id];
}

export const PASSIVE_TREE: PassiveNodeDef[] = [
  {
    id: 'demon_vigor',
    name: 'Darah Iblis Abadi',
    branch: 'Demon Blood',
    description: 'Meningkatkan Max HP dan ketahanan terhadap serangan bos.',
    maxLevel: 8,
    costPerLevel: 15,
    effectLabel: (lv) => `+${lv * 35} Max HP`,
  },
  {
    id: 'horn_resonance',
    name: 'Resonansi Kristal Tanduk',
    branch: 'Demon Blood',
    description: 'Mempercepat regenerasi MP serta memperkuat Damage Skill aktif.',
    maxLevel: 8,
    costPerLevel: 18,
    effectLabel: (lv) => `+${lv * 8}% Skill DMG & +${(lv * 0.6).toFixed(1)} MP/s`,
  },
  {
    id: 'twin_precision',
    name: 'Ketajaman Dual Blade',
    branch: 'Twin Blade',
    description: 'Meningkatkan Base Attack dan peluang Critical Hit tebasan.',
    maxLevel: 10,
    costPerLevel: 14,
    effectLabel: (lv) => `+${lv * 5} ATK · +${lv * 2}% Crit`,
  },
  {
    id: 'abyss_haste',
    name: 'Langkah Sayap Gelap',
    branch: 'Twin Blade',
    description: 'Mempercepat gerakan, serangan, dan mengurangi cooldown skill.',
    maxLevel: 6,
    costPerLevel: 20,
    effectLabel: (lv) => `+${lv * 4}% Speed · -${lv * 4}% CD`,
  },
  {
    id: 'shadow_leech',
    name: 'Hisapan Jiwa Katedral',
    branch: 'Abyssal Void',
    description: 'Memulihkan HP setiap kali mengalahkan monster di dungeon.',
    maxLevel: 6,
    costPerLevel: 18,
    effectLabel: (lv) => `+${lv * 6} HP per Kill`,
  },
  {
    id: 'fatal_surge',
    name: 'Ledakan Crit Amethyst',
    branch: 'Abyssal Void',
    description: 'Meningkatkan pengali Critical Damage.',
    maxLevel: 8,
    costPerLevel: 22,
    effectLabel: (lv) => `+${lv * 12}% Crit DMG`,
  },
];

export const STAGE_TITLES: string[] = [
  'Reruntuhan Lumut Slime',
  'Perkemahan Perang Goblin',
  'Katedral Besi Hitam',
  'Kripta Jaring & Kelelawar',
  'Palung Laut Siren',
  'Kuil Giok Manusia Ular',
  'Kawah Magma Lizar',
  'Balairung Titan Granit',
  'Kaldera Api Naga',
  'Takhta Langit Sang GOD',
];

export const STAGE_BOSS_NAMES: string[] = [
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
];

export const STAGE_BGM_NAMES: string[] = [
  'Reruntuhan Lumut Slime (Stage 1)',
  'Genderang Perkemahan Goblin (Stage 2)',
  'Orgel Katedral Besi (Stage 3)',
  'Kripta Jaring Kelam (Stage 4)',
  'Nyanyian Palung Siren (Stage 5)',
  'Seruling Kuil Ular (Stage 6)',
  'Dentuman Kawah Lizar (Stage 7)',
  'Gema Monolit Golem (Stage 8)',
  'Amukan Kaldera Naga (Stage 9)',
  'Simfoni Takhta GOD (Stage 10)',
];

export interface StageThemePalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  pillarDark: string;
  pillarMid: string;
  pillarHighlight: string;
  windowOuter: string;
  windowGlow: string;
  floorDeep: string;
  floorMid: string;
  floorTop: string;
  platformBase: string;
  platformTop: string;
  upperPlatformTop: string;
  accentHex: string;
  torchOuter: string;
  torchInner: string;
  motif:
    | 'slime_ruins'
    | 'goblin_camp'
    | 'iron_cathedral'
    | 'spider_crypt'
    | 'siren_ocean'
    | 'serpent_temple'
    | 'magma_cavern'
    | 'granite_hall'
    | 'dragon_caldera'
    | 'celestial_god';
}

export const STAGE_THEMES: StageThemePalette[] = [
  {
    skyTop: '#081510',
    skyMid: '#12291F',
    skyBottom: '#0A1611',
    pillarDark: '#13261C',
    pillarMid: '#1F3A2B',
    pillarHighlight: '#2D523E',
    windowOuter: '#14291E',
    windowGlow: '#22C55E',
    floorDeep: '#0B1710',
    floorMid: '#1C3526',
    floorTop: '#4ADE80',
    platformBase: '#16281E',
    platformTop: '#3B6E4E',
    upperPlatformTop: '#4ADE80',
    accentHex: '#4ADE80',
    torchOuter: '#16A34A',
    torchInner: '#BBF7D0',
    motif: 'slime_ruins',
  },
  {
    skyTop: '#160E09',
    skyMid: '#291911',
    skyBottom: '#140C08',
    pillarDark: '#2A1810',
    pillarMid: '#422618',
    pillarHighlight: '#6B3E26',
    windowOuter: '#29170F',
    windowGlow: '#F97316',
    floorDeep: '#180F0A',
    floorMid: '#362115',
    floorTop: '#9A6B47',
    platformBase: '#2A1A11',
    platformTop: '#7C4D2B',
    upperPlatformTop: '#F59E0B',
    accentHex: '#F59E0B',
    torchOuter: '#EA580C',
    torchInner: '#FEF08A',
    motif: 'goblin_camp',
  },
  {
    skyTop: '#0B0D16',
    skyMid: '#171C2B',
    skyBottom: '#0F111A',
    pillarDark: '#151824',
    pillarMid: '#23283A',
    pillarHighlight: '#3B425E',
    windowOuter: '#171B2A',
    windowGlow: '#DC2626',
    floorDeep: '#0F111A',
    floorMid: '#262B3D',
    floorTop: '#64748B',
    platformBase: '#191C28',
    platformTop: '#475569',
    upperPlatformTop: '#94A3B8',
    accentHex: '#EF4444',
    torchOuter: '#B91C1C',
    torchInner: '#FCA5A5',
    motif: 'iron_cathedral',
  },
  {
    skyTop: '#11081C',
    skyMid: '#221036',
    skyBottom: '#0F0917',
    pillarDark: '#1B0E2A',
    pillarMid: '#2D1847',
    pillarHighlight: '#4C2875',
    windowOuter: '#1D102E',
    windowGlow: '#A855F7',
    floorDeep: '#120A1D',
    floorMid: '#281640',
    floorTop: '#9333EA',
    platformBase: '#1C102E',
    platformTop: '#581C87',
    upperPlatformTop: '#C084FC',
    accentHex: '#C084FC',
    torchOuter: '#9333EA',
    torchInner: '#F3E8FF',
    motif: 'spider_crypt',
  },
  {
    skyTop: '#05141F',
    skyMid: '#0A2B3D',
    skyBottom: '#071B27',
    pillarDark: '#0A2533',
    pillarMid: '#124057',
    pillarHighlight: '#1E6685',
    windowOuter: '#0A2A3B',
    windowGlow: '#2DD4BF',
    floorDeep: '#071B26',
    floorMid: '#113A4E',
    floorTop: '#2DD4BF',
    platformBase: '#0C2C3D',
    platformTop: '#14B8A6',
    upperPlatformTop: '#5EEAD4',
    accentHex: '#2DD4BF',
    torchOuter: '#0EA5E9',
    torchInner: '#E0F2FE',
    motif: 'siren_ocean',
  },
  {
    skyTop: '#0A170E',
    skyMid: '#142E1D',
    skyBottom: '#0A150D',
    pillarDark: '#152B1B',
    pillarMid: '#21452B',
    pillarHighlight: '#366E44',
    windowOuter: '#162C1C',
    windowGlow: '#10B981',
    floorDeep: '#0D1B11',
    floorMid: '#1F3D27',
    floorTop: '#EAB308',
    platformBase: '#162D1D',
    platformTop: '#2E613C',
    upperPlatformTop: '#FACC15',
    accentHex: '#34D399',
    torchOuter: '#059669',
    torchInner: '#A7F3D0',
    motif: 'serpent_temple',
  },
  {
    skyTop: '#1A0805',
    skyMid: '#36130A',
    skyBottom: '#1C0906',
    pillarDark: '#26100C',
    pillarMid: '#3D1A12',
    pillarHighlight: '#6B2C1B',
    windowOuter: '#2B110B',
    windowGlow: '#F97316',
    floorDeep: '#1B0A07',
    floorMid: '#3B1810',
    floorTop: '#F97316',
    platformBase: '#29120D',
    platformTop: '#9A3412',
    upperPlatformTop: '#FB923C',
    accentHex: '#FB923C',
    torchOuter: '#EA580C',
    torchInner: '#FEF08A',
    motif: 'magma_cavern',
  },
  {
    skyTop: '#0F111A',
    skyMid: '#1E2233',
    skyBottom: '#121520',
    pillarDark: '#1D2130',
    pillarMid: '#31374F',
    pillarHighlight: '#4E577A',
    windowOuter: '#202536',
    windowGlow: '#A855F7',
    floorDeep: '#151824',
    floorMid: '#2E344A',
    floorTop: '#94A3B8',
    platformBase: '#1E2232',
    platformTop: '#475569',
    upperPlatformTop: '#C084FC',
    accentHex: '#A78BFA',
    torchOuter: '#7C3AED',
    torchInner: '#DDD6FE',
    motif: 'granite_hall',
  },
  {
    skyTop: '#1E0406',
    skyMid: '#3F0A0F',
    skyBottom: '#1B0507',
    pillarDark: '#2B090C',
    pillarMid: '#4A1016',
    pillarHighlight: '#7F1D1D',
    windowOuter: '#2E0A0E',
    windowGlow: '#EF4444',
    floorDeep: '#1A0608',
    floorMid: '#450A0A',
    floorTop: '#EF4444',
    platformBase: '#2E0B0E',
    platformTop: '#B91C1C',
    upperPlatformTop: '#FACC15',
    accentHex: '#F87171',
    torchOuter: '#DC2626',
    torchInner: '#FEF08A',
    motif: 'dragon_caldera',
  },
  {
    skyTop: '#120F29',
    skyMid: '#241F52',
    skyBottom: '#13102B',
    pillarDark: '#1E1A40',
    pillarMid: '#37306B',
    pillarHighlight: '#6359A8',
    windowOuter: '#25204D',
    windowGlow: '#FACC15',
    floorDeep: '#161233',
    floorMid: '#2E2861',
    floorTop: '#FACC15',
    platformBase: '#221E4A',
    platformTop: '#B09567',
    upperPlatformTop: '#FDE047',
    accentHex: '#FDE047',
    torchOuter: '#EAB308',
    torchInner: '#FFFFFF',
    motif: 'celestial_god',
  },
];

export function getStageTheme(stage: number): StageThemePalette {
  const idx = Math.max(0, Math.min(STAGE_THEMES.length - 1, Math.floor(stage) - 1));
  return STAGE_THEMES[idx];
}

export function getForgeCost(currentLevel: number): { gold: number; shards: number } {
  return {
    gold: 250 + currentLevel * 180,
    shards: 8 + currentLevel * 6,
  };
}

export function forgeWeapon(save: SaveData): SaveData {
  if (save.selectedCharacter === 'luna') {
    const lv = save.lunaWeapon?.forgeLevel ?? 0;
    if (lv >= 10) {
      throw new Error('Sabit Luna sudah mencapai level maksimal (+10).');
    }
    const cost = getForgeCost(lv);
    if (save.gold < cost.gold || save.forgeShards < cost.shards) {
      throw new Error('Gold atau Forge Shards tidak mencukupi.');
    }
    const nextLevel = lv + 1;
    const nextLunaUnlocked = [...(save.unlockedLunaWeapons ?? ['umbral_crescent_scythe'])];
    if (nextLevel >= 2 && !nextLunaUnlocked.includes('crimson_reaper_scythe')) {
      nextLunaUnlocked.push('crimson_reaper_scythe');
    }
    if (nextLevel >= 3 && !nextLunaUnlocked.includes('astral_eclipse_scythe')) {
      nextLunaUnlocked.push('astral_eclipse_scythe');
    }
    if (nextLevel >= 5 && !nextLunaUnlocked.includes('void_cosmos_scythe')) {
      nextLunaUnlocked.push('void_cosmos_scythe');
    }
    return {
      ...save,
      gold: save.gold - cost.gold,
      forgeShards: save.forgeShards - cost.shards,
      unlockedLunaWeapons: nextLunaUnlocked,
      lunaWeapon: {
        ...(save.lunaWeapon ?? { style: 'umbral_crescent_scythe', forgeLevel: 0 }),
        forgeLevel: nextLevel,
      },
    };
  }

  if (save.selectedCharacter === 'witch') {
    const lv = save.witchWeapon?.forgeLevel ?? 0;
    if (lv >= 10) {
      throw new Error('Tongkat Seraphina sudah mencapai level maksimal (+10).');
    }
    const cost = getForgeCost(lv);
    if (save.gold < cost.gold || save.forgeShards < cost.shards) {
      throw new Error('Gold atau Forge Shards tidak mencukupi.');
    }
    const nextLevel = lv + 1;
    const nextWitchUnlocked = [...(save.unlockedWitchWeapons ?? ['raven_gnarled_staff'])];
    if (nextLevel >= 2 && !nextWitchUnlocked.includes('amethyst_lantern_rod')) {
      nextWitchUnlocked.push('amethyst_lantern_rod');
    }
    if (nextLevel >= 3 && !nextWitchUnlocked.includes('astral_crow_scepter')) {
      nextWitchUnlocked.push('astral_crow_scepter');
    }
    if (nextLevel >= 5 && !nextWitchUnlocked.includes('eclipse_grimoire_staff')) {
      nextWitchUnlocked.push('eclipse_grimoire_staff');
    }
    return {
      ...save,
      gold: save.gold - cost.gold,
      forgeShards: save.forgeShards - cost.shards,
      unlockedWitchWeapons: nextWitchUnlocked,
      witchWeapon: {
        ...(save.witchWeapon ?? { style: 'raven_gnarled_staff', forgeLevel: 0 }),
        forgeLevel: nextLevel,
      },
    };
  }

  if (save.selectedCharacter === 'lyra') {
    const lv = save.lyraWeapon?.forgeLevel ?? 0;
    if (lv >= 10) {
      throw new Error('Senjata Lyra sudah mencapai level maksimal (+10).');
    }
    const cost = getForgeCost(lv);
    if (save.gold < cost.gold || save.forgeShards < cost.shards) {
      throw new Error('Gold atau Forge Shards tidak mencukupi.');
    }
    const nextLevel = lv + 1;
    const nextLyraUnlocked = [...(save.unlockedLyraWeapons ?? ['iron_knuckle'])];
    if (nextLevel >= 2 && !nextLyraUnlocked.includes('crimson_wraps')) {
      nextLyraUnlocked.push('crimson_wraps');
    }
    if (nextLevel >= 3 && !nextLyraUnlocked.includes('golden_cestus')) {
      nextLyraUnlocked.push('golden_cestus');
    }
    if (nextLevel >= 5 && !nextLyraUnlocked.includes('abyss_greaves')) {
      nextLyraUnlocked.push('abyss_greaves');
    }
    return {
      ...save,
      gold: save.gold - cost.gold,
      forgeShards: save.forgeShards - cost.shards,
      unlockedLyraWeapons: nextLyraUnlocked,
      lyraWeapon: {
        ...(save.lyraWeapon ?? { style: 'iron_knuckle', forgeLevel: 0 }),
        forgeLevel: nextLevel,
      },
    };
  }

  if (save.weapon.forgeLevel >= 10) {
    throw new Error('Senjata sudah mencapai level maksimal (+10).');
  }
  const cost = getForgeCost(save.weapon.forgeLevel);
  if (save.gold < cost.gold || save.forgeShards < cost.shards) {
    throw new Error('Gold atau Forge Shards tidak mencukupi.');
  }

  const nextLevel = save.weapon.forgeLevel + 1;
  const nextStyles = [...save.unlockedBladeStyles];
  if (nextLevel >= 2 && !nextStyles.includes('amethyst_crescent')) {
    nextStyles.push('amethyst_crescent');
  }
  if (nextLevel >= 3 && !nextStyles.includes('obsidian_claw')) {
    nextStyles.push('obsidian_claw');
  }
  if (nextLevel >= 5 && !nextStyles.includes('eclipse_edge')) {
    nextStyles.push('eclipse_edge');
  }

  return {
    ...save,
    gold: save.gold - cost.gold,
    forgeShards: save.forgeShards - cost.shards,
    unlockedBladeStyles: nextStyles,
    weapon: {
      ...save.weapon,
      forgeLevel: nextLevel,
    },
  };
}

export function purchaseWeaponSkin(
  save: SaveData,
  charId: CharacterId,
  weaponId: ScytheWeaponId | BladeStyleId | LyraWeaponId | WitchWeaponId
): SaveData {
  if (charId === 'luna') {
    const id = weaponId as ScytheWeaponId;
    const def = LUNA_SCYTHE_STYLES[id];
    if (!def) throw new Error('Sabit Luna tidak ditemukan.');
    const unlocked = save.unlockedLunaWeapons ?? ['umbral_crescent_scythe'];
    if (unlocked.includes(id)) {
      return {
        ...save,
        lunaWeapon: { ...(save.lunaWeapon ?? { style: 'umbral_crescent_scythe', forgeLevel: 0 }), style: id },
      };
    }
    if (save.gold < def.shopPrice) {
      throw new Error('Gold tidak mencukupi untuk membeli Sabit ini.');
    }
    return {
      ...save,
      gold: save.gold - def.shopPrice,
      unlockedLunaWeapons: [...unlocked, id],
      lunaWeapon: { ...(save.lunaWeapon ?? { style: 'umbral_crescent_scythe', forgeLevel: 0 }), style: id },
    };
  }

  if (charId === 'velvera') {
    const id = weaponId as BladeStyleId;
    const def = BLADE_STYLES[id];
    if (!def) throw new Error('Skin Dual Blade tidak ditemukan.');
    if (save.unlockedBladeStyles.includes(id)) {
      return { ...save, weapon: { ...save.weapon, style: id } };
    }
    if (save.gold < def.shopPrice) {
      throw new Error('Gold tidak mencukupi untuk membeli Dual Blade ini.');
    }
    return {
      ...save,
      gold: save.gold - def.shopPrice,
      unlockedBladeStyles: [...save.unlockedBladeStyles, id],
      weapon: { ...save.weapon, style: id },
    };
  }

  if (charId === 'witch') {
    const id = weaponId as WitchWeaponId;
    const def = WITCH_WEAPON_STYLES[id];
    if (!def) throw new Error('Tongkat Sihir tidak ditemukan.');
    const unlocked = save.unlockedWitchWeapons ?? ['raven_gnarled_staff'];
    if (unlocked.includes(id)) {
      return {
        ...save,
        witchWeapon: { ...(save.witchWeapon ?? { style: 'raven_gnarled_staff', forgeLevel: 0 }), style: id },
      };
    }
    if (save.gold < def.shopPrice) {
      throw new Error('Gold tidak mencukupi untuk membeli Tongkat Sihir ini.');
    }
    return {
      ...save,
      gold: save.gold - def.shopPrice,
      unlockedWitchWeapons: [...unlocked, id],
      witchWeapon: { ...(save.witchWeapon ?? { style: 'raven_gnarled_staff', forgeLevel: 0 }), style: id },
    };
  }

  const id = weaponId as LyraWeaponId;
  const def = LYRA_WEAPON_STYLES[id];
  if (!def) throw new Error('Skin Senjata Tangan & Kaki tidak ditemukan.');
  const unlocked = save.unlockedLyraWeapons ?? ['iron_knuckle'];
  if (unlocked.includes(id)) {
    return {
      ...save,
      lyraWeapon: { ...(save.lyraWeapon ?? { style: 'iron_knuckle', forgeLevel: 0 }), style: id },
    };
  }
  if (save.gold < def.shopPrice) {
    throw new Error('Gold tidak mencukupi untuk membeli Gauntlet & Greaves ini.');
  }
  return {
    ...save,
    gold: save.gold - def.shopPrice,
    unlockedLyraWeapons: [...unlocked, id],
    lyraWeapon: { ...(save.lyraWeapon ?? { style: 'iron_knuckle', forgeLevel: 0 }), style: id },
  };
}

export function getActiveSkillUpgradeCost(currentLevel: number): { gold: number; essence: number } {
  const lv = Math.max(0, currentLevel);
  return {
    gold: 160 + lv * 130,
    essence: 10 + lv * 7,
  };
}

export function upgradeCharacterActiveSkill(save: SaveData, skillId: ActiveSkillId): SaveData {
  const def = ACTIVE_SKILLS[skillId];
  if (!def) throw new Error('Skill karakter tidak ditemukan.');
  const currentLv = save.skillLevels[skillId] ?? 0;
  if (currentLv >= MAX_ACTIVE_SKILL_LEVEL) {
    throw new Error(`Skill sudah mencapai level maksimal (Lv.${MAX_ACTIVE_SKILL_LEVEL}).`);
  }
  const cost = getActiveSkillUpgradeCost(currentLv);
  if (save.gold < cost.gold || save.skillEssence < cost.essence) {
    throw new Error('Gold atau Skill Essence tidak mencukupi.');
  }
  return {
    ...save,
    gold: save.gold - cost.gold,
    skillEssence: save.skillEssence - cost.essence,
    skillLevels: {
      ...save.skillLevels,
      [skillId]: currentLv + 1,
    },
  };
}

export function upgradePassiveNode(save: SaveData, nodeId: PassiveNodeId): SaveData {
  const def = PASSIVE_TREE.find((n) => n.id === nodeId);
  if (!def) throw new Error('Node skill pasif tidak ditemukan.');
  const currentLv = save.passiveLevels[nodeId] ?? 0;
  if (currentLv >= def.maxLevel) {
    throw new Error('Skill pasif sudah maksimal.');
  }
  const cost = def.costPerLevel + currentLv * 6;
  if (save.skillEssence < cost) {
    throw new Error('Skill Essence tidak mencukupi.');
  }
  return {
    ...save,
    skillEssence: save.skillEssence - cost,
    passiveLevels: {
      ...save.passiveLevels,
      [nodeId]: currentLv + 1,
    },
  };
}

export const BESTIARY_ENTRIES: BestiaryEntryDef[] = [
  {
    id: 'goblin',
    name: 'Goblin Penjarah',
    spawnRateLabel: '25% Spawn Rate',
    targetKills: 15,
    lore: 'Makhluk licik penghuni lorong bawah tanah katedral. Bergerak cepat dan melompat menerkam musuh yang lengah dengan belati berkarat.',
    rewardGems: 80,
    rewardGold: 500,
  },
  {
    id: 'skeleton',
    name: 'Skeleton Pemanah Tulang',
    spawnRateLabel: '25% Spawn Rate',
    targetKills: 15,
    lore: 'Prajurit tulang belulang yang dibangkitkan oleh kabut Abyssal. Menjaga jarak dan melemparkan tulang berputar ke arah penyusup.',
    rewardGems: 80,
    rewardGold: 500,
  },
  {
    id: 'kelalawar',
    name: 'Kelalawar Abyssal',
    spawnRateLabel: '25% Spawn Rate',
    targetKills: 15,
    lore: 'Kelelawar raksasa bermata merah yang berpatroli di langit-langit menara lonceng dan menembakkan laser energi merah ke mangsanya.',
    rewardGems: 80,
    rewardGold: 500,
  },
  {
    id: 'zombie_knight',
    name: 'Zombie Knight Terkutuk',
    spawnRateLabel: '25% Spawn Rate',
    targetKills: 15,
    lore: 'Bekas penjaga katedral berzirah besi berat dan perisai menara. Tahan terhadap dorongan ringan dan melancarkan hantaman tanah berdaya rusak tinggi.',
    rewardGems: 110,
    rewardGold: 800,
  },
];

export function getStageWeather(stage: number): {
  type: StageWeatherType;
  label: string;
} {
  if (stage <= 2) return { type: 'violet_embers', label: 'Bara Jatuh Katedral' };
  if (stage <= 4) return { type: 'ash_mist', label: 'Kabut Abu Obsidian' };
  if (stage <= 6) return { type: 'spectral_fog', label: 'Kabut Arwah Perak' };
  if (stage <= 8) return { type: 'amethyst_rain', label: 'Hujan Kristal Amethyst' };
  return { type: 'abyssal_storm', label: 'Badai Bara Abyssal' };
}

export function getCharacterUpgradeCost(level: number): { gold: number; essence: number } {
  return {
    gold: 180 + (level - 1) * 140,
    essence: 8 + (level - 1) * 5,
  };
}

export function upgradeCharacterLevel(save: SaveData): SaveData {
  if (save.characterLevel >= 50) {
    throw new Error('Level karakter sudah maksimal (Lv.50).');
  }
  const cost = getCharacterUpgradeCost(save.characterLevel);
  if (save.gold < cost.gold || save.skillEssence < cost.essence) {
    throw new Error('Gold atau Skill Essence tidak mencukupi.');
  }
  return {
    ...save,
    gold: save.gold - cost.gold,
    skillEssence: save.skillEssence - cost.essence,
    characterLevel: save.characterLevel + 1,
  };
}

export function claimBestiaryReward(save: SaveData, monsterId: MonsterType): SaveData {
  const entry = BESTIARY_ENTRIES.find((e) => e.id === monsterId);
  if (!entry) throw new Error('Entri Bestiary tidak ditemukan.');
  if (save.claimedBestiaryIds.includes(monsterId)) {
    throw new Error('Hadiah Bestiary untuk monster ini sudah diklaim.');
  }
  const kills = save.bestiaryKills[monsterId] ?? 0;
  if (kills < entry.targetKills) {
    throw new Error(`Kalahkan ${entry.targetKills} ${entry.name} terlebih dahulu.`);
  }
  return {
    ...save,
    gems: save.gems + entry.rewardGems,
    gold: save.gold + entry.rewardGold,
    claimedBestiaryIds: [...save.claimedBestiaryIds, monsterId],
  };
}

export function advanceSubStage(
  stage: number,
  subStage: number
): { nextStage: number; nextSubStage: number; dungeonCompleted: boolean } {
  if (subStage < 5) {
    return { nextStage: stage, nextSubStage: subStage + 1, dungeonCompleted: false };
  }
  if (stage < 10) {
    return { nextStage: stage + 1, nextSubStage: 1, dungeonCompleted: false };
  }
  return { nextStage: 10, nextSubStage: 5, dungeonCompleted: true };
}

export function rollPortalSide(rng: () => number = Math.random): 'left' | 'right' {
  return rng() < 0.5 ? 'left' : 'right';
}

export function rollPlayerSpawnX(arenaWidth: number, rng: () => number = Math.random): number {
  const safeMargin = 160;
  const usable = Math.max(200, arenaWidth - safeMargin * 2);
  return Math.round(safeMargin + rng() * usable);
}

export function generateRoomMonsters(
  stage: number,
  subStage: number,
  rng: () => number = Math.random
): MonsterType[] {
  const pool: MonsterType[] = ['goblin', 'skeleton', 'kelalawar', 'zombie_knight'];
  const count =
    subStage === 5
      ? 6
      : Math.min(35, 22 + Math.floor((stage - 1) * 1.2) + Math.floor(subStage * 1.1));
  const result: MonsterType[] = [];
  for (let i = 0; i < count; i++) {
    const pick = pool[Math.floor(rng() * pool.length) % pool.length];
    result.push(pick);
  }
  return result;
}

export function rollSupplyChestHealPct(rng: () => number = Math.random): number {
  return 0.01 + rng() * 0.44;
}

export interface BossBarState {
  hp: number;
  maxHp: number;
  barHp: number;
  barMaxHp: number;
  barsRemaining: number;
  totalBars: number;
}

export function computeBossBarState(
  hp: number,
  maxHp: number,
  totalBars = 5
): BossBarState {
  const safeMax = Math.max(1, maxHp);
  const safeTotal = Math.max(1, Math.round(totalBars));
  const perBar = safeMax / safeTotal;
  if (hp <= 0) {
    return {
      hp: 0,
      maxHp: safeMax,
      barHp: 0,
      barMaxHp: perBar,
      barsRemaining: 0,
      totalBars: safeTotal,
    };
  }
  const clampedHp = Math.min(safeMax, hp);
  const barsRemaining = Math.min(safeTotal, Math.max(1, Math.ceil(clampedHp / perBar)));
  const floorHp = (barsRemaining - 1) * perBar;
  const barHp = Math.max(0, Math.min(perBar, clampedHp - floorHp));
  return {
    hp: clampedHp,
    maxHp: safeMax,
    barHp,
    barMaxHp: perBar,
    barsRemaining,
    totalBars: safeTotal,
  };
}

export function shouldResetDummyMetrics(
  lastHitSec: number,
  nowSec: number,
  timeoutSec = 8
): boolean {
  return lastHitSec >= 0 && nowSec - lastHitSec >= timeoutSec;
}

export function replaceRunSubSkill(
  list: RunSubSkillEntry[],
  replaceIndex: number,
  newSkillId: SubSkillId,
  newLevel = 1
): RunSubSkillEntry[] {
  const clampedLv = Math.max(1, Math.min(MAX_SUB_SKILL_LEVEL, newLevel));
  if (replaceIndex < 0 || replaceIndex >= list.length) {
    if (list.length >= MAX_RUN_SUB_SKILLS) return list;
    return [...list, { id: newSkillId, level: clampedLv }];
  }
  return list.map((entry, idx) =>
    idx === replaceIndex ? { id: newSkillId, level: clampedLv } : entry
  );
}

export function getCharacterActiveSkills(characterId: CharacterId): ActiveSkillId[] {
  return (Object.keys(ACTIVE_SKILLS) as ActiveSkillId[]).filter(
    (id) => ACTIVE_SKILLS[id].owner === characterId
  );
}

export function addOrUpgradeRunSubSkill(
  list: RunSubSkillEntry[],
  skillId: SubSkillId,
  targetLevel?: number
): {
  next: RunSubSkillEntry[];
  added: boolean;
  upgraded: boolean;
  maxed: boolean;
  newLevel: number;
} {
  const idx = list.findIndex((s) => s.id === skillId);
  if (idx >= 0) {
    const cur = Math.max(1, list[idx].level);
    if (cur >= MAX_SUB_SKILL_LEVEL) {
      return {
        next: list,
        added: false,
        upgraded: false,
        maxed: true,
        newLevel: MAX_SUB_SKILL_LEVEL,
      };
    }
    const nextLv = Math.min(
      MAX_SUB_SKILL_LEVEL,
      Math.max(cur + 1, targetLevel ?? cur + 1)
    );
    return {
      next: list.map((s, i) => (i === idx ? { ...s, level: nextLv } : s)),
      added: true,
      upgraded: true,
      maxed: false,
      newLevel: nextLv,
    };
  }
  if (list.length >= MAX_RUN_SUB_SKILLS) {
    return { next: list, added: false, upgraded: false, maxed: false, newLevel: 1 };
  }
  const initLv = Math.max(1, Math.min(MAX_SUB_SKILL_LEVEL, targetLevel ?? 1));
  return {
    next: [...list, { id: skillId, level: initLv }],
    added: true,
    upgraded: false,
    maxed: false,
    newLevel: initLv,
  };
}

// Boss Chests & Ancient Tombs drop random stage-only Sub-Skills (Max 4 slots, Max Lv.3; duplicate levels up existing!).
export function rollBossChestSkill(
  runSubSkills: RunSubSkillEntry[],
  rng: () => number = Math.random
): { skillId: SubSkillId; newLevel: number; autoEquipped: boolean; needsSwap?: boolean; isSubSkill: true } {
  const levelMap: Partial<Record<SubSkillId, number>> = {};
  for (const s of runSubSkills) {
    levelMap[s.id] = s.level;
  }
  const hasFullSlots = runSubSkills.length >= MAX_RUN_SUB_SKILLS;
  const pool = hasFullSlots ? runSubSkills.map((s) => s.id) : ALL_SUB_SKILL_IDS;
  const upgradeable = pool.filter((id) => (levelMap[id] ?? 0) < MAX_SUB_SKILL_LEVEL);
  const candidates = upgradeable.length > 0 ? upgradeable : pool;
  const skillId = candidates[Math.floor(rng() * candidates.length) % candidates.length];
  const prevLv = levelMap[skillId] ?? 0;
  const newLevel = Math.min(MAX_SUB_SKILL_LEVEL, prevLv + 1);
  const autoEquipped = !runSubSkills.some((s) => s.id === skillId);
  return { skillId, newLevel, autoEquipped, needsSwap: false, isSubSkill: true };
}

export function rollTombActiveSkill(
  runSubSkills: RunSubSkillEntry[],
  rng: () => number = Math.random
): { skillId: SubSkillId; newLevel: number; autoEquipped: boolean; needsSwap: boolean; isSubSkill: true } {
  const levelMap: Partial<Record<SubSkillId, number>> = {};
  for (const s of runSubSkills) {
    levelMap[s.id] = s.level;
  }
  const hasFullSlots = runSubSkills.length >= MAX_RUN_SUB_SKILLS;
  const upgradeable = ALL_SUB_SKILL_IDS.filter((id) => (levelMap[id] ?? 0) < MAX_SUB_SKILL_LEVEL);
  const candidates = upgradeable.length > 0 ? upgradeable : ALL_SUB_SKILL_IDS;
  const skillId = candidates[Math.floor(rng() * candidates.length) % candidates.length];
  const prevLv = levelMap[skillId] ?? 0;
  const alreadyEquipped = skillId in levelMap;

  // Duplicate pickup ALWAYS levels up existing slot (Lv.1->2->3) even when 4/4 full!
  if (alreadyEquipped) {
    const newLevel = Math.min(MAX_SUB_SKILL_LEVEL, prevLv + 1);
    return {
      skillId,
      newLevel,
      autoEquipped: false,
      needsSwap: false,
      isSubSkill: true,
    };
  }

  if (hasFullSlots) {
    return {
      skillId,
      newLevel: 1,
      autoEquipped: false,
      needsSwap: true,
      isSubSkill: true,
    };
  }

  return {
    skillId,
    newLevel: 1,
    autoEquipped: true,
    needsSwap: false,
    isSubSkill: true,
  };
}

export const RUN_TEMP_BUFFS: Record<
  RunTempBuffId,
  { id: RunTempBuffId; name: string; roleLabel: string; description: string }
> = {
  run_atk_boost: {
    id: 'run_atk_boost',
    name: 'Berkah Amukan Darah',
    roleLabel: 'Buff Stage',
    description: 'Menambah +10% Attack selama sisa perjalanan dungeon ini.',
  },
  run_speed_boost: {
    id: 'run_speed_boost',
    name: 'Berkah Angin Bayangan',
    roleLabel: 'Buff Stage',
    description: 'Menambah +10% Kecepatan Serang & Gerak selama run ini.',
  },
  run_crit_boost: {
    id: 'run_crit_boost',
    name: 'Berkah Mata Iblis',
    roleLabel: 'Buff Stage',
    description: 'Menambah +8% Peluang Critical Hit selama run ini.',
  },
  run_hp_surge: {
    id: 'run_hp_surge',
    name: 'Berkah Pemulihan Suci',
    roleLabel: 'Heal + HP',
    description: 'Memulihkan 35% HP seketika dan menambah +20 Max HP selama run.',
  },
};

export function rollPostStageSkillDraft(
  save: SaveData,
  runSubSkills: RunSubSkillEntry[] = [],
  rng: () => number = Math.random
): SkillDraftOption[] {
  const options: SkillDraftOption[] = [];
  const usedKeys = new Set<string>();
  const subLevelMap: Partial<Record<SubSkillId, number>> = {};
  for (const s of runSubSkills) subLevelMap[s.id] = s.level;

  // 1. Sub-Skill option (stage-only, max 4 slots, up to Lv.3)
  const hasFullSlots = runSubSkills.length >= MAX_RUN_SUB_SKILLS;
  const subPool = hasFullSlots ? runSubSkills.map((s) => s.id) : ALL_SUB_SKILL_IDS;
  const shuffledSubs = [...subPool].sort(() => rng() - 0.5);
  for (const subId of shuffledSubs) {
    const prevLv = subLevelMap[subId] ?? 0;
    if (prevLv < MAX_SUB_SKILL_LEVEL) {
      const def = SUB_SKILLS[subId];
      usedKeys.add(`sub:${subId}`);
      options.push({
        kind: 'sub',
        id: subId,
        name: def.name,
        roleLabel: def.roleLabel,
        description: `${def.description} (Otomatis menyerang musuh di jangkauan)`,
        nextLevel: prevLv + 1,
      });
      break;
    }
  }

  // 2. Temporary Run Buff option
  const tempBuffIds = (Object.keys(RUN_TEMP_BUFFS) as RunTempBuffId[]).sort(() => rng() - 0.5);
  const pickedBuff = RUN_TEMP_BUFFS[tempBuffIds[0]];
  usedKeys.add(`temp_buff:${pickedBuff.id}`);
  options.push({
    kind: 'temp_buff',
    id: pickedBuff.id,
    name: pickedBuff.name,
    roleLabel: pickedBuff.roleLabel,
    description: pickedBuff.description,
    nextLevel: 1,
  });

  // 3. Passive Tree or Second Sub-Skill option
  const passiveDefs = PASSIVE_TREE.filter((n) => (save.passiveLevels[n.id] ?? 0) < n.maxLevel);
  const shuffledPassives = [...passiveDefs].sort(() => rng() - 0.5);
  if (shuffledPassives.length > 0) {
    const node = shuffledPassives[0];
    const nextLv = (save.passiveLevels[node.id] ?? 0) + 1;
    usedKeys.add(`passive:${node.id}`);
    options.push({
      kind: 'passive',
      id: node.id,
      name: node.name,
      roleLabel: 'Pasif',
      description: `${node.description} (${node.effectLabel(nextLv)})`,
      nextLevel: nextLv,
    });
  }

  for (const buffId of tempBuffIds) {
    if (options.length >= 3) break;
    if (usedKeys.has(`temp_buff:${buffId}`)) continue;
    const b = RUN_TEMP_BUFFS[buffId];
    usedKeys.add(`temp_buff:${buffId}`);
    options.push({
      kind: 'temp_buff',
      id: buffId,
      name: b.name,
      roleLabel: b.roleLabel,
      description: b.description,
      nextLevel: 1,
    });
  }

  return options.slice(0, 3);
}
