import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { CatMerchantModal } from './components/CatMerchantModal';
import { DungeonHud } from './components/DungeonHud';
import { InventoryModal, type PendingSubSkillOffer } from './components/InventoryModal';
import { LobbyHud } from './components/LobbyHud';
import { SanctumModal, type SanctumScope, type SanctumTab } from './components/SanctumModal';
import { getScopeForSanctumTab } from './game/sanctumNav';
import { SettingsModal } from './components/SettingsModal';
import {
  ChestRewardModal,
  EndRunModal,
  PauseModal,
  StageDraftModal,
  StageSelectModal,
  SupplyChestOfferModal,
} from './components/StatusModals';
import { TitleScreen } from './components/TitleScreen';
import { WeaponShopModal } from './components/WeaponShopModal';
import { gameAudio } from './engine/audio';
import { DungeonEngine } from './engine/dungeonEngine';
import {
  claimDailyQuestReward,
  claimDailyReward,
  claimEventBannerReward,
  getClaimableDailyQuestCount,
  getNextClaimableDailyDay,
  getUnreadEventCount,
  performSinglePull,
  performTenPull,
  syncDailyQuestDate,
  trackDailyQuestProgress,
} from './game/gacha';
import { getUiStrings } from './game/i18n';
import {
  claimBestiaryReward,
  forgeWeapon,
  purchaseWeaponSkin,
  rollBossChestSkill,
  rollPostStageSkillDraft,
  rollTombActiveSkill,
  upgradeCharacterActiveSkill,
  upgradeCharacterLevel,
  upgradePassiveNode,
} from './game/progression';
import {
  getTodayDateKey,
  hasExistingSaveData,
  isCharacterUnlocked,
  loadSaveData,
  persistSaveData,
  resetSaveData,
} from './game/storage';
import type {
  ActiveSkillId,
  AnySkillId,
  AudioSettings,
  BladeAuraId,
  BladeStyleId,
  CatMerchantOffer,
  CharacterId,
  ChestChoiceOption,
  DailyQuestId,
  GameScreenState,
  HudSnapshot,
  Keybindings,
  LanguageCode,
  LobbyInteractableKind,
  LobbyRoomId,
  LyraWeaponId,
  MobileControlsSettings,
  MonsterType,
  PassiveNodeId,
  PullRecord,
  RunItemDef,
  RunSummary,
  RunTempBuffId,
  SaveData,
  ScytheWeaponId,
  SkillDraftOption,
  SubSkillId,
  WeaponEnchantId,
  WitchWeaponId,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  characterId: 'velvera',
  lobbyRoom: 'main',
  nearLobbyObject: null,
  dummyLastHit: 0,
  dummyMaxHit: 0,
  dummyDps: 0,
  hp: 100,
  maxHp: 100,
  mp: 100,
  maxMp: 100,
  silver: 0,
  stage: 1,
  subStage: 1,
  isBossRoom: false,
  bossName: null,
  bossHp: 0,
  bossMaxHp: 0,
  bossBarHp: 0,
  bossBarMaxHp: 0,
  bossBarsRemaining: 0,
  bossTotalBars: 0,
  monstersAlive: 0,
  portalReady: false,
  portalSpawnProgress: 1,
  portalSide: null,
  chestReady: false,
  chestOpened: false,
  nearInteractable: null,
  autoCombat: true,
  auraOverdriveSec: 0,
  hasDoubleJump: false,
  combo: 0,
  comboTimerPct: 0,
  comboChain: {
    sequence: [],
    windowRemainingSec: 0,
    activeBuffName: null,
    buffRemainingSec: 0,
    atkSpeedBonusPct: 0,
    damageBonusPct: 0,
  },
  score: 0,
  kills: 0,
  elapsedSec: 0,
  skillCooldowns: [0, 0, 0],
  skillMaxCooldowns: [5.5, 4.5, 5],
  runSubSkills: [],
  subSkillCooldowns: [],
  subSkillMaxCooldowns: [],
  runInventory: [],
  activeSynergies: [],
  activeItemSubCombos: [],
  dashCooldown: 0,
  inRunBanner: null,
  minimap: {
    worldW: 3600,
    worldH: 920,
    playerX: 500,
    playerY: 790,
    portal: null,
    bossChest: null,
    tomb: { x: 1795, y: 328, opened: false },
    catMerchant: null,
    supplyChests: [],
    platforms: [],
    floorSegments: [],
  },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<DungeonEngine | null>(null);

  const [hasSave, setHasSave] = useState<boolean>(() => hasExistingSaveData());
  const [save, setSave] = useState<SaveData>(() => loadSaveData());
  const saveRef = useRef<SaveData>(save);
  saveRef.current = save;

  const [screen, setScreen] = useState<GameScreenState>('title');
  const screenRef = useRef<GameScreenState>(screen);
  screenRef.current = screen;

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [sanctumOpen, setSanctumOpen] = useState(false);
  const [sanctumScope, setSanctumScope] = useState<SanctumScope>('character');
  const [sanctumTab, setSanctumTab] = useState<SanctumTab>('skills');
  const [sanctumGachaBanner, setSanctumGachaBanner] = useState<CharacterId | undefined>(undefined);
  const [weaponShopOpen, setWeaponShopOpen] = useState(false);
  const [catShopOpen, setCatShopOpen] = useState(false);
  const [catOffers, setCatOffers] = useState<CatMerchantOffer[]>([]);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [pendingDropItem, setPendingDropItem] = useState<RunItemDef | null>(null);
  const [pendingSubSkill, setPendingSubSkill] = useState<PendingSubSkillOffer | null>(null);
  const [supplyChestOffer, setSupplyChestOffer] = useState<{
    chestIndex: number;
    options: ChestChoiceOption[];
  } | null>(null);
  const [suspendedChestOffer, setSuspendedChestOffer] = useState<{
    chestIndex: number;
    options: ChestChoiceOption[];
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stageSelectOpen, setStageSelectOpen] = useState(false);
  const [latestPulls, setLatestPulls] = useState<PullRecord[]>([]);
  const [chestReward, setChestReward] = useState<{
    stage: number;
    skillId: AnySkillId;
    newLevel: number;
    autoEquipped: boolean;
    isSubSkill?: boolean;
    source?: 'boss' | 'tomb';
  } | null>(null);
  const [stageDraft, setStageDraft] = useState<{
    nextStage: number;
    nextSubStage: number;
    options: SkillDraftOption[];
  } | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const updateSave = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSave((prev) => {
      const next = updater(prev);
      saveRef.current = next;
      persistSaveData(next);
      setHasSave(true);
      engineRef.current?.updateSaveData(next);
      return next;
    });
  }, []);

  const tryLockLandscape = useCallback(() => {
    const ori = window.screen?.orientation as { lock?: (mode: string) => Promise<void> } | undefined;
    ori?.lock?.('landscape').catch(() => {});
  }, []);

  // Sync saved audio settings & daily quest date on initial mount
  useEffect(() => {
    gameAudio.setAudioSettings(saveRef.current.audioSettings);
    const todayKey = getTodayDateKey();
    if (saveRef.current.dailyQuests?.dateKey !== todayKey) {
      setSave((prev) => {
        const next = syncDailyQuestDate(prev, todayKey);
        saveRef.current = next;
        return next;
      });
    }
  }, []);

  // Keep body[data-state] synced with screen state
  useEffect(() => {
    document.body.dataset.state = screen;
  }, [screen]);

  // Detect coarse pointer / mobile screens & portrait orientation
  useEffect(() => {
    const checkViewport = () => {
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      const minDim = Math.min(window.innerWidth, window.innerHeight);
      setIsTouchDevice(coarse || minDim <= 540 || window.innerWidth <= 900);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, []);

  const setGameScreen = useCallback((next: GameScreenState) => {
    screenRef.current = next;
    setScreen(next);
    document.body.dataset.state = next;
    engineRef.current?.setMode(next);
  }, []);

  const enterLobby = useCallback((room: LobbyRoomId = 'main') => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSanctumOpen(false);
    setWeaponShopOpen(false);
    setCatShopOpen(false);
    setCatOffers([]);
    setInventoryOpen(false);
    setPendingDropItem(null);
    setPendingSubSkill(null);
    setSupplyChestOffer(null);
    setSuspendedChestOffer(null);
    setSettingsOpen(false);
    setStageSelectOpen(false);
    setChestReward(null);
    setStageDraft(null);
    setRunSummary(null);
    screenRef.current = 'lobby';
    setScreen('lobby');
    document.body.dataset.state = 'lobby';
    engineRef.current?.enterLobby(room);
    canvasRef.current?.focus();
  }, []);

  const handlePlayNewGame = useCallback(() => {
    gameAudio.playClick();
    tryLockLandscape();
    const fresh = resetSaveData();
    saveRef.current = fresh;
    setSave(fresh);
    setHasSave(true);
    gameAudio.setAudioSettings(fresh.audioSettings);
    engineRef.current?.updateSaveData(fresh);
    enterLobby('main');
  }, [enterLobby, tryLockLandscape]);

  const handleContinue = useCallback(() => {
    if (!hasSave) return;
    gameAudio.playClick();
    tryLockLandscape();
    enterLobby('main');
  }, [hasSave, enterLobby, tryLockLandscape]);

  const startDungeon = useCallback(
    (stage = 1) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      tryLockLandscape();
      setSanctumOpen(false);
      setWeaponShopOpen(false);
      setCatShopOpen(false);
      setCatOffers([]);
      setInventoryOpen(false);
      setPendingDropItem(null);
      setPendingSubSkill(null);
      setSupplyChestOffer(null);
      setSuspendedChestOffer(null);
      setSettingsOpen(false);
      setStageSelectOpen(false);
      setChestReward(null);
      setStageDraft(null);
      setRunSummary(null);
      setGameScreen('playing');
      engineRef.current?.startNewRun(stage, 1);
      canvasRef.current?.focus();
    },
    [setGameScreen, tryLockLandscape]
  );

  const handlePause = useCallback(() => {
    if (screenRef.current === 'playing') {
      setGameScreen('paused');
    } else if (screenRef.current === 'paused') {
      setGameScreen('playing');
      canvasRef.current?.focus();
    }
  }, [setGameScreen]);

  const openSanctum = useCallback((tab: SanctumTab, scope?: SanctumScope, bannerHero?: CharacterId) => {
    gameAudio.playClick();
    if (screenRef.current === 'playing') {
      engineRef.current?.setMode('paused');
      screenRef.current = 'paused';
      setScreen('paused');
    }
    setSanctumGachaBanner(bannerHero);
    setSanctumScope(scope ?? getScopeForSanctumTab(tab));
    setSanctumTab(tab);
    setSanctumOpen(true);
  }, []);

  const closeSanctum = useCallback(() => {
    gameAudio.playClick();
    setSanctumOpen(false);
    setSanctumGachaBanner(undefined);
    canvasRef.current?.focus();
  }, []);

  const openInventoryModal = useCallback((dropItem: RunItemDef | null = null) => {
    gameAudio.playClick();
    if (screenRef.current === 'playing') {
      engineRef.current?.setMode('paused');
      screenRef.current = 'paused';
      setScreen('paused');
    }
    setPendingDropItem(dropItem);
    setInventoryOpen(true);
  }, []);

  const closeInventoryModal = useCallback(() => {
    gameAudio.playClick();
    setPendingDropItem(null);
    setPendingSubSkill(null);
    setInventoryOpen(false);
    if (screenRef.current === 'paused') {
      engineRef.current?.setMode('playing');
      screenRef.current = 'playing';
      setScreen('playing');
    }
    canvasRef.current?.focus();
  }, []);

  const cancelPendingItemSwap = useCallback(() => {
    gameAudio.playClick();
    setPendingDropItem(null);
    setInventoryOpen(false);
    if (suspendedChestOffer) {
      setSupplyChestOffer(suspendedChestOffer);
      setSuspendedChestOffer(null);
      return;
    }
    if (screenRef.current === 'paused') {
      engineRef.current?.setMode('playing');
      screenRef.current = 'playing';
      setScreen('playing');
    }
    canvasRef.current?.focus();
  }, [suspendedChestOffer]);

  const cancelPendingSubSkillSwap = useCallback(() => {
    gameAudio.playClick();
    setPendingSubSkill(null);
    setInventoryOpen(false);
    engineRef.current?.reopenTomb();
    if (screenRef.current === 'paused') {
      engineRef.current?.setMode('playing');
      screenRef.current = 'playing';
      setScreen('playing');
    }
    canvasRef.current?.focus();
  }, []);

  const callbacksRef = useRef({
    onHudUpdate: (nextHud: HudSnapshot) => {
      setHud(nextHud);
    },
    onChestReward: (stage: number) => {
      const currentSubs = engineRef.current?.getRunSubSkills() ?? [];
      const reward = rollBossChestSkill(currentSubs);
      // Sub-skill is strictly stage-only; persistent save only receives Gold/Gems/Shards/Essence
      engineRef.current?.applyChestSubSkill(reward.skillId, reward.newLevel);
      updateSave((prev) => ({
        ...prev,
        gems: prev.gems + 160,
        gold: prev.gold + 350 + stage * 90,
        forgeShards: prev.forgeShards + 8 + stage * 2,
        skillEssence: prev.skillEssence + 18 + stage * 4,
      }));
      screenRef.current = 'paused';
      setScreen('paused');
      document.body.dataset.state = 'paused';
      engineRef.current?.setMode('paused');
      setChestReward({ stage, source: 'boss', ...reward });
    },
    onTombReward: (stage: number) => {
      updateSave((prev) => trackDailyQuestProgress(prev, 'chestsOpened', 1, getTodayDateKey()));
      const currentSubs = engineRef.current?.getRunSubSkills() ?? [];
      const reward = rollTombActiveSkill(currentSubs);
      if (reward.needsSwap) {
        if (screenRef.current === 'playing') {
          engineRef.current?.setMode('paused');
          screenRef.current = 'paused';
          setScreen('paused');
          document.body.dataset.state = 'paused';
        }
        setPendingDropItem(null);
        setPendingSubSkill({ skillId: reward.skillId, newLevel: reward.newLevel, source: 'tomb' });
        setInventoryOpen(true);
        return;
      }
      engineRef.current?.applyChestSubSkill(reward.skillId, reward.newLevel);
      screenRef.current = 'paused';
      setScreen('paused');
      document.body.dataset.state = 'paused';
      engineRef.current?.setMode('paused');
      setChestReward({ stage, source: 'tomb', ...reward });
    },
    onChestChoiceOffer: (chestIndex: number, options: ChestChoiceOption[]) => {
      if (screenRef.current === 'playing') {
        screenRef.current = 'paused';
        setScreen('paused');
        document.body.dataset.state = 'paused';
      }
      setSupplyChestOffer({ chestIndex, options });
    },
    onStageDraftRequest: (nextStage: number, nextSubStage: number) => {
      updateSave((prev) => trackDailyQuestProgress(prev, 'stagesCleared', 1, getTodayDateKey()));
      screenRef.current = 'paused';
      setScreen('paused');
      document.body.dataset.state = 'paused';
      const currentSubs = engineRef.current?.getRunSubSkills() ?? [];
      const options = rollPostStageSkillDraft(saveRef.current, currentSubs);
      setStageDraft({ nextStage, nextSubStage, options });
    },
    onMonsterKilled: (kind: MonsterType) => {
      updateSave((prev) =>
        trackDailyQuestProgress(
          {
            ...prev,
            bestiaryKills: {
              ...prev.bestiaryKills,
              [kind]: (prev.bestiaryKills[kind] ?? 0) + 1,
            },
          },
          'kills',
          1,
          getTodayDateKey()
        )
      );
    },
    onSupplyChestLoot: (loot: { gold: number; shards: number; essence: number }) => {
      updateSave((prev) =>
        trackDailyQuestProgress(
          {
            ...prev,
            gold: prev.gold + loot.gold,
            forgeShards: prev.forgeShards + loot.shards,
            skillEssence: prev.skillEssence + loot.essence,
          },
          'chestsOpened',
          1,
          getTodayDateKey()
        )
      );
    },
    onInventoryFullDrop: (item: RunItemDef) => {
      openInventoryModal(item);
    },
    onOpenInventory: () => {
      openInventoryModal(null);
    },
    onCatMerchantOpen: () => {
      gameAudio.playClick();
      if (screenRef.current === 'playing') {
        engineRef.current?.setMode('paused');
        screenRef.current = 'paused';
        setScreen('paused');
        document.body.dataset.state = 'paused';
      }
      setCatOffers([...(engineRef.current?.getCatMerchantOffers() ?? [])]);
      setCatShopOpen(true);
    },
    onLobbyInteract: (kind: LobbyInteractableKind) => {
      if (kind === 'gacha_statue') {
        openSanctum('gacha', 'gacha');
      } else if (kind === 'enchant_altar') {
        openSanctum('weapon', 'weapon');
      } else if (kind === 'weapon_shop') {
        setWeaponShopOpen(true);
      } else if (kind === 'stage_portal') {
        setStageSelectOpen(true);
      }
    },
    onRunEnd: (summary: RunSummary) => {
      setInventoryOpen(false);
      setCatShopOpen(false);
      setCatOffers([]);
      setPendingDropItem(null);
      setPendingSubSkill(null);
      setSupplyChestOffer(null);
      setSuspendedChestOffer(null);
      updateSave((prev) => {
        const base = {
          ...prev,
          gems: prev.gems + summary.gemsEarned,
          gold: prev.gold + summary.goldEarned,
          forgeShards: prev.forgeShards + summary.shardsEarned,
          skillEssence: prev.skillEssence + summary.essenceEarned,
          highestStage: Math.max(prev.highestStage, summary.stageReached),
          bestScore: Math.max(prev.bestScore, summary.score),
        };
        return summary.outcome === 'victory'
          ? trackDailyQuestProgress(base, 'stagesCleared', 1, getTodayDateKey())
          : base;
      });
      setRunSummary(summary);
      screenRef.current = 'gameover';
      setScreen('gameover');
      document.body.dataset.state = 'gameover';
    },
    onPauseRequest: () => {
      handlePause();
    },
  });

  // Mount isolated Canvas2D engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new DungeonEngine(canvas, saveRef.current, {
      onHudUpdate: (h) => callbacksRef.current.onHudUpdate(h),
      onChestReward: (st) => callbacksRef.current.onChestReward(st),
      onTombReward: (st) => callbacksRef.current.onTombReward(st),
      onChestChoiceOffer: (idx, opts) => callbacksRef.current.onChestChoiceOffer(idx, opts),
      onStageDraftRequest: (ns, nss) => callbacksRef.current.onStageDraftRequest(ns, nss),
      onMonsterKilled: (kind) => callbacksRef.current.onMonsterKilled(kind),
      onSupplyChestLoot: (loot) => callbacksRef.current.onSupplyChestLoot(loot),
      onInventoryFullDrop: (item) => callbacksRef.current.onInventoryFullDrop(item),
      onOpenInventory: () => callbacksRef.current.onOpenInventory(),
      onCatMerchantOpen: () => callbacksRef.current.onCatMerchantOpen(),
      onLobbyInteract: (kind) => callbacksRef.current.onLobbyInteract(kind),
      onRunEnd: (s) => callbacksRef.current.onRunEnd(s),
      onPauseRequest: () => callbacksRef.current.onPauseRequest(),
    });
    engineRef.current = engine;

    // Support ?autostart=1 (enters Lobby) or ?autostart=dungeon (starts Stage 1-1)
    const params = new URLSearchParams(window.location.search);
    const auto = params.get('autostart');
    if (auto === '1') {
      screenRef.current = 'lobby';
      setScreen('lobby');
      document.body.dataset.state = 'lobby';
      engine.enterLobby('main');
    } else if (auto === 'enchant') {
      screenRef.current = 'lobby';
      setScreen('lobby');
      document.body.dataset.state = 'lobby';
      engine.enterLobby('enchant');
    } else if (auto === 'dungeon') {
      const stageParam = Math.max(1, Math.min(10, Number(params.get('stage')) || 1));
      const subStageParam = Math.max(1, Math.min(5, Number(params.get('substage')) || 1));
      screenRef.current = 'playing';
      setScreen('playing');
      document.body.dataset.state = 'playing';
      engine.startNewRun(stageParam, subStageParam);
    } else if (auto === 'boss') {
      screenRef.current = 'playing';
      setScreen('playing');
      document.body.dataset.state = 'playing';
      engine.startNewRun(1, 5);
    }

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleUpdateAudioSettings = useCallback(
    (nextAudio: AudioSettings) => {
      gameAudio.setAudioSettings(nextAudio);
      updateSave((prev) => ({
        ...prev,
        audioSettings: nextAudio,
      }));
    },
    [updateSave]
  );

  const handleChangeLanguage = useCallback(
    (language: LanguageCode) => {
      gameAudio.playClick();
      updateSave((prev) => ({
        ...prev,
        language,
      }));
    },
    [updateSave]
  );

  const handleChangeMobileControls = useCallback(
    (mobileControls: MobileControlsSettings) => {
      updateSave((prev) => ({
        ...prev,
        mobileControls,
      }));
    },
    [updateSave]
  );

  const handleChangeKeybindings = useCallback(
    (nextKeybindings: Keybindings) => {
      gameAudio.playClick();
      updateSave((prev) => ({
        ...prev,
        keybindings: nextKeybindings,
      }));
    },
    [updateSave]
  );

  const toggleMute = useCallback(() => {
    gameAudio.playClick();
    const current = saveRef.current.audioSettings;
    handleUpdateAudioSettings({
      ...current,
      muted: !current.muted,
    });
  }, [handleUpdateAudioSettings]);

  // Global keyboard shortcuts (Mute [M], Pause [Esc/P], Inventory toggle when open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settingsOpen) return;
      if (e.code === 'KeyM' && !e.repeat) {
        const current = saveRef.current.audioSettings;
        handleUpdateAudioSettings({
          ...current,
          muted: !current.muted,
        });
      }
      if (inventoryOpen && !pendingDropItem && !e.repeat) {
        if (e.code === saveRef.current.keybindings.inventory || e.code === 'Escape') {
          e.preventDefault();
          closeInventoryModal();
          return;
        }
      }
      if (catShopOpen && !e.repeat && e.code === 'Escape') {
        e.preventDefault();
        setCatShopOpen(false);
        setGameScreen('playing');
        requestAnimationFrame(() => canvasRef.current?.focus());
        return;
      }
      if (
        (screenRef.current === 'playing' || screenRef.current === 'paused') &&
        !sanctumOpen &&
        !weaponShopOpen &&
        !catShopOpen &&
        !inventoryOpen &&
        !supplyChestOffer &&
        !settingsOpen &&
        !stageSelectOpen &&
        !chestReward &&
        !stageDraft &&
        (e.key === 'Escape' || e.code === 'Escape' || e.code === 'KeyP') &&
        !e.repeat
      ) {
        e.preventDefault();
        handlePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    sanctumOpen,
    weaponShopOpen,
    catShopOpen,
    inventoryOpen,
    pendingDropItem,
    supplyChestOffer,
    settingsOpen,
    stageSelectOpen,
    chestReward,
    stageDraft,
    handlePause,
    handleUpdateAudioSettings,
    closeInventoryModal,
    setGameScreen,
  ]);

  const handleSelectCharacter = useCallback(
    (id: CharacterId) => {
      if (!isCharacterUnlocked(saveRef.current, id)) return;
      gameAudio.playClick();
      updateSave((prev) => ({
        ...prev,
        selectedCharacter: id,
      }));
    },
    [updateSave]
  );

  const handlePullSingle = (bannerId: CharacterId) => {
    try {
      const res = performSinglePull(saveRef.current, { bannerId });
      gameAudio.playChestOrGacha(res.record.rarity === 'SSR');
      setLatestPulls([res.record]);
      updateSave(() => trackDailyQuestProgress(res.nextSave, 'pulls', 1, getTodayDateKey()));
    } catch {
      // Insufficient gems guarded in UI
    }
  };

  const handlePullTen = (bannerId: CharacterId) => {
    try {
      const res = performTenPull(saveRef.current, { bannerId });
      const hasSsr = res.records.some((r) => r.rarity === 'SSR');
      gameAudio.playChestOrGacha(hasSsr);
      setLatestPulls(res.records);
      updateSave(() => trackDailyQuestProgress(res.nextSave, 'pulls', 10, getTodayDateKey()));
    } catch {
      // Insufficient gems guarded in UI
    }
  };

  const handleClaimDaily = () => {
    try {
      const todayKey = getTodayDateKey();
      const res = claimDailyReward(saveRef.current, todayKey);
      gameAudio.playChestOrGacha(true);
      updateSave(() => res.nextSave);
    } catch {
      // Already claimed today
    }
  };

  const handleClaimDailyQuest = (questId: DailyQuestId) => {
    try {
      const todayKey = getTodayDateKey();
      const res = claimDailyQuestReward(saveRef.current, questId, todayKey);
      gameAudio.playChestOrGacha(true);
      updateSave(() => res.nextSave);
    } catch {
      // Not claimable yet
    }
  };

  const handleClaimEvent = (eventId: string) => {
    gameAudio.playChestOrGacha(false);
    updateSave((prev) => claimEventBannerReward(prev, eventId));
  };

  const handleForgeWeapon = () => {
    try {
      const next = forgeWeapon(saveRef.current);
      gameAudio.playChestOrGacha(false);
      updateSave(() => next);
    } catch {
      // Guarded in UI
    }
  };

  const handleBuyOrEquipWeapon = (
    charId: CharacterId,
    weaponId: ScytheWeaponId | BladeStyleId | LyraWeaponId | WitchWeaponId
  ) => {
    try {
      const next = purchaseWeaponSkin(saveRef.current, charId, weaponId);
      gameAudio.playChestOrGacha(true);
      updateSave(() => next);
    } catch {
      // Guarded in UI
    }
  };

  const handleUpgradeActiveSkill = (skillId: ActiveSkillId) => {
    try {
      const next = upgradeCharacterActiveSkill(saveRef.current, skillId);
      gameAudio.playChestOrGacha(false);
      updateSave(() => next);
    } catch {
      // Guarded in UI
    }
  };

  const handleUpgradePassive = (nodeId: PassiveNodeId) => {
    try {
      const next = upgradePassiveNode(saveRef.current, nodeId);
      gameAudio.playClick();
      updateSave(() => next);
    } catch {
      // Guarded in UI
    }
  };

  const handleUpgradeCharacter = () => {
    try {
      const next = upgradeCharacterLevel(saveRef.current);
      gameAudio.playChestOrGacha(false);
      updateSave(() => next);
    } catch {
      // Guarded in UI
    }
  };

  const handleClaimBestiary = (monsterId: MonsterType) => {
    try {
      const next = claimBestiaryReward(saveRef.current, monsterId);
      gameAudio.playChestOrGacha(true);
      updateSave(() => next);
    } catch {
      // Guarded in UI
    }
  };

  const handleSelectStageDraft = (option: SkillDraftOption) => {
    if (!stageDraft) return;
    gameAudio.playChestOrGacha(true);
    if (option.kind === 'sub') {
      engineRef.current?.applyChestSubSkill(option.id as SubSkillId, option.nextLevel);
    } else if (option.kind === 'temp_buff') {
      engineRef.current?.applyTempBuff(option.id as RunTempBuffId);
    } else if (option.kind === 'passive') {
      const nodeId = option.id as PassiveNodeId;
      updateSave((prev) => ({
        ...prev,
        passiveLevels: {
          ...prev.passiveLevels,
          [nodeId]: option.nextLevel,
        },
      }));
    }
    const { nextStage, nextSubStage } = stageDraft;
    setStageDraft(null);
    screenRef.current = 'playing';
    setScreen('playing');
    document.body.dataset.state = 'playing';
    engineRef.current?.advanceToRoom(nextStage, nextSubStage);
    requestAnimationFrame(() => canvasRef.current?.focus());
  };

  const handlePickSupplyChestOption = (option: ChestChoiceOption) => {
    const res = engineRef.current?.claimChestChoiceOption(option);
    if (res?.status === 'bag_full' && res.itemDef) {
      setSuspendedChestOffer(supplyChestOffer);
      setSupplyChestOffer(null);
      openInventoryModal(res.itemDef);
      return;
    }
    setSuspendedChestOffer(null);
    setSupplyChestOffer(null);
    setGameScreen('playing');
    requestAnimationFrame(() => canvasRef.current?.focus());
  };

  const openSettingsFromGameplay = useCallback(() => {
    gameAudio.playClick();
    if (screenRef.current === 'playing') {
      setGameScreen('paused');
    }
    setSettingsOpen(true);
  }, [setGameScreen]);

  const todayKey = getTodayDateKey();
  const unreadEvents = getUnreadEventCount(save);
  const dailyClaimable =
    getNextClaimableDailyDay(save, todayKey) !== null ||
    getClaimableDailyQuestCount(save, todayKey) > 0;
  const equippedSkills =
    save.selectedCharacter === 'luna'
      ? save.lunaEquippedSkills
      : save.selectedCharacter === 'witch'
        ? save.witchEquippedSkills
        : save.selectedCharacter === 'lyra'
          ? save.lyraEquippedSkills
          : save.equippedSkills;
  const settingsContext: 'title' | 'lobby' | 'playing' =
    screen === 'title' ? 'title' : screen === 'lobby' ? 'lobby' : 'playing';
  const language: LanguageCode = save.language ?? 'id';
  const uiStrings = getUiStrings(language);

  return (
    <main className="app-main-container relative bg-[#09090E]">
      {/* Isolated Canvas Mount */}
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          data-testid="dungeon-canvas"
          tabIndex={0}
          className="w-full h-full block outline-none"
        />
      </div>

      {/* Simple Fantasy Temple Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          hasSave={hasSave}
          language={language}
          onPlayNewGame={handlePlayNewGame}
          onContinue={handleContinue}
          onOpenSettings={() => {
            gameAudio.playClick();
            setSettingsOpen(true);
          }}
        />
      )}

      {/* Playable Fantasy Temple Lobby HUD */}
      {screen === 'lobby' && (
        <LobbyHud
          hud={hud}
          save={save}
          equippedSkills={equippedSkills}
          unreadEvents={unreadEvents}
          dailyClaimable={dailyClaimable}
          showTouchControls={isTouchDevice}
          onOpenSettings={() => {
            gameAudio.playClick();
            setSettingsOpen(true);
          }}
          onOpenSanctum={openSanctum}
          onOpenInventory={() => openInventoryModal(null)}
          onTouchMove={(dir) => engineRef.current?.setTouchMove(dir)}
          onTouchDown={(active) => engineRef.current?.setTouchDown(active)}
          onTouchJumpStart={() => engineRef.current?.triggerTouchJump()}
          onTouchJumpEnd={() => engineRef.current?.releaseTouchJump()}
          onTouchDash={() => engineRef.current?.triggerTouchDash()}
          onTouchSkill={(slot) => engineRef.current?.triggerTouchSkill(slot)}
          onTouchInteract={() => engineRef.current?.triggerTouchInteract()}
        />
      )}

      {/* Active Dungeon Gameplay HUD */}
      {(screen === 'playing' || screen === 'paused') && (
        <DungeonHud
          hud={hud}
          equippedSkills={equippedSkills}
          keybindings={save.keybindings}
          language={language}
          mobileControls={save.mobileControls}
          lunaAwakening={save.lunaAwakening ?? 0}
          velveraAwakening={save.velveraAwakening}
          lyraAwakening={save.lyraAwakening}
          witchAwakening={save.witchAwakening ?? 0}
          gems={save.gems}
          muted={save.audioSettings.muted}
          showTouchControls={isTouchDevice}
          onToggleMute={toggleMute}
          onToggleAutoCombat={() => {
            gameAudio.playClick();
            engineRef.current?.toggleAutoCombat();
          }}
          onPause={handlePause}
          onOpenSettings={openSettingsFromGameplay}
          onOpenSanctum={openSanctum}
          onOpenInventory={() => openInventoryModal(null)}
          onTouchMove={(dir) => engineRef.current?.setTouchMove(dir)}
          onTouchDown={(active) => engineRef.current?.setTouchDown(active)}
          onTouchJumpStart={() => engineRef.current?.triggerTouchJump()}
          onTouchJumpEnd={() => engineRef.current?.releaseTouchJump()}
          onTouchDash={() => engineRef.current?.triggerTouchDash()}
          onTouchSkill={(slot) => engineRef.current?.triggerTouchSkill(slot)}
          onTouchInteract={() => engineRef.current?.triggerTouchInteract()}
        />
      )}

      {/* Audio, Language, Mobile Layout & Keybinding Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        context={settingsContext}
        language={language}
        settings={save.audioSettings}
        mobileControls={save.mobileControls}
        keybindings={save.keybindings}
        onChangeLanguage={handleChangeLanguage}
        onChange={handleUpdateAudioSettings}
        onChangeMobileControls={handleChangeMobileControls}
        onChangeKeybindings={handleChangeKeybindings}
        onSaveAndClose={() => {
          gameAudio.playClick();
          setSettingsOpen(false);
          if (settingsContext === 'playing') {
            enterLobby('main');
          } else {
            canvasRef.current?.focus();
          }
        }}
        onResumeGame={() => {
          gameAudio.playClick();
          setSettingsOpen(false);
          if (settingsContext === 'playing') {
            setGameScreen('playing');
          }
          canvasRef.current?.focus();
        }}
        onGoToMainMenu={() => {
          gameAudio.playClick();
          setSettingsOpen(false);
          setSanctumOpen(false);
          setWeaponShopOpen(false);
          setCatShopOpen(false);
          setCatOffers([]);
          setInventoryOpen(false);
          setPendingDropItem(null);
          setPendingSubSkill(null);
          setSupplyChestOffer(null);
          setSuspendedChestOffer(null);
          setStageSelectOpen(false);
          setChestReward(null);
          setStageDraft(null);
          setRunSummary(null);
          setGameScreen('title');
        }}
        onTestSfx={() => {
          gameAudio.playChestOrGacha(true);
        }}
      />

      {/* NPC Weapon Shop Modal */}
      <WeaponShopModal
        open={weaponShopOpen}
        language={language}
        save={save}
        onClose={() => {
          gameAudio.playClick();
          setWeaponShopOpen(false);
          canvasRef.current?.focus();
        }}
        onBuyOrEquip={handleBuyOrEquipWeapon}
        onSelectCharacter={handleSelectCharacter}
      />

      {/* Stage-Only 2-Column Inventory Modal (4 Sub-Skills + 5 Items + Combos + Swap Modes) */}
      <InventoryModal
        open={inventoryOpen}
        language={language}
        runSubSkills={hud.runSubSkills ?? []}
        inventory={hud.runInventory ?? []}
        pendingDropItem={pendingDropItem}
        pendingSubSkill={pendingSubSkill}
        activeItemSubCombos={hud.activeItemSubCombos}
        hasDoubleJump={hud.hasDoubleJump}
        onClose={closeInventoryModal}
        onDiscardItem={(uid) => {
          gameAudio.playClick();
          engineRef.current?.removeRunItem(uid);
        }}
        onReplaceWithPending={(uidToReplace) => {
          if (!pendingDropItem) return;
          gameAudio.playChestOrGacha(true);
          setSuspendedChestOffer(null);
          engineRef.current?.replaceRunItem(uidToReplace, pendingDropItem.id);
          closeInventoryModal();
        }}
        onReplaceSubSkill={(slotIndex) => {
          if (!pendingSubSkill) return;
          gameAudio.playChestOrGacha(true);
          engineRef.current?.replaceRunSubSkillSlot(
            slotIndex,
            pendingSubSkill.skillId,
            pendingSubSkill.newLevel
          );
          closeInventoryModal();
        }}
        onSkipPending={cancelPendingItemSwap}
        onSkipPendingSubSkill={cancelPendingSubSkillSwap}
      />

      {/* White Cat NPC Merchant Modal (Every 3 Stages, Silver Currency) */}
      <CatMerchantModal
        open={catShopOpen}
        language={language}
        silver={hud.silver}
        offers={catOffers}
        inventory={hud.runInventory ?? []}
        runSubSkills={hud.runSubSkills ?? []}
        onBuyOffer={(offerUid) => {
          const res = engineRef.current?.buyCatMerchantOffer(offerUid) ?? {
            status: 'invalid' as const,
          };
          setCatOffers([...(engineRef.current?.getCatMerchantOffers() ?? [])]);
          return res;
        }}
        onSwapItem={(uidToRemove, offerUid) => {
          engineRef.current?.completeCatItemSwap(uidToRemove, offerUid);
          setCatOffers([...(engineRef.current?.getCatMerchantOffers() ?? [])]);
        }}
        onSwapSubSkill={(slotIndex, offerUid) => {
          engineRef.current?.completeCatSubSkillSwap(slotIndex, offerUid);
          setCatOffers([...(engineRef.current?.getCatMerchantOffers() ?? [])]);
        }}
        onClose={() => {
          gameAudio.playClick();
          setCatShopOpen(false);
          setGameScreen('playing');
          requestAnimationFrame(() => canvasRef.current?.focus());
        }}
      />

      {/* Orange Supply Chest 4-Choice Modal (1 Heal 1%-45% + 3 Items, Pick 1) */}
      <SupplyChestOfferModal
        offer={supplyChestOffer}
        language={language}
        onPickOption={handlePickSupplyChestOption}
        onSkip={() => {
          gameAudio.playClick();
          setSupplyChestOffer(null);
          setGameScreen('playing');
          requestAnimationFrame(() => canvasRef.current?.focus());
        }}
      />

      {/* Stage Select Modal */}
      <StageSelectModal
        open={stageSelectOpen}
        language={language}
        highestStage={save.highestStage}
        onSelectStage={(stageNum) => {
          gameAudio.playPortal();
          startDungeon(stageNum);
        }}
        onClose={() => {
          gameAudio.playClick();
          setStageSelectOpen(false);
          canvasRef.current?.focus();
        }}
      />

      {/* Pause Modal */}
      <PauseModal
        open={
          screen === 'paused' &&
          !sanctumOpen &&
          !weaponShopOpen &&
          !catShopOpen &&
          !inventoryOpen &&
          !supplyChestOffer &&
          !settingsOpen &&
          !chestReward &&
          !stageDraft
        }
        language={language}
        stage={hud.stage}
        subStage={hud.subStage}
        onResume={() => {
          setGameScreen('playing');
          canvasRef.current?.focus();
        }}
        onOpenSanctum={() => openSanctum('weapon', 'weapon')}
        onOpenSettings={openSettingsFromGameplay}
        onRestart={() => startDungeon(hud.stage)}
        onExitLobby={() => enterLobby('main')}
        onExitTitle={() => {
          setGameScreen('title');
        }}
      />

      {/* Boss Skill Chest / Ancient Tomb Modal */}
      <ChestRewardModal
        reward={chestReward}
        language={language}
        onClose={() => {
          setChestReward(null);
          setGameScreen('playing');
          requestAnimationFrame(() => canvasRef.current?.focus());
        }}
      />

      {/* Post-Stage 1-of-3 Stage Draft Modal */}
      <StageDraftModal
        draft={stageDraft}
        language={language}
        onSelect={handleSelectStageDraft}
      />

      {/* Victory / Defeat Modal */}
      <EndRunModal
        summary={screen === 'gameover' && !sanctumOpen ? runSummary : null}
        language={language}
        bestScore={save.bestScore}
        onPlayAgain={() => startDungeon(1)}
        onOpenSanctum={() => openSanctum('gacha', 'gacha')}
        onExitLobby={() => enterLobby('main')}
        onExitTitle={() => {
          setRunSummary(null);
          setGameScreen('title');
        }}
      />

      {/* Sanctum Modal */}
      <SanctumModal
        open={sanctumOpen}
        scope={sanctumScope}
        initialTab={sanctumTab}
        initialGachaBanner={sanctumGachaBanner}
        language={language}
        save={save}
        latestPulls={latestPulls}
        onClose={closeSanctum}
        onSelectCharacter={handleSelectCharacter}
        onOpenGachaForHero={(heroId) => openSanctum('gacha', 'gacha', heroId)}
        onPullSingle={handlePullSingle}
        onPullTen={handlePullTen}
        onChangeLunaWeaponStyle={(style: ScytheWeaponId) => {
          gameAudio.playClick();
          updateSave((prev) => ({
            ...prev,
            lunaWeapon: {
              ...(prev.lunaWeapon ?? { style: 'umbral_crescent_scythe', forgeLevel: 0 }),
              style,
            },
          }));
        }}
        onChangeWeaponStyle={(style: BladeStyleId) => {
          gameAudio.playClick();
          updateSave((prev) => ({
            ...prev,
            weapon: { ...prev.weapon, style },
          }));
        }}
        onChangeLyraWeaponStyle={(style: LyraWeaponId) => {
          gameAudio.playClick();
          updateSave((prev) => ({
            ...prev,
            lyraWeapon: { ...(prev.lyraWeapon ?? { style: 'iron_knuckle', forgeLevel: 0 }), style },
          }));
        }}
        onChangeWitchWeaponStyle={(style: WitchWeaponId) => {
          gameAudio.playClick();
          updateSave((prev) => ({
            ...prev,
            witchWeapon: {
              ...(prev.witchWeapon ?? { style: 'raven_gnarled_staff', forgeLevel: 0 }),
              style,
            },
          }));
        }}
        onChangeWeaponAura={(aura: BladeAuraId) => {
          gameAudio.playClick();
          updateSave((prev) => ({
            ...prev,
            weapon: { ...prev.weapon, aura },
          }));
        }}
        onChangeWeaponEnchant={(enchant: WeaponEnchantId) => {
          gameAudio.playClick();
          updateSave((prev) => ({
            ...prev,
            weapon: { ...prev.weapon, enchant },
          }));
        }}
        onForgeWeapon={handleForgeWeapon}
        onEquipSkill={(slot, skillId) => {
          gameAudio.playClick();
          updateSave((prev) => {
            const charId = prev.selectedCharacter;
            const currentBar =
              charId === 'luna'
                ? prev.lunaEquippedSkills
                : charId === 'witch'
                  ? prev.witchEquippedSkills
                  : charId === 'lyra'
                    ? prev.lyraEquippedSkills
                    : prev.equippedSkills;
            const next = [...currentBar] as SaveData['equippedSkills'];
            const existingIdx = next.indexOf(skillId);
            if (existingIdx >= 0) {
              next[existingIdx] = next[slot];
            }
            next[slot] = skillId;
            return {
              ...prev,
              lunaEquippedSkills: charId === 'luna' ? next : prev.lunaEquippedSkills,
              witchEquippedSkills: charId === 'witch' ? next : prev.witchEquippedSkills,
              lyraEquippedSkills: charId === 'lyra' ? next : prev.lyraEquippedSkills,
              equippedSkills: charId === 'velvera' ? next : prev.equippedSkills,
            };
          });
        }}
        onUpgradeActiveSkill={handleUpgradeActiveSkill}
        onUpgradePassive={handleUpgradePassive}
        onUpgradeCharacter={handleUpgradeCharacter}
        onClaimBestiary={handleClaimBestiary}
        onClaimDaily={handleClaimDaily}
        onClaimDailyQuest={handleClaimDailyQuest}
        onClaimEvent={handleClaimEvent}
      />

      {/* Mobile Portrait Orientation Guard Overlay */}
      {isTouchDevice && isPortrait && (
        <div
          data-testid="portrait-rotate-overlay"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6 text-center bg-[#06070B]/95"
          role="dialog"
          aria-modal="true"
          aria-label={uiStrings.rotateDeviceTitle}
        >
          <div className="w-16 h-16 rounded-xl bg-[#161826] border border-[#FACC15]/60 flex items-center justify-center shadow-lg">
            <RotateCw className="w-8 h-8 text-[#FACC15]" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            {uiStrings.rotateDeviceTitle}
          </h2>
          <p className="text-xs text-[#94A3B8] max-w-xs leading-relaxed">
            {uiStrings.rotateDeviceHint}
          </p>
          <button
            type="button"
            onClick={tryLockLandscape}
            className="px-4 py-2 text-xs font-bold rounded bg-[#7E22CE] hover:bg-[#9333EA] text-white border border-[#C084FC]/60 cursor-pointer"
          >
            Landscape Mode
          </button>
        </div>
      )}
    </main>
  );
}
