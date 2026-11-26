import type { LanguageCode, LobbyInteractableKind, RunItemDef, SubSkillDef } from './types';

export interface UiStrings {
  // Title Screen
  enterSanctum: string;
  startDungeon: string;
  selectCharacter: string;
  settings: string;
  // Lobby HUD
  lobbyStartDungeon: string;
  lobbyCharacterBtn: string;
  lobbyDailyBtn: string;
  lobbyEventBtn: string;
  lobbyGachaBtn: string;
  lobbySwitchCharBtn: string;
  lobbySettingBtn: string;
  lobbyInteractBtn: string;
  lobbyDummyLabel: string;
  lobbyDummyHit: string;
  lobbyDummyMax: string;
  lobbyDummyDps: string;
  lobbyNewTag: string;
  // Controls & Dungeon HUD
  attack: string;
  dash: string;
  jump: string;
  bag: string;
  autoOn: string;
  autoOff: string;
  doubleJumpBadge: string;
  enemiesCount: string;
  orangeChestLegend: string;
  tombLegend: string;
  portalLegend: string;
  bossBadge: string;
  bossLayerPrefix: string;
  // Stage Bag Modal (2 Categories)
  bagTitle: string;
  bagSubtitle: string;
  bagSubSkillCategory: string;
  bagItemCategory: string;
  bagSlotLabel: string;
  bagEmptyLabel: string;
  bagEmptySubSkillHint: string;
  bagEmptyItemHint: string;
  bagSelectPrompt: string;
  bagDiscardBtn: string;
  bagSwapBanner: string;
  bagSwapBtn: string;
  bagCancelSwapBtn: string;
  bagSynergyTitle: string;
  closeBtn: string;
  // Supply Chest Modal (4 Choices, Pick 1)
  chestModalTitle: string;
  chestModalSubtitle: string;
  chestHealBadge: string;
  chestItemBadge: string;
  chestPickBtn: string;
  chestSkipBtn: string;
  // Pause, Draft, Stage Select, End Run
  pauseTitle: string;
  pauseResume: string;
  pauseRestart: string;
  pauseSettings: string;
  pauseLobby: string;
  stageSelectTitle: string;
  stageSelectSubtitle: string;
  stageLabel: string;
  stageUnlocked: string;
  stageLocked: string;
  stageEnterBtn: string;
  draftTitle: string;
  draftSubtitle: string;
  draftSubSkillBadge: string;
  draftPassiveBadge: string;
  draftBuffBadge: string;
  bossChestModalTitle: string;
  bossChestModalSubtitle: string;
  tombModalTitle: string;
  tombModalSubtitle: string;
  continueNextStage: string;
  victoryTitle: string;
  defeatTitle: string;
  runStatsScore: string;
  runStatsKills: string;
  runStatsTime: string;
  runStatsRewards: string;
  returnLobbyBtn: string;
  retryStageBtn: string;
  // Settings Modal
  settingsTitle: string;
  settingsSubtitle: string;
  settingsLangTitle: string;
  settingsLangId: string;
  settingsLangEn: string;
  settingsAudioTitle: string;
  settingsMasterVol: string;
  settingsBgmVol: string;
  settingsSfxVol: string;
  settingsMuteAll: string;
  settingsUnmuteAll: string;
  settingsTestSfx: string;
  settingsMobileLayoutTitle: string;
  settingsMobileLayoutHint: string;
  settingsCustomButtonsBtn: string;
  settingsCustomButtonsTitle: string;
  settingsCustomButtonsHint: string;
  settingsOpacity: string;
  settingsSaveLayoutBtn: string;
  settingsResetDefault: string;
  settingsCancelBtn: string;
  bagSubSkillSwapBanner: string;
  bagCancelReturnBtn: string;
  settingsKeysTitle: string;
  settingsResetKeys: string;
  settingsPressKey: string;
  // Character / Weapon Modals
  sanctumTitle: string;
  sanctumTabCharacter: string;
  sanctumTabSkills: string;
  sanctumTabWeapon: string;
  sanctumTabGacha: string;
  sanctumTabBestiary: string;
  sanctumTabDaily: string;
  sanctumTabEvents: string;
  shopTitle: string;
  // Beta, Silver, White Cat NPC, Item+Sub-Skill Combos
  betaTag: string;
  silverLabel: string;
  catLegend: string;
  catShopTitle: string;
  catShopSubtitle: string;
  catShopEmpty: string;
  catShopBuyBtn: string;
  catShopSoldBadge: string;
  catShopSubSkillTag: string;
  catShopItemTag: string;
  bagComboPanelTitle: string;
  bagComboActiveBadge: string;
  bagComboLockedHint: string;
  // Daily Quests, Hero Lock, Per-button Customizer & Mobile Orientation
  dailyQuestsTitle: string;
  dailyQuestsSubtitle: string;
  dailyQuestClaimBtn: string;
  dailyQuestClaimedBadge: string;
  heroLockedBadge: string;
  heroUnlockGachaBtn: string;
  settingsButtonScale: string;
  settingsSelectedButton: string;
  settingsApplyAllOpacity: string;
  rotateDeviceTitle: string;
  rotateDeviceHint: string;
}

const ID_STRINGS: UiStrings = {
  enterSanctum: 'Masuk ke Lobi',
  startDungeon: 'Mulai Dungeon',
  selectCharacter: 'Pilih Karakter',
  settings: 'Pengaturan',
  lobbyStartDungeon: 'Mulai Dungeon',
  lobbyCharacterBtn: 'Karakter',
  lobbyDailyBtn: 'Harian',
  lobbyEventBtn: 'Event',
  lobbyGachaBtn: 'Gacha',
  lobbySwitchCharBtn: 'Ganti Hero',
  lobbySettingBtn: 'Setting',
  lobbyInteractBtn: 'Interaksi',
  lobbyDummyLabel: 'Orang Sawah',
  lobbyDummyHit: 'Hit',
  lobbyDummyMax: 'Max',
  lobbyDummyDps: 'DPS',
  lobbyNewTag: 'Baru',
  attack: 'Serang',
  dash: 'Dash',
  jump: 'Lompat',
  bag: 'Tas',
  autoOn: 'Auto: ON',
  autoOff: 'Auto: OFF',
  doubleJumpBadge: 'Double Jump',
  enemiesCount: 'Musuh',
  orangeChestLegend: 'Oranye',
  tombLegend: 'Makam',
  portalLegend: 'Portal',
  bossBadge: 'BOSS',
  bossLayerPrefix: 'Lapis',
  bagTitle: 'TAS STAGE',
  bagSubtitle: 'Kelola Sub-Skill (maks 4) & Item Peti Oranye (maks 5) selama run berlangsung.',
  bagSubSkillCategory: 'Kategori Sub-Skill',
  bagItemCategory: 'Kategori Item',
  bagSlotLabel: 'Slot',
  bagEmptyLabel: 'Kosong',
  bagEmptySubSkillHint: 'Diperoleh dari Peti Boss & Makam Kuno.',
  bagEmptyItemHint: 'Diperoleh dari Peti Oranye di arena.',
  bagSelectPrompt: 'Pilih salah satu kotak di atas untuk melihat ikon & detail lengkap.',
  bagDiscardBtn: 'Buang Item',
  bagSwapBanner: 'Tas Item penuh (5/5). Pilih 1 item di bawah untuk ditukar dengan:',
  bagSwapBtn: 'Tukar Slot Ini',
  bagCancelSwapBtn: 'Batal Tukar',
  bagSynergyTitle: 'Sinergi Aktif',
  closeBtn: 'Tutup',
  chestModalTitle: 'PETI PERBEKALAN',
  chestModalSubtitle: 'Pilih 1 dari 4 berkah peti untuk dibawa bertarung.',
  chestHealBadge: 'PEMULIHAN HP',
  chestItemBadge: 'AKSESORIS STAGE',
  chestPickBtn: 'Pilih Hadiah',
  chestSkipBtn: 'Tutup Peti',
  pauseTitle: 'GAME DIJEDA',
  pauseResume: 'Lanjut Main',
  pauseRestart: 'Ulang Stage',
  pauseSettings: 'Pengaturan',
  pauseLobby: 'Kembali ke Lobi',
  stageSelectTitle: 'PILIH STAGE DUNGEON',
  stageSelectSubtitle: 'Pilih tantangan Stage 1 sampai Stage 10 untuk dimasuki.',
  stageLabel: 'Stage',
  stageUnlocked: 'Terbuka',
  stageLocked: 'Terkunci',
  stageEnterBtn: 'Masuk Stage',
  draftTitle: 'PILIH BERKAH STAGE',
  draftSubtitle: 'Pilih 1 peningkatan untuk memperkuat pertarungan menuju ruangan berikutnya.',
  draftSubSkillBadge: 'Sub-Skill',
  draftPassiveBadge: 'Pasif Permanen',
  draftBuffBadge: 'Buff Run',
  bossChestModalTitle: 'PETI BOSS TERBUKA',
  bossChestModalSubtitle: 'Memperoleh Sub-Skill otomatis untuk membantu di dalam stage!',
  tombModalTitle: 'MAKAM KUNO TERUNGKAP',
  tombModalSubtitle: 'Energi kuno memberikan Sub-Skill baru ke dalam tas run.',
  continueNextStage: 'Lanjutkan',
  victoryTitle: 'DUNGEON DITAKLUKKAN',
  defeatTitle: 'TUMBANG DI DUNGEON',
  runStatsScore: 'Skor',
  runStatsKills: 'Monster Tumbang',
  runStatsTime: 'Waktu',
  runStatsRewards: 'Hadiah Diperoleh',
  returnLobbyBtn: 'Kembali ke Lobi',
  retryStageBtn: 'Coba Lagi',
  settingsTitle: 'PENGATURAN',
  settingsSubtitle: 'Atur bahasa, volume audio, tata letak tombol mobile & kontrol keyboard.',
  settingsLangTitle: 'Bahasa / Language',
  settingsLangId: 'Indonesia',
  settingsLangEn: 'English',
  settingsAudioTitle: 'Audio & Musik Stage 1–10',
  settingsMasterVol: 'Volume Utama',
  settingsBgmVol: 'Volume Musik (BGM)',
  settingsSfxVol: 'Volume Efek (SFX)',
  settingsMuteAll: 'Bisukan Semua',
  settingsUnmuteAll: 'Suara Aktif',
  settingsTestSfx: 'Tes SFX',
  settingsMobileLayoutTitle: 'Kostum Tombol Mobile',
  settingsMobileLayoutHint: 'Atur posisi tombol arah, skill, dash & lompat langsung di layar.',
  settingsCustomButtonsBtn: 'Kostum Tombol',
  settingsCustomButtonsTitle: 'KOSTUM TOMBOL · GESER BEBAS',
  settingsCustomButtonsHint: 'Tahan dan seret kelompok tombol (Arah, Skill 1–3, Dash / Lompat) ke posisi yang nyaman.',
  settingsOpacity: 'Transparansi Tombol',
  settingsSaveLayoutBtn: 'Simpan',
  settingsResetDefault: 'Reset',
  settingsCancelBtn: 'Batal / Kembali',
  bagSubSkillSwapBanner: 'Slot Sub-Skill penuh (4/4). Pilih 1 Sub-Skill untuk ditukar dengan:',
  bagCancelReturnBtn: 'Batal / Kembali',
  settingsKeysTitle: 'Kontrol Keyboard',
  settingsResetKeys: 'Reset Tombol',
  settingsPressKey: 'Tekan Tombol...',
  sanctumTitle: 'MENU KARAKTER & SANCTUM',
  sanctumTabCharacter: 'Karakter',
  sanctumTabSkills: 'Skill',
  sanctumTabWeapon: 'Senjata',
  sanctumTabGacha: 'Gacha',
  sanctumTabBestiary: 'Bestiary',
  sanctumTabDaily: 'Harian',
  sanctumTabEvents: 'Event',
  shopTitle: 'PEDAGANG SENJATA',
  betaTag: 'BETA',
  silverLabel: 'Silver',
  catLegend: 'Kucing',
  catShopTitle: 'TOKO KUCING PUTIH',
  catShopSubtitle: 'Pedagang misterius setiap 3 stage. Belanjakan Silver (reset ke 0 jika tumbang).',
  catShopEmpty: 'Semua penawaran Kucing Putih di ruangan ini sudah dibeli.',
  catShopBuyBtn: 'Beli',
  catShopSoldBadge: 'Terbeli',
  catShopSubSkillTag: 'SUB-SKILL',
  catShopItemTag: 'ITEM STAGE',
  bagComboPanelTitle: 'Combo Item & Sub-Skill',
  bagComboActiveBadge: 'AKTIF',
  bagComboLockedHint: 'Pasangkan Item & Sub-Skill cocok untuk efek ekstra',
  dailyQuestsTitle: 'Misi Harian (Reset Setiap Hari)',
  dailyQuestsSubtitle: 'Selesaikan misi di dungeon & gacha untuk klaim bonus Gems & Skill Essence.',
  dailyQuestClaimBtn: 'Klaim',
  dailyQuestClaimedBadge: 'Diklaim',
  heroLockedBadge: 'Terkunci · Gacha',
  heroUnlockGachaBtn: 'Buka di Gacha',
  settingsButtonScale: 'Ukuran Tombol',
  settingsSelectedButton: 'Tombol Dipilih',
  settingsApplyAllOpacity: 'Terapkan ke Semua',
  rotateDeviceTitle: 'Putar Perangkat ke Horizontal (Landscape)',
  rotateDeviceHint: 'Game aksi side-scrolling ini dirancang penuh untuk layar horizontal.',
};

const EN_STRINGS: UiStrings = {
  enterSanctum: 'Enter Lobby',
  startDungeon: 'Start Dungeon',
  selectCharacter: 'Select Hero',
  settings: 'Settings',
  lobbyStartDungeon: 'Start Dungeon',
  lobbyCharacterBtn: 'Character',
  lobbyDailyBtn: 'Daily',
  lobbyEventBtn: 'Events',
  lobbyGachaBtn: 'Gacha',
  lobbySwitchCharBtn: 'Switch Hero',
  lobbySettingBtn: 'Settings',
  lobbyInteractBtn: 'Interact',
  lobbyDummyLabel: 'Dummy',
  lobbyDummyHit: 'Hit',
  lobbyDummyMax: 'Max',
  lobbyDummyDps: 'DPS',
  lobbyNewTag: 'New',
  attack: 'Attack',
  dash: 'Dash',
  jump: 'Jump',
  bag: 'Bag',
  autoOn: 'Auto: ON',
  autoOff: 'Auto: OFF',
  doubleJumpBadge: 'Double Jump',
  enemiesCount: 'Enemies',
  orangeChestLegend: 'Chest',
  tombLegend: 'Tomb',
  portalLegend: 'Portal',
  bossBadge: 'BOSS',
  bossLayerPrefix: 'Layer',
  bagTitle: 'STAGE BAG',
  bagSubtitle: 'Manage Sub-Skills (max 4) & Chest Accessories (max 5) active for this run.',
  bagSubSkillCategory: 'Sub-Skill Category',
  bagItemCategory: 'Item Category',
  bagSlotLabel: 'Slot',
  bagEmptyLabel: 'Empty',
  bagEmptySubSkillHint: 'Dropped by Boss Chests & Ancient Tombs.',
  bagEmptyItemHint: 'Dropped by Orange Supply Chests.',
  bagSelectPrompt: 'Tap any slot above to inspect its icon & stats.',
  bagDiscardBtn: 'Discard Item',
  bagSwapBanner: 'Item bag is full (5/5). Pick 1 item below to swap with:',
  bagSwapBtn: 'Replace This Slot',
  bagCancelSwapBtn: 'Cancel Swap',
  bagSynergyTitle: 'Active Synergies',
  closeBtn: 'Close',
  chestModalTitle: 'SUPPLY CHEST',
  chestModalSubtitle: 'Pick 1 of the 4 chest blessings for this run.',
  chestHealBadge: 'HP RECOVERY',
  chestItemBadge: 'STAGE ACCESSORY',
  chestPickBtn: 'Pick Reward',
  chestSkipBtn: 'Close Chest',
  pauseTitle: 'PAUSED',
  pauseResume: 'Resume',
  pauseRestart: 'Restart Stage',
  pauseSettings: 'Settings',
  pauseLobby: 'Back to Lobby',
  stageSelectTitle: 'SELECT DUNGEON STAGE',
  stageSelectSubtitle: 'Choose any unlocked stage from Stage 1 to Stage 10.',
  stageLabel: 'Stage',
  stageUnlocked: 'Unlocked',
  stageLocked: 'Locked',
  stageEnterBtn: 'Enter Stage',
  draftTitle: 'CHOOSE STAGE BLESSING',
  draftSubtitle: 'Pick 1 upgrade before advancing to the next chamber.',
  draftSubSkillBadge: 'Sub-Skill',
  draftPassiveBadge: 'Passive',
  draftBuffBadge: 'Run Buff',
  bossChestModalTitle: 'BOSS CHEST OPENED',
  bossChestModalSubtitle: 'Auto-casting Sub-Skill acquired for this dungeon run!',
  tombModalTitle: 'ANCIENT TOMB UNSEALED',
  tombModalSubtitle: 'Ancient energy grants a new Sub-Skill for this run.',
  continueNextStage: 'Continue',
  victoryTitle: 'DUNGEON CLEARED',
  defeatTitle: 'FALLEN IN BATTLE',
  runStatsScore: 'Score',
  runStatsKills: 'Monsters Slain',
  runStatsTime: 'Time',
  runStatsRewards: 'Rewards Earned',
  returnLobbyBtn: 'Return to Lobby',
  retryStageBtn: 'Retry',
  settingsTitle: 'SETTINGS',
  settingsSubtitle: 'Configure language, audio volumes, mobile button layout & keybindings.',
  settingsLangTitle: 'Language / Bahasa',
  settingsLangId: 'Indonesia',
  settingsLangEn: 'English',
  settingsAudioTitle: 'Audio & Stage 1–10 BGM',
  settingsMasterVol: 'Master Volume',
  settingsBgmVol: 'Music Volume (BGM)',
  settingsSfxVol: 'Effects Volume (SFX)',
  settingsMuteAll: 'Mute All',
  settingsUnmuteAll: 'Audio On',
  settingsTestSfx: 'Test SFX',
  settingsMobileLayoutTitle: 'Mobile Button Layout',
  settingsMobileLayoutHint: 'Drag and arrange touch buttons directly on screen.',
  settingsCustomButtonsBtn: 'Customize Buttons',
  settingsCustomButtonsTitle: 'CUSTOMIZE BUTTONS · DRAG & DROP',
  settingsCustomButtonsHint: 'Hold and drag D-Pad, Skills 1–3, or Dash / Jump anywhere on screen.',
  settingsOpacity: 'Button Opacity',
  settingsSaveLayoutBtn: 'Save',
  settingsResetDefault: 'Reset',
  settingsCancelBtn: 'Cancel / Back',
  bagSubSkillSwapBanner: 'Sub-Skill slots full (4/4). Pick 1 Sub-Skill to replace with:',
  bagCancelReturnBtn: 'Cancel / Back',
  settingsKeysTitle: 'Keyboard Controls',
  settingsResetKeys: 'Reset Keys',
  settingsPressKey: 'Press Key...',
  sanctumTitle: 'CHARACTER & SANCTUM',
  sanctumTabCharacter: 'Character',
  sanctumTabSkills: 'Skills',
  sanctumTabWeapon: 'Weapon',
  sanctumTabGacha: 'Gacha',
  sanctumTabBestiary: 'Bestiary',
  sanctumTabDaily: 'Daily',
  sanctumTabEvents: 'Events',
  shopTitle: 'WEAPON MERCHANT',
  betaTag: 'BETA',
  silverLabel: 'Silver',
  catLegend: 'Cat Shop',
  catShopTitle: 'WHITE CAT SHOP',
  catShopSubtitle: 'Mysterious merchant every 3 stages. Spend Silver (resets to 0 on defeat).',
  catShopEmpty: 'All White Cat offers in this chamber have been purchased.',
  catShopBuyBtn: 'Buy',
  catShopSoldBadge: 'Sold',
  catShopSubSkillTag: 'SUB-SKILL',
  catShopItemTag: 'RUN ITEM',
  bagComboPanelTitle: 'Item & Sub-Skill Combos',
  bagComboActiveBadge: 'ACTIVE',
  bagComboLockedHint: 'Pair matching Run Item & Sub-Skill for bonus power',
  dailyQuestsTitle: 'Daily Quests (Resets Daily)',
  dailyQuestsSubtitle: 'Complete dungeon & summon missions for bonus Gems and Skill Essence.',
  dailyQuestClaimBtn: 'Claim',
  dailyQuestClaimedBadge: 'Claimed',
  heroLockedBadge: 'Locked · Gacha',
  heroUnlockGachaBtn: 'Get in Gacha',
  settingsButtonScale: 'Button Size',
  settingsSelectedButton: 'Selected Button',
  settingsApplyAllOpacity: 'Apply to All',
  rotateDeviceTitle: 'Rotate Device to Landscape',
  rotateDeviceHint: 'This side-scrolling action slasher plays in full horizontal landscape mode.',
};

export function getUiStrings(lang: LanguageCode = 'id'): UiStrings {
  return lang === 'en' ? EN_STRINGS : ID_STRINGS;
}

export function getLobbyPropTitle(kind: LobbyInteractableKind, lang: LanguageCode = 'id'): string {
  if (lang === 'en') {
    switch (kind) {
      case 'gacha_statue':
        return 'Gacha';
      case 'training_dummy':
        return 'Dummy';
      case 'stage_portal':
        return 'Portal';
      case 'weapon_shop':
        return 'Merchant';
      case 'enchant_portal':
        return 'Enchant';
      case 'enchant_altar':
        return 'Altar';
      case 'return_portal':
        return 'Lobby';
    }
  }
  switch (kind) {
    case 'gacha_statue':
      return 'Gacha';
    case 'training_dummy':
      return 'Orang Sawah';
    case 'stage_portal':
      return 'Portal';
    case 'weapon_shop':
      return 'Pedagang';
    case 'enchant_portal':
      return 'Enchant';
    case 'enchant_altar':
      return 'Altar';
    case 'return_portal':
      return 'Lobi';
  }
}

export function getItemCategoryLabel(
  category: RunItemDef['category'],
  lang: LanguageCode = 'id'
): string {
  if (lang === 'en') {
    return category === 'Sepatu' ? 'Boots' : 'Accessory';
  }
  return category;
}

export function getSubSkillElementLabel(
  sub: SubSkillDef,
  lang: LanguageCode = 'id'
): string {
  if (lang === 'en') {
    if (sub.element === 'burn') return 'Fire · Burn';
    if (sub.element === 'freeze') return 'Frost · Freeze';
    return 'Venom · DoT';
  }
  return sub.roleLabel;
}
