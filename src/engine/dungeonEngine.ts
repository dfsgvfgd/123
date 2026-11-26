import {
  aabbOverlap,
  calculateSkillDamage,
  calculateSlashDamage,
  COMBAT_DAMAGE_SCALE,
  computePlayerStats,
  getBasicAttackComboMultiplier,
  type DerivedPlayerStats,
} from '../game/combatMath';
import {
  COMBO_DECAY_WINDOW_SEC,
  computeComboTimerPct,
  createInitialComboChainState,
  getSubSkillVfxScale,
  isCriticalComboMilestone,
  recordSkillChain,
  tickComboChain,
  toComboChainHud,
  type ComboChainState,
} from '../game/comboChain';
import {
  getLobbyRoomProps,
  getLobbyRoomSpawnX,
  getLobbyRoomWidth,
  LOBBY_GROUND_Y,
  LOBBY_H,
  LOBBY_MAIN_W,
  type LobbyPropConfig,
} from '../game/lobbyLayout';
import {
  ACTIVE_SKILLS,
  addRunInventoryItem,
  advanceSubStage,
  BLADE_AURAS,
  BOSS_MAX_HP,
  computeBossBarState,
  computeItemSubSkillCombos,
  computeMonsterSilverDrop,
  computeRunItemBonuses,
  generateCatMerchantOffers,
  generateRoomMonsters,
  getStageTheme,
  getStageWeather,
  getSubSkillScaledStats,
  MAX_RUN_INVENTORY,
  MAX_RUN_SUB_SKILLS,
  MAX_SUB_SKILL_LEVEL,
  NORMAL_MONSTER_BASE_HP,
  removeRunInventoryItem,
  replaceRunSubSkill,
  rollDungeonChestOffer,
  rollSupplyChestCount,
  RUN_ITEMS,
  RUN_TEMP_BUFFS,
  shouldResetDummyMetrics,
  shouldSpawnCatMerchant,
  STAGE_BOSS_NAMES,
  SUB_SKILLS,
  LUNA_SCYTHE_STYLES,
  WITCH_WEAPON_STYLES,
} from '../game/progression';
import {
  getStageLayout,
  getTerrainYFromSegments,
  type StageLayout,
  type StagePlatform,
} from '../game/stageLayouts';
import { formatKeyCodeLabel } from '../game/storage';
import type {
  ActiveSkillId,
  CatMerchantOffer,
  ChestChoiceOption,
  GameScreenState,
  HudSnapshot,
  LobbyInteractableKind,
  LobbyRoomId,
  MonsterType,
  RunInventoryEntry,
  RunItemDef,
  RunItemId,
  RunSubSkillEntry,
  RunSummary,
  RunTempBuffId,
  SaveData,
  SubSkillId,
} from '../game/types';
import { gameAudio, type BgmTrackId } from './audio';
import { VisualPool } from './particlePool';
import { SkillVfxPool } from './skillVfx';
import {
  getChestSprite,
  getEnchantAltarSprite,
  getEnchantPortalSprite,
  getGachaStatueSprite,
  getLunaSprite,
  getLyraSprite,
  getMonsterSprite,
  getOneEyedBatSprite,
  getOrangeChestSprite,
  getPortalSprite,
  getTombSprite,
  getTrainingDummySprite,
  getVelveraSprite,
  getWeaponNpcSprite,
  getWhiteCatNpcSprite,
  getWitchSprite,
  type EnemyAnimPose,
  type VelveraAnimFrame,
} from './pixelSprites';

const VIEW_WORLD_W = 1280;
const VIEW_WORLD_H = 680;
const DEFAULT_WORLD_W = 3600;
const DEFAULT_WORLD_H = 920;
const GRAVITY = 1520;

function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sx = x1 + (x2 - x1) * t;
    const sy = y1 + (y2 - y1) * t;
    if (sx >= rx && sx <= rx + rw && sy >= ry && sy <= ry + rh) {
      return true;
    }
  }
  return false;
}

interface EnemyEntity {
  id: number;
  kind: MonsterType | 'boss' | 'boss_bat';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  atk: number;
  facing: 1 | -1;
  state: 'seek' | 'windup' | 'attack' | 'recover' | 'ko';
  stateTimer: number;
  attackCooldown: number;
  hitFlash: number;
  koTimer: number;
  // Elemental Status Effects
  burnTimer: number;
  burnDps: number;
  burnTickAcc: number;
  freezeTimer: number;
  freezeLockTimer: number;
  poisonTimer: number;
  poisonDps: number;
  poisonTickAcc: number;
  hoverPhase: number;
  hasToken: boolean;
  bossPattern: number;
  aimX: number;
  aimY: number;
  laserEndX: number;
  laserEndY: number;
  laserHitApplied: boolean;
  homePlatform: StagePlatform | null;
  bossTotalBars?: number;
}

interface BossDangerZone {
  id: number;
  x: number;
  y: number;
  radius: number;
  timer: number;
  duration: number;
  damage: number;
  color: string;
}

interface PlayerHazardZone {
  id: number;
  kind: 'fire_trap' | 'poison_cloud';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damage: number;
  isCrit: boolean;
  tickAcc: number;
  skillLevel?: number;
}

interface DelayedSkillEvent {
  delay: number;
  run: () => void;
}

interface ActiveVortexZone {
  x: number;
  y: number;
  radius: number;
  life: number;
  tickAcc: number;
  damage: number;
  isCrit: boolean;
}

type LobbyProp = LobbyPropConfig;

interface ProjectileEntity {
  active: boolean;
  fromPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  pierce: number;
  life: number;
  color: string;
  coreColor: string;
  kind:
    | 'crescent'
    | 'spear'
    | 'bone'
    | 'orb'
    | 'aura_fist'
    | 'fireball'
    | 'ice_arrow'
    | 'witch_bolt'
    | 'kunai'
    | 'meteor';
  element?: 'burn' | 'freeze' | 'poison';
  skillLevel?: number;
}

interface ActiveBoomerang {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: 'out' | 'back';
  dist: number;
  maxDist: number;
  damage: number;
  isCrit: boolean;
  hitIds: Set<number>;
  color: string;
  coreColor: string;
  spin: number;
  skillLevel: number;
}

interface ActiveOrbitBlade {
  kind: 'shadow_blades' | 'razor_aura';
  life: number;
  maxLife: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  tickAcc: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onChestReward: (stage: number) => void;
  onTombReward: (stage: number) => void;
  onStageDraftRequest: (nextStage: number, nextSubStage: number) => void;
  onMonsterKilled: (kind: MonsterType) => void;
  onSupplyChestLoot: (loot: { gold: number; shards: number; essence: number }) => void;
  onChestChoiceOffer?: (chestIndex: number, options: ChestChoiceOption[]) => void;
  onInventoryFullDrop?: (item: RunItemDef) => void;
  onOpenInventory?: () => void;
  onCatMerchantOpen?: () => void;
  onLobbyInteract: (kind: LobbyInteractableKind) => void;
  onRunEnd: (summary: RunSummary) => void;
  onPauseRequest: () => void;
}

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  len: number;
  alpha: number;
  phase: number;
}

export class DungeonEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private save: SaveData;
  private stats: DerivedPlayerStats;
  private callbacks: EngineCallbacks;

  private mode: GameScreenState = 'title';
  private lobbyRoom: LobbyRoomId = 'main';
  private rafId = 0;
  private lastTime = 0;
  private resizeObserver: ResizeObserver | null = null;
  private viewW = 1280;
  private viewH = 680;
  private visibleWorldW = VIEW_WORLD_W;
  private visibleWorldH = VIEW_WORLD_H;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private camX = 0;
  private camY = 0;

  private pool = new VisualPool(440, 28, 72, 20);
  private skillVfx = new SkillVfxPool(64);
  private delayedSkillEvents: DelayedSkillEvent[] = [];
  private activeVortexes: ActiveVortexZone[] = [];
  private activeBoomerangs: ActiveBoomerang[] = [];
  private activeOrbitBlades: ActiveOrbitBlade[] = [];

  // Input state
  private keysHeld = new Set<string>();
  private touchMoveDir: -1 | 0 | 1 = 0;
  private touchDown = false;
  private jumpBuffer = 0;
  private slashBuffer = 0;
  private dashBuffer = 0;
  private jumpHeld = false;

  // Player state
  private px = 360;
  private py = 704;
  private pw = 48;
  private ph = 86;
  private pvx = 0;
  private pvy = 0;
  private facing: 1 | -1 = 1;
  private grounded = true;
  private coyoteTimer = 0;
  private airJumpsRemaining = 0;
  private hp = 100;
  private mp = 100;
  private invulnTimer = 0;
  private playerHitFlash = 0;
  private hurtBlinkTimer = 0;
  private squashX = 1;
  private squashY = 1;
  private walkDist = 0;

  // Stage-only Run Progression (Sub-Skills, Inventory max 5, Temp Buffs)
  private runSubSkills: RunSubSkillEntry[] = [];
  private runInventory: RunInventoryEntry[] = [];
  private nextItemUid = 1;
  private runTempBuffs = {
    atkPct: 0,
    speedPct: 0,
    critPct: 0,
    maxHpFlat: 0,
  };

  // Combat, Skills, Sub-Skills & Combo Chain
  private autoCombat = true;
  private autoSubSkillDelay = 0;
  private auraOverdriveTimer = 0;
  private comboStep = 0;
  private comboResetTimer = 0;
  private slashTimer = 0;
  private slashMaxTimer = 0.24;
  private slashCooldown = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  private skillCooldowns: [number, number, number] = [0, 0, 0];
  private subSkillCooldowns: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
  private skillAnim: {
    skillId: ActiveSkillId;
    timer: number;
    duration: number;
    style: 'sweep' | 'dash' | 'channel' | 'leap';
  } | null = null;
  private renderBodyTilt = 0;
  private renderFloatY = 0;
  private lunaCastFx: { kind: 'lifesteal' | 'dash' | 'eclipse'; timer: number; maxTimer: number } | null = null;
  private comboChain: ComboChainState = createInitialComboChainState();

  // Dungeon Room state
  private stage = 1;
  private subStage = 1;
  private currentLayout: StageLayout = getStageLayout(1, 1);
  private enemies: EnemyEntity[] = [];
  private nextEnemyId = 1;
  private projectiles: ProjectileEntity[] = [];
  private playerHazards: PlayerHazardZone[] = [];
  private nextHazardId = 1;
  private portalReady = false;
  private portalSide: 'left' | 'right' | null = null;
  private portalX = 3340;
  private portalY = 305;
  private portalScale = 1;
  private portalSpawnProgress = 1;
  private bossDeathSpot: { x: number; y: number } | null = null;
  private catMerchant: { x: number; y: number; active: boolean } | null = null;
  private catMerchantOffers: CatMerchantOffer[] = [];
  private chestReady = false;
  private chestOpened = false;
  private chestX = 1800;
  private chestY = 810;
  private supplyChests: Array<{ x: number; y: number; opened: boolean }> = [];
  private tomb: { x: number; y: number; opened: boolean } = { x: 1795, y: 328, opened: false };
  private roomBannerTimer = 0;
  private roomBannerText = '';

  // Boss Red Danger Zones & Lobby Training Dummy
  private dangerZones: BossDangerZone[] = [];
  private nextDangerZoneId = 1;
  private dummyHitTimer = 0;
  private dummyLastHitAt = -999;
  private dummyIdleSec = 0;
  private dummyLastHit = 0;
  private dummyMaxHit = 0;
  private dummyHitsLog: Array<{ t: number; dmg: number }> = [];
  private dummyDps = 0;

  // Run telemetry
  private score = 0;
  private kills = 0;
  private comboHits = 0;
  private comboDecayTimer = 0;
  private elapsedSec = 0;
  private runSilver = 0;
  private gemsEarned = 0;
  private goldEarned = 0;
  private shardsEarned = 0;
  private essenceEarned = 0;

  // Juice & Atmosphere
  private hitstopTimer = 0;
  private trauma = 0;
  private ambientTime = 0;
  private hudSyncTimer = 0;
  private weatherParticles: WeatherParticle[] = [];
  private stageBackdrops = new Map<string, HTMLCanvasElement>();
  private lobbyBackdropCanvas: HTMLCanvasElement;
  private lobbyBakedImageCanvas: HTMLCanvasElement | null = null;
  private warmGlowCanvas: HTMLCanvasElement;
  private arcaneGlowCanvas: HTMLCanvasElement;
  private divineGlowCanvas: HTMLCanvasElement;
  private lobbyTileW = 1220;
  private lobbyTorchY = 245;
  private pausedFrameRendered = false;
  private loopActive = false;

  constructor(
    canvas: HTMLCanvasElement,
    initialSave: SaveData,
    callbacks: EngineCallbacks
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.save = initialSave;
    this.stats = computePlayerStats(initialSave);
    this.callbacks = callbacks;

    for (let i = 0; i < 110; i++) {
      this.weatherParticles.push({
        x: Math.random() * DEFAULT_WORLD_W,
        y: Math.random() * DEFAULT_WORLD_H,
        vx: (Math.random() - 0.5) * 32,
        vy: 28 + Math.random() * 44,
        size: i % 3 === 0 ? 4 : 3,
        len: 12 + (i % 4) * 5,
        alpha: 0.25 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 64; i++) {
      this.projectiles.push({
        active: false,
        fromPlayer: true,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 10,
        damage: 10,
        isCrit: false,
        pierce: 1,
        life: 0,
        color: '#A855F7',
        coreColor: '#F3E8FF',
        kind: 'crescent',
      });
    }

    this.getStageBackdrop(1, this.currentLayout);
    this.lobbyBackdropCanvas = this.buildLobbyBackdrop();
    this.warmGlowCanvas = this.buildGlowSprite('rgba(251, 146, 60, 0.34)', 'rgba(234, 88, 12, 0.14)');
    this.arcaneGlowCanvas = this.buildGlowSprite('rgba(56, 189, 248, 0.24)', 'rgba(168, 85, 247, 0.12)');
    this.divineGlowCanvas = this.buildGlowSprite('rgba(250, 204, 21, 0.18)', 'rgba(168, 85, 247, 0.11)');
    const lobbyImg = new Image();
    lobbyImg.onload = () => {
      this.lobbyBakedImageCanvas = this.buildBakedLobbyImageBackdrop(lobbyImg);
      this.pausedFrameRendered = false;
    };
    lobbyImg.src = './assets/aistudio/image_ab0f9618.png';
    this.setupListeners();
    this.handleResize();
    this.startLoop();
  }

  private getActiveSkillBar(): [ActiveSkillId, ActiveSkillId, ActiveSkillId] {
    if (this.save.selectedCharacter === 'luna') {
      return this.save.lunaEquippedSkills;
    }
    if (this.save.selectedCharacter === 'witch') {
      return this.save.witchEquippedSkills;
    }
    return this.save.selectedCharacter === 'lyra'
      ? this.save.lyraEquippedSkills
      : this.save.equippedSkills;
  }

  private getEquippedSubSkills(): RunSubSkillEntry[] {
    return this.runSubSkills;
  }

  getRunSubSkills(): RunSubSkillEntry[] {
    return this.runSubSkills;
  }

  getRunInventory(): RunInventoryEntry[] {
    return this.runInventory;
  }

  getRunSilver(): number {
    return this.runSilver;
  }

  getCatMerchantOffers(): CatMerchantOffer[] {
    return this.catMerchantOffers;
  }

  private recomputeStats(adjustHp = true): void {
    const prevMaxHp = this.stats.maxHp;
    this.stats = computePlayerStats(this.save, this.runInventory, this.runTempBuffs, this.runSubSkills);
    if (adjustHp && this.stats.maxHp > prevMaxHp) {
      this.hp += this.stats.maxHp - prevMaxHp;
    }
    this.hp = Math.min(this.hp, this.stats.maxHp);
    this.mp = Math.min(this.mp, this.stats.maxMp);
  }

  applyChestSubSkill(skillId: SubSkillId, newLevel: number): void {
    const clamped = Math.max(1, Math.min(MAX_SUB_SKILL_LEVEL, newLevel));
    const existing = this.runSubSkills.find((s) => s.id === skillId);
    if (existing) {
      existing.level = Math.max(existing.level, clamped);
    } else if (this.runSubSkills.length < MAX_RUN_SUB_SKILLS) {
      this.runSubSkills.push({ id: skillId, level: clamped });
    } else {
      const upgradeable = this.runSubSkills.find((s) => s.level < MAX_SUB_SKILL_LEVEL);
      if (upgradeable) {
        upgradeable.level = Math.min(MAX_SUB_SKILL_LEVEL, upgradeable.level + 1);
      }
    }
    this.recomputeStats(false);
    this.emitHud(true);
  }

  applyTempBuff(buffId: RunTempBuffId): void {
    if (buffId === 'run_atk_boost') this.runTempBuffs.atkPct += 0.1;
    else if (buffId === 'run_speed_boost') this.runTempBuffs.speedPct += 0.1;
    else if (buffId === 'run_crit_boost') this.runTempBuffs.critPct += 0.08;
    else if (buffId === 'run_hp_surge') {
      this.runTempBuffs.maxHpFlat += 20;
      this.recomputeStats(true);
      this.hp = Math.min(this.stats.maxHp, this.hp + Math.round(this.stats.maxHp * 0.35));
      this.emitHud(true);
      return;
    }
    this.recomputeStats(true);
    this.emitHud(true);
  }

  addRunItem(itemId: RunItemId): boolean {
    return this.addRunItemDetailed(itemId).added;
  }

  private addRunItemDetailed(itemId: RunItemId): {
    added: boolean;
    upgraded: boolean;
    maxed: boolean;
    newLevel: number;
  } {
    const uid = `item_${this.nextItemUid++}`;
    const res = addRunInventoryItem(this.runInventory, itemId, uid);
    if (!res.added) {
      return { added: false, upgraded: false, maxed: res.maxed, newLevel: res.newLevel };
    }
    this.runInventory = res.next;
    this.recomputeStats(true);
    if (this.stats.hasDoubleJump && this.grounded) {
      this.airJumpsRemaining = 1;
    }
    this.emitHud(true);
    return { added: true, upgraded: res.upgraded, maxed: res.maxed, newLevel: res.newLevel };
  }

  removeRunItem(uid: string): void {
    this.runInventory = removeRunInventoryItem(this.runInventory, uid);
    this.recomputeStats(false);
    this.emitHud(true);
  }

  replaceRunItem(uidToRemove: string, newItemId: RunItemId): void {
    const filtered = removeRunInventoryItem(this.runInventory, uidToRemove);
    const uid = `item_${this.nextItemUid++}`;
    this.runInventory = addRunInventoryItem(filtered, newItemId, uid).next;
    this.recomputeStats(true);
    this.emitHud(true);
  }

  replaceRunSubSkillSlot(slotIndex: number, newSkillId: SubSkillId, newLevel = 1): void {
    this.runSubSkills = replaceRunSubSkill(this.runSubSkills, slotIndex, newSkillId, newLevel);
    if (slotIndex >= 0 && slotIndex < this.subSkillCooldowns.length) {
      this.subSkillCooldowns[slotIndex] = 0;
    }
    this.recomputeStats(false);
    this.emitHud(true);
  }

  buyCatMerchantOffer(offerUid: string): {
    status: 'bought' | 'insufficient_silver' | 'bag_full' | 'skills_full' | 'invalid';
    offer?: CatMerchantOffer;
  } {
    const offer = this.catMerchantOffers.find((o) => o.uid === offerUid);
    if (!offer || offer.purchased) return { status: 'invalid' };
    if (this.runSilver < offer.priceSilver) {
      return { status: 'insufficient_silver', offer };
    }

    const cx = this.px + this.pw * 0.5;
    if (offer.kind === 'item' && offer.itemDef) {
      const res = this.addRunItemDetailed(offer.itemDef.id);
      if (!res.added && !res.maxed) {
        return { status: 'bag_full', offer };
      }
      this.runSilver -= offer.priceSilver;
      offer.purchased = true;
      gameAudio.playChestOrGacha(true);
      this.pool.spawnBurst(cx, this.py + 28, 16, [offer.itemDef.accentHex, '#E2E8F0'], 55, 190, 4, true);
      this.pool.spawnText(cx, this.py - 28, `+${offer.itemDef.name}`, '#E2E8F0', 1.08, 'chain');
      this.emitHud(true);
      return { status: 'bought', offer };
    }

    if (offer.kind === 'sub_skill' && offer.subSkillDef) {
      const existing = this.runSubSkills.find((s) => s.id === offer.subSkillDef!.id);
      if (!existing && this.runSubSkills.length >= MAX_RUN_SUB_SKILLS) {
        return { status: 'skills_full', offer };
      }
      this.runSilver -= offer.priceSilver;
      offer.purchased = true;
      this.applyChestSubSkill(offer.subSkillDef.id, offer.nextLevel);
      gameAudio.playChestOrGacha(true);
      this.pool.spawnBurst(cx, this.py + 28, 16, [offer.subSkillDef.accentHex, '#E2E8F0'], 55, 190, 4, true);
      this.pool.spawnText(cx, this.py - 28, `+${offer.subSkillDef.name}`, '#C084FC', 1.08, 'chain');
      this.emitHud(true);
      return { status: 'bought', offer };
    }

    return { status: 'invalid' };
  }

  completeCatItemSwap(uidToRemove: string, offerUid: string): boolean {
    const offer = this.catMerchantOffers.find((o) => o.uid === offerUid);
    if (!offer || offer.purchased || offer.kind !== 'item' || !offer.itemDef) return false;
    if (this.runSilver < offer.priceSilver) return false;
    this.runSilver -= offer.priceSilver;
    offer.purchased = true;
    this.replaceRunItem(uidToRemove, offer.itemDef.id);
    gameAudio.playChestOrGacha(true);
    this.emitHud(true);
    return true;
  }

  completeCatSubSkillSwap(slotIndex: number, offerUid: string): boolean {
    const offer = this.catMerchantOffers.find((o) => o.uid === offerUid);
    if (!offer || offer.purchased || offer.kind !== 'sub_skill' || !offer.subSkillDef) return false;
    if (this.runSilver < offer.priceSilver) return false;
    this.runSilver -= offer.priceSilver;
    offer.purchased = true;
    this.replaceRunSubSkillSlot(slotIndex, offer.subSkillDef.id, 1);
    gameAudio.playChestOrGacha(true);
    this.emitHud(true);
    return true;
  }

  reopenTomb(): void {
    this.tomb.opened = false;
    this.emitHud(true);
  }

  private getTerrainYAt(centerX: number): number {
    return getTerrainYFromSegments(this.currentLayout.floorSegments, centerX);
  }

  private getActiveWorldW(): number {
    if (this.mode === 'lobby') {
      return getLobbyRoomWidth(this.lobbyRoom);
    }
    return this.currentLayout.worldW;
  }

  private getActiveWorldH(): number {
    return this.mode === 'lobby' ? LOBBY_H : this.currentLayout.worldH;
  }

  private getLobbyProps(): LobbyProp[] {
    return getLobbyRoomProps(this.lobbyRoom, this.save.language ?? 'id');
  }

  updateSaveData(nextSave: SaveData): void {
    this.save = nextSave;
    this.recomputeStats(true);
  }

  setMode(mode: GameScreenState): void {
    this.mode = mode;
    this.pausedFrameRendered = false;
    if (mode === 'title') {
      gameAudio.setBgmTrack('title');
    } else if (mode === 'lobby') {
      gameAudio.setBgmTrack(this.lobbyRoom === 'enchant' ? 'enchant' : 'lobby');
    }
    if (mode !== 'playing' && mode !== 'lobby') {
      this.clearHeldInputs();
    }
    this.ensureLoopRunning();
  }

  enterLobby(room: LobbyRoomId = 'main'): void {
    this.runSubSkills = [];
    this.runInventory = [];
    this.runTempBuffs = { atkPct: 0, speedPct: 0, critPct: 0, maxHpFlat: 0 };
    this.runSilver = 0;
    this.catMerchant = null;
    this.catMerchantOffers = [];
    this.bossDeathSpot = null;
    this.portalScale = 1;
    this.portalSpawnProgress = 1;
    this.stats = computePlayerStats(this.save);
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
    this.lobbyRoom = room;
    this.mode = 'lobby';
    this.enemies = [];
    this.dangerZones = [];
    this.playerHazards = [];
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].active = false;
    }
    this.pool.clear();
    this.skillVfx.clear();
    this.lunaCastFx = null;
    this.delayedSkillEvents = [];
    this.activeVortexes = [];
    this.activeBoomerangs = [];
    this.activeOrbitBlades = [];
    this.clearHeldInputs();
    this.playerHitFlash = 0;
    this.hurtBlinkTimer = 0;
    this.invulnTimer = 0;
    this.skillCooldowns = [0, 0, 0];
    this.subSkillCooldowns = [0, 0, 0, 0, 0, 0, 0, 0];
    this.dashCooldown = 0;
    this.auraOverdriveTimer = 0;
    this.comboChain = createInitialComboChainState();
    this.dummyHitTimer = 0;
    this.dummyLastHitAt = -999;
    this.dummyIdleSec = 0;
    this.dummyLastHit = 0;
    this.dummyMaxHit = 0;
    this.dummyDps = 0;
    this.dummyHitsLog = [];
    this.px = getLobbyRoomSpawnX(room);
    this.py = LOBBY_GROUND_Y - this.ph;
    this.pvx = 0;
    this.pvy = 0;
    this.grounded = true;
    this.airJumpsRemaining = 0;
    this.facing = 1;
    const w = this.getActiveWorldW();
    this.camX = Math.max(
      0,
      Math.min(w - this.visibleWorldW, this.px + this.pw * 0.5 - this.visibleWorldW * 0.5)
    );
    this.camY = 0;
    const isEn = this.save.language === 'en';
    this.roomBannerText =
      room === 'enchant'
        ? isEn
          ? 'ENCHANT & FORGE CHAMBER'
          : 'RUANG ENCHANT & PENEMPAAN'
        : isEn
          ? 'SANCTUARY · ADVENTURER LOBBY'
          : 'KUIL SUCI · LOBI PETUALANG';
    this.roomBannerTimer = 2.0;
    gameAudio.setBgmTrack(room === 'enchant' ? 'enchant' : 'lobby');
    this.emitHud(true);
    this.ensureLoopRunning();
  }

  startNewRun(startStage = 1, startSubStage = 1): void {
    this.runSubSkills = [];
    this.runInventory = [];
    this.runTempBuffs = { atkPct: 0, speedPct: 0, critPct: 0, maxHpFlat: 0 };
    this.runSilver = 0;
    this.catMerchant = null;
    this.catMerchantOffers = [];
    this.bossDeathSpot = null;
    this.portalScale = 1;
    this.portalSpawnProgress = 1;
    this.stats = computePlayerStats(this.save);
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
    this.stage = Math.max(1, Math.min(10, startStage));
    this.subStage = Math.max(1, Math.min(5, startSubStage));
    this.ensureLoopRunning();
    this.score = 0;
    this.kills = 0;
    this.comboHits = 0;
    this.elapsedSec = 0;
    this.gemsEarned = 0;
    this.goldEarned = 0;
    this.shardsEarned = 0;
    this.essenceEarned = 0;
    this.auraOverdriveTimer = 0;
    this.playerHitFlash = 0;
    this.hurtBlinkTimer = 0;
    this.invulnTimer = 0;
    this.skillCooldowns = [0, 0, 0];
    this.subSkillCooldowns = [0, 0, 0, 0, 0, 0, 0, 0];
    this.dashCooldown = 0;
    this.comboChain = createInitialComboChainState();
    this.dangerZones = [];
    this.playerHazards = [];
    this.pool.clear();
    this.skillVfx.clear();
    this.lunaCastFx = null;
    this.delayedSkillEvents = [];
    this.activeVortexes = [];
    this.activeBoomerangs = [];
    this.activeOrbitBlades = [];
    this.clearHeldInputs();
    this.mode = 'playing';
    this.setupRoom(this.stage, this.subStage);
    this.emitHud(true);
  }

  toggleAutoCombat(): boolean {
    this.autoCombat = !this.autoCombat;
    this.emitHud(true);
    return this.autoCombat;
  }

  advanceToRoom(nextStage: number, nextSubStage: number): void {
    this.stage = nextStage;
    this.subStage = nextSubStage;
    this.hp = Math.min(this.stats.maxHp, this.hp + Math.round(this.stats.maxHp * 0.18));
    this.mp = Math.min(this.stats.maxMp, this.mp + 30);
    this.pausedFrameRendered = false;
    this.hitstopTimer = 0;
    this.dashTimer = 0;
    this.slashTimer = 0;
    this.slashCooldown = 0;
    this.skillAnim = null;
    this.lunaCastFx = null;
    this.renderBodyTilt = 0;
    this.renderFloatY = 0;
    this.bossDeathSpot = null;
    this.portalScale = 1;
    this.portalSpawnProgress = 1;
    this.mode = 'playing';
    this.clearHeldInputs();
    this.jumpBuffer = 0;
    this.slashBuffer = 0;
    this.dashBuffer = 0;
    this.setupRoom(this.stage, this.subStage);
    this.emitHud(true);
    this.ensureLoopRunning();
  }

  private setupRoom(stage: number, subStage: number): void {
    this.enemies = [];
    this.dangerZones = [];
    this.playerHazards = [];
    this.skillVfx.clear();
    this.skillAnim = null;
    this.renderBodyTilt = 0;
    this.renderFloatY = 0;
    this.lunaCastFx = null;
    this.delayedSkillEvents = [];
    this.activeVortexes = [];
    this.activeBoomerangs = [];
    this.activeOrbitBlades = [];
    this.bossDeathSpot = null;
    this.portalScale = 1;
    this.portalSpawnProgress = 1;
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].active = false;
    }

    const layout = getStageLayout(stage, subStage);
    this.currentLayout = layout;
    const worldW = layout.worldW;
    const worldH = layout.worldH;
    this.getStageBackdrop(stage, layout);
    gameAudio.setBgmTrack(`stage_${stage}` as BgmTrackId);

    // Pick stage-specific spawn spot from active layout
    const spawnSpots = layout.playerSpawnSpots;
    const spawnIdx = (stage * 3 + subStage + Math.floor(Math.random() * spawnSpots.length)) % spawnSpots.length;
    const pickedSpawn = spawnSpots[spawnIdx] ?? { x: 360, y: this.getTerrainYAt(360) };
    this.px = Math.max(96, Math.min(worldW - this.pw - 96, pickedSpawn.x - this.pw * 0.5));
    this.py = this.getTerrainYAt(this.px + this.pw * 0.5) - this.ph;
    this.pvx = 0;
    this.pvy = 0;
    this.grounded = true;
    this.airJumpsRemaining = this.stats.hasDoubleJump ? 1 : 0;
    this.facing = this.px > worldW * 0.5 ? -1 : 1;
    this.invulnTimer = 0.6;
    this.playerHitFlash = 0;
    this.hurtBlinkTimer = 0;
    this.camX = Math.max(
      0,
      Math.min(worldW - this.visibleWorldW, this.px + this.pw * 0.5 - this.visibleWorldW * 0.5)
    );
    this.camY = Math.max(
      0,
      Math.min(worldH - this.visibleWorldH, this.py + this.ph * 0.5 - this.visibleWorldH * 0.55)
    );

    this.portalReady = false;
    this.portalSide = null;
    this.chestReady = false;
    this.chestOpened = false;

    // 3-5 Orange Supply Chests (strictly 30% chance for 5 chests)
    const candidateSpots = layout.supplyChestSpots;
    const spawnCenterX = this.px + this.pw * 0.5;
    const spawnFootY = this.py + this.ph;
    const safeChestSpots = candidateSpots.filter(
      (spot) => Math.abs(spot.x - spawnCenterX) >= 180 || Math.abs(spot.y - spawnFootY) >= 95
    );
    const chestPool = safeChestSpots.length >= 3 ? safeChestSpots : candidateSpots;
    const chestCount = rollSupplyChestCount(chestPool.length);
    const shuffledChests = [...chestPool].sort(() => Math.random() - 0.5);
    this.supplyChests = shuffledChests.slice(0, chestCount).map((spot) => ({
      x: spot.x,
      y: spot.y,
      opened: false,
    }));

    // 1 Ancient Tomb placed on active layout's tomb shrine spot
    this.tomb = {
      x: layout.tombSpot.x,
      y: layout.tombSpot.y,
      opened: false,
    };

    // Spawn the White Cat Merchant NPC every 3 rooms starting at 1-3 (1-3, 2-1, 2-4, 3-2, ...)
    if (shouldSpawnCatMerchant(stage, subStage)) {
      this.catMerchant = {
        x: layout.catMerchantSpot.x,
        y: layout.catMerchantSpot.y,
        active: true,
      };
      this.catMerchantOffers = generateCatMerchantOffers(stage, this.runInventory, this.runSubSkills);
    } else {
      this.catMerchant = null;
      this.catMerchantOffers = [];
    }

    const isBoss = subStage === 5;
    const weather = getStageWeather(stage);
    this.roomBannerText = isBoss
      ? `STAGE ${stage}-${subStage} · BOSS: ${STAGE_BOSS_NAMES[stage - 1]}`
      : `STAGE ${stage}-${subStage} · ${weather.label}`;
    this.roomBannerTimer = 2.6;

    // Spread monsters across BOTH lower floor terraces and mid/upper platforms
    const upperPlatforms = layout.platforms.filter(
      (p) => p.isUpperFloor || p.tier === 'mid' || p.tier === 'high'
    );
    const types = generateRoomMonsters(stage, subStage);
    for (let i = 0; i < types.length; i++) {
      const mType = types[i];
      const placeOnUpper = i % 3 !== 1 && mType !== 'kelalawar' && upperPlatforms.length > 0;
      let ex = 130 + ((worldW - 260) * (i + 0.25 + Math.random() * 0.5)) / types.length;
      let ey: number | undefined;
      let homePlat: StagePlatform | null = null;

      if (placeOnUpper) {
        const plat = upperPlatforms[i % upperPlatforms.length];
        ex = plat.x + 32 + Math.random() * Math.max(20, plat.w - 88);
        ey = plat.y;
        homePlat = plat;
      }

      if (!homePlat && Math.abs(ex - this.px) < 210) {
        ex = this.px < worldW * 0.5 ? this.px + 250 : this.px - 250;
      }
      ex = Math.max(80, Math.min(worldW - 120, ex));
      this.spawnMonster(mType, ex, stage, ey, homePlat);
    }

    if (isBoss) {
      let bossX = layout.bossSpawnSpot?.x ?? (this.px < worldW * 0.5 ? worldW - 340 : 260);
      if (Math.abs(bossX - this.px) < 320) {
        bossX = this.px < worldW * 0.5 ? worldW - 340 : 260;
      }
      this.spawnMonster('boss', bossX, stage);
      if (stage === 4) {
        const batX = bossX > worldW * 0.5 ? bossX - 200 : bossX + 200;
        this.spawnMonster('boss_bat', batX, stage);
      }
    }
  }

  private spawnMonster(
    kind: MonsterType | 'boss' | 'boss_bat',
    x: number,
    stage: number,
    surfaceY?: number,
    homePlatform: StagePlatform | null = null
  ): void {
    let w = 44;
    let h = 52;
    let hp = NORMAL_MONSTER_BASE_HP;
    let baseAtk = 15;
    const floorHere = surfaceY ?? this.getTerrainYAt(x + 24);
    let y = floorHere - h;

    if (kind === 'goblin') {
      w = 42;
      h = 48;
      hp = NORMAL_MONSTER_BASE_HP;
      baseAtk = 15;
      y = floorHere - h;
    } else if (kind === 'skeleton') {
      w = 42;
      h = 58;
      hp = NORMAL_MONSTER_BASE_HP;
      baseAtk = 18;
      y = floorHere - h;
    } else if (kind === 'kelalawar') {
      w = 48;
      h = 36;
      hp = NORMAL_MONSTER_BASE_HP;
      baseAtk = 17;
      y = 220 + Math.random() * 340;
    } else if (kind === 'zombie_knight') {
      w = 56;
      h = 68;
      hp = NORMAL_MONSTER_BASE_HP;
      baseAtk = 26;
      y = floorHere - h;
    } else if (kind === 'boss_bat') {
      w = 72;
      h = 56;
      hp = 24000;
      baseAtk = 28;
      y = 320;
    } else if (kind === 'boss') {
      // 2x larger than standard monsters + 99,999 HP + 5-layer HP bar (x5 -> x1)
      w = 136;
      h = 160;
      const totalBars = 5;
      hp = BOSS_MAX_HP;
      baseAtk = 34;
      y = floorHere - h;
      this.enemies.push({
        id: this.nextEnemyId++,
        kind,
        x,
        y,
        w,
        h,
        vx: 0,
        vy: 0,
        hp,
        maxHp: hp,
        atk: Math.round(baseAtk * (1 + (stage - 1) * 0.14)),
        facing: x > this.px ? -1 : 1,
        state: 'seek',
        stateTimer: 0,
        attackCooldown: 0.7 + Math.random() * 0.9,
        hitFlash: 0,
        koTimer: 0,
        burnTimer: 0,
        burnDps: 0,
        burnTickAcc: 0,
        freezeTimer: 0,
        freezeLockTimer: 0,
        poisonTimer: 0,
        poisonDps: 0,
        poisonTickAcc: 0,
        hoverPhase: Math.random() * Math.PI * 2,
        hasToken: false,
        bossPattern: 0,
        aimX: this.px + this.pw * 0.5,
        aimY: this.py + this.ph * 0.5,
        laserEndX: this.px + this.pw * 0.5,
        laserEndY: this.py + this.ph * 0.5,
        laserHitApplied: false,
        homePlatform,
        bossTotalBars: totalBars,
      });
      return;
    }

    this.enemies.push({
      id: this.nextEnemyId++,
      kind,
      x,
      y,
      w,
      h,
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      atk: Math.round(baseAtk * (1 + (stage - 1) * 0.14)),
      facing: x > this.px ? -1 : 1,
      state: 'seek',
      stateTimer: 0,
      attackCooldown: 0.7 + Math.random() * 0.9,
      hitFlash: 0,
      koTimer: 0,
      burnTimer: 0,
      burnDps: 0,
      burnTickAcc: 0,
      freezeTimer: 0,
      freezeLockTimer: 0,
      poisonTimer: 0,
      poisonDps: 0,
      poisonTickAcc: 0,
      hoverPhase: Math.random() * Math.PI * 2,
      hasToken: false,
      bossPattern: 0,
      aimX: this.px + this.pw * 0.5,
      aimY: this.py + this.ph * 0.5,
      laserEndX: this.px + this.pw * 0.5,
      laserEndY: this.py + this.ph * 0.5,
      laserHitApplied: false,
      homePlatform,
    });
  }

  private setupListeners(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('dungeon:screen-shake', this.onExternalScreenShake);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.addEventListener('mousedown', this.onMouseDown);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);
  }

  destroy(): void {
    this.loopActive = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('dungeon:screen-shake', this.onExternalScreenShake);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.resizeObserver?.disconnect();
  }

  clearHeldInputs(): void {
    this.keysHeld.clear();
    this.touchMoveDir = 0;
    this.touchDown = false;
    this.jumpHeld = false;
  }

  private onWindowBlur = (): void => {
    this.clearHeldInputs();
  };

  private onExternalScreenShake = (ev: Event): void => {
    const customEv = ev as CustomEvent<{ intensity?: number }>;
    const intensity =
      typeof customEv.detail?.intensity === 'number'
        ? Math.max(0.15, Math.min(1, customEv.detail.intensity))
        : 0.5;
    this.trauma = Math.min(1, Math.max(this.trauma, intensity));
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.clearHeldInputs();
    }
  };

  private handleResize(): void {
    const parent = this.canvas.parentElement;
    const rect = (parent ?? this.canvas).getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.viewW = w;
    this.viewH = h;
    this.pausedFrameRendered = false;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    const scaleX = w / VIEW_WORLD_W;
    const scaleY = h / VIEW_WORLD_H;
    if (w < 768) {
      this.scale = Math.max(0.44, Math.min(scaleX * 1.25, scaleY));
    } else {
      this.scale = Math.min(scaleX, scaleY);
      if (w > VIEW_WORLD_W && h > VIEW_WORLD_H) {
        this.scale = Math.max(scaleX, scaleY * 0.92);
      }
    }
    this.visibleWorldW = w / this.scale;
    this.visibleWorldH = h / this.scale;
    this.offsetX = Math.max(0, (w - this.getActiveWorldW() * this.scale) * 0.5);
    this.offsetY = Math.max(0, (h - this.getActiveWorldH() * this.scale) * 0.5);
    this.ensureLoopRunning();
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (this.mode !== 'playing' && this.mode !== 'lobby') return;
    if (e.button === 0) {
      this.slashBuffer = 0.14;
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.mode !== 'playing' && this.mode !== 'lobby') return;
    const code = e.code;
    const kb = this.save.keybindings;

    if (!e.repeat) {
      if (code === kb.jump || code === 'ArrowUp' || code === 'Space') {
        e.preventDefault();
        this.jumpBuffer = 0.14;
        this.jumpHeld = true;
      } else if (code === kb.attack || code === 'KeyZ') {
        this.slashBuffer = 0.14;
      } else if (code === kb.dash || code === 'KeyX' || code === 'ShiftLeft' || code === 'ShiftRight') {
        this.dashBuffer = 0.12;
      } else if (code === kb.skill1 || code === 'KeyQ') {
        this.tryCastSkill(0);
      } else if (code === kb.skill2 || code === 'KeyE') {
        this.tryCastSkill(1);
      } else if (code === kb.skill3 || code === 'KeyR') {
        this.tryCastSkill(2);
      } else if (code === kb.interact || code === 'Enter') {
        this.tryInteract();
      } else if (code === kb.inventory && this.mode === 'playing') {
        e.preventDefault();
        this.callbacks.onOpenInventory?.();
      }
    }
    this.keysHeld.add(code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const code = e.code;
    const kb = this.save.keybindings;
    this.keysHeld.delete(code);
    if (code === kb.jump || code === 'ArrowUp' || code === 'Space') {
      this.jumpHeld = false;
      if (this.pvy < -180) {
        this.pvy *= 0.48;
      }
    }
  };

  setTouchMove(dir: -1 | 0 | 1): void {
    this.touchMoveDir = dir;
  }
  setTouchDown(active: boolean): void {
    this.touchDown = active;
  }
  triggerTouchJump(): void {
    if (this.mode === 'playing' || this.mode === 'lobby') {
      this.jumpBuffer = 0.14;
      this.jumpHeld = true;
    }
  }
  releaseTouchJump(): void {
    this.jumpHeld = false;
    if (this.pvy < -180) this.pvy *= 0.48;
  }
  triggerTouchSlash(): void {
    if (this.mode === 'playing' || this.mode === 'lobby') this.slashBuffer = 0.14;
  }
  triggerTouchDash(): void {
    if (this.mode === 'playing' || this.mode === 'lobby') this.dashBuffer = 0.12;
  }
  triggerTouchSkill(slot: 0 | 1 | 2): void {
    if (this.mode === 'playing' || this.mode === 'lobby') this.tryCastSkill(slot);
  }
  triggerTouchInteract(): void {
    if (this.mode === 'playing' || this.mode === 'lobby') this.tryInteract();
  }

  private getNearLobbyObject(): LobbyInteractableKind | null {
    if (this.mode !== 'lobby') return null;
    const pcx = this.px + this.pw * 0.5;
    const props = this.getLobbyProps();
    for (let i = 0; i < props.length; i++) {
      if (props[i].kind === 'training_dummy') continue;
      if (Math.abs(pcx - props[i].x) < 92) {
        return props[i].kind;
      }
    }
    return null;
  }

  private getNearInteractable(): 'portal' | 'chest' | 'tomb' | 'supply' | 'cat_merchant' | null {
    const pcx = this.px + this.pw * 0.5;
    const pby = this.py + this.ph;
    if (
      this.catMerchant &&
      this.catMerchant.active &&
      Math.abs(pcx - this.catMerchant.x) < 84 &&
      Math.abs(pby - this.catMerchant.y) < 62
    ) {
      return 'cat_merchant';
    }
    if (
      this.chestReady &&
      !this.chestOpened &&
      Math.abs(pcx - this.chestX) < 88 &&
      Math.abs(pby - this.chestY) < 60
    ) {
      return 'chest';
    }
    if (!this.tomb.opened && Math.abs(pcx - this.tomb.x) < 76 && Math.abs(pby - this.tomb.y) < 60) {
      return 'tomb';
    }
    for (let i = 0; i < this.supplyChests.length; i++) {
      const sc = this.supplyChests[i];
      if (!sc.opened && Math.abs(pcx - sc.x) < 70 && Math.abs(pby - sc.y) < 55) {
        return 'supply';
      }
    }
    if (
      this.portalReady &&
      this.portalSpawnProgress >= 0.65 &&
      Math.abs(pcx - this.portalX) < 92 * this.portalScale &&
      Math.abs(pby - this.portalY) < 68
    ) {
      return 'portal';
    }
    return null;
  }

  private openSupplyChest(index: number): void {
    const sc = this.supplyChests[index];
    if (!sc || sc.opened) return;
    sc.opened = true;

    const gold = 85 + Math.floor(Math.random() * 75) + this.stage * 24;
    const shards = 2 + Math.floor(Math.random() * 4);
    const essence = 4 + Math.floor(Math.random() * 6);
    this.callbacks.onSupplyChestLoot({ gold, shards, essence });

    gameAudio.playChestOrGacha(true);
    this.pool.spawnBurst(sc.x, sc.y - 22, 22, ['#FB923C', '#FACC15', '#FEF08A'], 65, 220, 4, true);

    const options = rollDungeonChestOffer(this.runInventory, this.stats.maxHp);
    if (this.callbacks.onChestChoiceOffer) {
      // Freeze monsters & action while picking 1 of 4 choices (1 heal + 3 accessories)
      this.setMode('paused');
      this.callbacks.onChestChoiceOffer(index, options);
      this.emitHud(true);
      return;
    }

    // Headless fallback if no chest offer UI callback is attached
    for (const opt of options.slice(0, 1)) {
      this.claimChestChoiceOption(opt);
    }
    this.emitHud(true);
  }

  claimChestChoiceOption(opt: ChestChoiceOption): { status: 'claimed' | 'bag_full'; itemDef?: RunItemDef } {
    const cx = this.px + this.pw * 0.5;
    if (opt.kind === 'heal') {
      const healAmt = Math.max(
        1,
        opt.healAmount ?? Math.round(this.stats.maxHp * (opt.healPct ?? 0.25))
      );
      this.hp = Math.min(this.stats.maxHp, this.hp + healAmt);
      gameAudio.playChestOrGacha(false);
      this.pool.spawnBurst(cx, this.py + 28, 14, ['#4ADE80', '#BBF7D0'], 45, 160, 4, true);
      this.pool.spawnText(cx, this.py - 24, `+${healAmt} HP`, '#4ADE80', 1.1, 'heal');
      this.emitHud(true);
      return { status: 'claimed' };
    }

    if (opt.kind === 'item' && opt.itemDef) {
      const res = this.addRunItemDetailed(opt.itemDef.id);
      if (!res.added) {
        return { status: 'bag_full', itemDef: opt.itemDef };
      }
      gameAudio.playChestOrGacha(true);
      this.pool.spawnBurst(cx, this.py + 28, 16, [opt.itemDef.accentHex, '#FACC15'], 55, 180, 4, true);
      const lvLabel = res.upgraded
        ? res.newLevel >= 3
          ? `+${opt.itemDef.name} Lv.3 MAX!`
          : `+${opt.itemDef.name} Lv.${res.newLevel}!`
        : `+${opt.itemDef.name}`;
      this.pool.spawnText(cx, this.py - 30, lvLabel, res.upgraded ? '#FACC15' : '#FB923C', 1.08, 'chain');
      this.emitHud(true);
      return { status: 'claimed' };
    }

    return { status: 'claimed' };
  }

  tryInteract(): void {
    if (this.mode === 'lobby') {
      const target = this.getNearLobbyObject();
      if (!target) return;
      if (target === 'enchant_portal') {
        gameAudio.playPortal();
        this.enterLobby('enchant');
        return;
      }
      if (target === 'return_portal') {
        gameAudio.playPortal();
        this.enterLobby('main');
        return;
      }
      gameAudio.playClick();
      this.callbacks.onLobbyInteract(target);
      return;
    }

    if (this.mode !== 'playing') return;
    const target = this.getNearInteractable();
    if (target === 'chest') {
      this.chestOpened = true;
      gameAudio.playChestOrGacha(true);
      this.pool.spawnBurst(this.chestX, this.chestY - 26, 26, ['#FACC15', '#A855F7', '#F3E8FF'], 80, 280, 5, true);
      this.gemsEarned += 160;
      this.goldEarned += 350 + this.stage * 90;
      this.shardsEarned += 8 + this.stage * 2;
      this.essenceEarned += 18 + this.stage * 4;
      this.callbacks.onChestReward(this.stage);
      this.emitHud(true);
      return;
    }
    if (target === 'tomb') {
      this.tomb.opened = true;
      gameAudio.playChestOrGacha(true);
      this.pool.spawnBurst(this.tomb.x, this.tomb.y - 46, 26, ['#A855F7', '#F3E8FF', '#8A7656'], 70, 250, 5, true);
      this.callbacks.onTombReward(this.stage);
      this.emitHud(true);
      return;
    }
    if (target === 'supply') {
      const pcx = this.px + this.pw * 0.5;
      const pby = this.py + this.ph;
      const idx = this.supplyChests.findIndex(
        (sc) => !sc.opened && Math.abs(pcx - sc.x) < 72 && Math.abs(pby - sc.y) < 55
      );
      if (idx >= 0) this.openSupplyChest(idx);
      return;
    }
    if (target === 'cat_merchant') {
      gameAudio.playClick();
      this.clearHeldInputs();
      this.setMode('paused');
      this.callbacks.onCatMerchantOpen?.();
      this.emitHud(true);
      return;
    }
    if (target === 'portal') {
      gameAudio.playPortal();
      this.pool.spawnBurst(this.portalX, this.portalY - 52, 24, ['#C084FC', '#9333EA', '#F3E8FF'], 70, 220, 4, true);
      const next = advanceSubStage(this.stage, this.subStage);
      if (next.dungeonCompleted) {
        this.finishRun('victory');
        return;
      }
      this.clearHeldInputs();
      this.setMode('paused');
      this.callbacks.onStageDraftRequest(next.nextStage, next.nextSubStage);
    }
  }

  private ensureLoopRunning(): void {
    if (!this.loopActive) {
      this.startLoop();
    }
  }

  private startLoop(): void {
    this.loopActive = true;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      if (!this.loopActive) return;
      const rawDt = Math.max(0, (now - this.lastTime) / 1000);
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (this.mode === 'playing') {
        this.pausedFrameRendered = false;
        this.ambientTime += dt;
        this.updateWeather(dt);
        this.updatePlaying(dt);
        this.render();
      } else if (this.mode === 'lobby') {
        this.pausedFrameRendered = false;
        this.ambientTime += dt;
        if (this.dummyLastHitAt >= 0) {
          this.dummyIdleSec += Math.min(rawDt, 0.5);
        }
        this.updateWeather(dt);
        this.updateLobby(dt);
        this.render();
      } else {
        if (!this.pausedFrameRendered) {
          this.render();
          this.pausedFrameRendered = true;
        }
        this.loopActive = false;
        return;
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private updateWeather(dt: number): void {
    const weather = getStageWeather(this.stage).type;
    const activeW = this.currentLayout.worldW;
    const activeH = this.currentLayout.worldH;
    for (let i = 0; i < this.weatherParticles.length; i++) {
      const p = this.weatherParticles[i];
      if (weather === 'violet_embers') {
        // Falling/drifting embers for Stage 1-2
        p.y += (24 + (i % 5) * 8) * dt;
        p.x += Math.sin(this.ambientTime * 1.6 + p.phase) * 22 * dt;
        if (p.y > activeH + 12) {
          p.y = -14;
          p.x = Math.random() * activeW;
        }
      } else if (weather === 'ash_mist' || weather === 'spectral_fog') {
        p.x += (weather === 'ash_mist' ? 30 : -26) * dt;
        p.y += (12 + Math.sin(this.ambientTime * 1.1 + p.phase) * 8) * dt;
        if (p.x > activeW + 20) p.x = -20;
        if (p.x < -20) p.x = activeW + 20;
        if (p.y > activeH + 12) p.y = -12;
      } else if (weather === 'amethyst_rain' || weather === 'abyssal_storm') {
        const speedMult = weather === 'abyssal_storm' ? 1.45 : 1.0;
        p.x -= 95 * speedMult * dt;
        p.y += 420 * speedMult * dt;
        if (p.y > activeH - 90) {
          p.y = -20 - Math.random() * 80;
          p.x = Math.random() * (activeW + 180);
        }
      }
    }
  }

  private updateSmoothCharacterPose(dt: number): void {
    if (this.skillAnim) {
      this.skillAnim.timer = Math.max(0, this.skillAnim.timer - dt);
      if (this.skillAnim.timer <= 0) {
        this.skillAnim = null;
      }
    }

    let targetTilt = (this.pvx / 365) * 0.055 * this.facing;
    let targetFloatY = 0;

    if (this.dashTimer > 0) {
      targetTilt = 0.14;
      targetFloatY = -2;
    } else if (this.slashTimer > 0) {
      const progress = 1 - this.slashTimer / Math.max(0.01, this.slashMaxTimer);
      const arc = Math.sin(progress * Math.PI);
      targetTilt = (this.comboStep === 2 ? -0.08 : this.comboStep === 3 ? 0.12 : 0.08) * arc;
      targetFloatY = -2.5 * arc;
    } else if (this.skillAnim) {
      const p = 1 - this.skillAnim.timer / Math.max(0.01, this.skillAnim.duration);
      const bell = Math.sin(p * Math.PI);
      if (this.skillAnim.style === 'dash') {
        targetTilt = 0.17 * bell;
        targetFloatY = -3.5 * bell;
      } else if (this.skillAnim.style === 'sweep') {
        targetTilt = (p < 0.28 ? -0.1 : 0.14) * bell;
        targetFloatY = -3 * bell;
      } else if (this.skillAnim.style === 'leap') {
        targetTilt = -0.09 * bell;
        targetFloatY = -7 * bell;
      } else {
        targetTilt = -0.06 * Math.sin(p * Math.PI * 1.2);
        targetFloatY = -5 * bell;
      }
    } else if (!this.grounded) {
      targetTilt = Math.max(-0.08, Math.min(0.1, (this.pvy / 690) * 0.09));
    }

    const damp = Math.min(1, dt * 18);
    this.renderBodyTilt += (targetTilt - this.renderBodyTilt) * damp;
    this.renderFloatY += (targetFloatY - this.renderFloatY) * damp;
  }

  private updateLobby(dt: number): void {
    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    this.roomBannerTimer = Math.max(0, this.roomBannerTimer - dt);
    this.dummyHitTimer = Math.max(0, this.dummyHitTimer - dt);
    this.auraOverdriveTimer = Math.max(0, this.auraOverdriveTimer - dt);
    this.comboChain = tickComboChain(this.comboChain, dt, this.ambientTime);
    if (this.auraOverdriveTimer > 0 && Math.random() < 0.35) {
      this.pool.spawnParticle(
        this.px + this.pw * 0.5 + (Math.random() - 0.5) * 32,
        this.py + 38 + Math.random() * 44,
        (Math.random() - 0.5) * 40,
        -60 - Math.random() * 50,
        4,
        0.35,
        Math.random() < 0.5 ? '#F97316' : '#FACC15',
        0,
        true
      );
    }
    this.pool.update(dt);
    this.skillVfx.update(dt, this.px + this.pw * 0.5, this.py + this.ph * 0.5);

    const nowSec = this.ambientTime;
    if (this.dummyLastHitAt >= 0 && shouldResetDummyMetrics(0, this.dummyIdleSec, 8)) {
      this.dummyLastHitAt = -999;
      this.dummyIdleSec = 0;
      this.dummyLastHit = 0;
      this.dummyMaxHit = 0;
      this.dummyDps = 0;
      this.dummyHitsLog = [];
      this.emitHud(true);
    } else {
      this.dummyHitsLog = this.dummyHitsLog.filter((item) => nowSec - item.t <= 4.0);
      if (this.dummyHitsLog.length === 0) {
        this.dummyDps = 0;
      } else {
        const total = this.dummyHitsLog.reduce((sum, item) => sum + item.dmg, 0);
        const span = Math.max(1.0, nowSec - this.dummyHitsLog[0].t);
        this.dummyDps = Math.round(total / span);
      }
    }

    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.slashBuffer = Math.max(0, this.slashBuffer - dt);
    this.dashBuffer = Math.max(0, this.dashBuffer - dt);
    this.slashTimer = Math.max(0, this.slashTimer - dt);
    this.slashCooldown = Math.max(0, this.slashCooldown - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.comboResetTimer = Math.max(0, this.comboResetTimer - dt);
    if (this.lunaCastFx) {
      this.lunaCastFx.timer -= dt;
      if (this.lunaCastFx.timer <= 0) this.lunaCastFx = null;
    }
    for (let s = 0; s < 3; s++) {
      this.skillCooldowns[s] = Math.max(0, this.skillCooldowns[s] - dt);
    }
    for (let s = 0; s < this.subSkillCooldowns.length; s++) {
      this.subSkillCooldowns[s] = Math.max(0, this.subSkillCooldowns[s] - dt);
    }
    this.mp = Math.min(this.stats.maxMp, this.mp + this.stats.mpRegenPerSec * 2 * dt);

    this.squashX += (1 - this.squashX) * Math.min(1, dt * 14);
    this.squashY += (1 - this.squashY) * Math.min(1, dt * 14);

    this.updatePlayerMovement(dt);
    this.updateSmoothCharacterPose(dt);

    const activeWorldW = this.getActiveWorldW();
    const targetCamX = Math.max(
      0,
      Math.min(activeWorldW - this.visibleWorldW, this.px + this.pw * 0.5 - this.visibleWorldW * 0.5)
    );
    this.camX += (targetCamX - this.camX) * Math.min(1, dt * 8);
    this.camY = 0;

    this.updateLobbyAutoDummyAttack();
    this.handlePlayerActions();
    this.updateProjectiles(dt);
    this.updatePlayerHazards(dt);
    this.updateDelayedSkillEvents(dt);
    this.updateActiveVortexes(dt);
    this.updateBoomerangsAndOrbits(dt);

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.16) {
      this.hudSyncTimer = 0;
      this.emitHud(false);
    }
  }

  private updatePlaying(dt: number): void {
    this.elapsedSec += dt;
    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    this.playerHitFlash = Math.max(0, this.playerHitFlash - dt);
    this.hurtBlinkTimer = Math.max(0, this.hurtBlinkTimer - dt);
    this.roomBannerTimer = Math.max(0, this.roomBannerTimer - dt);
    this.autoSubSkillDelay = Math.max(0, this.autoSubSkillDelay - dt);
    this.auraOverdriveTimer = Math.max(0, this.auraOverdriveTimer - dt);
    if (this.portalReady && this.portalSpawnProgress < 1) {
      this.portalSpawnProgress = Math.min(1, this.portalSpawnProgress + dt / 1.4);
    }
    this.comboChain = tickComboChain(this.comboChain, dt, this.ambientTime);

    if (this.auraOverdriveTimer > 0 && Math.random() < 0.35) {
      this.pool.spawnParticle(
        this.px + this.pw * 0.5 + (Math.random() - 0.5) * 32,
        this.py + 38 + Math.random() * 44,
        (Math.random() - 0.5) * 40,
        -60 - Math.random() * 50,
        4,
        0.35,
        Math.random() < 0.5 ? '#F97316' : '#FACC15',
        0,
        true
      );
    }

    this.pool.update(dt);
    this.skillVfx.update(dt, this.px + this.pw * 0.5, this.py + this.ph * 0.5);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.slashBuffer = Math.max(0, this.slashBuffer - dt);
    this.dashBuffer = Math.max(0, this.dashBuffer - dt);
    this.slashTimer = Math.max(0, this.slashTimer - dt);
    this.slashCooldown = Math.max(0, this.slashCooldown - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.comboResetTimer = Math.max(0, this.comboResetTimer - dt);
    if (this.lunaCastFx) {
      this.lunaCastFx.timer -= dt;
      if (this.lunaCastFx.timer <= 0) this.lunaCastFx = null;
    }

    if (this.comboDecayTimer > 0) {
      this.comboDecayTimer -= dt;
      if (this.comboDecayTimer <= 0) this.comboHits = 0;
    }

    for (let s = 0; s < 3; s++) {
      this.skillCooldowns[s] = Math.max(0, this.skillCooldowns[s] - dt);
    }
    for (let s = 0; s < this.subSkillCooldowns.length; s++) {
      this.subSkillCooldowns[s] = Math.max(0, this.subSkillCooldowns[s] - dt);
    }

    this.mp = Math.min(this.stats.maxMp, this.mp + this.stats.mpRegenPerSec * dt);

    this.squashX += (1 - this.squashX) * Math.min(1, dt * 14);
    this.squashY += (1 - this.squashY) * Math.min(1, dt * 14);

    this.updatePlayerMovement(dt);
    this.updateSmoothCharacterPose(dt);

    // Smooth camera horizontal & vertical tracking across the active multi-tier dungeon
    const activeW = this.currentLayout.worldW;
    const activeH = this.currentLayout.worldH;
    const targetCamX = Math.max(
      0,
      Math.min(activeW - this.visibleWorldW, this.px + this.pw * 0.5 - this.visibleWorldW * 0.5)
    );
    const maxCamY = Math.max(0, activeH - this.visibleWorldH);
    const targetCamY = Math.max(
      0,
      Math.min(maxCamY, this.py + this.ph * 0.5 - this.visibleWorldH * 0.56)
    );
    this.camX += (targetCamX - this.camX) * Math.min(1, dt * 8);
    this.camY += (targetCamY - this.camY) * Math.min(1, dt * 7);

    // Auto-open Supply Chests when standing on same platform/elevation
    const pcx = this.px + this.pw * 0.5;
    const pby = this.py + this.ph;
    for (let i = 0; i < this.supplyChests.length; i++) {
      const sc = this.supplyChests[i];
      if (!sc.opened && Math.abs(pcx - sc.x) < 46 && Math.abs(pby - sc.y) < 42) {
        this.openSupplyChest(i);
        if (this.mode !== 'playing') return;
      }
    }

    this.updateAutoCombat();
    this.updateSubSkillAutoFire();
    this.handlePlayerActions();
    this.updateProjectiles(dt);
    this.updatePlayerHazards(dt);
    this.updateDelayedSkillEvents(dt);
    this.updateActiveVortexes(dt);
    this.updateBoomerangsAndOrbits(dt);
    this.updateDangerZones(dt);
    this.updateEnemies(dt);
    this.checkRoomClear();

    this.hudSyncTimer += dt;
    const hudInterval = this.comboDecayTimer > 0 ? 0.06 : 0.16;
    if (this.hudSyncTimer >= hudInterval) {
      this.hudSyncTimer = 0;
      this.emitHud(false);
    }
  }

  private spawnBossDangerZone(
    x: number,
    y: number,
    radius: number,
    duration: number,
    damage: number,
    color = '#EF4444'
  ): void {
    this.dangerZones.push({
      id: this.nextDangerZoneId++,
      x: Math.max(radius, Math.min(this.currentLayout.worldW - radius, x)),
      y,
      radius,
      timer: duration,
      duration,
      damage,
      color,
    });
  }

  private updateDangerZones(dt: number): void {
    const pcx = this.px + this.pw * 0.5;
    const pcy = this.py + this.ph * 0.5;
    for (let i = this.dangerZones.length - 1; i >= 0; i--) {
      const z = this.dangerZones[i];
      z.timer -= dt;
      if (z.timer <= 0) {
        this.trauma = Math.min(1, this.trauma + 0.25);
        this.pool.spawnBurst(z.x, z.y, 18, [z.color, '#FACC15', '#FCA5A5'], 80, 260, 5, true);
        if (Math.hypot(pcx - z.x, pcy - z.y) <= z.radius + 18) {
          this.damagePlayer(z.damage);
        }
        this.dangerZones.splice(i, 1);
      }
    }
  }

  private updatePlayerHazards(dt: number): void {
    for (let i = this.playerHazards.length - 1; i >= 0; i--) {
      const h = this.playerHazards[i];
      h.life -= dt;
      h.tickAcc += dt;

      if (h.kind === 'fire_trap') {
        if (Math.random() < 0.22) {
          this.pool.spawnParticle(
            h.x + (Math.random() - 0.5) * h.radius,
            h.y - 4,
            (Math.random() - 0.5) * 16,
            -35 - Math.random() * 25,
            3,
            0.3,
            '#F97316',
            0,
            true
          );
        }

        // Trigger when any enemy steps near the trap
        let triggered = false;
        for (const enemy of this.enemies) {
          if (enemy.state === 'ko') continue;
          const ex = enemy.x + enemy.w * 0.5;
          const ey = enemy.y + enemy.h;
          if (Math.hypot(ex - h.x, ey - h.y) <= h.radius + 16) {
            triggered = true;
            break;
          }
        }
        if (triggered) {
          this.trauma = Math.min(1, this.trauma + 0.2);
          gameAudio.playHit(true);
          this.skillVfx.spawn({
            kind: 'star_pillar',
            x: h.x,
            y: h.y,
            tx: h.x,
            ty: h.y,
            facing: 1,
            radius: 75,
            angle: 0,
            maxLife: 0.44,
            color: '#F97316',
            coreColor: '#FEF08A',
            accentColor: '#EF4444',
            orbitCount: 4,
            followPlayer: false,
            trackTargetToPlayer: false,
          });
          this.pool.spawnBurst(h.x, h.y - 16, 22, ['#F97316', '#FACC15', '#EF4444'], 90, 280, 5, true);
          for (const enemy of this.enemies) {
            if (enemy.state === 'ko') continue;
            const ex = enemy.x + enemy.w * 0.5;
            const ey = enemy.y + enemy.h * 0.5;
            if (Math.hypot(ex - h.x, ey - h.y) <= 125) {
              this.damageEnemy(enemy, h.damage, h.isCrit, 160, 'burn');
            }
          }
          this.playerHazards.splice(i, 1);
          continue;
        }
      } else if (h.kind === 'poison_cloud') {
        if (Math.random() < 0.45) {
          this.pool.spawnParticle(
            h.x + (Math.random() - 0.5) * h.radius * 1.4,
            h.y - 8 - Math.random() * 40,
            (Math.random() - 0.5) * 24,
            -28 - Math.random() * 24,
            4,
            0.45,
            Math.random() < 0.6 ? '#4ADE80' : '#A855F7',
            -10,
            true
          );
        }
        if (h.tickAcc >= 0.65) {
          h.tickAcc = 0;
          for (const enemy of this.enemies) {
            if (enemy.state === 'ko') continue;
            const ex = enemy.x + enemy.w * 0.5;
            const ey = enemy.y + enemy.h * 0.5;
            if (Math.hypot(ex - h.x, ey - h.y) <= h.radius + 20) {
              this.damageEnemy(enemy, Math.max(4, Math.round(h.damage * 0.45)), false, 20, 'poison');
            }
          }
          const dBox = this.getTrainingDummyBox();
          if (dBox && Math.hypot(dBox.x + dBox.w * 0.5 - h.x, dBox.y + dBox.h - h.y) <= h.radius + 20) {
            this.damageTrainingDummy(Math.max(4, Math.round(h.damage * 0.45)), false);
          }
        }
      }

      if (h.life <= 0) {
        this.playerHazards.splice(i, 1);
      }
    }
  }

  private updateDelayedSkillEvents(dt: number): void {
    for (let i = this.delayedSkillEvents.length - 1; i >= 0; i--) {
      const ev = this.delayedSkillEvents[i];
      ev.delay -= dt;
      if (ev.delay <= 0) {
        this.delayedSkillEvents.splice(i, 1);
        ev.run();
      }
    }
  }

  private updateActiveVortexes(dt: number): void {
    for (let i = this.activeVortexes.length - 1; i >= 0; i--) {
      const v = this.activeVortexes[i];
      v.life -= dt;
      v.tickAcc += dt;

      // Smoothly pull nearby non-boss enemies inward toward singularity core
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        const dist = Math.hypot(ex - v.x, ey - v.y);
        if (dist <= v.radius && dist > 14 && enemy.kind !== 'boss') {
          const pull = Math.min(1, dt * 3.8);
          enemy.x += (v.x - ex) * pull;
          if (enemy.kind === 'kelalawar' || enemy.kind === 'boss_bat') {
            enemy.y += (v.y - ey) * pull * 0.65;
          }
        }
      }

      if (v.tickAcc >= 0.34) {
        v.tickAcc = 0;
        const tickDmg = Math.max(4, Math.round(v.damage * 0.42));
        for (const enemy of this.enemies) {
          if (enemy.state === 'ko') continue;
          const ex = enemy.x + enemy.w * 0.5;
          const ey = enemy.y + enemy.h * 0.5;
          if (Math.hypot(ex - v.x, ey - v.y) <= v.radius) {
            this.damageEnemy(enemy, tickDmg, false, 20);
          }
        }
        const dBox = this.getTrainingDummyBox();
        if (dBox && Math.hypot(dBox.x + dBox.w * 0.5 - v.x, dBox.y + dBox.h * 0.5 - v.y) <= v.radius) {
          this.damageTrainingDummy(tickDmg, false);
        }
      }

      if (v.life <= 0) {
        this.trauma = Math.min(1, this.trauma + 0.25);
        this.skillVfx.spawn({
          kind: 'curse_sigil',
          x: v.x,
          y: v.y,
          tx: v.x,
          ty: v.y,
          facing: 1,
          radius: v.radius * 0.62,
          angle: 0,
          maxLife: 0.38,
          color: '#E879F9',
          coreColor: '#FEF08A',
          accentColor: '#9333EA',
          orbitCount: 6,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        this.pool.spawnBurst(v.x, v.y, 24, ['#E879F9', '#9333EA', '#FACC15'], 90, 290, 5, true);
        const popDmg = Math.max(6, Math.round(v.damage * 0.72));
        for (const enemy of this.enemies) {
          if (enemy.state === 'ko') continue;
          const ex = enemy.x + enemy.w * 0.5;
          const ey = enemy.y + enemy.h * 0.5;
          if (Math.hypot(ex - v.x, ey - v.y) <= v.radius * 0.92) {
            this.damageEnemy(enemy, popDmg, v.isCrit, 180);
          }
        }
        const dBox = this.getTrainingDummyBox();
        if (dBox && Math.hypot(dBox.x + dBox.w * 0.5 - v.x, dBox.y + dBox.h * 0.5 - v.y) <= v.radius * 0.92) {
          this.damageTrainingDummy(popDmg, v.isCrit);
        }
        this.activeVortexes.splice(i, 1);
      }
    }
  }

  private updateBoomerangsAndOrbits(dt: number): void {
    const pcx = this.px + this.pw * 0.5;
    const pcy = this.py + this.ph * 0.5;
    const dummyBox = this.getTrainingDummyBox();

    for (let i = this.activeBoomerangs.length - 1; i >= 0; i--) {
      const b = this.activeBoomerangs[i];
      b.spin += dt * 16;
      if (b.phase === 'out') {
        const step = Math.hypot(b.vx * dt, b.vy * dt);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.dist += step;
        if (b.dist >= b.maxDist) {
          b.phase = 'back';
          b.hitIds.clear();
        }
      } else {
        const ang = Math.atan2(pcy - b.y, pcx - b.x);
        const speed = 720;
        b.x += Math.cos(ang) * speed * dt;
        b.y += Math.sin(ang) * speed * dt;
        if (Math.hypot(pcx - b.x, pcy - b.y) <= 28) {
          this.activeBoomerangs.splice(i, 1);
          continue;
        }
      }

      for (const enemy of this.enemies) {
        if (enemy.state === 'ko' || b.hitIds.has(enemy.id)) continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - b.x, ey - b.y) <= 44) {
          b.hitIds.add(enemy.id);
          this.damageEnemy(enemy, b.damage, b.isCrit, 120, 'poison', b.skillLevel);
        }
      }
      if (dummyBox && !b.hitIds.has(-99) && Math.hypot(dummyBox.x + dummyBox.w * 0.5 - b.x, dummyBox.y + dummyBox.h * 0.5 - b.y) <= 46) {
        b.hitIds.add(-99);
        this.damageTrainingDummy(b.damage, b.isCrit);
      }
    }

    for (let i = this.activeOrbitBlades.length - 1; i >= 0; i--) {
      const ob = this.activeOrbitBlades[i];
      ob.life -= dt;
      ob.tickAcc += dt;
      if (ob.tickAcc >= (ob.kind === 'razor_aura' ? 0.36 : 0.42)) {
        ob.tickAcc = 0;
        for (const enemy of this.enemies) {
          if (enemy.state === 'ko') continue;
          const ex = enemy.x + enemy.w * 0.5;
          const ey = enemy.y + enemy.h * 0.5;
          if (Math.hypot(ex - pcx, ey - pcy) <= ob.radius + 26) {
            this.damageEnemy(
              enemy,
              Math.max(4, Math.round(ob.damage * 0.48)),
              ob.isCrit,
              80,
              ob.kind === 'razor_aura' ? 'burn' : 'poison'
            );
          }
        }
        if (dummyBox && Math.hypot(dummyBox.x + dummyBox.w * 0.5 - pcx, dummyBox.y + dummyBox.h * 0.5 - pcy) <= ob.radius + 32) {
          this.damageTrainingDummy(Math.max(4, Math.round(ob.damage * 0.48)), ob.isCrit);
        }
      }
      if (ob.life <= 0) {
        this.activeOrbitBlades.splice(i, 1);
      }
    }
  }

  private getTrainingDummyBox(): { x: number; y: number; w: number; h: number } | null {
    if (this.mode !== 'lobby') return null;
    const dummy = this.getLobbyProps().find((p) => p.kind === 'training_dummy');
    if (!dummy) return null;
    return { x: dummy.x - 32, y: dummy.y - 96, w: 64, h: 96 };
  }

  private damageTrainingDummy(damage: number, isCrit: boolean): void {
    const box = this.getTrainingDummyBox();
    if (!box) return;
    this.dummyHitTimer = 0.16;
    this.dummyLastHitAt = this.ambientTime;
    this.dummyIdleSec = 0;
    this.dummyLastHit = damage;
    this.dummyMaxHit = Math.max(this.dummyMaxHit, damage);
    this.dummyHitsLog.push({ t: this.ambientTime, dmg: damage });
    gameAudio.playHit(isCrit);
    this.pool.spawnBurst(
      box.x + box.w * 0.5,
      box.y + 44,
      isCrit ? 14 : 7,
      isCrit ? ['#FACC15', '#F97316', '#FFFFFF'] : ['#C084FC', '#F3E8FF'],
      65,
      200,
      4,
      isCrit
    );
    this.pool.spawnText(
      box.x + box.w * 0.5,
      box.y - 6,
      `${damage}`,
      isCrit ? '#FACC15' : '#F3E8FF',
      isCrit ? 1.35 : 1.05,
      isCrit ? 'crit' : 'normal',
      isCrit ? 'CRIT!' : ''
    );
    this.emitHud(true);
  }

  private updateLobbyAutoDummyAttack(): void {
    if (this.dashTimer > 0 || this.slashCooldown > 0) return;
    const dBox = this.getTrainingDummyBox();
    if (!dBox) return;
    const pcx = this.px + this.pw * 0.5;
    const pcy = this.py + this.ph * 0.5;
    const dcx = dBox.x + dBox.w * 0.5;
    const dcy = dBox.y + dBox.h * 0.5;
    const edx = dcx - pcx;
    const edy = Math.abs(dcy - pcy);
    const basicRange = this.save.selectedCharacter === 'witch' ? 190 : 108;
    if (Math.abs(edx) <= basicRange && edy <= 115) {
      const kb = this.save.keybindings;
      const moveLeft = this.keysHeld.has(kb.left) || this.keysHeld.has('ArrowLeft') || this.touchMoveDir === -1;
      const moveRight = this.keysHeld.has(kb.right) || this.keysHeld.has('ArrowRight') || this.touchMoveDir === 1;
      if (!moveLeft && !moveRight && edx !== 0) {
        this.facing = edx >= 0 ? 1 : -1;
      }
      this.slashBuffer = 0.12;
    }
  }

  private updateAutoCombat(): void {
    if (this.dashTimer > 0) return;
    const pcx = this.px + this.pw * 0.5;
    const pcy = this.py + this.ph * 0.5;

    let nearestEnemy: EnemyEntity | null = null;
    let nearestDist = Infinity;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.state === 'ko') continue;
      const d = Math.hypot(e.x + e.w * 0.5 - pcx, e.y + e.h * 0.5 - pcy);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = e;
      }
    }

    if (!nearestEnemy) return;
    const edx = nearestEnemy.x + nearestEnemy.w * 0.5 - pcx;
    const edy = Math.abs(nearestEnemy.y + nearestEnemy.h * 0.5 - pcy);

    const kb = this.save.keybindings;
    const moveLeft = this.keysHeld.has(kb.left) || this.keysHeld.has('ArrowLeft') || this.touchMoveDir === -1;
    const moveRight = this.keysHeld.has(kb.right) || this.keysHeld.has('ArrowRight') || this.touchMoveDir === 1;
    const userMoving = moveLeft || moveRight;

    // Auto Basic Attack is always active when enemies enter range (no manual attack button required)
    const basicRange = this.save.selectedCharacter === 'witch' ? 350 : 134;
    if (Math.abs(edx) <= basicRange && edy <= 125 && this.slashCooldown <= 0) {
      if (!userMoving && edx !== 0) {
        this.facing = edx >= 0 ? 1 : -1;
      }
      this.slashBuffer = 0.12;
    }

    // Auto ON -> automatically cast Character Active Skills [1][2][3] when enemies are within range!
    // Auto OFF -> [1][2][3] are strictly manual.
    if (!this.autoCombat) return;
    if (Math.abs(edx) <= 380 && edy <= 210) {
      const activeBar = this.getActiveSkillBar();
      for (let slot = 0; slot < 3; slot++) {
        const skillId = activeBar[slot];
        const def = ACTIVE_SKILLS[skillId];
        if (def && this.skillCooldowns[slot] <= 0 && this.mp >= def.mpCost) {
          if (!userMoving && edx !== 0) {
            this.facing = edx >= 0 ? 1 : -1;
          }
          this.tryCastSkill(slot as 0 | 1 | 2);
          break;
        }
      }
    }
  }

  // Stage Sub-Skills auto-attack automatically whenever any enemy enters their range (independent of Auto ON/OFF!)
  private updateSubSkillAutoFire(): void {
    if (this.runSubSkills.length === 0 || this.enemies.length === 0) return;
    if (this.autoSubSkillDelay > 0) return;

    const pcx = this.px + this.pw * 0.5;
    const pcy = this.py + this.ph * 0.5;

    for (let s = 0; s < this.runSubSkills.length; s++) {
      const sub = this.runSubSkills[s];
      const def = SUB_SKILLS[sub.id];
      if (!def || this.subSkillCooldowns[s] > 0 || this.mp < def.mpCost) continue;
      const scaledStats = getSubSkillScaledStats(sub.id, sub.level);

      let targetEnemy: EnemyEntity | null = null;
      let bestDist = Infinity;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.state === 'ko') continue;
        const d = Math.hypot(e.x + e.w * 0.5 - pcx, e.y + e.h * 0.5 - pcy);
        if (d <= scaledStats.range && d < bestDist) {
          bestDist = d;
          targetEnemy = e;
        }
      }

      if (targetEnemy) {
        this.tryCastSubSkill(s);
        this.autoSubSkillDelay = 0.35;
        break;
      }
    }
  }

  private updatePlayerMovement(dt: number): void {
    const kb = this.save.keybindings;
    const moveLeft = this.keysHeld.has(kb.left) || this.keysHeld.has('ArrowLeft') || this.touchMoveDir === -1;
    const moveRight = this.keysHeld.has(kb.right) || this.keysHeld.has('ArrowRight') || this.touchMoveDir === 1;
    const dir = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
    const overdriveMoveMult = this.auraOverdriveTimer > 0 ? 1.25 : 1.0;

    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      if (Math.random() < 0.65) {
        const trailHex =
          this.save.selectedCharacter === 'luna'
            ? (LUNA_SCYTHE_STYLES[this.save.lunaWeapon?.style ?? 'umbral_crescent_scythe']?.bladeCore ?? '#38BDF8')
            : this.save.selectedCharacter === 'lyra'
              ? '#F97316'
              : this.save.selectedCharacter === 'witch'
                ? (WITCH_WEAPON_STYLES[this.save.witchWeapon?.style ?? 'raven_gnarled_staff']?.lanternGlow ?? '#C084FC')
                : BLADE_AURAS[this.save.weapon.aura].trailHex;
        this.pool.spawnAfterimage(this.px, this.py, this.facing, trailHex);
      }
    } else {
      const targetSpeed = dir * 365 * this.stats.moveSpeedMult * overdriveMoveMult;
      const accel = this.grounded ? 2600 : 1750;
      if (this.pvx < targetSpeed) {
        this.pvx = Math.min(targetSpeed, this.pvx + accel * dt);
      } else if (this.pvx > targetSpeed) {
        this.pvx = Math.max(targetSpeed, this.pvx - accel * dt);
      }
      if (dir !== 0 && this.slashTimer <= 0) {
        this.facing = dir > 0 ? 1 : -1;
      }
    }

    if (this.grounded) {
      this.coyoteTimer = 0.1;
      this.airJumpsRemaining = this.stats.hasDoubleJump ? 1 : 0;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.pvy = -690;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
      this.squashX = 0.84;
      this.squashY = 1.18;
      gameAudio.playJump();
      const dustCol = this.save.selectedCharacter === 'lyra' ? '#F97316' : '#C084FC';
      this.pool.spawnBurst(this.px + this.pw * 0.5, this.py + this.ph, 5, [dustCol, '#475569'], 30, 90, 3);
    } else if (this.jumpBuffer > 0 && !this.grounded && this.airJumpsRemaining > 0) {
      // Double Jump from Boots!
      this.airJumpsRemaining--;
      this.pvy = -650;
      this.jumpBuffer = 0;
      this.squashX = 0.82;
      this.squashY = 1.2;
      gameAudio.playJump();
      this.pool.spawnBurst(this.px + this.pw * 0.5, this.py + this.ph, 10, ['#38BDF8', '#E0F2FE', '#FACC15'], 45, 130, 4, true);
    }

    if (this.dashTimer <= 0) {
      this.pvy += GRAVITY * dt;
    } else {
      this.pvy = 0;
    }

    const prevBottom = this.py + this.ph;
    this.px += this.pvx * dt;
    this.py += this.pvy * dt;

    if (this.grounded && Math.abs(this.pvx) > 25) {
      this.walkDist += Math.abs(this.pvx) * dt;
    }

    const activeW = this.getActiveWorldW();
    this.px = Math.max(24, Math.min(activeW - this.pw - 24, this.px));

    const dropDown = this.keysHeld.has(kb.down) || this.keysHeld.has('ArrowDown') || this.touchDown;

    let landed = false;
    if (this.mode !== 'lobby' && this.pvy >= 0 && !dropDown) {
      for (const plat of this.currentLayout.platforms) {
        const horiz = this.px + this.pw > plat.x + 8 && this.px < plat.x + plat.w - 8;
        if (horiz && prevBottom <= plat.y + 14 && this.py + this.ph >= plat.y) {
          this.py = plat.y - this.ph;
          this.pvy = 0;
          landed = true;
          break;
        }
      }
    }

    const floorY = this.mode === 'lobby' ? LOBBY_GROUND_Y : this.getTerrainYAt(this.px + this.pw * 0.5);
    if (this.py + this.ph >= floorY) {
      this.py = floorY - this.ph;
      this.pvy = 0;
      landed = true;
    }

    if (landed && !this.grounded) {
      this.squashX = 1.2;
      this.squashY = 0.8;
      this.airJumpsRemaining = this.stats.hasDoubleJump ? 1 : 0;
    }
    this.grounded = landed;
  }

  private handlePlayerActions(): void {
    const isLuna = this.save.selectedCharacter === 'luna';
    const isLyra = this.save.selectedCharacter === 'lyra';
    const isWitch = this.save.selectedCharacter === 'witch';
    const lunaStyle =
      LUNA_SCYTHE_STYLES[this.save.lunaWeapon?.style ?? 'umbral_crescent_scythe'] ??
      LUNA_SCYTHE_STYLES.umbral_crescent_scythe;
    const witchStyle =
      WITCH_WEAPON_STYLES[this.save.witchWeapon?.style ?? 'raven_gnarled_staff'] ??
      WITCH_WEAPON_STYLES.raven_gnarled_staff;
    const overdriveAtkMult = this.auraOverdriveTimer > 0 ? 1.3 : 1.0;
    const chainSpeedMult = 1 + this.comboChain.atkSpeedBonus;
    const chainDmgMult = 1 + this.comboChain.damageBonus;

    if (this.dashBuffer > 0 && this.dashCooldown <= 0) {
      this.dashBuffer = 0;
      this.dashTimer = 0.16;
      this.dashCooldown = 0.72;
      this.invulnTimer = Math.max(this.invulnTimer, 0.22);
      this.pvx = this.facing * 820;
      this.pvy = 0;
      gameAudio.playDash();
      const cols = isLuna
        ? [lunaStyle.bladeCore, lunaStyle.bladeGlow, '#E9D5FF']
        : isLyra
          ? ['#FEF08A', '#F97316']
          : isWitch
            ? [witchStyle.lanternGlow, '#FACC15']
            : [BLADE_AURAS[this.save.weapon.aura].coreHex, BLADE_AURAS[this.save.weapon.aura].glowHex];
      this.pool.spawnBurst(this.px + this.pw * 0.5, this.py + this.ph * 0.5, 10, cols, 50, 180, 4, true);
    }

    if (this.slashBuffer > 0 && this.slashCooldown <= 0) {
      this.slashBuffer = 0;
      this.comboStep = this.comboResetTimer > 0 ? (this.comboStep % 3) + 1 : 1;
      this.comboResetTimer = 0.65;

      const cdBase = this.comboStep === 3 ? 0.34 : 0.22;
      this.slashCooldown = cdBase / (this.stats.attackSpeedMult * overdriveAtkMult * chainSpeedMult);
      this.slashMaxTimer = Math.max(0.22, Math.min(0.32, this.slashCooldown * 0.9));
      this.slashTimer = this.slashMaxTimer;
      this.pvx += this.facing * (isWitch ? 40 : this.comboStep === 3 ? 195 : 95);

      gameAudio.playSlash(this.comboStep);
      const cx = this.px + this.pw * 0.5 + this.facing * 26;
      const cy = this.py + this.ph * 0.45;
      const reach = isLuna
        ? 76
        : isLyra
          ? 64
          : isWitch
            ? 68
            : this.save.weapon.style === 'amethyst_crescent'
              ? 74
              : 62;

      const mult =
        getBasicAttackComboMultiplier(this.save.selectedCharacter, this.comboStep) *
        (this.auraOverdriveTimer > 0 ? 1.2 : 1.0) *
        chainDmgMult;

      if (isLuna) {
        if (this.comboStep === 1) {
          this.pool.spawnSlashArc(cx + this.facing * 12, cy - 4, this.facing, reach, -1.05, 0.85, lunaStyle.bladeCore, lunaStyle.bladeGlow, 7, 0.16, 'basic');
          this.pool.spawnBurst(cx + this.facing * 42, cy, 6, [lunaStyle.bladeCore, lunaStyle.bladeGlow, '#E9D5FF'], 55, 165, 3, true);
        } else if (this.comboStep === 2) {
          this.pool.spawnSlashArc(cx + this.facing * 10, cy - 8, this.facing, reach + 6, -1.35, 0.72, lunaStyle.bladeCore, lunaStyle.bladeGlow, 8, 0.17, 'basic');
          this.pool.spawnBurst(cx + this.facing * 44, cy - 12, 7, [lunaStyle.bladeCore, lunaStyle.bladeGlow], 65, 190, 3, true);
        } else {
          this.pool.spawnSlashArc(cx + this.facing * 14, cy, this.facing, reach + 18, -1.65, 1.55, '#E0F2FE', lunaStyle.bladeGlow, 10, 0.21, 'basic');
          this.pool.spawnBurst(cx + this.facing * 48, cy + 4, 11, [lunaStyle.bladeCore, lunaStyle.bladeGlow, '#F5D0FE'], 85, 240, 4, true);
        }
      } else if (isWitch) {
        // Seraphina casts Astral Staff Bolts & Raven Lantern sparks!
        this.pool.spawnSlashArc(cx + this.facing * 6, cy - 10, this.facing, 42, -0.8, 0.8, '#FEF08A', witchStyle.lanternGlow, 6, 0.14, 'basic');
        this.pool.spawnBurst(cx + this.facing * 18, cy - 8, 9, [witchStyle.lanternGlow, '#FACC15', '#E9D5FF'], 55, 175, 4, true);
        const bolts = this.comboStep === 3 ? 2 : 1;
        for (let b = 0; b < bolts; b++) {
          const { damage, isCrit } = calculateSlashDamage(
            this.stats,
            mult * (bolts > 1 ? 0.68 : 1.0),
            Math.random,
            1,
            this.save.selectedCharacter
          );
          this.spawnProjectile({
            fromPlayer: true,
            x: cx + this.facing * 18,
            y: cy - 8 + (b === 1 ? -14 : 0),
            vx: this.facing * 680,
            vy: b === 1 ? -28 : 0,
            radius: this.comboStep === 3 ? 15 : 12,
            damage,
            isCrit,
            pierce: this.comboStep === 3 ? 2 : 1,
            life: 0.9,
            color: witchStyle.lanternGlow,
            coreColor: '#FEF08A',
            kind: 'witch_bolt',
          });
        }
      } else if (isLyra) {
        if (this.comboStep === 1) {
          this.pool.spawnSlashArc(cx + this.facing * 12, cy - 6, this.facing, 48, -0.55, 0.55, '#FEF08A', '#F97316', 7, 0.15, 'basic');
          this.pool.spawnBurst(cx + this.facing * 24, cy - 6, 8, ['#FEF08A', '#F97316', '#EF4444'], 60, 190, 4, true);
        } else if (this.comboStep === 2) {
          this.pool.spawnSlashArc(cx, cy - 8, this.facing, 66, -1.35, 0.65, '#FDE047', '#EF4444', 8, 0.17, 'basic');
          this.pool.spawnBurst(cx + this.facing * 20, cy - 12, 10, ['#FACC15', '#F97316'], 70, 210, 4, true);
        } else {
          this.pool.spawnSlashArc(cx, cy, this.facing, 78, -1.75, 1.75, '#FEF08A', '#EA580C', 11, 0.21, 'basic');
          this.pool.spawnBurst(cx + this.facing * 24, cy, 14, ['#FEF08A', '#F97316', '#EF4444'], 80, 240, 5, true);
        }
      } else {
        const aura = BLADE_AURAS[this.save.weapon.aura];
        if (this.comboStep === 1) {
          this.pool.spawnSlashArc(cx, cy, this.facing, reach, -0.95, 0.75, aura.coreHex, aura.glowHex, 6, 0.15, 'basic');
        } else if (this.comboStep === 2) {
          this.pool.spawnSlashArc(cx, cy, this.facing, reach + 6, -1.2, 1.05, aura.coreHex, aura.glowHex, 7, 0.16, 'basic');
        } else {
          this.pool.spawnSlashArc(cx, cy, this.facing, reach + 18, -1.65, 1.65, aura.coreHex, aura.glowHex, 10, 0.2, 'basic');
        }
      }

      const hitBox = {
        x: this.facing === 1 ? this.px + 12 : this.px + this.pw - 12 - (reach + 38),
        y: this.py - 14,
        w: reach + 38,
        h: this.ph + 26,
      };

      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        if (aabbOverlap(hitBox, enemy)) {
          const { damage, isCrit } = calculateSlashDamage(
            this.stats,
            isWitch ? mult * 0.45 : mult,
            Math.random,
            1,
            this.save.selectedCharacter
          );
          this.damageEnemy(enemy, damage, isCrit, this.comboStep === 3 ? 280 : 140);
        }
      }

      const dummyBox = this.getTrainingDummyBox();
      if (dummyBox && aabbOverlap(hitBox, dummyBox)) {
        const { damage, isCrit } = calculateSlashDamage(
          this.stats,
          isWitch ? mult * 0.45 : mult,
          Math.random,
          1,
          this.save.selectedCharacter
        );
        this.damageTrainingDummy(damage, isCrit);
      }
    }
  }

  private applyComboChainTrigger(tag: ActiveSkillId | SubSkillId): void {
    const chainTag = tag in SUB_SKILLS ? SUB_SKILLS[tag as SubSkillId].chainTag : ACTIVE_SKILLS[tag as ActiveSkillId].chainTag;
    const { nextState, triggeredBuff } = recordSkillChain(this.comboChain, chainTag, this.ambientTime);
    this.comboChain = nextState;
    if (triggeredBuff) {
      const cx = this.px + this.pw * 0.5;
      const bonusParts: string[] = [];
      if (triggeredBuff.atkSpeedBonus > 0) bonusParts.push(`+${Math.round(triggeredBuff.atkSpeedBonus * 100)}% SPD`);
      if (triggeredBuff.damageBonus > 0) bonusParts.push(`+${Math.round(triggeredBuff.damageBonus * 100)}% DMG`);
      this.pool.spawnText(
        cx,
        this.py - 28,
        `${triggeredBuff.name} (${bonusParts.join(' · ')})`,
        '#FACC15',
        1.05,
        'chain',
        'COMBO CHAIN!'
      );
      this.pool.spawnBurst(cx, this.py + this.ph * 0.4, 16, ['#FACC15', '#C084FC', '#38BDF8'], 70, 230, 4, true);
    }
  }

  private tryCastSkill(slot: 0 | 1 | 2): void {
    const activeBar = this.getActiveSkillBar();
    const skillId = activeBar[slot];
    const def = ACTIVE_SKILLS[skillId];
    if (!def) return;
    const skillLevel = Math.max(1, this.save.skillLevels[skillId] ?? 1);

    if (this.skillCooldowns[slot] > 0 || this.mp < def.mpCost) return;

    this.mp -= def.mpCost;
    this.skillCooldowns[slot] = def.cooldown * (1 - this.stats.cooldownReduction);
    const animMeta: { style: 'sweep' | 'dash' | 'channel' | 'leap'; duration: number } =
      skillId === 'luna_umbral_rush' || skillId === 'phantom_blink' || skillId === 'lyra_fist_rush'
        ? { style: 'dash', duration: 0.36 }
        : skillId === 'luna_soul_harvest' ||
            skillId === 'witch_void_vortex' ||
            skillId === 'lyra_aura_overdrive' ||
            skillId === 'witch_arcane_lightning' ||
            skillId === 'witch_chrono_nova'
          ? { style: 'channel', duration: 0.42 }
          : skillId === 'demon_eclipse' ||
              skillId === 'lyra_cyclone_kick' ||
              skillId === 'witch_starfall_meteor' ||
              skillId === 'luna_abyssal_execution' ||
              skillId === 'lyra_earthshaker_slam' ||
              skillId === 'lyra_phoenix_uppercut'
            ? { style: 'leap', duration: 0.40 }
            : { style: 'sweep', duration: 0.38 };
    this.skillAnim = {
      skillId,
      timer: animMeta.duration,
      duration: animMeta.duration,
      style: animMeta.style,
    };
    if (animMeta.style === 'dash' || animMeta.style === 'sweep') {
      this.squashX = 1.09;
      this.squashY = 0.92;
    } else {
      this.squashX = 0.93;
      this.squashY = 1.08;
    }
    gameAudio.playSkill();
    this.applyComboChainTrigger(skillId);

    const chainDmgMult = 1 + this.comboChain.damageBonus;
    const aura = BLADE_AURAS[this.save.weapon.aura];
    const cx = this.px + this.pw * 0.5;
    const cy = this.py + this.ph * 0.5;

    const lunaStyle =
      LUNA_SCYTHE_STYLES[this.save.lunaWeapon?.style ?? 'umbral_crescent_scythe'] ??
      LUNA_SCYTHE_STYLES.umbral_crescent_scythe;

    if (skillId === 'luna_soul_harvest') {
      // Lifesteal Cast Activation: crimson-violet reaping scythe crescent + inward shadow blades + blood drain tendrils
      this.comboStep = 3;
      this.trauma = Math.min(1, this.trauma + 0.36);
      this.lunaCastFx = { kind: 'lifesteal', timer: 0.3, maxTimer: 0.3 };
      this.skillVfx.spawn({
        kind: 'inward_motes',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: this.facing,
        radius: 68,
        angle: 0,
        maxLife: 0.3,
        color: '#E11D48',
        coreColor: '#F5D0FE',
        accentColor: '#9333EA',
        orbitCount: 6,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      const reapX = cx + this.facing * 26;
      this.skillVfx.spawn({
        kind: 'blood_scythe_reap',
        x: reapX,
        y: cy + 2,
        tx: reapX,
        ty: cy + 2,
        facing: this.facing,
        radius: 150,
        angle: 0,
        maxLife: 0.56,
        color: '#F43F5E',
        coreColor: '#FFE4E6',
        accentColor: '#C026D3',
        orbitCount: 4,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnSlashArc(cx + this.facing * 20, cy - 4, this.facing, 132, -1.85, 1.75, '#FFE4E6', '#F43F5E', 13, 0.25, 'skill');
      this.pool.spawnBurst(cx + this.facing * 36, cy, 18, ['#F43F5E', '#C026D3', '#F5D0FE'], 85, 260, 4, true);

      let hits = 0;
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - reapX, ey - cy) < 175) {
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageEnemy(enemy, damage, isCrit, 210);
          this.skillVfx.spawn({
            kind: 'drain_tendril',
            x: ex,
            y: ey,
            tx: cx,
            ty: cy,
            facing: this.facing,
            radius: 40,
            angle: 0,
            maxLife: 0.58,
            color: '#E11D48',
            coreColor: '#F5D0FE',
            accentColor: '#4ADE80',
            orbitCount: 3,
            followPlayer: false,
            trackTargetToPlayer: true,
          });
          hits++;
        }
      }
      const dBoxL1 = this.getTrainingDummyBox();
      if (dBoxL1) {
        const dx = dBoxL1.x + dBoxL1.w * 0.5;
        const dy = dBoxL1.y + dBoxL1.h * 0.5;
        if (Math.hypot(dx - cx, dy - cy) < 185) {
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageTrainingDummy(damage, isCrit);
          this.skillVfx.spawn({
            kind: 'drain_tendril',
            x: dx,
            y: dy,
            tx: cx,
            ty: cy,
            facing: this.facing,
            radius: 40,
            angle: 0,
            maxLife: 0.58,
            color: '#E11D48',
            coreColor: '#F5D0FE',
            accentColor: '#4ADE80',
            orbitCount: 3,
            followPlayer: false,
            trackTargetToPlayer: true,
          });
          hits++;
        }
      }
      if (hits > 0) {
        const heal = Math.max(8, Math.round(this.stats.maxHp * 0.1));
        this.hp = Math.min(this.stats.maxHp, this.hp + heal);
        this.skillVfx.spawn({
          kind: 'sustain_pulse',
          x: cx,
          y: cy,
          tx: cx,
          ty: cy,
          facing: this.facing,
          radius: 54,
          angle: 0,
          maxLife: 0.54,
          color: '#E11D48',
          coreColor: '#F0FDF4',
          accentColor: '#4ADE80',
          orbitCount: 4,
          followPlayer: true,
          trackTargetToPlayer: false,
        });
        this.pool.spawnText(cx, this.py - 16, `+${heal} HP`, '#4ADE80', 1.1, 'heal');
      }
    } else if (skillId === 'luna_umbral_rush') {
      // Shadow Dash-Slash: crisp directional launch flash + bolder origin afterimage before dashing
      this.comboStep = 1;
      this.invulnTimer = Math.max(this.invulnTimer, 0.36);
      this.lunaCastFx = { kind: 'dash', timer: 0.24, maxTimer: 0.24 };
      const startX = cx;
      this.skillVfx.spawn({
        kind: 'launch_flash',
        x: startX,
        y: cy,
        tx: startX,
        ty: cy,
        facing: this.facing,
        radius: 52,
        angle: 0,
        maxLife: 0.22,
        color: lunaStyle.bladeGlow,
        coreColor: '#E0F2FE',
        accentColor: lunaStyle.bladeCore,
        orbitCount: 4,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      // Extra bold afterimage stamped directly at launch origin
      this.pool.spawnAfterimage(startX - this.pw * 0.5, this.py, this.facing, '#E0F2FE');
      const rushDist = 250 * this.facing;
      const activeW = this.getActiveWorldW();
      this.px = Math.max(24, Math.min(activeW - this.pw - 24, this.px + rushDist));
      const endX = this.px + this.pw * 0.5;
      for (let i = 0; i < 6; i++) {
        this.pool.spawnAfterimage(
          startX + ((endX - startX) * i) / 6 - this.pw * 0.5,
          this.py,
          this.facing,
          lunaStyle.bladeCore
        );
      }
      this.skillVfx.spawn({
        kind: 'dash_ribbon',
        x: startX,
        y: cy,
        tx: endX,
        ty: cy,
        facing: this.facing,
        radius: 60,
        angle: 0,
        maxLife: 0.42,
        color: lunaStyle.bladeGlow,
        coreColor: '#E0F2FE',
        accentColor: lunaStyle.bladeCore,
        orbitCount: 3,
        followPlayer: false,
        trackTargetToPlayer: false,
      });

      const dashFacing = this.facing;
      const slashCy = cy;
      for (let step = 0; step < 3; step++) {
        const sx = startX + ((endX - startX) * (step + 0.5)) / 3;
        const triggerSlash = () => {
          this.skillVfx.spawn({
            kind: 'cross_slash',
            x: sx,
            y: slashCy + (step - 1) * 10,
            tx: sx,
            ty: slashCy,
            facing: dashFacing,
            radius: 76,
            angle: (step % 2 === 0 ? -0.58 : 0.42) * dashFacing,
            maxLife: 0.3,
            color: lunaStyle.bladeGlow,
            coreColor: '#E0F2FE',
            accentColor: '#38BDF8',
            orbitCount: 2,
            followPlayer: false,
            trackTargetToPlayer: false,
          });
          this.pool.spawnBurst(sx, slashCy, 12, [lunaStyle.bladeCore, lunaStyle.bladeGlow, '#E0F2FE'], 70, 230, 4, true);
          for (const enemy of this.enemies) {
            if (enemy.state === 'ko') continue;
            const ex = enemy.x + enemy.w * 0.5;
            const ey = enemy.y + enemy.h * 0.5;
            if (Math.abs(ex - sx) <= 85 && Math.abs(ey - slashCy) <= 115) {
              const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
              this.damageEnemy(enemy, Math.max(4, Math.round(damage * 0.44)), isCrit, 160);
            }
          }
          const dBox = this.getTrainingDummyBox();
          if (dBox) {
            const dex = dBox.x + dBox.w * 0.5;
            const dey = dBox.y + dBox.h * 0.5;
            if (Math.abs(dex - sx) <= 95 && Math.abs(dey - slashCy) <= 125) {
              const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
              this.damageTrainingDummy(Math.max(4, Math.round(damage * 0.44)), isCrit);
            }
          }
        };
        if (step === 0) triggerSlash();
        else this.delayedSkillEvents.push({ delay: step * 0.085, run: triggerSlash });
      }
    } else if (skillId === 'luna_lunar_eclipse') {
      // Crescent Eclipse Dome AoE: brief lunar corona ring + crescent arc on cast before dome blooms
      this.comboStep = 2;
      this.trauma = Math.min(1, this.trauma + 0.44);
      this.lunaCastFx = { kind: 'eclipse', timer: 0.26, maxTimer: 0.26 };
      const domeX = cx + this.facing * 34;
      const domeY = cy - 8;
      const castFacing = this.facing;
      this.skillVfx.spawn({
        kind: 'cast_eclipse_ring',
        x: domeX,
        y: domeY,
        tx: domeX,
        ty: domeY,
        facing: castFacing,
        radius: 86,
        angle: 0,
        maxLife: 0.22,
        color: '#818CF8',
        coreColor: '#E0F2FE',
        accentColor: lunaStyle.bladeGlow,
        orbitCount: 8,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.delayedSkillEvents.push({
        delay: 0.06,
        run: () => {
          this.skillVfx.spawn({
            kind: 'scythe_eclipse',
            x: domeX,
            y: domeY,
            tx: domeX,
            ty: domeY,
            facing: castFacing,
            radius: 178,
            angle: 0,
            maxLife: 0.72,
            color: '#9333EA',
            coreColor: '#F5D0FE',
            accentColor: '#F43F5E',
            orbitCount: 8,
            followPlayer: false,
            trackTargetToPlayer: false,
          });
          this.pool.spawnSlashArc(domeX, domeY, castFacing, 156, -0.45, Math.PI * 1.45, '#F5D0FE', '#9333EA', 13, 0.28, 'skill');
          this.pool.spawnBurst(domeX, domeY, 20, [lunaStyle.bladeCore, '#9333EA', '#F43F5E'], 90, 310, 4, true);
        },
      });

      const strikeDome = (mult: number, showCross: boolean) => {
        for (const enemy of this.enemies) {
          if (enemy.state === 'ko') continue;
          const ex = enemy.x + enemy.w * 0.5;
          const ey = enemy.y + enemy.h * 0.5;
          if (Math.hypot(ex - domeX, ey - domeY) <= 192) {
            const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
            this.damageEnemy(enemy, Math.max(5, Math.round(damage * mult)), isCrit, 190);
            if (showCross) {
              this.skillVfx.spawn({
                kind: 'cross_slash',
                x: ex,
                y: ey,
                tx: ex,
                ty: ey,
                facing: castFacing,
                radius: 56,
                angle: -0.7,
                maxLife: 0.26,
                color: '#818CF8',
                coreColor: '#E0F2FE',
                accentColor: lunaStyle.bladeGlow,
                orbitCount: 2,
                followPlayer: false,
                trackTargetToPlayer: false,
              });
            }
          }
        }
        const dBoxL3 = this.getTrainingDummyBox();
        if (dBoxL3) {
          const dx = dBoxL3.x + dBoxL3.w * 0.5;
          const dy = dBoxL3.y + dBoxL3.h * 0.5;
          if (Math.hypot(dx - domeX, dy - domeY) <= 195) {
            const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
            this.damageTrainingDummy(Math.max(5, Math.round(damage * mult)), isCrit);
          }
        }
      };

      strikeDome(0.65, false);
      this.delayedSkillEvents.push({
        delay: 0.42,
        run: () => {
          this.trauma = Math.min(1, this.trauma + 0.28);
          this.pool.spawnBurst(domeX, domeY, 22, ['#E0F2FE', '#818CF8', lunaStyle.bladeGlow], 100, 320, 5, true);
          strikeDome(0.75, true);
        },
      });
    } else if (skillId === 'lyra_fist_rush') {
      // Flaming Martial Dash Strike + Sonic Shockwave Cone + Flaming Fist Projectiles
      this.comboStep = 1;
      this.pvx = this.facing * 440;
      const startX = cx;
      const dashEndX = cx + this.facing * 125;
      this.skillVfx.spawn({
        kind: 'dash_ribbon',
        x: startX,
        y: cy,
        tx: dashEndX,
        ty: cy,
        facing: this.facing,
        radius: 55,
        angle: 0,
        maxLife: 0.34,
        color: '#F97316',
        coreColor: '#FEF08A',
        accentColor: '#EF4444',
        orbitCount: 2,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.skillVfx.spawn({
        kind: 'sonic_cone',
        x: cx + this.facing * 26,
        y: cy - 4,
        tx: cx + this.facing * 90,
        ty: cy - 4,
        facing: this.facing,
        radius: 82,
        angle: 0,
        maxLife: 0.35,
        color: '#F97316',
        coreColor: '#FEF08A',
        accentColor: '#EF4444',
        orbitCount: 2,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      for (let k = 0; k < 3; k++) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.spawnProjectile({
          fromPlayer: true,
          x: cx + this.facing * (24 + k * 24),
          y: cy - 10 + (k - 1) * 12,
          vx: this.facing * 640,
          vy: 0,
          radius: 19,
          damage: Math.max(4, Math.round(damage * 0.44)),
          isCrit,
          pierce: 3,
          life: 0.68,
          color: '#F97316',
          coreColor: '#FEF08A',
          kind: 'aura_fist',
        });
      }
    } else if (skillId === 'lyra_cyclone_kick') {
      // Rising Fiery Tornado Column around Lyra's spiral heel kick
      this.comboStep = 2;
      this.pvy = -410;
      this.grounded = false;
      this.trauma = Math.min(1, this.trauma + 0.3);
      this.skillVfx.spawn({
        kind: 'tornado_column',
        x: cx,
        y: cy + 16,
        tx: cx,
        ty: cy - 120,
        facing: this.facing,
        radius: 122,
        angle: 0,
        maxLife: 0.6,
        color: '#F97316',
        coreColor: '#FEF08A',
        accentColor: '#EF4444',
        orbitCount: 5,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(cx, cy, 22, ['#FEF08A', '#F97316', '#EF4444'], 90, 300, 5, true);
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - cx, ey - cy) < 160) {
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageEnemy(enemy, damage, isCrit, 250);
          if (enemy.kind !== 'boss') enemy.vy = -250;
        }
      }
      const dBox1 = this.getTrainingDummyBox();
      if (dBox1 && Math.hypot(dBox1.x + dBox1.w * 0.5 - cx, dBox1.y + dBox1.h * 0.5 - cy) < 175) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (skillId === 'lyra_aura_overdrive') {
      // Crimson-Gold Chi Overdrive Dome + Persistent Player Flame Body Aura
      this.comboStep = 3;
      this.auraOverdriveTimer = 8.0;
      this.trauma = Math.min(1, this.trauma + 0.4);
      this.skillVfx.spawn({
        kind: 'eclipse_dome',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: this.facing,
        radius: 185,
        angle: 0,
        maxLife: 0.62,
        color: '#EF4444',
        coreColor: '#FEF08A',
        accentColor: '#F97316',
        orbitCount: 8,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.skillVfx.spawn({
        kind: 'sustain_pulse',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: this.facing,
        radius: 68,
        angle: 0,
        maxLife: 0.68,
        color: '#F97316',
        coreColor: '#FEF08A',
        accentColor: '#FACC15',
        orbitCount: 4,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(cx, cy, 30, ['#FEF08A', '#F97316', '#DC2626'], 100, 340, 5, true);
      this.pool.spawnText(cx, this.py - 18, 'AURA OVERDRIVE!', '#FACC15', 1.15, 'chain');
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - cx, ey - cy) < 190) {
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageEnemy(enemy, damage, isCrit, 310);
        }
      }
      const dBox2 = this.getTrainingDummyBox();
      if (dBox2 && Math.hypot(dBox2.x + dBox2.w * 0.5 - cx, dBox2.y + dBox2.h * 0.5 - cy) < 195) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (skillId === 'void_tempest') {
      // Swirling Void Cyclone Vortex pulling non-boss targets inward + dual wind cleave
      this.trauma = Math.min(1, this.trauma + 0.35);
      this.skillVfx.spawn({
        kind: 'cyclone_vortex',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: this.facing,
        radius: 165,
        angle: 0,
        maxLife: 0.56,
        color: aura.glowHex,
        coreColor: aura.coreHex,
        accentColor: aura.trailHex,
        orbitCount: 6,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(cx, cy, 24, [aura.coreHex, aura.glowHex, aura.trailHex], 90, 320, 5, true);
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - cx, ey - cy) < 175) {
          if (enemy.kind !== 'boss') {
            enemy.x += (cx - ex) * 0.3;
          }
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageEnemy(enemy, damage, isCrit, 220);
        }
      }
      const dBox3 = this.getTrainingDummyBox();
      if (dBox3 && Math.hypot(dBox3.x + dBox3.w * 0.5 - cx, dBox3.y + dBox3.h * 0.5 - cy) < 175) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (skillId === 'phantom_blink') {
      // Phantom Dash-Slash: dash ribbon + afterimages + 3 staggered crimson-violet cross slashes
      this.invulnTimer = Math.max(this.invulnTimer, 0.34);
      const startX = cx;
      const blinkDist = 235 * this.facing;
      const activeW = this.getActiveWorldW();
      this.px = Math.max(24, Math.min(activeW - this.pw - 24, this.px + blinkDist));
      const endX = this.px + this.pw * 0.5;
      for (let i = 0; i < 5; i++) {
        this.pool.spawnAfterimage(
          startX + ((endX - startX) * i) / 5 - this.pw * 0.5,
          this.py,
          this.facing,
          aura.glowHex
        );
      }
      this.skillVfx.spawn({
        kind: 'dash_ribbon',
        x: startX,
        y: cy,
        tx: endX,
        ty: cy,
        facing: this.facing,
        radius: 56,
        angle: 0,
        maxLife: 0.4,
        color: aura.glowHex,
        coreColor: aura.coreHex,
        accentColor: '#F43F5E',
        orbitCount: 2,
        followPlayer: false,
        trackTargetToPlayer: false,
      });

      const blinkDir = this.facing;
      const blinkY = cy;
      for (let step = 0; step < 3; step++) {
        const sx = startX + ((endX - startX) * (step + 0.5)) / 3;
        const doBlinkCut = () => {
          this.skillVfx.spawn({
            kind: 'cross_slash',
            x: sx,
            y: blinkY,
            tx: sx,
            ty: blinkY,
            facing: blinkDir,
            radius: 72,
            angle: (step % 2 === 0 ? 0.52 : -0.52) * blinkDir,
            maxLife: 0.28,
            color: aura.glowHex,
            coreColor: aura.coreHex,
            accentColor: '#F43F5E',
            orbitCount: 2,
            followPlayer: false,
            trackTargetToPlayer: false,
          });
          for (const enemy of this.enemies) {
            if (enemy.state === 'ko') continue;
            const ex = enemy.x + enemy.w * 0.5;
            const ey = enemy.y + enemy.h * 0.5;
            if (Math.abs(ex - sx) <= 80 && Math.abs(ey - blinkY) <= 110) {
              const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
              this.damageEnemy(enemy, Math.max(4, Math.round(damage * 0.45)), isCrit, 160);
            }
          }
          const dBox4 = this.getTrainingDummyBox();
          if (dBox4) {
            const dex = dBox4.x + dBox4.w * 0.5;
            if (Math.abs(dex - sx) <= 90 && Math.abs(dBox4.y + dBox4.h * 0.5 - blinkY) <= 120) {
              const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
              this.damageTrainingDummy(Math.max(4, Math.round(damage * 0.45)), isCrit);
            }
          }
        };
        if (step === 0) doBlinkCut();
        else this.delayedSkillEvents.push({ delay: step * 0.08, run: doBlinkCut });
      }
    } else if (skillId === 'abyssal_crescent') {
      // Staggered Razor Crescent Shockwaves + Sonic Muzzle Wave
      this.skillVfx.spawn({
        kind: 'sonic_cone',
        x: cx + this.facing * 24,
        y: cy,
        tx: cx + this.facing * 95,
        ty: cy,
        facing: this.facing,
        radius: 68,
        angle: 0,
        maxLife: 0.3,
        color: aura.glowHex,
        coreColor: aura.coreHex,
        accentColor: aura.trailHex,
        orbitCount: 2,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      for (let k = 0; k < 2; k++) {
        const launchBlade = () => {
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.spawnProjectile({
            fromPlayer: true,
            x: this.px + this.pw * 0.5 + this.facing * (28 + k * 14),
            y: this.py + this.ph * 0.5 + (k === 0 ? -6 : 6),
            vx: this.facing * 680,
            vy: 0,
            radius: 24,
            damage: Math.max(4, Math.round(damage * 0.6)),
            isCrit,
            pierce: 4,
            life: 1.35,
            color: aura.glowHex,
            coreColor: aura.coreHex,
            kind: 'crescent',
          });
        };
        if (k === 0) launchBlade();
        else this.delayedSkillEvents.push({ delay: 0.14, run: launchBlade });
      }
    } else if (skillId === 'demon_eclipse') {
      // Unfurl Abyssal Demon Wings behind Velvera + launch 5 angled diagonal demon lances
      this.trauma = Math.min(1, this.trauma + 0.45);
      this.skillVfx.spawn({
        kind: 'demon_wings',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: this.facing,
        radius: 122,
        angle: 0,
        maxLife: 0.65,
        color: '#D946EF',
        coreColor: '#FAE8FF',
        accentColor: '#7E22CE',
        orbitCount: 2,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      for (let i = 0; i < 5; i++) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        const spread = (i - 2) * 0.16;
        this.spawnProjectile({
          fromPlayer: true,
          x: cx + this.facing * 26,
          y: cy - 34 + Math.abs(i - 2) * 10,
          vx: this.facing * Math.cos(spread) * 690,
          vy: (0.28 + spread) * 520,
          radius: 16,
          damage: Math.max(4, Math.round(damage * 0.46)),
          isCrit,
          pierce: 2,
          life: 1.25,
          color: '#D946EF',
          coreColor: '#FAE8FF',
          kind: 'spear',
        });
      }
    } else if (skillId === 'soul_rend') {
      // Twin Cross-Rip + Curse Sigil + Soul-Drain Tendrils & Sustain Pulse
      const ripX = cx + this.facing * 62;
      const hitBox = {
        x: this.facing === 1 ? this.px : this.px - 140,
        y: this.py - 20,
        w: 170,
        h: this.ph + 40,
      };
      this.skillVfx.spawn({
        kind: 'curse_sigil',
        x: ripX,
        y: cy,
        tx: ripX,
        ty: cy,
        facing: this.facing,
        radius: 118,
        angle: 0,
        maxLife: 0.56,
        color: '#C026D3',
        coreColor: '#F5D0FE',
        accentColor: '#4ADE80',
        orbitCount: 6,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.skillVfx.spawn({
        kind: 'cross_slash',
        x: ripX,
        y: cy,
        tx: ripX,
        ty: cy,
        facing: this.facing,
        radius: 92,
        angle: 0.45 * this.facing,
        maxLife: 0.34,
        color: '#C026D3',
        coreColor: '#F5D0FE',
        accentColor: '#E879F9',
        orbitCount: 2,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(ripX, cy, 20, ['#F5D0FE', '#C026D3', '#7E22CE'], 85, 270, 4, true);
      let hits = 0;
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        if (aabbOverlap(hitBox, enemy)) {
          const ex = enemy.x + enemy.w * 0.5;
          const ey = enemy.y + enemy.h * 0.5;
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageEnemy(enemy, damage, isCrit, 190);
          this.skillVfx.spawn({
            kind: 'drain_tendril',
            x: ex,
            y: ey,
            tx: cx,
            ty: cy,
            facing: this.facing,
            radius: 36,
            angle: 0,
            maxLife: 0.56,
            color: '#C026D3',
            coreColor: '#F5D0FE',
            accentColor: '#4ADE80',
            orbitCount: 3,
            followPlayer: false,
            trackTargetToPlayer: true,
          });
          hits++;
        }
      }
      const dBox5 = this.getTrainingDummyBox();
      if (dBox5 && aabbOverlap(hitBox, dBox5)) {
        const dx = dBox5.x + dBox5.w * 0.5;
        const dy = dBox5.y + dBox5.h * 0.5;
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
        this.skillVfx.spawn({
          kind: 'drain_tendril',
          x: dx,
          y: dy,
          tx: cx,
          ty: cy,
          facing: this.facing,
          radius: 36,
          angle: 0,
          maxLife: 0.56,
          color: '#C026D3',
          coreColor: '#F5D0FE',
          accentColor: '#4ADE80',
          orbitCount: 3,
          followPlayer: false,
          trackTargetToPlayer: true,
        });
        hits++;
      }
      if (hits > 0) {
        const heal = Math.round(this.stats.maxHp * 0.14);
        this.hp = Math.min(this.stats.maxHp, this.hp + heal);
        this.skillVfx.spawn({
          kind: 'sustain_pulse',
          x: cx,
          y: cy,
          tx: cx,
          ty: cy,
          facing: this.facing,
          radius: 56,
          angle: 0,
          maxLife: 0.55,
          color: '#C026D3',
          coreColor: '#F0FDF4',
          accentColor: '#4ADE80',
          orbitCount: 4,
          followPlayer: true,
          trackTargetToPlayer: false,
        });
        this.pool.spawnText(cx, this.py - 14, `+${heal} HP`, '#4ADE80', 1.1, 'heal');
      }
    } else if (skillId === 'witch_raven_arcana') {
      // Arcane Seal Muzzle + 3 Animated Flapping Shadow Ravens
      this.skillVfx.spawn({
        kind: 'curse_sigil',
        x: cx + this.facing * 26,
        y: cy - 6,
        tx: cx + this.facing * 26,
        ty: cy - 6,
        facing: this.facing,
        radius: 54,
        angle: 0,
        maxLife: 0.4,
        color: '#A855F7',
        coreColor: '#FEF08A',
        accentColor: '#E879F9',
        orbitCount: 4,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(cx + this.facing * 20, cy - 8, 16, ['#C084FC', '#FACC15', '#E879F9'], 75, 240, 4, true);
      for (let k = -1; k <= 1; k++) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.spawnProjectile({
          fromPlayer: true,
          x: cx + this.facing * 28,
          y: cy - 8 + k * 14,
          vx: this.facing * 640,
          vy: k * 70,
          radius: 17,
          damage: Math.max(4, Math.round(damage * 0.48)),
          isCrit,
          pierce: 3,
          life: 1.25,
          color: '#A855F7',
          coreColor: '#FEF08A',
          kind: 'witch_bolt',
        });
      }
    } else if (skillId === 'witch_starfall_meteor') {
      // Rotating Astral Star Crystals that detonate into Vertical Starlight Pillars on impact
      this.trauma = Math.min(1, this.trauma + 0.42);
      this.skillVfx.spawn({
        kind: 'curse_sigil',
        x: cx + this.facing * 120,
        y: Math.max(40, this.camY + 60),
        tx: cx + this.facing * 120,
        ty: Math.max(40, this.camY + 60),
        facing: this.facing,
        radius: 135,
        angle: 0,
        maxLife: 0.48,
        color: '#E879F9',
        coreColor: '#FEF08A',
        accentColor: '#FACC15',
        orbitCount: 6,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      for (let i = 0; i < 4; i++) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.spawnProjectile({
          fromPlayer: true,
          x: cx + this.facing * 110 + (i - 1.5) * 84,
          y: Math.max(20, this.camY + 12 - i * 32),
          vx: this.facing * 50,
          vy: 750,
          radius: 20,
          damage: Math.max(5, Math.round(damage * 0.62)),
          isCrit,
          pierce: 1,
          life: 1.45,
          color: '#E879F9',
          coreColor: '#FEF08A',
          kind: 'meteor',
          element: 'burn',
          skillLevel,
        });
      }
    } else if (skillId === 'witch_void_vortex') {
      // Persistent 1.15s Black-Hole Gravity Singularity pulling enemies inward & ticking + final implosion
      const vortexX = cx + this.facing * 165;
      const vortexY = cy;
      const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
      this.skillVfx.spawn({
        kind: 'singularity',
        x: vortexX,
        y: vortexY,
        tx: vortexX,
        ty: vortexY,
        facing: this.facing,
        radius: 215,
        angle: 0,
        maxLife: 1.15,
        color: '#9333EA',
        coreColor: '#F5D0FE',
        accentColor: '#FACC15',
        orbitCount: 6,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.activeVortexes.push({
        x: vortexX,
        y: vortexY,
        radius: 230,
        life: 1.15,
        tickAcc: 0.28,
        damage,
        isCrit,
      });
      this.pool.spawnBurst(vortexX, vortexY, 22, ['#E879F9', '#9333EA', '#FACC15'], 85, 250, 4, true);
      // Graceful backward blink away from danger
      this.invulnTimer = Math.max(this.invulnTimer, 0.38);
      const activeW = this.getActiveWorldW();
      this.pool.spawnAfterimage(this.px, this.py, this.facing, '#E879F9');
      this.px = Math.max(24, Math.min(activeW - this.pw - 24, this.px - this.facing * 135));
    } else if (skillId === 'luna_phantom_scythe') {
      // Throw two spinning returning phantom scythe crescents forward
      this.comboStep = 2;
      this.lunaCastFx = { kind: 'dash', timer: 0.24, maxTimer: 0.24 };
      this.skillVfx.spawn({
        kind: 'crescent_boomerang',
        x: cx + this.facing * 26,
        y: cy - 4,
        tx: cx + this.facing * 240,
        ty: cy - 4,
        facing: this.facing,
        radius: 64,
        angle: 0,
        maxLife: 0.34,
        color: lunaStyle.bladeGlow,
        coreColor: '#E0F2FE',
        accentColor: lunaStyle.bladeCore,
        orbitCount: 4,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      for (let k = 0; k < 2; k++) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.activeBoomerangs.push({
          x: cx + this.facing * (24 + k * 14),
          y: cy - 8 + k * 16,
          vx: this.facing * (720 - k * 55),
          vy: (k === 0 ? -1 : 1) * 48,
          phase: 'out',
          dist: 0,
          maxDist: 380 + skillLevel * 20,
          damage: Math.max(4, Math.round(damage * 0.62)),
          isCrit,
          hitIds: new Set<number>(),
          color: lunaStyle.bladeGlow,
          coreColor: '#E0F2FE',
          spin: k * 1.4,
          skillLevel: Math.min(3, Math.ceil(skillLevel / 3)),
        });
      }
    } else if (skillId === 'luna_abyssal_execution') {
      // Heavy scythe execution cleave with vertical shockwave + execute bonus below 50% HP
      this.comboStep = 3;
      this.trauma = Math.min(1, this.trauma + 0.52);
      this.lunaCastFx = { kind: 'eclipse', timer: 0.3, maxTimer: 0.3 };
      const strikeX = cx + this.facing * 68;
      const strikeY = cy - 6;
      this.skillVfx.spawn({
        kind: 'blood_scythe_burst',
        x: strikeX,
        y: strikeY,
        tx: strikeX,
        ty: strikeY,
        facing: this.facing,
        radius: 175,
        angle: 0,
        maxLife: 0.52,
        color: '#E11D48',
        coreColor: '#FFE4E6',
        accentColor: '#9333EA',
        orbitCount: 6,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.skillVfx.spawn({
        kind: 'vertical_shockwave',
        x: strikeX,
        y: this.py + this.ph,
        tx: strikeX,
        ty: this.py + this.ph,
        facing: this.facing,
        radius: 140,
        angle: 0,
        maxLife: 0.45,
        color: '#9333EA',
        coreColor: '#F5D0FE',
        accentColor: '#F43F5E',
        orbitCount: 4,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(strikeX, strikeY, 26, ['#F43F5E', '#A855F7', '#F5D0FE'], 95, 310, 5, true);
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - strikeX, ey - strikeY) <= 195) {
          const execMult = enemy.hp < enemy.maxHp * 0.5 ? 1.35 : 1;
          const { damage, isCrit } = calculateSkillDamage(
            this.stats,
            skillId,
            skillLevel,
            Math.random,
            chainDmgMult * execMult
          );
          this.damageEnemy(enemy, damage, isCrit, 260);
        }
      }
      const dBoxExec = this.getTrainingDummyBox();
      if (dBoxExec && Math.hypot(dBoxExec.x + dBoxExec.w * 0.5 - strikeX, dBoxExec.y + dBoxExec.h * 0.5 - strikeY) <= 195) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (skillId === 'lyra_earthshaker_slam') {
      // Heavy gauntlet ground-shatter slam with crimson shockwave ring
      this.comboStep = 3;
      this.pvy = Math.max(this.pvy, 280);
      this.trauma = Math.min(1, this.trauma + 0.5);
      const slamX = cx + this.facing * 24;
      const groundY = this.mode === 'lobby' ? LOBBY_GROUND_Y : this.getTerrainYAt(slamX);
      this.skillVfx.spawn({
        kind: 'boss_shockwave',
        x: slamX,
        y: groundY - 6,
        tx: slamX,
        ty: groundY - 6,
        facing: this.facing,
        radius: 205,
        angle: 0,
        maxLife: 0.48,
        color: '#F97316',
        coreColor: '#FEF08A',
        accentColor: '#EF4444',
        orbitCount: 6,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.skillVfx.spawn({
        kind: 'vertical_shockwave',
        x: slamX,
        y: groundY,
        tx: slamX,
        ty: groundY,
        facing: this.facing,
        radius: 145,
        angle: 0,
        maxLife: 0.42,
        color: '#FB923C',
        coreColor: '#FEF08A',
        accentColor: '#DC2626',
        orbitCount: 4,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(slamX, groundY - 12, 28, ['#FEF08A', '#F97316', '#EF4444'], 100, 320, 5, true);
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - slamX, ey - cy) <= 210) {
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageEnemy(enemy, damage, isCrit, 280);
          if (enemy.kind !== 'boss') enemy.vy = -190;
        }
      }
      const dBoxSlam = this.getTrainingDummyBox();
      if (dBoxSlam && Math.hypot(dBoxSlam.x + dBoxSlam.w * 0.5 - slamX, dBoxSlam.y + dBoxSlam.h * 0.5 - cy) <= 210) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (skillId === 'lyra_phoenix_uppercut') {
      // Rising flaming uppercut launching enemies into the air
      this.comboStep = 2;
      this.pvy = -445;
      this.pvx = this.facing * 240;
      this.grounded = false;
      this.trauma = Math.min(1, this.trauma + 0.34);
      const upperX = cx + this.facing * 32;
      this.skillVfx.spawn({
        kind: 'tornado_column',
        x: upperX,
        y: cy + 12,
        tx: upperX,
        ty: cy - 140,
        facing: this.facing,
        radius: 112,
        angle: 0,
        maxLife: 0.52,
        color: '#FB923C',
        coreColor: '#FEF08A',
        accentColor: '#EF4444',
        orbitCount: 4,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.skillVfx.spawn({
        kind: 'sonic_cone',
        x: upperX,
        y: cy - 12,
        tx: upperX + this.facing * 45,
        ty: cy - 90,
        facing: this.facing,
        radius: 86,
        angle: -0.75 * this.facing,
        maxLife: 0.34,
        color: '#F97316',
        coreColor: '#FEF08A',
        accentColor: '#EF4444',
        orbitCount: 2,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(upperX, cy - 16, 22, ['#FEF08A', '#F97316', '#EF4444'], 90, 290, 5, true);
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - upperX, ey - cy) <= 175) {
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageEnemy(enemy, damage, isCrit, 220);
          if (enemy.kind !== 'boss') enemy.vy = -330;
        }
      }
      const dBoxUpper = this.getTrainingDummyBox();
      if (dBoxUpper && Math.hypot(dBoxUpper.x + dBoxUpper.w * 0.5 - upperX, dBoxUpper.y + dBoxUpper.h * 0.5 - cy) <= 185) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (skillId === 'witch_arcane_lightning') {
      // Chain violet arcane thunder pillars across up to 4 targets
      this.trauma = Math.min(1, this.trauma + 0.36);
      const targets = this.enemies
        .filter((e) => e.state !== 'ko' && Math.hypot(e.x + e.w * 0.5 - cx, e.y + e.h * 0.5 - cy) <= 520)
        .sort(
          (a, b) =>
            Math.hypot(a.x + a.w * 0.5 - cx, a.y + a.h * 0.5 - cy) -
            Math.hypot(b.x + b.w * 0.5 - cx, b.y + b.h * 0.5 - cy)
        )
        .slice(0, 4);
      let prevX = cx;
      let prevY = cy - 18;
      for (const target of targets) {
        const tx = target.x + target.w * 0.5;
        const ty = target.y + target.h * 0.5;
        this.skillVfx.spawn({
          kind: 'lightning_bolt',
          x: prevX,
          y: prevY,
          tx,
          ty,
          facing: tx >= prevX ? 1 : -1,
          radius: 44,
          angle: 0,
          maxLife: 0.34,
          color: '#A855F7',
          coreColor: '#FEF08A',
          accentColor: '#38BDF8',
          orbitCount: 4,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        this.skillVfx.spawn({
          kind: 'violet_thunder_pillar',
          x: tx,
          y: target.y + target.h,
          tx,
          ty,
          facing: 1,
          radius: 56,
          angle: 0,
          maxLife: 0.42,
          color: '#A855F7',
          coreColor: '#F5D0FE',
          accentColor: '#38BDF8',
          orbitCount: 3,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        prevX = tx;
        prevY = ty;
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageEnemy(target, damage, isCrit, 120);
        this.pool.spawnBurst(tx, ty, 14, ['#A855F7', '#F5D0FE', '#38BDF8'], 75, 240, 4, true);
      }
      const dBoxBolt = this.getTrainingDummyBox();
      if (dBoxBolt && Math.hypot(dBoxBolt.x + dBoxBolt.w * 0.5 - cx, dBoxBolt.y + dBoxBolt.h * 0.5 - cy) <= 520) {
        const tx = dBoxBolt.x + dBoxBolt.w * 0.5;
        const ty = dBoxBolt.y + dBoxBolt.h * 0.5;
        this.skillVfx.spawn({
          kind: 'lightning_bolt',
          x: prevX,
          y: prevY,
          tx,
          ty,
          facing: tx >= prevX ? 1 : -1,
          radius: 44,
          angle: 0,
          maxLife: 0.34,
          color: '#A855F7',
          coreColor: '#FEF08A',
          accentColor: '#38BDF8',
          orbitCount: 4,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
      }
      if (targets.length === 0 && !dBoxBolt) {
        const emptyX = cx + this.facing * 150;
        this.skillVfx.spawn({
          kind: 'violet_thunder_pillar',
          x: emptyX,
          y: this.py + this.ph,
          tx: emptyX,
          ty: cy,
          facing: this.facing,
          radius: 68,
          angle: 0,
          maxLife: 0.42,
          color: '#A855F7',
          coreColor: '#F5D0FE',
          accentColor: '#38BDF8',
          orbitCount: 3,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
      }
    } else if (skillId === 'witch_chrono_nova') {
      // Astral Chrono Nova wave: radial frost/arcane burst pushing enemies + healing 10% Max HP
      this.trauma = Math.min(1, this.trauma + 0.32);
      this.invulnTimer = Math.max(this.invulnTimer, 0.35);
      this.skillVfx.spawn({
        kind: 'frost_ring',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: this.facing,
        radius: 190,
        angle: 0,
        maxLife: 0.55,
        color: '#38BDF8',
        coreColor: '#E0F2FE',
        accentColor: '#C084FC',
        orbitCount: 6,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.skillVfx.spawn({
        kind: 'cast_eclipse_ring',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: this.facing,
        radius: 145,
        angle: 0,
        maxLife: 0.44,
        color: '#C084FC',
        coreColor: '#E0F2FE',
        accentColor: '#38BDF8',
        orbitCount: 8,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(cx, cy, 24, ['#38BDF8', '#C084FC', '#E0F2FE'], 95, 290, 5, true);
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - cx, ey - cy) <= 215) {
          const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
          this.damageEnemy(enemy, damage, isCrit, 310, 'freeze', 2);
        }
      }
      const dBoxNova = this.getTrainingDummyBox();
      if (dBoxNova && Math.hypot(dBoxNova.x + dBoxNova.w * 0.5 - cx, dBoxNova.y + dBoxNova.h * 0.5 - cy) <= 215) {
        const { damage, isCrit } = calculateSkillDamage(this.stats, skillId, skillLevel, Math.random, chainDmgMult);
        this.damageTrainingDummy(damage, isCrit);
      }
      const heal = Math.max(8, Math.round(this.stats.maxHp * 0.1));
      this.hp = Math.min(this.stats.maxHp, this.hp + heal);
      this.skillVfx.spawn({
        kind: 'sustain_pulse',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: this.facing,
        radius: 56,
        angle: 0,
        maxLife: 0.52,
        color: '#38BDF8',
        coreColor: '#F0FDF4',
        accentColor: '#4ADE80',
        orbitCount: 4,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.pool.spawnText(cx, this.py - 14, `+${heal} HP`, '#4ADE80', 1.1, 'heal');
    }

    this.emitHud(true);
  }

  private tryCastSubSkill(slot: number): void {
    const equippedSubs = this.getEquippedSubSkills();
    const entry = equippedSubs[slot];
    if (!entry) return;
    const subId = entry.id;
    const def = SUB_SKILLS[subId];
    if (!def) return;
    const skillLevel = Math.max(1, entry.level);

    if (this.subSkillCooldowns[slot] > 0 || this.mp < def.mpCost) return;

    const scaledSub = getSubSkillScaledStats(subId, skillLevel);
    this.mp -= def.mpCost;
    this.subSkillCooldowns[slot] = scaledSub.cooldown * (1 - this.stats.cooldownReduction);
    gameAudio.playSkill();
    this.applyComboChainTrigger(subId);

    const chainDmgMult = 1 + this.comboChain.damageBonus;
    const cx = this.px + this.pw * 0.5;
    const cy = this.py + this.ph * 0.5;
    const floorY = this.py + this.ph;
    const baseRoll = calculateSkillDamage(this.stats, subId, skillLevel, Math.random, chainDmgMult);
    const damage = Math.max(4, Math.round(baseRoll.damage * scaledSub.damageMult));
    const isCrit = baseRoll.isCrit;

    // Find closest living target within scaled range so sub-skills auto-aim cleanly
    let nearestTarget: EnemyEntity | null = null;
    let nearestDist = Infinity;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.state === 'ko') continue;
      const d = Math.hypot(e.x + e.w * 0.5 - cx, e.y + e.h * 0.5 - cy);
      if (d <= scaledSub.range + 40 && d < nearestDist) {
        nearestDist = d;
        nearestTarget = e;
      }
    }
    const aimX = nearestTarget ? nearestTarget.x + nearestTarget.w * 0.5 : cx + this.facing * 180;
    const aimY = nearestTarget ? nearestTarget.y + nearestTarget.h * 0.5 : cy;
    const aimAng = Math.atan2(aimY - cy, aimX - cx);
    const aimDir: 1 | -1 = aimX >= cx ? 1 : -1;

    const vfxScale = getSubSkillVfxScale(skillLevel);

    if (subId === 'sub_fireball') {
      this.pool.spawnBurst(cx + aimDir * 18, cy, 8 + skillLevel * 2, ['#F97316', '#FACC15'], 50, 160, 4, true);
      this.spawnProjectile({
        fromPlayer: true,
        x: cx + aimDir * 22,
        y: cy - 6,
        vx: Math.cos(aimAng) * 540,
        vy: Math.sin(aimAng) * 540,
        radius: Math.round(14 * vfxScale.radiusMult),
        damage,
        isCrit,
        pierce: 1,
        life: 1.5,
        color: '#F97316',
        coreColor: '#FEF08A',
        kind: 'fireball',
        element: 'burn',
        skillLevel,
      });
    } else if (subId === 'sub_firetrap') {
      const trapX = nearestTarget ? aimX : cx + this.facing * 32;
      const trapY = nearestTarget ? nearestTarget.y + nearestTarget.h : floorY;
      this.playerHazards.push({
        id: this.nextHazardId++,
        kind: 'fire_trap',
        x: trapX,
        y: trapY,
        radius: Math.round(48 * vfxScale.radiusMult),
        life: 10.0,
        maxLife: 10.0,
        damage,
        isCrit,
        tickAcc: 0,
        skillLevel,
      });
      this.pool.spawnBurst(trapX, trapY - 6, 8 + skillLevel * 2, ['#EF4444', '#F97316', '#FACC15'], 40, 120, 4, true);
    } else if (subId === 'sub_icearrow') {
      this.pool.spawnBurst(cx + aimDir * 18, cy, 8 + skillLevel * 2, ['#38BDF8', '#BAE6FD', '#E0F2FE'], 50, 160, 4, true);
      for (let k = 0; k < 2; k++) {
        const ang = aimAng + (k === 0 ? -0.05 : 0.05);
        this.spawnProjectile({
          fromPlayer: true,
          x: cx + aimDir * (20 + k * 14),
          y: cy - 6 + k * 10,
          vx: Math.cos(ang) * 660,
          vy: Math.sin(ang) * 660,
          radius: Math.round(12 * vfxScale.radiusMult),
          damage: Math.max(4, Math.round(damage * 0.72)),
          isCrit,
          pierce: 3,
          life: 1.35,
          color: '#38BDF8',
          coreColor: '#F0F9FF',
          kind: 'ice_arrow',
          element: 'freeze',
          skillLevel,
        });
      }
    } else if (subId === 'sub_poison') {
      const cloudX = nearestTarget ? aimX : cx + this.facing * 95;
      const cloudY = nearestTarget ? nearestTarget.y + nearestTarget.h : floorY;
      this.playerHazards.push({
        id: this.nextHazardId++,
        kind: 'poison_cloud',
        x: cloudX,
        y: cloudY,
        radius: Math.round(100 * vfxScale.radiusMult),
        life: 4.8,
        maxLife: 4.8,
        damage,
        isCrit,
        tickAcc: 0.55,
        skillLevel,
      });
      this.pool.spawnBurst(cloudX, cloudY - 24, 14 + skillLevel * 3, ['#4ADE80', '#22C55E', '#A855F7'], 60, 190, 5, true);
    } else if (subId === 'sub_lightning') {
      const inRange = this.enemies
        .filter((e) => e.state !== 'ko' && Math.hypot(e.x + e.w * 0.5 - cx, e.y + e.h * 0.5 - cy) <= scaledSub.range + 40)
        .sort(
          (a, b) =>
            Math.hypot(a.x + a.w * 0.5 - cx, a.y + a.h * 0.5 - cy) -
            Math.hypot(b.x + b.w * 0.5 - cx, b.y + b.h * 0.5 - cy)
        )
        .slice(0, 4);
      let prevX = cx;
      let prevY = cy - 10;
      for (const target of inRange) {
        const tx = target.x + target.w * 0.5;
        const ty = target.y + target.h * 0.5;
        this.skillVfx.spawn({
          kind: 'lightning_bolt',
          x: prevX,
          y: prevY,
          tx,
          ty,
          facing: tx >= prevX ? 1 : -1,
          radius: 40,
          angle: 0,
          maxLife: 0.28,
          color: '#38BDF8',
          coreColor: '#FEF08A',
          accentColor: '#38BDF8',
          orbitCount: vfxScale.streakCount,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        prevX = tx;
        prevY = ty;
        this.pool.spawnBurst(tx, ty, 10 + skillLevel * 2, ['#FACC15', '#FEF08A', '#38BDF8'], 70, 220, 4, true);
        this.damageEnemy(target, damage, isCrit, 80, 'burn', skillLevel);
      }
      const dBoxBolt = this.getTrainingDummyBox();
      if (dBoxBolt && Math.hypot(dBoxBolt.x + dBoxBolt.w * 0.5 - cx, dBoxBolt.y + dBoxBolt.h * 0.5 - cy) <= scaledSub.range + 40) {
        const tx = dBoxBolt.x + dBoxBolt.w * 0.5;
        const ty = dBoxBolt.y + dBoxBolt.h * 0.5;
        this.skillVfx.spawn({
          kind: 'lightning_bolt',
          x: prevX,
          y: prevY,
          tx,
          ty,
          facing: tx >= prevX ? 1 : -1,
          radius: 40,
          angle: 0,
          maxLife: 0.28,
          color: '#38BDF8',
          coreColor: '#FEF08A',
          accentColor: '#38BDF8',
          orbitCount: vfxScale.streakCount,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (subId === 'sub_shadow_kunai') {
      this.pool.spawnBurst(cx + aimDir * 14, cy, 7 + skillLevel * 2, ['#C084FC', '#E9D5FF'], 45, 140, 3, true);
      for (let k = -1; k <= 1; k++) {
        const ang = aimAng + k * 0.12;
        this.spawnProjectile({
          fromPlayer: true,
          x: cx + aimDir * 16,
          y: cy - 4,
          vx: Math.cos(ang) * 760,
          vy: Math.sin(ang) * 760,
          radius: Math.round(11 * vfxScale.radiusMult),
          damage: Math.max(4, Math.round(damage * 0.56)),
          isCrit,
          pierce: 2,
          life: 1.0,
          color: '#C084FC',
          coreColor: '#FFFFFF',
          kind: 'kunai',
          element: 'poison',
          skillLevel,
        });
      }
    } else if (subId === 'sub_meteor') {
      const targetX = nearestTarget ? aimX : cx + this.facing * 120;
      const startY = Math.max(10, (nearestTarget ? aimY : cy) - 340);
      this.spawnProjectile({
        fromPlayer: true,
        x: targetX - 40,
        y: startY,
        vx: 75,
        vy: 690,
        radius: Math.round(19 * vfxScale.radiusMult),
        damage,
        isCrit,
        pierce: 2,
        life: 1.5,
        color: '#FB923C',
        coreColor: '#FEF08A',
        kind: 'meteor',
        element: 'burn',
        skillLevel,
      });
    } else if (subId === 'sub_frost_nova') {
      this.skillVfx.spawn({
        kind: 'frost_ring',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: 1,
        radius: Math.round(145 * vfxScale.radiusMult),
        angle: 0,
        maxLife: 0.45,
        color: '#67E8F9',
        coreColor: '#F0F9FF',
        accentColor: '#38BDF8',
        orbitCount: 4 + skillLevel * 2,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(cx, cy, 18 + skillLevel * 4, ['#67E8F9', '#BAE6FD', '#FFFFFF'], 90, 290, 5, true);
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - cx, ey - cy) <= scaledSub.range) {
          this.damageEnemy(enemy, damage, isCrit, 180, 'freeze', skillLevel);
        }
      }
    } else if (subId === 'sub_shadow_blades') {
      const orbitR = Math.round(86 * vfxScale.radiusMult);
      this.skillVfx.spawn({
        kind: 'shadow_blades_spin',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: 1,
        radius: orbitR,
        angle: 0,
        maxLife: 2.5,
        color: '#A855F7',
        coreColor: '#F3E8FF',
        accentColor: '#38BDF8',
        orbitCount: 3 + skillLevel,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.activeOrbitBlades.push({
        kind: 'shadow_blades',
        life: 2.5,
        maxLife: 2.5,
        radius: orbitR,
        damage,
        isCrit,
        tickAcc: 0.35,
      });
    } else if (subId === 'sub_dark_chains') {
      const targets = this.enemies
        .filter((e) => e.state !== 'ko' && Math.hypot(e.x + e.w * 0.5 - cx, e.y + e.h * 0.5 - cy) <= scaledSub.range + 40)
        .slice(0, 1 + skillLevel);
      for (const t of targets) {
        const tx = t.x + t.w * 0.5;
        const ty = t.y + t.h * 0.5;
        this.skillVfx.spawn({
          kind: 'dark_chain_snare',
          x: cx,
          y: cy - 6,
          tx,
          ty,
          facing: tx >= cx ? 1 : -1,
          radius: 40,
          angle: 0,
          maxLife: 0.5,
          color: '#818CF8',
          coreColor: '#E0E7FF',
          accentColor: '#A855F7',
          orbitCount: 4,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        if (t.kind !== 'boss') {
          t.x = Math.max(40, Math.min(this.currentLayout.worldW - t.w - 40, cx + (tx >= cx ? 72 : -72 - t.w)));
        }
        this.damageEnemy(t, damage, isCrit, 20, 'freeze', skillLevel);
      }
      const dBoxChain = this.getTrainingDummyBox();
      if (dBoxChain && Math.hypot(dBoxChain.x + dBoxChain.w * 0.5 - cx, dBoxChain.y + dBoxChain.h * 0.5 - cy) <= scaledSub.range + 40) {
        this.skillVfx.spawn({
          kind: 'dark_chain_snare',
          x: cx,
          y: cy - 6,
          tx: dBoxChain.x + dBoxChain.w * 0.5,
          ty: dBoxChain.y + dBoxChain.h * 0.5,
          facing: 1,
          radius: 40,
          angle: 0,
          maxLife: 0.5,
          color: '#818CF8',
          coreColor: '#E0E7FF',
          accentColor: '#A855F7',
          orbitCount: 4,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (subId === 'sub_abyss_spear') {
      this.skillVfx.spawn({
        kind: 'abyss_crystal_spear',
        x: cx + aimDir * 24,
        y: cy - 4,
        tx: aimX,
        ty: aimY,
        facing: aimDir,
        radius: Math.round(52 * vfxScale.radiusMult),
        angle: aimAng,
        maxLife: 0.34,
        color: '#38BDF8',
        coreColor: '#F0F9FF',
        accentColor: '#818CF8',
        orbitCount: 3,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.spawnProjectile({
        fromPlayer: true,
        x: cx + aimDir * 24,
        y: cy - 4,
        vx: Math.cos(aimAng) * 820,
        vy: Math.sin(aimAng) * 820,
        radius: Math.round(16 * vfxScale.radiusMult),
        damage,
        isCrit,
        pierce: 4 + skillLevel,
        life: 1.2,
        color: '#38BDF8',
        coreColor: '#F0F9FF',
        kind: 'spear',
        element: 'freeze',
        skillLevel,
      });
    } else if (subId === 'sub_blood_scythe') {
      const targetX = nearestTarget ? aimX : cx + aimDir * 110;
      const targetY = nearestTarget ? aimY : cy;
      this.skillVfx.spawn({
        kind: 'blood_scythe_burst',
        x: targetX,
        y: targetY,
        tx: targetX,
        ty: targetY,
        facing: aimDir,
        radius: Math.round(92 * vfxScale.radiusMult),
        angle: 0,
        maxLife: 0.48,
        color: '#F43F5E',
        coreColor: '#FFE4E6',
        accentColor: '#FB7185',
        orbitCount: 4,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      this.pool.spawnBurst(targetX, targetY, 16, ['#F43F5E', '#FFE4E6', '#9F1239'], 75, 240, 4, true);
      let hitAny = false;
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        if (Math.hypot(ex - targetX, ey - targetY) <= 135) {
          this.damageEnemy(enemy, damage, isCrit, 160, 'burn', skillLevel);
          hitAny = true;
        }
      }
      const dBoxBlood = this.getTrainingDummyBox();
      if (dBoxBlood && Math.hypot(dBoxBlood.x + dBoxBlood.w * 0.5 - targetX, dBoxBlood.y + dBoxBlood.h * 0.5 - targetY) <= 135) {
        this.damageTrainingDummy(damage, isCrit);
        hitAny = true;
      }
      if (hitAny) {
        this.skillVfx.spawn({
          kind: 'drain_tendril',
          x: targetX,
          y: targetY,
          tx: cx,
          ty: cy,
          facing: aimDir,
          radius: 32,
          angle: 0,
          maxLife: 0.44,
          color: '#F43F5E',
          coreColor: '#FFE4E6',
          accentColor: '#4ADE80',
          orbitCount: 3,
          followPlayer: false,
          trackTargetToPlayer: true,
        });
        const heal = Math.max(4, Math.round(this.stats.maxHp * (0.03 + skillLevel * 0.015)));
        this.hp = Math.min(this.stats.maxHp, this.hp + heal);
        this.pool.spawnText(cx, this.py - 14, `+${heal} HP`, '#4ADE80', 0.95, 'heal');
      }
    } else if (subId === 'sub_violet_thunder') {
      const targets = this.enemies
        .filter((e) => e.state !== 'ko' && Math.hypot(e.x + e.w * 0.5 - cx, e.y + e.h * 0.5 - cy) <= scaledSub.range + 40)
        .slice(0, 1 + skillLevel);
      for (const t of targets) {
        const tx = t.x + t.w * 0.5;
        const tyFloor = t.y + t.h;
        this.skillVfx.spawn({
          kind: 'violet_thunder_pillar',
          x: tx,
          y: tyFloor,
          tx,
          ty: tyFloor,
          facing: 1,
          radius: Math.round(135 * vfxScale.radiusMult),
          angle: 0,
          maxLife: 0.46,
          color: '#D946EF',
          coreColor: '#FAE8FF',
          accentColor: '#A855F7',
          orbitCount: 5,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        this.damageEnemy(t, damage, isCrit, 130, 'burn', skillLevel);
      }
      const dBoxVt = this.getTrainingDummyBox();
      if (dBoxVt && Math.hypot(dBoxVt.x + dBoxVt.w * 0.5 - cx, dBoxVt.y + dBoxVt.h * 0.5 - cy) <= scaledSub.range + 40) {
        this.skillVfx.spawn({
          kind: 'violet_thunder_pillar',
          x: dBoxVt.x + dBoxVt.w * 0.5,
          y: dBoxVt.y + dBoxVt.h,
          tx: dBoxVt.x + dBoxVt.w * 0.5,
          ty: dBoxVt.y + dBoxVt.h,
          facing: 1,
          radius: 135,
          angle: 0,
          maxLife: 0.46,
          color: '#D946EF',
          coreColor: '#FAE8FF',
          accentColor: '#A855F7',
          orbitCount: 5,
          followPlayer: false,
          trackTargetToPlayer: false,
        });
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (subId === 'sub_shadow_spikes') {
      const sx = nearestTarget ? aimX : cx + aimDir * 115;
      const syFloor = nearestTarget ? nearestTarget.y + nearestTarget.h : floorY;
      this.skillVfx.spawn({
        kind: 'floor_shadow_spikes',
        x: sx,
        y: syFloor,
        tx: sx,
        ty: syFloor,
        facing: aimDir,
        radius: Math.round(88 * vfxScale.radiusMult),
        angle: 0,
        maxLife: 0.58,
        color: '#9333EA',
        coreColor: '#F3E8FF',
        accentColor: '#C084FC',
        orbitCount: 6 + skillLevel * 2,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h;
        if (Math.abs(ex - sx) <= 105 && Math.abs(ey - syFloor) <= 85) {
          this.damageEnemy(enemy, damage, isCrit, 140, 'poison', skillLevel);
        }
      }
      const dBoxSpikes = this.getTrainingDummyBox();
      if (dBoxSpikes && Math.abs(dBoxSpikes.x + dBoxSpikes.w * 0.5 - sx) <= 105) {
        this.damageTrainingDummy(damage, isCrit);
      }
    } else if (subId === 'sub_razor_aura') {
      const auraR = Math.round(104 * vfxScale.radiusMult);
      this.skillVfx.spawn({
        kind: 'razor_whirl_aura',
        x: cx,
        y: cy,
        tx: cx,
        ty: cy,
        facing: 1,
        radius: auraR,
        angle: 0,
        maxLife: 2.7,
        color: '#F59E0B',
        coreColor: '#FEF3C7',
        accentColor: '#A855F7',
        orbitCount: 6 + skillLevel * 2,
        followPlayer: true,
        trackTargetToPlayer: false,
      });
      this.activeOrbitBlades.push({
        kind: 'razor_aura',
        life: 2.7,
        maxLife: 2.7,
        radius: auraR,
        damage,
        isCrit,
        tickAcc: 0.3,
      });
    } else if (subId === 'sub_crescent_boomerang') {
      this.activeBoomerangs.push({
        x: cx + aimDir * 24,
        y: cy - 4,
        vx: Math.cos(aimAng) * 690,
        vy: Math.sin(aimAng) * 690,
        phase: 'out',
        dist: 0,
        maxDist: 360 + skillLevel * 35,
        damage: Math.max(4, Math.round(damage * 0.78)),
        isCrit,
        hitIds: new Set<number>(),
        color: '#E879F9',
        coreColor: '#FAF5FF',
        spin: 0,
        skillLevel,
      });
    } else if (subId === 'sub_vertical_shockwave') {
      const dir = aimDir;
      const baseFloor = floorY;
      for (let step = 0; step < 3; step++) {
        const waveX = cx + dir * (78 + step * 96);
        const fireWave = () => {
          const groundY = this.mode === 'lobby' ? LOBBY_GROUND_Y : this.getTerrainYAt(waveX);
          this.skillVfx.spawn({
            kind: 'vertical_shockwave',
            x: waveX,
            y: Math.min(baseFloor, groundY),
            tx: waveX,
            ty: groundY,
            facing: dir,
            radius: Math.round(135 * vfxScale.radiusMult),
            angle: 0,
            maxLife: 0.42,
            color: '#FB923C',
            coreColor: '#FEF08A',
            accentColor: '#EA580C',
            orbitCount: 3,
            followPlayer: false,
            trackTargetToPlayer: false,
          });
          for (const enemy of this.enemies) {
            if (enemy.state === 'ko') continue;
            const ex = enemy.x + enemy.w * 0.5;
            if (Math.abs(ex - waveX) <= 64) {
              this.damageEnemy(enemy, Math.max(4, Math.round(damage * 0.65)), isCrit, 160, 'burn', skillLevel);
            }
          }
          const dBoxSw = this.getTrainingDummyBox();
          if (dBoxSw && Math.abs(dBoxSw.x + dBoxSw.w * 0.5 - waveX) <= 64) {
            this.damageTrainingDummy(Math.max(4, Math.round(damage * 0.65)), isCrit);
          }
        };
        if (step === 0) fireWave();
        else this.delayedSkillEvents.push({ delay: step * 0.09, run: fireWave });
      }
    } else if (subId === 'sub_cosmic_needles') {
      const needleCount = 4 + skillLevel * 2;
      const targets = this.enemies.filter((e) => e.state !== 'ko');
      for (let n = 0; n < needleCount; n++) {
        const pick = targets.length > 0 ? targets[n % targets.length] : null;
        const tx = pick ? pick.x + pick.w * 0.5 : aimX + (n - needleCount * 0.5) * 32;
        const ty = pick ? pick.y + pick.h * 0.5 : aimY;
        const sx = tx + ((n % 2 === 0 ? -1 : 1) * (130 + (n % 3) * 35));
        const sy = Math.max(30, ty - 220 - (n % 3) * 35);
        this.delayedSkillEvents.push({
          delay: n * 0.045,
          run: () => {
            this.skillVfx.spawn({
              kind: 'cosmic_needle_rain',
              x: sx,
              y: sy,
              tx,
              ty,
              facing: tx >= sx ? 1 : -1,
              radius: 36,
              angle: Math.atan2(ty - sy, tx - sx),
              maxLife: 0.28,
              color: '#C084FC',
              coreColor: '#F5D0FE',
              accentColor: '#38BDF8',
              orbitCount: 2,
              followPlayer: false,
              trackTargetToPlayer: false,
            });
            if (pick && pick.state !== 'ko') {
              this.damageEnemy(pick, Math.max(4, Math.round(damage * 0.42)), isCrit, 60, 'freeze', skillLevel);
            } else {
              const dBoxN = this.getTrainingDummyBox();
              if (dBoxN) {
                this.damageTrainingDummy(Math.max(4, Math.round(damage * 0.42)), isCrit);
              }
            }
          },
        });
      }
    }

    this.emitHud(true);
  }

  private spawnProjectile(cfg: Omit<ProjectileEntity, 'active'>): void {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) {
        Object.assign(p, cfg, { active: true });
        return;
      }
    }
  }

  private applyElementalStatus(
    enemy: EnemyEntity,
    element: 'burn' | 'freeze' | 'poison',
    skillLevel = 1
  ): void {
    const cx = enemy.x + enemy.w * 0.5;
    if (element === 'burn') {
      enemy.burnTimer = Math.max(enemy.burnTimer, 3.6);
      enemy.burnDps = Math.max(enemy.burnDps, (8 + skillLevel * 4 + this.stage * 2) * COMBAT_DAMAGE_SCALE);
      this.pool.spawnBurst(cx, enemy.y + enemy.h * 0.4, 10, ['#F97316', '#FACC15', '#EF4444'], 50, 150, 4, true);
      this.pool.spawnText(cx + 16, enemy.y - 46, 'BURN!', '#FB923C', 0.88, 'burn');
    } else if (element === 'freeze') {
      enemy.freezeTimer = Math.max(enemy.freezeTimer, 2.8);
      enemy.freezeLockTimer = Math.max(enemy.freezeLockTimer, enemy.kind === 'boss' ? 0.25 : 0.75);
      this.pool.spawnBurst(cx, enemy.y + enemy.h * 0.45, 12, ['#38BDF8', '#BAE6FD', '#FFFFFF'], 50, 170, 4, true);
      this.pool.spawnText(cx + 16, enemy.y - 46, 'FREEZE!', '#38BDF8', 0.92, 'freeze');
    } else if (element === 'poison') {
      enemy.poisonTimer = Math.max(enemy.poisonTimer, 4.2);
      enemy.poisonDps = Math.max(enemy.poisonDps, (7 + skillLevel * 3.5 + this.stage * 2) * COMBAT_DAMAGE_SCALE);
      this.pool.spawnBurst(cx, enemy.y + enemy.h * 0.45, 10, ['#4ADE80', '#22C55E', '#A855F7'], 40, 140, 4, true);
      this.pool.spawnText(cx + 16, enemy.y - 46, 'POISON!', '#4ADE80', 0.88, 'poison');
    }
  }

  private damageEnemy(
    enemy: EnemyEntity,
    damage: number,
    isCrit: boolean,
    knockbackSpeed: number,
    element?: 'burn' | 'freeze' | 'poison',
    skillLevel = 1
  ): void {
    enemy.hp -= damage;
    enemy.hitFlash = 0.08;
    const kbResist = enemy.kind === 'zombie_knight' ? 0.35 : enemy.kind === 'boss' ? 0.15 : 1;
    const dir = enemy.x + enemy.w * 0.5 >= this.px + this.pw * 0.5 ? 1 : -1;
    enemy.vx = dir * knockbackSpeed * kbResist;

    if (element) {
      this.applyElementalStatus(enemy, element, skillLevel);
    } else if (this.stats.voidBurnDps > 0) {
      enemy.burnTimer = Math.max(enemy.burnTimer, 2.5);
      enemy.burnDps = Math.max(enemy.burnDps, this.stats.voidBurnDps);
    }

    if (this.stats.lifestealPct > 0) {
      const heal = Math.max(1, Math.round(damage * this.stats.lifestealPct));
      this.hp = Math.min(this.stats.maxHp, this.hp + heal);
    }

    const prevCombo = this.comboHits;
    this.comboHits++;
    this.comboDecayTimer = COMBO_DECAY_WINDOW_SEC;
    this.score += damage;

    const hitCriticalCombo = isCriticalComboMilestone(prevCombo, this.comboHits, 50);

    gameAudio.playHit(isCrit);
    const isLuna = this.save.selectedCharacter === 'luna';
    const isLyra = this.save.selectedCharacter === 'lyra';
    const isWitch = this.save.selectedCharacter === 'witch';
    const aura = BLADE_AURAS[this.save.weapon.aura];
    const hitCols = isLuna
      ? isCrit
        ? ['#FACC15', '#38BDF8', '#A855F7']
        : ['#38BDF8', '#A855F7', '#E9D5FF']
      : isLyra
        ? isCrit
          ? ['#FEF08A', '#F97316', '#EF4444']
          : ['#FEF08A', '#F97316']
        : isWitch
          ? isCrit
            ? ['#FACC15', '#E879F9', '#C084FC']
            : ['#E879F9', '#C084FC']
          : isCrit
            ? ['#FACC15', aura.coreHex, aura.glowHex]
            : [aura.coreHex, aura.glowHex];

    this.pool.spawnBurst(
      enemy.x + enemy.w * 0.5,
      enemy.y + enemy.h * 0.45,
      isCrit ? 15 : 8,
      hitCols,
      70,
      240,
      isCrit ? 5 : 4,
      isCrit
    );
    this.pool.spawnText(
      enemy.x + enemy.w * 0.5,
      enemy.y - 8,
      `${damage}`,
      isCrit ? '#FACC15' : isLyra ? '#FED7AA' : isWitch ? '#F5D0FE' : '#F3E8FF',
      isCrit ? 1.35 : 1.0,
      isCrit ? 'crit' : 'normal',
      isCrit ? 'CRIT!' : ''
    );

    if (hitCriticalCombo) {
      this.trauma = Math.min(1, this.trauma + 0.55);
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.055);
      this.pool.spawnBurst(
        this.px + this.pw * 0.5,
        this.py + this.ph * 0.4,
        24,
        ['#FACC15', '#F43F5E', '#C084FC', '#FFFFFF'],
        105,
        300,
        5,
        true
      );
      this.pool.spawnText(
        this.px + this.pw * 0.5,
        this.py - 34,
        `CRITICAL COMBO ${this.comboHits}x!`,
        '#FACC15',
        1.25,
        'chain',
        'CRITICAL COMBO!'
      );
      this.emitHud(true);
    } else if (isCrit || this.comboStep === 3) {
      this.hitstopTimer = Math.max(this.hitstopTimer, isCrit ? 0.045 : 0.032);
      this.trauma = Math.min(1, this.trauma + (isCrit ? 0.28 : 0.18));
    }

    if (enemy.hp <= 0) {
      this.handleEnemyKilled(enemy, isLyra);
    }
  }

  private handleEnemyKilled(enemy: EnemyEntity, isLyra: boolean): void {
    if (enemy.state === 'ko') return;
    enemy.hp = 0;
    enemy.state = 'ko';
    enemy.koTimer = 0.34;
    enemy.hasToken = false;
    enemy.vy = -210;
    this.kills++;
    const silverDrop = computeMonsterSilverDrop(enemy.kind, this.stage);
    this.runSilver += silverDrop;
    this.score += enemy.kind === 'boss' ? 800 * this.stage : 120 * this.stage;
    this.goldEarned += enemy.kind === 'boss' ? 180 : 28 + this.stage * 6;
    this.essenceEarned += enemy.kind === 'boss' ? 16 : 3;
    if (this.stats.killHeal > 0) {
      this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.killHeal);
    }
    if (enemy.kind !== 'boss' && enemy.kind !== 'boss_bat') {
      this.callbacks.onMonsterKilled(enemy.kind);
    }
    this.hitstopTimer = Math.max(this.hitstopTimer, enemy.kind === 'boss' ? 0.08 : 0.04);
    this.trauma = Math.min(1, this.trauma + (enemy.kind === 'boss' ? 0.65 : 0.25));
    gameAudio.playKill();
    const cx = enemy.x + enemy.w * 0.5;
    const cy = enemy.y + enemy.h * 0.5;
    this.pool.spawnBurst(
      cx,
      cy,
      enemy.kind === 'boss' ? 32 : 16,
      isLyra ? ['#FACC15', '#F97316', '#E2E8F0'] : ['#C084FC', '#7E22CE', '#E2E8F0'],
      90,
      300,
      5,
      true
    );
    if (enemy.kind === 'boss' || enemy.kind === 'zombie_knight' || enemy.kind === 'boss_bat') {
      this.pool.spawnText(cx, enemy.y - 24, `+${silverDrop} Silver`, '#E2E8F0', 0.92, 'chain');
    }

    // Rule: When Boss dies, automatically KO all remaining non-boss monsters and save grounded Boss death spot
    if (enemy.kind === 'boss') {
      const clampedX = Math.max(130, Math.min(this.currentLayout.worldW - 130, cx));
      this.bossDeathSpot = {
        x: clampedX,
        y: this.getTerrainYAt(clampedX),
      };
      for (let i = 0; i < this.enemies.length; i++) {
        const other = this.enemies[i];
        if (other !== enemy && other.state !== 'ko') {
          this.handleEnemyKilled(other, isLyra);
        }
      }
    }
  }

  private damagePlayer(amount: number): void {
    if (this.invulnTimer > 0 || this.mode !== 'playing') return;
    this.hp = Math.max(0, this.hp - amount);
    this.trauma = Math.min(1, this.trauma + 0.42);
    this.hitstopTimer = 0.04;
    gameAudio.playPlayerHurt();
    this.pool.spawnBurst(this.px + this.pw * 0.5, this.py + this.ph * 0.5, 12, ['#EF4444', '#FCA5A5'], 60, 210, 4);
    this.pool.spawnText(this.px + this.pw * 0.5, this.py - 10, `-${amount}`, '#F87171', 1.15, 'hurt');

    if (this.hp <= 0) {
      this.finishRun('defeat');
    } else {
      this.invulnTimer = 0.72;
      this.playerHitFlash = 0.12;
      this.hurtBlinkTimer = 0.5;
      this.emitHud(true);
    }
  }

  private updateProjectiles(dt: number): void {
    const playerBox = { x: this.px + 6, y: this.py + 6, w: this.pw - 12, h: this.ph - 12 };
    const dummyBox = this.getTrainingDummyBox();

    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -60 || p.x > this.currentLayout.worldW + 60 || p.y > this.currentLayout.worldH - 40) {
        p.active = false;
        continue;
      }

      if ((p.kind === 'fireball' || p.kind === 'meteor') && Math.random() < 0.65) {
        this.pool.spawnParticle(p.x, p.y, -p.vx * 0.15, (Math.random() - 0.5) * 40, 4, 0.25, '#F97316', 0, true);
      } else if (p.kind === 'ice_arrow' && Math.random() < 0.5) {
        this.pool.spawnParticle(p.x, p.y, -p.vx * 0.1, (Math.random() - 0.5) * 28, 3, 0.22, '#BAE6FD', 0, true);
      } else if ((p.kind === 'witch_bolt' || p.kind === 'kunai') && Math.random() < 0.5) {
        this.pool.spawnParticle(p.x, p.y, -p.vx * 0.1, (Math.random() - 0.5) * 24, 3, 0.22, p.color, 0, true);
      }

      if (p.kind === 'meteor' && p.fromPlayer) {
        const floorHere = this.mode === 'lobby' ? LOBBY_GROUND_Y : this.getTerrainYAt(p.x);
        if (p.y >= floorHere - 8) {
          this.trauma = Math.min(1, this.trauma + 0.22);
          this.skillVfx.spawn({
            kind: 'star_pillar',
            x: p.x,
            y: floorHere,
            tx: p.x,
            ty: floorHere,
            facing: 1,
            radius: 105,
            angle: 0,
            maxLife: 0.48,
            color: p.color,
            coreColor: p.coreColor,
            accentColor: '#FACC15',
            orbitCount: 4,
            followPlayer: false,
            trackTargetToPlayer: false,
          });
          this.pool.spawnBurst(p.x, floorHere - 12, 18, ['#FB923C', '#FACC15', p.color], 85, 250, 4, true);
          for (const splashEnemy of this.enemies) {
            if (splashEnemy.state === 'ko') continue;
            const sx = splashEnemy.x + splashEnemy.w * 0.5;
            const sy = splashEnemy.y + splashEnemy.h * 0.5;
            if (Math.hypot(sx - p.x, sy - floorHere) <= 135) {
              this.damageEnemy(splashEnemy, p.damage, p.isCrit, 160, 'burn', p.skillLevel ?? 1);
            }
          }
          if (dummyBox && Math.hypot(dummyBox.x + dummyBox.w * 0.5 - p.x, dummyBox.y + dummyBox.h - floorHere) <= 135) {
            this.damageTrainingDummy(p.damage, p.isCrit);
          }
          p.active = false;
          continue;
        }
      }

      const pBox = {
        x: p.x - p.radius,
        y: p.y - p.radius,
        w: p.radius * 2,
        h: p.radius * 2,
      };

      if (p.fromPlayer) {
        let hitSomething = false;
        for (const enemy of this.enemies) {
          if (enemy.state === 'ko') continue;
          if (aabbOverlap(pBox, enemy)) {
            if (p.kind === 'fireball' || p.kind === 'meteor') {
              // AoE splash explosion + Starlight Pillar for meteor
              if (p.kind === 'meteor') {
                this.skillVfx.spawn({
                  kind: 'star_pillar',
                  x: p.x,
                  y: enemy.y + enemy.h,
                  tx: p.x,
                  ty: enemy.y + enemy.h,
                  facing: 1,
                  radius: 105,
                  angle: 0,
                  maxLife: 0.48,
                  color: p.color,
                  coreColor: p.coreColor,
                  accentColor: '#FACC15',
                  orbitCount: 4,
                  followPlayer: false,
                  trackTargetToPlayer: false,
                });
              }
              this.pool.spawnBurst(p.x, p.y, 18, ['#F97316', '#FACC15', '#EF4444'], 80, 250, 5, true);
              const splashRadius = p.kind === 'meteor' ? 130 : 95;
              for (const splashEnemy of this.enemies) {
                if (splashEnemy.state === 'ko') continue;
                const sx = splashEnemy.x + splashEnemy.w * 0.5;
                const sy = splashEnemy.y + splashEnemy.h * 0.5;
                if (Math.hypot(sx - p.x, sy - p.y) <= splashRadius) {
                  this.damageEnemy(splashEnemy, p.damage, p.isCrit, 140, 'burn', p.skillLevel ?? 1);
                }
              }
            } else {
              if (p.kind === 'spear') {
                this.skillVfx.spawn({
                  kind: 'curse_sigil',
                  x: p.x,
                  y: p.y,
                  tx: p.x,
                  ty: p.y,
                  facing: 1,
                  radius: 44,
                  angle: 0,
                  maxLife: 0.34,
                  color: p.color,
                  coreColor: p.coreColor,
                  accentColor: '#7E22CE',
                  orbitCount: 4,
                  followPlayer: false,
                  trackTargetToPlayer: false,
                });
              }
              this.damageEnemy(enemy, p.damage, p.isCrit, 120, p.element, p.skillLevel ?? 1);
            }
            p.pierce--;
            hitSomething = true;
            if (p.pierce <= 0) {
              p.active = false;
              break;
            }
          }
        }
        if (p.active && !hitSomething && dummyBox && aabbOverlap(pBox, dummyBox)) {
          if (p.kind === 'meteor') {
            this.skillVfx.spawn({
              kind: 'star_pillar',
              x: p.x,
              y: dummyBox.y + dummyBox.h,
              tx: p.x,
              ty: dummyBox.y + dummyBox.h,
              facing: 1,
              radius: 105,
              angle: 0,
              maxLife: 0.48,
              color: p.color,
              coreColor: p.coreColor,
              accentColor: '#FACC15',
              orbitCount: 4,
              followPlayer: false,
              trackTargetToPlayer: false,
            });
          } else if (p.kind === 'spear') {
            this.skillVfx.spawn({
              kind: 'curse_sigil',
              x: p.x,
              y: p.y,
              tx: p.x,
              ty: p.y,
              facing: 1,
              radius: 44,
              angle: 0,
              maxLife: 0.34,
              color: p.color,
              coreColor: p.coreColor,
              accentColor: '#7E22CE',
              orbitCount: 4,
              followPlayer: false,
              trackTargetToPlayer: false,
            });
          }
          this.damageTrainingDummy(p.damage, p.isCrit);
          p.active = false;
        }
      } else if (aabbOverlap(pBox, playerBox)) {
        this.damagePlayer(p.damage);
        p.active = false;
      }
    }
  }

  private updateEnemies(dt: number): void {
    const pcx = this.px + this.pw * 0.5;
    const pcy = this.py + this.ph * 0.5;
    const playerBox = { x: this.px + 8, y: this.py + 8, w: this.pw - 16, h: this.ph - 12 };
    const isLyra = this.save.selectedCharacter === 'lyra';

    let activeTokens = 0;
    for (const e of this.enemies) {
      if (e.hasToken && e.state !== 'ko') activeTokens++;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.hitFlash = Math.max(0, e.hitFlash - dt);

      // Update Elemental Status Effects (Burn, Freeze, Poison)
      if (e.state !== 'ko') {
        if (e.burnTimer > 0) {
          e.burnTimer = Math.max(0, e.burnTimer - dt);
          e.burnTickAcc += dt;
          if (Math.random() < 0.35) {
            this.pool.spawnParticle(
              e.x + Math.random() * e.w,
              e.y + Math.random() * e.h * 0.7,
              (Math.random() - 0.5) * 24,
              -55 - Math.random() * 35,
              3,
              0.3,
              Math.random() < 0.5 ? '#FB923C' : '#FACC15',
              0,
              true
            );
          }
          if (e.burnTickAcc >= 0.5) {
            e.burnTickAcc = 0;
            const tickDmg = Math.max(2, Math.round(e.burnDps * 0.5));
            e.hp -= tickDmg;
            this.pool.spawnText(e.x + e.w * 0.5, e.y - 6, `${tickDmg}`, '#FB923C', 0.85, 'burn');
            if (e.hp <= 0) {
              this.handleEnemyKilled(e, isLyra);
              continue;
            }
          }
        }

        if (e.poisonTimer > 0) {
          e.poisonTimer = Math.max(0, e.poisonTimer - dt);
          e.poisonTickAcc += dt;
          if (Math.random() < 0.3) {
            this.pool.spawnParticle(
              e.x + Math.random() * e.w,
              e.y + e.h * 0.3 + Math.random() * e.h * 0.5,
              (Math.random() - 0.5) * 18,
              -35 - Math.random() * 25,
              3,
              0.38,
              Math.random() < 0.6 ? '#4ADE80' : '#A855F7',
              -10,
              true
            );
          }
          if (e.poisonTickAcc >= 0.55) {
            e.poisonTickAcc = 0;
            const tickDmg = Math.max(2, Math.round(e.poisonDps * 0.55));
            e.hp -= tickDmg;
            this.pool.spawnText(e.x + e.w * 0.5, e.y - 6, `${tickDmg}`, '#4ADE80', 0.85, 'poison');
            if (e.hp <= 0) {
              this.handleEnemyKilled(e, isLyra);
              continue;
            }
          }
        }

        if (e.freezeTimer > 0) {
          e.freezeTimer = Math.max(0, e.freezeTimer - dt);
          e.freezeLockTimer = Math.max(0, e.freezeLockTimer - dt);
          if (Math.random() < 0.22) {
            this.pool.spawnParticle(
              e.x + Math.random() * e.w,
              e.y + Math.random() * e.h * 0.8,
              (Math.random() - 0.5) * 16,
              25 + Math.random() * 25,
              3,
              0.35,
              '#BAE6FD',
              40,
              true
            );
          }
        }
      }

      if (e.state === 'ko') {
        e.koTimer -= dt;
        e.vy += GRAVITY * 0.7 * dt;
        e.x += e.vx * dt;
        const floorY = this.getTerrainYAt(e.x + e.w * 0.5);
        e.y = Math.min(floorY - e.h, e.y + e.vy * dt);
        if (e.koTimer <= 0) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      const freezeFactor = e.freezeLockTimer > 0 ? 0.08 : e.freezeTimer > 0 ? 0.35 : 1.0;
      const effDt = dt * freezeFactor;

      const ecx = e.x + e.w * 0.5;
      const ecy = e.y + e.h * 0.5;
      const dx = pcx - ecx;
      const dist = Math.abs(dx);
      const totalDist = Math.hypot(dx, pcy - ecy);
      e.attackCooldown = Math.max(0, e.attackCooldown - effDt);

      if (e.state === 'seek') {
        e.facing = dx >= 0 ? 1 : -1;

        if (e.kind === 'goblin') {
          const speed = (175 + this.stage * 8) * freezeFactor;
          e.vx += (e.facing * speed - e.vx) * Math.min(1, dt * 8);
          if (dist < 145 && Math.abs(pcy - ecy) < 95 && e.attackCooldown <= 0 && activeTokens < 3) {
            e.state = 'windup';
            e.stateTimer = 0.28;
            e.hasToken = true;
            activeTokens++;
            e.vx = 0;
          }
        } else if (e.kind === 'skeleton') {
          const desired = (dist < 190 ? -e.facing * 125 : dist > 360 ? e.facing * 120 : 0) * freezeFactor;
          e.vx += (desired - e.vx) * Math.min(1, dt * 6);
          if (totalDist < 520 && e.attackCooldown <= 0 && activeTokens < 3) {
            e.state = 'windup';
            e.stateTimer = 0.62;
            e.aimX = pcx;
            e.aimY = pcy;
            e.hasToken = true;
            activeTokens++;
            e.vx = 0;
          }
        } else if (e.kind === 'kelalawar' || e.kind === 'boss_bat') {
          // Hover and keep ranged line-of-sight to fire laser!
          e.hoverPhase += effDt * (e.kind === 'boss_bat' ? 4.0 : 3.2);
          const preferredY = Math.max(150, Math.min(620, pcy - 110)) + Math.sin(e.hoverPhase) * 38;
          const targetVx =
            (dist > 260 ? e.facing * (e.kind === 'boss_bat' ? 210 : 170) : dist < 130 ? -e.facing * 120 : Math.cos(e.hoverPhase) * 70) *
            freezeFactor;
          e.vx += (targetVx - e.vx) * Math.min(1, dt * 5);
          e.vy += ((preferredY - e.y) * 2.5 - e.vy) * Math.min(1, dt * 6);
          if (totalDist < 480 && e.attackCooldown <= 0 && activeTokens < 3) {
            e.state = 'windup';
            e.stateTimer = 0.68;
            e.aimX = pcx;
            e.aimY = pcy;
            e.laserHitApplied = false;
            if (e.kind === 'boss_bat') {
              this.spawnBossDangerZone(pcx, this.getTerrainYAt(pcx) - 24, 72, 0.9, e.atk, '#EF4444');
            }
            e.hasToken = true;
            activeTokens++;
            e.vx = 0;
            e.vy = 0;
          }
        } else if (e.kind === 'zombie_knight') {
          const speed = (102 + this.stage * 4) * freezeFactor;
          e.vx += (e.facing * speed - e.vx) * Math.min(1, dt * 5);
          if (dist < 102 && Math.abs(pcy - ecy) < 88 && e.attackCooldown <= 0 && activeTokens < 3) {
            e.state = 'windup';
            e.stateTimer = 0.62;
            e.hasToken = true;
            activeTokens++;
            e.vx = 0;
          }
        } else if (e.kind === 'boss') {
          const speed = (135 + this.stage * 6) * freezeFactor;
          e.vx += (e.facing * speed - e.vx) * Math.min(1, dt * 5);
          if (e.attackCooldown <= 0) {
            e.state = 'windup';
            e.bossPattern = (e.bossPattern + 1) % 3;
            e.stateTimer = e.bossPattern === 2 ? 0.65 : 0.5;
            e.aimX = pcx;
            e.aimY = pcy;
            e.hasToken = true;
            e.vx = 0;

            const targetGroundY = this.getTerrainYAt(pcx) - 20;
            if (e.bossPattern === 2) {
              if (this.stage === 1) {
                this.spawnBossDangerZone(pcx, targetGroundY, 92, 0.95, Math.round(e.atk * 1.2), '#EF4444');
                this.spawnBossDangerZone(ecx + e.facing * 120, this.getTerrainYAt(ecx) - 20, 74, 0.95, e.atk, '#EF4444');
              } else if (this.stage === 2) {
                this.spawnBossDangerZone(ecx, e.y + e.h - 18, 125, 0.9, Math.round(e.atk * 1.25), '#EF4444');
                this.spawnBossDangerZone(pcx, targetGroundY, 72, 1.0, e.atk, '#EF4444');
              } else if (this.stage === 3) {
                for (let z = -1; z <= 1; z++) {
                  const zx = pcx + z * 120;
                  this.spawnBossDangerZone(zx, this.getTerrainYAt(zx) - 20, 68, 0.9 + Math.abs(z) * 0.12, e.atk, '#EF4444');
                }
              } else if (this.stage === 4) {
                this.spawnBossDangerZone(pcx, targetGroundY, 85, 0.88, e.atk, '#EF4444');
                this.spawnBossDangerZone(pcx - 140, this.getTerrainYAt(pcx - 140) - 20, 65, 1.05, e.atk, '#EF4444');
                this.spawnBossDangerZone(pcx + 140, this.getTerrainYAt(pcx + 140) - 20, 65, 1.05, e.atk, '#EF4444');
              } else if (this.stage === 5) {
                for (let z = 0; z < 3; z++) {
                  const zx = pcx + (z - 1) * 105;
                  this.spawnBossDangerZone(zx, this.getTerrainYAt(zx) - 20, 70, 0.85 + z * 0.15, e.atk, '#EF4444');
                }
              } else if (this.stage === 6) {
                this.spawnBossDangerZone(pcx - 55, targetGroundY, 72, 0.85, e.atk, '#EF4444');
                this.spawnBossDangerZone(pcx + 55, targetGroundY, 72, 0.85, e.atk, '#EF4444');
              } else if (this.stage === 7) {
                for (let z = -1; z <= 1; z++) {
                  const zx = pcx + z * 110;
                  this.spawnBossDangerZone(zx, this.getTerrainYAt(zx) - 20, 76, 0.9, Math.round(e.atk * 1.15), '#EF4444');
                }
              } else if (this.stage === 8) {
                this.spawnBossDangerZone(pcx, targetGroundY, 130, 1.05, Math.round(e.atk * 1.35), '#EF4444');
              } else if (this.stage === 9) {
                for (let z = -1; z <= 2; z++) {
                  const zx = pcx + (z - 0.5) * 115;
                  this.spawnBossDangerZone(zx, this.getTerrainYAt(zx) - 20, 74, 0.92 + (z + 1) * 0.1, Math.round(e.atk * 1.2), '#EF4444');
                }
              } else {
                for (let z = -2; z <= 2; z++) {
                  const zx = pcx + z * 110;
                  this.spawnBossDangerZone(zx, this.getTerrainYAt(zx) - 20, 72, 0.95 + Math.abs(z) * 0.08, Math.round(e.atk * 1.3), '#EF4444');
                }
              }
            } else if (e.bossPattern === 0) {
              this.spawnBossDangerZone(pcx, targetGroundY, 74, 0.78, e.atk, '#EF4444');
            }
          }
        }
      } else if (e.state === 'windup') {
        e.stateTimer -= effDt;
        e.vx *= 0.85;
        if ((e.kind === 'skeleton' || e.kind === 'kelalawar' || e.kind === 'boss_bat') && e.stateTimer > 0.28) {
          e.aimX = pcx;
          e.aimY = pcy;
        }
        if (e.stateTimer <= 0) {
          e.state = 'attack';
          if (e.kind === 'goblin') {
            e.vx = e.facing * 410;
            e.vy = -260;
            e.stateTimer = 0.28;
          } else if (e.kind === 'skeleton') {
            const ang = Math.atan2(e.aimY - (ecy - 8), e.aimX - (ecx + e.facing * 18));
            this.spawnProjectile({
              fromPlayer: false,
              x: ecx + e.facing * 18,
              y: ecy - 8,
              vx: Math.cos(ang) * 440,
              vy: Math.sin(ang) * 440,
              radius: 9,
              damage: e.atk,
              isCrit: false,
              pierce: 1,
              life: 2.0,
              color: '#EF4444',
              coreColor: '#F8FAFC',
              kind: 'bone',
            });
            e.stateTimer = 0.16;
          } else if (e.kind === 'kelalawar' || e.kind === 'boss_bat') {
            // Kelalawar fires an Abyssal Laser Beam toward locked aim coordinates!
            const ang = Math.atan2(e.aimY - ecy, e.aimX - ecx);
            const beamLen = e.kind === 'boss_bat' ? 760 : 620;
            e.laserEndX = ecx + Math.cos(ang) * beamLen;
            e.laserEndY = ecy + Math.sin(ang) * beamLen;
            e.laserHitApplied = false;
            e.vx = 0;
            e.vy = 0;
            e.stateTimer = 0.28;
            this.pool.spawnBurst(ecx, ecy, 10, ['#F43F5E', '#FDA4AF', '#FFFFFF'], 40, 140, 4, true);
          } else if (e.kind === 'zombie_knight') {
            e.vx = e.facing * 145;
            e.stateTimer = 0.24;
            const slamBox = {
              x: e.facing === 1 ? e.x + 14 : e.x - 68,
              y: e.y - 12,
              w: e.w + 58,
              h: e.h + 18,
            };
            this.skillVfx.spawn({
              kind: 'boss_cleave_arc',
              x: ecx + e.facing * 24,
              y: ecy,
              tx: ecx + e.facing * 74,
              ty: ecy,
              facing: e.facing,
              radius: 74,
              angle: 0,
              maxLife: 0.26,
              color: '#EF4444',
              coreColor: '#FECACA',
              accentColor: '#84CC16',
              orbitCount: 2,
              followPlayer: false,
              trackTargetToPlayer: false,
            });
            this.pool.spawnBurst(ecx + e.facing * 42, e.y + e.h - 6, 12, ['#94A3B8', '#84CC16', '#EF4444'], 50, 170, 4);
            if (aabbOverlap(slamBox, playerBox)) {
              this.damagePlayer(e.atk);
            }
          } else if (e.kind === 'boss') {
            if (e.bossPattern === 0) {
              e.vx = e.facing * (510 + this.stage * 12);
              e.stateTimer = 0.42;
              this.skillVfx.spawn({
                kind: 'boss_cleave_arc',
                x: ecx + e.facing * 44,
                y: ecy,
                tx: ecx + e.facing * 130,
                ty: ecy,
                facing: e.facing,
                radius: 120,
                angle: 0,
                maxLife: 0.36,
                color: '#EF4444',
                coreColor: '#FEF08A',
                accentColor: '#A855F7',
                orbitCount: 3,
                followPlayer: false,
                trackTargetToPlayer: false,
              });
            } else if (e.bossPattern === 1) {
              const count = this.stage >= 8 ? 5 : 3;
              const half = Math.floor(count / 2);
              for (let k = -half; k <= half; k++) {
                this.spawnProjectile({
                  fromPlayer: false,
                  x: ecx + e.facing * 25,
                  y: ecy - 10,
                  vx: e.facing * (330 + this.stage * 12),
                  vy: k * 85,
                  radius: 13,
                  damage: e.atk,
                  isCrit: false,
                  pierce: 1,
                  life: 2.3,
                  color: '#EF4444',
                  coreColor: '#FECACA',
                  kind: 'orb',
                });
              }
              this.skillVfx.spawn({
                kind: 'boss_cleave_arc',
                x: ecx + e.facing * 32,
                y: ecy - 8,
                tx: ecx + e.facing * 95,
                ty: ecy,
                facing: e.facing,
                radius: 95,
                angle: 0,
                maxLife: 0.3,
                color: '#A855F7',
                coreColor: '#F5D0FE',
                accentColor: '#EF4444',
                orbitCount: 2,
                followPlayer: false,
                trackTargetToPlayer: false,
              });
              e.stateTimer = 0.25;
            } else {
              this.trauma = Math.min(1, this.trauma + 0.35);
              this.skillVfx.spawn({
                kind: 'boss_shockwave',
                x: ecx,
                y: e.y + e.h,
                tx: ecx,
                ty: e.y + e.h,
                facing: e.facing,
                radius: 145,
                angle: 0,
                maxLife: 0.44,
                color: '#EF4444',
                coreColor: '#FEF08A',
                accentColor: '#A855F7',
                orbitCount: 4,
                followPlayer: false,
                trackTargetToPlayer: false,
              });
              this.pool.spawnBurst(ecx, e.y + e.h - 6, 22, ['#EF4444', '#A855F7'], 80, 280, 5, true);
              e.stateTimer = 0.3;
            }
          }
        }
      } else if (e.state === 'attack') {
        e.stateTimer -= dt;
        if (e.kind === 'kelalawar' || e.kind === 'boss_bat') {
          if (
            !e.laserHitApplied &&
            segmentIntersectsRect(
              ecx,
              ecy,
              e.laserEndX,
              e.laserEndY,
              playerBox.x,
              playerBox.y,
              playerBox.w,
              playerBox.h
            )
          ) {
            e.laserHitApplied = true;
            this.damagePlayer(e.atk);
          }
        } else if (
          (e.kind === 'goblin' || (e.kind === 'boss' && e.bossPattern === 0)) &&
          aabbOverlap(e, playerBox)
        ) {
          this.damagePlayer(e.atk);
        }

        if (e.stateTimer <= 0) {
          e.state = 'recover';
          e.stateTimer = 0.4;
          e.hasToken = false;
          e.attackCooldown = e.kind === 'boss' ? 1.35 : 1.45 + Math.random() * 0.65;
        }
      } else if (e.state === 'recover') {
        e.stateTimer -= effDt;
        e.vx *= 0.86;
        if (e.stateTimer <= 0) {
          e.state = 'seek';
        }
      }

      if (e.kind !== 'kelalawar' && e.kind !== 'boss_bat') {
        e.vy += GRAVITY * dt;
      }
      const prevBottom = e.y + e.h;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = Math.max(32, Math.min(this.currentLayout.worldW - e.w - 32, e.x));

      // Keep platform-spawned upper-tier monsters patrolling on their elevated balcony unless knocked off
      if (e.homePlatform && e.state === 'seek' && e.vy === 0) {
        const minPx = e.homePlatform.x + 12;
        const maxPx = e.homePlatform.x + e.homePlatform.w - e.w - 12;
        if (e.x <= minPx) {
          e.x = minPx;
          e.vx = Math.max(0, e.vx);
        } else if (e.x >= maxPx) {
          e.x = maxPx;
          e.vx = Math.min(0, e.vx);
        }
      }

      if (e.kind !== 'kelalawar' && e.kind !== 'boss_bat') {
        let onPlat = false;
        if (e.vy >= 0 && e.kind !== 'boss') {
          for (const plat of this.currentLayout.platforms) {
            if (e.x + e.w > plat.x + 8 && e.x < plat.x + plat.w - 8 && prevBottom <= plat.y + 12 && e.y + e.h >= plat.y) {
              e.y = plat.y - e.h;
              e.vy = 0;
              onPlat = true;
              break;
            }
          }
        }
        const floorY = this.getTerrainYAt(e.x + e.w * 0.5);
        if (!onPlat && e.y + e.h >= floorY) {
          e.y = floorY - e.h;
          e.vy = 0;
        }
      } else {
        const floorY = this.getTerrainYAt(e.x + e.w * 0.5);
        e.y = Math.max(120, Math.min(floorY - 60, e.y));
      }
    }
  }

  private checkRoomClear(): void {
    const alive = this.enemies.filter((e) => e.state !== 'ko').length;
    if (alive === 0 && !this.portalReady) {
      this.portalReady = true;
      this.hitstopTimer = 0;

      if (this.subStage === 5 && this.bossDeathSpot) {
        this.portalX = this.bossDeathSpot.x;
        this.portalY = this.bossDeathSpot.y;
        this.portalSide = this.portalX < this.currentLayout.worldW * 0.5 ? 'left' : 'right';
        this.portalScale = 1.38;
        this.portalSpawnProgress = 0;
      } else {
        const candidates = [
          {
            side: 'left' as const,
            spot: this.currentLayout.portalLeftSpot,
          },
          {
            side: 'right' as const,
            spot: this.currentLayout.portalRightSpot,
          },
          ...this.currentLayout.lowerPortalSpots.map((spot) => ({
            side: (spot.x < this.currentLayout.worldW * 0.5 ? 'left' : 'right') as 'left' | 'right',
            spot,
          })),
        ];
        const chosen = candidates[Math.floor(Math.random() * candidates.length) % candidates.length];
        this.portalSide = chosen.side;
        this.portalX = chosen.spot.x;
        this.portalY = chosen.spot.y;
        this.portalScale = 1.0;
        this.portalSpawnProgress = 1;
      }

      gameAudio.playPortal();
      this.pool.spawnBurst(this.portalX, this.portalY - 52, 22, ['#C084FC', '#A855F7', '#F3E8FF'], 60, 210, 4, true);

      if (this.subStage === 5) {
        this.chestReady = true;
        this.chestOpened = false;
        this.chestX = Math.round(this.currentLayout.worldW * 0.5);
        this.chestY = this.getTerrainYAt(this.chestX);
        this.pool.spawnBurst(this.chestX, this.chestY - 24, 24, ['#FACC15', '#A855F7'], 70, 230, 5, true);
      }
      this.emitHud(true);
    }
  }

  private finishRun(outcome: 'victory' | 'defeat'): void {
    this.mode = 'gameover';
    this.playerHitFlash = 0;
    this.hurtBlinkTimer = 0;
    this.invulnTimer = 0;
    this.clearHeldInputs();

    const boss = this.enemies.find((e) => e.kind === 'boss');
    const bossPct = boss ? Math.round((boss.hp / boss.maxHp) * 100) : 0;

    if (outcome === 'victory') {
      this.gemsEarned += 320;
      this.goldEarned += 1200;
      this.shardsEarned += 30;
      this.essenceEarned += 45;
      gameAudio.playChestOrGacha(true);
    } else {
      // Non-persistent dungeon Silver resets strictly to 0 upon defeat
      this.runSilver = 0;
      gameAudio.playPlayerHurt();
    }

    this.emitHud(true);
    this.callbacks.onRunEnd({
      outcome,
      stageReached: this.stage,
      subStageReached: this.subStage,
      score: Math.round(this.score),
      kills: this.kills,
      clearTimeSec: Math.round(this.elapsedSec),
      bossHpRemainingPct: bossPct,
      gemsEarned: this.gemsEarned,
      goldEarned: this.goldEarned,
      shardsEarned: this.shardsEarned,
      essenceEarned: this.essenceEarned,
    });
  }

  private emitHud(force: boolean): void {
    const boss = this.enemies.find((e) => e.kind === 'boss' && e.state !== 'ko');
    const alive = this.enemies.filter((e) => e.state !== 'ko').length;
    const activeBar = this.getActiveSkillBar();
    const maxCds: [number, number, number] = [
      ACTIVE_SKILLS[activeBar[0]].cooldown * (1 - this.stats.cooldownReduction),
      ACTIVE_SKILLS[activeBar[1]].cooldown * (1 - this.stats.cooldownReduction),
      ACTIVE_SKILLS[activeBar[2]].cooldown * (1 - this.stats.cooldownReduction),
    ];
    const equippedSubs = this.getEquippedSubSkills();
    const subCooldowns = equippedSubs.map((_, idx) =>
      Number((this.subSkillCooldowns[idx] ?? 0).toFixed(1))
    );
    const subMaxCds = equippedSubs.map((s) =>
      SUB_SKILLS[s.id]
        ? getSubSkillScaledStats(s.id, s.level).cooldown * (1 - this.stats.cooldownReduction)
        : 1
    );

    if (!force && this.mode !== 'playing' && this.mode !== 'lobby') return;

    const bossBar = boss
      ? computeBossBarState(boss.hp, boss.maxHp, boss.bossTotalBars ?? 5)
      : { hp: 0, maxHp: 0, barHp: 0, barMaxHp: 0, barsRemaining: 0, totalBars: 0 };
    const activeSynergies = computeRunItemBonuses(this.runInventory).activeSynergies;
    const activeItemSubCombos = computeItemSubSkillCombos(this.runInventory, this.runSubSkills);

    this.callbacks.onHudUpdate({
      characterId: this.save.selectedCharacter,
      lobbyRoom: this.lobbyRoom,
      nearLobbyObject: this.getNearLobbyObject(),
      dummyLastHit: this.dummyLastHit,
      dummyMaxHit: this.dummyMaxHit,
      dummyDps: this.dummyDps,
      hp: Math.round(this.hp),
      maxHp: this.stats.maxHp,
      mp: Math.round(this.mp),
      maxMp: this.stats.maxMp,
      silver: this.runSilver,
      stage: this.stage,
      subStage: this.subStage,
      isBossRoom: this.subStage === 5,
      bossName: boss ? STAGE_BOSS_NAMES[this.stage - 1] : null,
      bossHp: Math.round(bossBar.hp),
      bossMaxHp: bossBar.maxHp,
      bossBarHp: Math.round(bossBar.barHp),
      bossBarMaxHp: Math.round(bossBar.barMaxHp),
      bossBarsRemaining: bossBar.barsRemaining,
      bossTotalBars: bossBar.totalBars,
      monstersAlive: alive,
      portalReady: this.portalReady,
      portalSpawnProgress: Number(this.portalSpawnProgress.toFixed(2)),
      portalSide: this.portalSide,
      chestReady: this.chestReady,
      chestOpened: this.chestOpened,
      nearInteractable: this.getNearInteractable(),
      autoCombat: this.autoCombat,
      auraOverdriveSec: Number(this.auraOverdriveTimer.toFixed(1)),
      hasDoubleJump: this.stats.hasDoubleJump,
      combo: this.comboHits,
      comboTimerPct: computeComboTimerPct(this.comboHits, this.comboDecayTimer, COMBO_DECAY_WINDOW_SEC),
      comboChain: toComboChainHud(this.comboChain, this.ambientTime),
      score: Math.round(this.score),
      kills: this.kills,
      elapsedSec: Math.round(this.elapsedSec),
      skillCooldowns: [
        Number(this.skillCooldowns[0].toFixed(1)),
        Number(this.skillCooldowns[1].toFixed(1)),
        Number(this.skillCooldowns[2].toFixed(1)),
      ],
      skillMaxCooldowns: maxCds,
      runSubSkills: equippedSubs.map((s) => ({ ...s })),
      subSkillCooldowns: subCooldowns,
      subSkillMaxCooldowns: subMaxCds,
      runInventory: this.runInventory.map((item) => ({ ...item })),
      activeSynergies,
      activeItemSubCombos,
      dashCooldown: Number(this.dashCooldown.toFixed(1)),
      inRunBanner: this.roomBannerTimer > 0 ? this.roomBannerText : null,
      minimap: {
        worldW: this.currentLayout.worldW,
        worldH: this.currentLayout.worldH,
        playerX: Math.round(this.px + this.pw * 0.5),
        playerY: Math.round(this.py + this.ph * 0.5),
        portal: this.portalReady ? { x: this.portalX, y: this.portalY } : null,
        bossChest: this.chestReady
          ? { x: this.chestX, y: this.chestY, opened: this.chestOpened }
          : null,
        tomb: { x: this.tomb.x, y: this.tomb.y, opened: this.tomb.opened },
        catMerchant:
          this.catMerchant && this.catMerchant.active
            ? { x: this.catMerchant.x, y: this.catMerchant.y }
            : null,
        supplyChests: this.supplyChests.map((s) => ({ x: s.x, y: s.y, opened: s.opened })),
        platforms: this.currentLayout.platforms.map((p) => ({ x: p.x, y: p.y, w: p.w })),
        floorSegments: this.currentLayout.floorSegments,
      },
    });
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.mode === 'lobby' ? '#161422' : '#11141D';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    ctx.save();
    const shakeMag = this.trauma * this.trauma * 14;
    const shakeX = shakeMag > 0.2 ? (Math.random() * 2 - 1) * shakeMag : 0;
    const shakeY = shakeMag > 0.2 ? (Math.random() * 2 - 1) * shakeMag : 0;

    ctx.translate(this.offsetX + shakeX, this.offsetY + shakeY);
    ctx.scale(this.scale, this.scale);
    const activeCamX = this.mode === 'title' ? 0 : Math.round(this.camX);
    const activeCamY = this.mode === 'title' || this.mode === 'lobby' ? 0 : Math.round(this.camY);
    const viewLeft = activeCamX - 110;
    const viewRight = activeCamX + this.visibleWorldW + 110;
    ctx.translate(-activeCamX, -activeCamY);

    if (this.mode === 'lobby') {
      this.renderLobbyBackdrop(ctx, activeCamX);
      this.renderLobbyWorld(ctx);
      ctx.restore();
      return;
    }

    this.renderGothicCathedralBackdrop(ctx, activeCamX, activeCamY);

    if (this.mode === 'title') {
      ctx.restore();
      return;
    }

    // 1. Multi-tier Textured Stone Dungeon Platforms & Upper Balcony Floors (enriched ashlar + corbels)
    const theme = getStageTheme(this.stage);
    for (const plat of this.currentLayout.platforms) {
      if (plat.x + plat.w < viewLeft || plat.x > viewRight) continue;
      // Layered drop shadow beneath stone ledge
      ctx.fillStyle = 'rgba(4, 4, 10, 0.62)';
      ctx.fillRect(plat.x + 6, plat.y + plat.h, plat.w - 12, 10);
      // Dark stone base & midtone ashlar body
      ctx.fillStyle = theme.platformBase;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = theme.pillarMid;
      ctx.fillRect(plat.x + 2, plat.y + 5, plat.w - 4, plat.h - 8);
      // Highlighted stone top bevel (foreground contrast edge + inner specular lip)
      ctx.fillStyle = plat.isUpperFloor ? theme.upperPlatformTop : theme.platformTop;
      ctx.fillRect(plat.x - 2, plat.y, plat.w + 4, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(plat.x, plat.y, plat.w, 1.5);
      // Staggered stone masonry joints & bevelled bricks
      ctx.fillStyle = theme.floorDeep;
      for (let bx = plat.x + 20; bx < plat.x + plat.w - 12; bx += 26) {
        ctx.fillRect(bx, plat.y + 5, 2, Math.floor((plat.h - 5) * 0.55));
        ctx.fillRect(bx + 13, plat.y + Math.floor(plat.h * 0.55), 2, Math.ceil((plat.h - 5) * 0.45));
      }
      ctx.fillRect(plat.x + 2, plat.y + Math.floor(plat.h * 0.55), plat.w - 4, 1.5);
      // Carved rune/torch-lit corner endcaps & stepped stone corbels
      ctx.fillStyle = theme.accentHex;
      ctx.fillRect(plat.x + 5, plat.y + 7, 10, 4);
      ctx.fillRect(plat.x + plat.w - 15, plat.y + 7, 10, 4);
      ctx.fillStyle = theme.pillarDark;
      ctx.fillRect(plat.x + 12, plat.y + plat.h, 20, 14);
      ctx.fillRect(plat.x + plat.w - 32, plat.y + plat.h, 20, 14);
      ctx.fillRect(plat.x + 16, plat.y + plat.h + 14, 12, 6);
      ctx.fillRect(plat.x + plat.w - 28, plat.y + plat.h + 14, 12, 6);
      ctx.fillStyle = theme.pillarHighlight;
      ctx.fillRect(plat.x + 14, plat.y + plat.h, 16, 3);
      ctx.fillRect(plat.x + plat.w - 30, plat.y + plat.h, 16, 3);
      if (plat.w >= 360) {
        const midX = Math.round(plat.x + plat.w * 0.5);
        ctx.fillStyle = theme.pillarDark;
        ctx.fillRect(midX - 10, plat.y + plat.h, 20, 14);
        ctx.fillStyle = theme.pillarHighlight;
        ctx.fillRect(midX - 8, plat.y + plat.h, 16, 3);
      }
    }

    // 2. Player Sub-Skill Arena Hazards (Trap Api & Kabut Racun)
    this.renderPlayerHazards(ctx);

    // 3. Boss Red Circle Danger Zones
    for (let i = 0; i < this.dangerZones.length; i++) {
      const z = this.dangerZones[i];
      const progress = Math.max(0, Math.min(1, 1 - z.timer / z.duration));
      ctx.save();
      ctx.beginPath();
      ctx.arc(Math.round(z.x), Math.round(z.y), z.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#EF4444';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(Math.round(z.x), Math.round(z.y), Math.max(6, z.radius * progress), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.34)';
      ctx.fill();

      ctx.fillStyle = '#FEE2E2';
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', Math.round(z.x), Math.round(z.y));
      ctx.restore();
    }

    // 4. Ancient Tomb ("Makam") on Elevated Central Altar
    const tombSpr = getTombSprite(this.tomb.opened);
    ctx.drawImage(tombSpr, Math.round(this.tomb.x - 32), this.tomb.y - 84, 64, 84);

    // 5. 2 Elevated Orange Chests (Peti Oranye)
    for (let i = 0; i < this.supplyChests.length; i++) {
      const sc = this.supplyChests[i];
      const sSpr = getOrangeChestSprite(sc.opened);
      ctx.drawImage(sSpr, Math.round(sc.x - 28), sc.y - 48, 56, 48);
    }

    // 5b. White Cat Merchant NPC every 3rd stage (grounded flush in safe corner)
    if (this.catMerchant && this.catMerchant.active) {
      const catFrame: 0 | 1 = Math.floor(this.ambientTime * 3) % 2 === 0 ? 0 : 1;
      const catSpr = getWhiteCatNpcSprite(catFrame);
      ctx.save();
      ctx.fillStyle = 'rgba(4, 4, 10, 0.58)';
      ctx.beginPath();
      ctx.ellipse(Math.round(this.catMerchant.x), this.catMerchant.y + 2, 34, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(catSpr, Math.round(this.catMerchant.x - 42), this.catMerchant.y - 96, 84, 96);
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      const catTag = this.save.language === 'en' ? 'White Cat Shop' : 'Kucing Putih';
      const tw = ctx.measureText(catTag).width + 18;
      ctx.fillStyle = 'rgba(11, 10, 18, 0.88)';
      ctx.fillRect(Math.round(this.catMerchant.x - tw * 0.5), this.catMerchant.y - 116, Math.round(tw), 20);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(this.catMerchant.x - tw * 0.5), this.catMerchant.y - 116, Math.round(tw), 20);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(catTag, Math.round(this.catMerchant.x), this.catMerchant.y - 106);
      ctx.restore();
    }

    // 6. Enlarged Dark Fantasy Archway Portal (gradual bloom at Boss death spot or standard tier portal)
    if (this.portalReady) {
      const pFrame = Math.floor(this.ambientTime * 6) % 2 === 0 ? 0 : 1;
      const pSpr = getPortalSprite(pFrame);
      const ease = 1 - Math.pow(1 - this.portalSpawnProgress, 3);
      const scaleDraw = this.portalScale * (0.25 + 0.75 * ease);
      const drawW = Math.round(104 * scaleDraw);
      const drawH = Math.round(152 * scaleDraw);
      ctx.save();
      ctx.globalAlpha = Math.max(0.18, ease);
      ctx.drawImage(pSpr, Math.round(this.portalX - drawW * 0.5), this.portalY - drawH, drawW, drawH);
      ctx.restore();
      if (ease > 0.45) {
        this.renderStagePortalAura(ctx, this.portalX, this.portalY - Math.round(70 * scaleDraw), 'stage');
      }
    }

    // 7. Boss Skill Chest
    if (this.chestReady) {
      const cSpr = getChestSprite(this.chestOpened);
      ctx.drawImage(cSpr, Math.round(this.chestX - 28), this.chestY - 48, 56, 48);
    }

    // 8. Dash Afterimages
    this.renderDashAfterimages(ctx);

    // 9. Monsters, Kelalawar Laser Telegraph/Beam, Elemental Particle Shaders & 2x Bosses
    for (const e of this.enemies) {
      if (e.x + e.w < viewLeft || e.x > viewRight) continue;
      const animFrame: 0 | 1 = Math.floor(this.ambientTime * 6 + e.id) % 2 === 0 ? 0 : 1;
      const animPose: EnemyAnimPose =
        e.state === 'windup' ? 'windup' : e.state === 'attack' ? 'attack' : 'walk';
      const spr =
        e.kind === 'boss_bat'
          ? getOneEyedBatSprite(animFrame, e.hitFlash > 0, animPose)
          : getMonsterSprite(e.kind, animFrame, this.stage, e.hitFlash > 0, animPose);
      ctx.save();
      if (e.state === 'ko') {
        ctx.globalAlpha = Math.max(0, e.koTimer / 0.34);
      }
      const centerX = Math.round(e.x + e.w * 0.5);
      const centerY = Math.round(e.y + e.h * 0.5);
      const bottomY = Math.round(e.y + e.h);
      const walkBob =
        e.state === 'seek' && Math.abs(e.vx) > 20
          ? -Math.abs(Math.sin(this.ambientTime * 11 + e.id)) * (e.kind === 'boss' ? 4 : 3)
          : 0;
      const coilScaleX =
        e.state === 'windup' ? 0.94 : e.state === 'attack' ? 1.11 : 1.0;
      const coilScaleY =
        e.state === 'windup' ? 1.06 : e.state === 'attack' ? 0.92 : 1.0;
      const lungeOffset =
        e.state === 'windup'
          ? -e.facing * (e.kind === 'boss' ? 6 : 4)
          : e.state === 'attack'
            ? e.facing * (e.kind === 'boss' ? 12 : 8)
            : 0;
      const tiltRad =
        e.state === 'windup'
          ? -0.07
          : e.state === 'attack'
            ? 0.09
            : Math.abs(e.vx) > 20
              ? Math.sin(this.ambientTime * 10 + e.id) * 0.03
              : 0;

      ctx.translate(centerX + lungeOffset, Math.round(bottomY + walkBob));
      ctx.scale(e.facing * coilScaleX, coilScaleY);
      if (Math.abs(tiltRad) > 0.002) {
        ctx.rotate(tiltRad);
      }

      const drawW =
        e.kind === 'boss'
          ? 156
          : e.kind === 'boss_bat'
            ? 104
            : e.kind === 'zombie_knight'
              ? 78
              : e.kind === 'kelalawar'
                ? 72
                : 62;
      const drawH =
        e.kind === 'boss'
          ? 184
          : e.kind === 'boss_bat'
            ? 84
            : e.kind === 'zombie_knight'
              ? 90
              : e.kind === 'kelalawar'
                ? 54
                : 72;
      ctx.drawImage(spr, -drawW * 0.5, -drawH, drawW, drawH);
      ctx.restore();

      // Elemental Particle Shaders around enemies (Burn, Freeze, Poison)
      if (e.state !== 'ko') {
        this.renderEnemyElementalShaders(ctx, e, centerX, centerY);
      }

      // Windup telegraphs (Skeleton bow aim line & Kelalawar laser sight)
      if (e.state === 'windup') {
        if (e.kind === 'skeleton') {
          const startX = centerX + e.facing * 18;
          const startY = Math.round(e.y + e.h * 0.5 - 8);
          const ang = Math.atan2(e.aimY - startY, e.aimX - startX);
          const endX = Math.round(startX + Math.cos(ang) * 540);
          const endY = Math.round(startY + Math.sin(ang) * 540);

          ctx.save();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([10, 6]);
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(Math.round(e.aimX), Math.round(e.aimY), 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else if (e.kind === 'kelalawar' || e.kind === 'boss_bat') {
          const ang = Math.atan2(e.aimY - centerY, e.aimX - centerX);
          const len = e.kind === 'boss_bat' ? 760 : 620;
          const endX = Math.round(centerX + Math.cos(ang) * len);
          const endY = Math.round(centerY + Math.sin(ang) * len);

          ctx.save();
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Charging crimson orb at bat eye
          const pulse = 6 + Math.sin(this.ambientTime * 28) * 3;
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulse + 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFE4E6';
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(3, pulse - 2), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.save();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = e.kind === 'boss' ? 4 : 3;
          ctx.globalAlpha = 0.85;
          ctx.strokeRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8);
          if (e.kind === 'boss' || e.kind === 'zombie_knight') {
            const arcR = e.kind === 'boss' ? 112 : 68;
            ctx.beginPath();
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.arc(centerX + e.facing * (e.kind === 'boss' ? 42 : 24), centerY, arcR, e.facing === 1 ? -0.95 : Math.PI - 0.95, e.facing === 1 ? 0.95 : Math.PI + 0.95);
            ctx.fill();
            ctx.stroke();
          }
          ctx.fillStyle = '#FACC15';
          ctx.font = '700 18px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('!', centerX, e.y - 12);
          ctx.restore();
        }
      }

      // Active Kelalawar Laser Beam during attack state
      if (e.state === 'attack' && (e.kind === 'kelalawar' || e.kind === 'boss_bat')) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.42)';
        ctx.lineWidth = e.kind === 'boss_bat' ? 20 : 14;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(Math.round(e.laserEndX), Math.round(e.laserEndY));
        ctx.stroke();

        ctx.strokeStyle = '#F43F5E';
        ctx.lineWidth = e.kind === 'boss_bat' ? 10 : 7;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(Math.round(e.laserEndX), Math.round(e.laserEndY));
        ctx.stroke();

        ctx.strokeStyle = '#FFF1F2';
        ctx.lineWidth = e.kind === 'boss_bat' ? 4 : 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(Math.round(e.laserEndX), Math.round(e.laserEndY));
        ctx.stroke();
        ctx.restore();
      }

      if (e.kind !== 'boss' && e.state !== 'ko' && e.hp < e.maxHp) {
        const bw = 42;
        const bx = Math.round(centerX - bw * 0.5);
        const by = Math.round(e.y - 10);
        ctx.fillStyle = '#09090E';
        ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(bx, by, Math.round((e.hp / e.maxHp) * bw), 4);
      }
    }

    // 10. Player Sprite
    this.renderPlayerSprite(ctx);

    // 11. Projectiles
    this.renderProjectiles(ctx);

    // 11b. Distinct Skill Silhouettes & Active Boomerangs
    this.skillVfx.render(ctx);
    this.renderBoomerangs(ctx);

    // 12. Pooled Slash Arcs, Pixel Particles & Floating Combat Text
    this.pool.render(ctx);

    // 13. World-space Interaction Prompt
    const near = this.getNearInteractable();
    if (near) {
      const iKey = formatKeyCodeLabel(this.save.keybindings.interact);
      let targetX = this.portalX;
      let label = `[${iKey}] Masuk Portal`;
      let borderCol = '#C084FC';
      let promptY = this.portalY - Math.round(182 * this.portalScale);

      if (near === 'cat_merchant' && this.catMerchant) {
        targetX = this.catMerchant.x;
        label = `[${iKey}] ${this.save.language === 'en' ? 'White Cat Shop' : 'Toko Kucing Putih'}`;
        borderCol = '#E2E8F0';
        promptY = this.catMerchant.y - 144;
      } else if (near === 'chest') {
        targetX = this.chestX;
        label = `[${iKey}] Buka Peti Boss`;
        borderCol = '#FACC15';
        promptY = this.chestY - 84;
      } else if (near === 'tomb') {
        targetX = this.tomb.x;
        label = `[${iKey}] Periksa Makam Skill`;
        borderCol = '#A855F7';
        promptY = this.tomb.y - 118;
      } else if (near === 'supply') {
        const pcx = this.px + this.pw * 0.5;
        const pby = this.py + this.ph;
        const sc = this.supplyChests.find(
          (item) => !item.opened && Math.abs(pcx - item.x) < 72 && Math.abs(pby - item.y) < 55
        );
        targetX = sc ? sc.x : pcx;
        label = `[${iKey}] Buka Peti Oranye`;
        borderCol = '#FB923C';
        promptY = (sc ? sc.y : pby) - 88;
      }

      this.drawWorldPrompt(ctx, targetX, promptY, label, borderCol);
    }

    ctx.restore();
  }

  private renderBoomerangs(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.activeBoomerangs.length; i++) {
      const b = this.activeBoomerangs[i];
      ctx.save();
      ctx.translate(Math.round(b.x), Math.round(b.y));
      ctx.rotate(b.spin);
      ctx.fillStyle = '#0D061A';
      ctx.beginPath();
      ctx.arc(0, 0, 24, -1.4, 1.4);
      ctx.arc(-8, 0, 15, 1.4, -1.4, true);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(2, 0, 22, -1.3, 1.3);
      ctx.arc(-6, 0, 15, 1.3, -1.3, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = b.coreColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderPlayerHazards(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.playerHazards.length; i++) {
      const h = this.playerHazards[i];
      const vfxScale = getSubSkillVfxScale(h.skillLevel ?? 1);
      ctx.save();
      if (h.kind === 'fire_trap') {
        const pulse = 0.78 + Math.sin(this.ambientTime * 10) * 0.22;
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(h.x, h.y - 4, 4, h.x, h.y - 4, h.radius);
        grad.addColorStop(0, `rgba(251, 146, 60, ${(vfxScale.auraAlpha + 0.14) * pulse})`);
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(Math.round(h.x), Math.round(h.y - 4), h.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 2 + (h.skillLevel ?? 1) * 0.4;
        ctx.beginPath();
        ctx.ellipse(Math.round(h.x), Math.round(h.y - 3), h.radius * 0.78, 10 + (h.skillLevel ?? 1) * 1.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (h.kind === 'poison_cloud') {
        const alpha = Math.min(1, h.life / 1.0);
        ctx.globalAlpha = alpha;
        const grad = ctx.createRadialGradient(h.x, h.y - 26, 8, h.x, h.y - 26, h.radius);
        grad.addColorStop(0, `rgba(74, 222, 128, ${vfxScale.auraAlpha})`);
        grad.addColorStop(0.62, 'rgba(168, 85, 247, 0.14)');
        grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(Math.round(h.x), Math.round(h.y - 26), h.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderEnemyElementalShaders(
    ctx: CanvasRenderingContext2D,
    e: EnemyEntity,
    cx: number,
    cy: number
  ): void {
    if (e.burnTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const r = Math.max(e.w, e.h) * 0.72;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
      grad.addColorStop(0, 'rgba(251, 146, 60, 0.42)');
      grad.addColorStop(0.6, 'rgba(239, 68, 68, 0.2)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (e.freezeTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const r = Math.max(e.w, e.h) * 0.7;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
      grad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Crystalline ice prism overlay around frozen target
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.moveTo(cx, Math.round(e.y - 6));
      ctx.lineTo(Math.round(e.x + e.w + 6), cy);
      ctx.lineTo(cx, Math.round(e.y + e.h + 4));
      ctx.lineTo(Math.round(e.x - 6), cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (e.poisonTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const r = Math.max(e.w, e.h) * 0.68;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
      grad.addColorStop(0, 'rgba(74, 222, 128, 0.36)');
      grad.addColorStop(0.65, 'rgba(168, 85, 247, 0.18)');
      grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderLobbyWorld(ctx: CanvasRenderingContext2D): void {
    const props = this.getLobbyProps();
    const pFrame: 0 | 1 = Math.floor(this.ambientTime * 5) % 2 === 0 ? 0 : 1;
    const nearKind = this.getNearLobbyObject();

    for (let i = 0; i < props.length; i++) {
      const prop = props[i];
      // Crisp floor contact shadow right along ground baseline so bases anchor cleanly
      const shadowHalfW =
        prop.kind === 'gacha_statue'
          ? 96
          : prop.kind === 'stage_portal' || prop.kind === 'enchant_portal' || prop.kind === 'return_portal'
            ? 46
            : prop.kind === 'weapon_shop'
              ? 40
              : prop.kind === 'enchant_altar'
                ? 42
                : 28;
      ctx.save();
      ctx.fillStyle = 'rgba(4, 4, 10, 0.62)';
      ctx.beginPath();
      ctx.ellipse(Math.round(prop.x), prop.y + 2, shadowHalfW, prop.kind === 'gacha_statue' ? 7 : 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (prop.kind === 'gacha_statue') {
        // Soft divine sanctuary light bloom behind the monumental praying Goddess Statue
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const divinePulse = 0.92 + Math.sin(this.ambientTime * 2.4) * 0.08;
        const r = 138 * divinePulse;
        ctx.drawImage(this.divineGlowCanvas, Math.round(prop.x - r), Math.round(prop.y - 196 - r), r * 2, r * 2);
        ctx.restore();

        const spr = getGachaStatueSprite(pFrame);
        ctx.drawImage(spr, Math.round(prop.x - 110), prop.y - 320, 220, 320);
      } else if (prop.kind === 'weapon_shop') {
        const spr = getWeaponNpcSprite(pFrame);
        ctx.save();
        ctx.translate(Math.round(prop.x), prop.y);
        if (prop.facing === -1) {
          ctx.scale(-1, 1);
        }
        ctx.drawImage(spr, -46, -118, 92, 118);
        ctx.restore();
      } else if (prop.kind === 'stage_portal' || prop.kind === 'return_portal') {
        const spr = getPortalSprite(pFrame);
        ctx.drawImage(spr, Math.round(prop.x - 52), prop.y - 152, 104, 152);
        this.renderStagePortalAura(
          ctx,
          prop.x,
          prop.y - 72,
          prop.kind === 'stage_portal' ? 'stage' : 'enchant'
        );
      } else if (prop.kind === 'enchant_portal') {
        const spr = getEnchantPortalSprite(pFrame);
        ctx.drawImage(spr, Math.round(prop.x - 52), prop.y - 152, 104, 152);
        this.renderStagePortalAura(ctx, prop.x, prop.y - 72, 'enchant');
      } else if (prop.kind === 'enchant_altar') {
        const spr = getEnchantAltarSprite(pFrame);
        ctx.drawImage(spr, Math.round(prop.x - 44), prop.y - 96, 88, 96);
      } else if (prop.kind === 'training_dummy') {
        const spr = getTrainingDummySprite(this.dummyHitTimer > 0);
        ctx.drawImage(spr, Math.round(prop.x - 32), prop.y - 96, 64, 96);
      }

      ctx.save();
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      const labelY =
        prop.kind === 'gacha_statue'
          ? prop.y - 332
          : prop.kind === 'stage_portal' || prop.kind === 'enchant_portal' || prop.kind === 'return_portal'
            ? prop.y - 170
            : prop.kind === 'weapon_shop'
              ? prop.y - 134
              : prop.kind === 'enchant_altar'
                ? prop.y - 114
                : prop.y - 114;
      const w = ctx.measureText(prop.label).width + 20;
      ctx.fillStyle = 'rgba(11, 10, 18, 0.86)';
      ctx.fillRect(Math.round(prop.x - w * 0.5), labelY - 12, Math.round(w), 22);
      ctx.strokeStyle = prop.accent;
      ctx.lineWidth = nearKind === prop.kind ? 2 : 1;
      ctx.strokeRect(Math.round(prop.x - w * 0.5), labelY - 12, Math.round(w), 22);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(prop.label, Math.round(prop.x), labelY - 1);
      ctx.restore();
    }

    this.renderPlayerHazards(ctx);
    this.renderDashAfterimages(ctx);
    this.renderPlayerSprite(ctx);
    this.renderProjectiles(ctx);
    this.skillVfx.render(ctx);
    this.renderBoomerangs(ctx);
    this.pool.render(ctx);

    if (nearKind) {
      const prop = props.find((p) => p.kind === nearKind);
      if (prop) {
        const iKey = formatKeyCodeLabel(this.save.keybindings.interact);
        const isEn = this.save.language === 'en';
        const actionLabel =
          nearKind === 'gacha_statue'
            ? `[${iKey}] ${isEn ? 'Open Gacha' : 'Buka Gacha'}`
            : nearKind === 'weapon_shop'
              ? `[${iKey}] ${isEn ? 'Weapon Shop' : 'Toko Senjata'}`
              : nearKind === 'stage_portal'
                ? `[${iKey}] ${isEn ? 'Select Stage' : 'Pilih Stage'}`
                : nearKind === 'enchant_portal'
                  ? `[${iKey}] ${isEn ? 'Enchant Room ->' : 'Ruang Enchant ->'}`
                  : nearKind === 'return_portal'
                    ? `[${iKey}] ${isEn ? '<- Main Lobby' : '<- Lobi Utama'}`
                    : `[${iKey}] ${isEn ? 'Enchant Altar' : 'Altar Enchant'}`;
        const promptY =
          nearKind === 'gacha_statue'
            ? prop.y - 372
            : nearKind === 'stage_portal' || nearKind === 'enchant_portal' || nearKind === 'return_portal'
              ? prop.y - 212
              : prop.y - 178;
        this.drawWorldPrompt(ctx, prop.x, promptY, actionLabel, prop.accent);
      }
    }
  }

  private drawWorldPrompt(
    ctx: CanvasRenderingContext2D,
    targetX: number,
    promptY: number,
    label: string,
    borderCol: string
  ): void {
    ctx.save();
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    const w = ctx.measureText(label).width + 20;
    ctx.fillStyle = 'rgba(13, 12, 20, 0.92)';
    ctx.fillRect(Math.round(targetX - w * 0.5), promptY, Math.round(w), 26);
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(Math.round(targetX - w * 0.5), promptY, Math.round(w), 26);
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, Math.round(targetX), promptY + 13);
    ctx.restore();
  }

  private renderDashAfterimages(ctx: CanvasRenderingContext2D): void {
    const isLuna = this.save.selectedCharacter === 'luna';
    const isLyra = this.save.selectedCharacter === 'lyra';
    const isWitch = this.save.selectedCharacter === 'witch';
    const lunaWpn = this.save.lunaWeapon?.style ?? 'umbral_crescent_scythe';
    const lyraWpn = this.save.lyraWeapon?.style ?? 'iron_knuckle';
    const witchWpn = this.save.witchWeapon?.style ?? 'raven_gnarled_staff';
    for (let i = 0; i < this.pool.afterimages.length; i++) {
      const img = this.pool.afterimages[i];
      if (!img.active) continue;
      const spr = isLuna
        ? getLunaSprite('dash', lunaWpn, false)
        : isWitch
          ? getWitchSprite('dash', witchWpn, false)
          : isLyra
            ? getLyraSprite('dash', this.auraOverdriveTimer > 0, false, lyraWpn)
            : getVelveraSprite('dash', this.save.weapon.style, this.save.weapon.aura, false);
      ctx.save();
      ctx.globalAlpha = (img.life / img.maxLife) * 0.45;
      ctx.translate(Math.round(img.x + this.pw * 0.5), Math.round(img.y + this.ph));
      ctx.scale(img.facing, 1);
      if (isLuna) {
        ctx.drawImage(spr, -74, -124, 148, 136);
      } else if (isWitch) {
        ctx.drawImage(spr, -52, -112, 104, 118);
      } else {
        ctx.drawImage(spr, -50, -108, 100, 114);
      }
      ctx.restore();
    }
  }

  private renderStagePortalAura(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    variant: 'stage' | 'enchant'
  ): void {
    const t = this.ambientTime;
    const isStage = variant === 'stage';
    const primary = isStage ? '#C084FC' : '#38BDF8';
    const secondary = isStage ? '#F43F5E' : '#818CF8';
    const core = isStage ? '#F5D0FE' : '#E0F2FE';

    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));
    ctx.globalCompositeOperation = 'lighter';

    // Subtle pulsing portal core energy halo
    const pulse = 0.88 + Math.sin(t * 4.2) * 0.12;
    const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, (isStage ? 58 : 48) * pulse);
    glow.addColorStop(0, isStage ? 'rgba(217, 70, 239, 0.22)' : 'rgba(56, 189, 248, 0.18)');
    glow.addColorStop(0.55, isStage ? 'rgba(147, 51, 234, 0.14)' : 'rgba(99, 102, 241, 0.1)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, (isStage ? 44 : 36) * pulse, (isStage ? 66 : 56) * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle counter-rotating dashed vortex bands
    for (let ring = 0; ring < 2; ring++) {
      const rx = ring === 0 ? (isStage ? 27 : 22) : (isStage ? 18 : 14);
      const ry = ring === 0 ? (isStage ? 50 : 42) : (isStage ? 34 : 28);
      ctx.save();
      ctx.rotate(Math.sin(t * 1.4 + ring) * 0.12);
      ctx.strokeStyle = ring === 0 ? primary : secondary;
      ctx.globalAlpha = isStage ? 0.5 : 0.34;
      ctx.lineWidth = ring === 0 ? 1.8 : 1.4;
      ctx.setLineDash([8, 9]);
      ctx.lineDashOffset = (ring === 0 ? -1 : 1) * t * 34;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.setLineDash([]);

    // Swirling dark-fantasy pixel motes orbiting into the aperture
    const moteCount = isStage ? 12 : 7;
    for (let i = 0; i < moteCount; i++) {
      const phase = ((t * (isStage ? 1.55 : 1.15) + i / moteCount) % 1);
      const spiralR = (1 - phase * 0.78) * (isStage ? 1.15 : 0.95);
      const ang = t * (i % 2 === 0 ? 2.8 : 2.1) + i * ((Math.PI * 2) / moteCount);
      const mx = Math.cos(ang) * 28 * spiralR;
      const my = Math.sin(ang) * 50 * spiralR - phase * 6;
      const alpha = Math.sin(phase * Math.PI) * (isStage ? 0.92 : 0.65);
      const size = i % 3 === 0 ? 3.5 : 2.5;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = i % 4 === 0 ? secondary : i % 2 === 0 ? core : primary;
      ctx.fillRect(Math.round(mx - size * 0.5), Math.round(my - size * 0.5), size, size);
    }

    ctx.restore();
  }

  private renderPlayerSprite(ctx: CanvasRenderingContext2D): void {
    const isLuna = this.save.selectedCharacter === 'luna';
    const isLyra = this.save.selectedCharacter === 'lyra';
    const isWitch = this.save.selectedCharacter === 'witch';
    const lunaWpn = this.save.lunaWeapon?.style ?? 'umbral_crescent_scythe';
    const lyraWpn = this.save.lyraWeapon?.style ?? 'iron_knuckle';
    const witchWpn = this.save.witchWeapon?.style ?? 'raven_gnarled_staff';
    // Only blink gently while alive & actively playing right after taking non-lethal damage;
    // never flash white on skill cast, dash, or gameover!
    const hurtBlink =
      this.mode === 'playing' &&
      this.hurtBlinkTimer > 0 &&
      Math.floor(this.ambientTime * 16) % 2 !== 0;
    const showHurtTint = this.mode === 'playing' && this.playerHitFlash > 0;

    let frame: VelveraAnimFrame = Math.floor(this.ambientTime * 2) % 2 === 0 ? 'idle0' : 'idle1';
    if (this.dashTimer > 0) {
      frame = 'dash';
    } else if (this.slashTimer > 0) {
      const p = Math.max(0, Math.min(0.999, 1 - this.slashTimer / Math.max(0.01, this.slashMaxTimer)));
      const seq = Math.min(9, Math.floor(p * 10));
      frame = `slash_seq_${seq}` as VelveraAnimFrame;
    } else if (this.skillAnim) {
      const p = 1 - this.skillAnim.timer / Math.max(0.01, this.skillAnim.duration);
      if (this.skillAnim.style === 'dash') {
        frame =
          p < 0.42
            ? 'dash'
            : (`slash_seq_${Math.min(9, 2 + Math.floor(((p - 0.42) / 0.58) * 8))}` as VelveraAnimFrame);
      } else if (this.skillAnim.style === 'channel') {
        frame =
          p < 0.4
            ? 'cast'
            : p < 0.85
              ? (`slash_seq_${Math.min(7, 2 + Math.floor(((p - 0.4) / 0.45) * 6))}` as VelveraAnimFrame)
              : 'idle0';
      } else if (this.skillAnim.style === 'leap') {
        frame = p < 0.2 ? 'cast' : p < 0.55 ? 'jump' : (`slash_seq_${Math.min(9, Math.floor(p * 10))}` as VelveraAnimFrame);
      } else {
        frame = `slash_seq_${Math.min(9, Math.floor(Math.max(0, p) * 10))}` as VelveraAnimFrame;
      }
    } else if (!this.grounded) {
      frame = this.pvy > 40 ? 'fall' : 'jump';
    } else if (Math.abs(this.pvx) > 30) {
      const step = Math.floor(this.walkDist / 20) % 4;
      frame = step === 0 ? 'run0' : step === 1 ? 'run1' : step === 2 ? 'run2' : 'run3';
    }

    const pSpr = isLuna
      ? getLunaSprite(frame, lunaWpn, showHurtTint)
      : isWitch
        ? getWitchSprite(frame, witchWpn, showHurtTint)
        : isLyra
          ? getLyraSprite(frame, this.auraOverdriveTimer > 0, showHurtTint, lyraWpn)
          : getVelveraSprite(
              frame,
              this.save.weapon.style,
              this.save.weapon.aura,
              showHurtTint
            );
    ctx.save();
    if (hurtBlink) {
      ctx.globalAlpha = 0.65;
    }
    const baseFootX = Math.round(this.px + this.pw * 0.5);
    const baseFootY = Math.round(this.py + this.ph);
    if (this.grounded) {
      ctx.save();
      ctx.fillStyle = 'rgba(4, 4, 10, 0.58)';
      ctx.beginPath();
      ctx.ellipse(baseFootX, baseFootY + 1, 20, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.translate(baseFootX, Math.round(baseFootY + this.renderFloatY));
    ctx.scale(this.facing * this.squashX, this.squashY);
    if (Math.abs(this.renderBodyTilt) > 0.002) {
      ctx.rotate(this.renderBodyTilt);
    }
    if (this.auraOverdriveTimer > 0) {
      // Persistent martial flame aura & orbiting chi sparks around Lyra
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.85 + Math.sin(this.ambientTime * 14) * 0.15;
      const auraGrad = ctx.createRadialGradient(0, -48, 8, 0, -48, 56 * pulse);
      auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
      auraGrad.addColorStop(0.55, 'rgba(249, 115, 22, 0.18)');
      auraGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -48, 56 * pulse, 0, Math.PI * 2);
      ctx.fill();

      for (let s = 0; s < 2; s++) {
        const ang = this.ambientTime * 7 + s * Math.PI;
        const sx = Math.cos(ang) * 34;
        const sy = -48 + Math.sin(ang) * 18;
        ctx.fillStyle = s === 0 ? '#FEF08A' : '#F97316';
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (isLuna) {
      ctx.drawImage(pSpr, -74, -124, 148, 136);
      if (this.lunaCastFx) {
        this.renderLunaCastOverlay(ctx);
      }
    } else if (isWitch) {
      ctx.drawImage(pSpr, -52, -112, 104, 118);
    } else {
      ctx.drawImage(pSpr, -50, -108, 100, 114);
    }
    ctx.restore();
  }

  private renderLunaCastOverlay(ctx: CanvasRenderingContext2D): void {
    const fx = this.lunaCastFx;
    if (!fx) return;
    const alpha = Math.max(0, Math.min(1, fx.timer / Math.max(0.01, fx.maxTimer)));
    const progress = 1 - alpha;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (fx.kind === 'lifesteal') {
      // Crisp crimson-violet scythe slash glint along Luna's blade arc (zero orb/square pixels)
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(8, -50, 32 + progress * 14, -1.7, 0.9);
      ctx.stroke();

      ctx.strokeStyle = '#F5D0FE';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(10, -50, 25 + progress * 12, -1.5, 0.7);
      ctx.stroke();
    } else if (fx.kind === 'dash') {
      // Razor linear cleave glint across scythe edge & shoulder cloak
      ctx.globalAlpha = alpha * 0.95;
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-20, -54);
      ctx.lineTo(32, -40);
      ctx.stroke();

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-24, -36);
      ctx.lineTo(24, -26);
      ctx.stroke();
    } else if (fx.kind === 'eclipse') {
      // Sharp crescent blade gleam on Luna's raised scythe edge
      ctx.globalAlpha = alpha * 0.95;
      ctx.strokeStyle = '#F5D0FE';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(16, -68, 18 + progress * 12, -1.45, 0.95);
      ctx.stroke();

      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(16, -68, 12 + progress * 10, -1.2, 0.75);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) continue;
      ctx.save();
      ctx.translate(Math.round(p.x), Math.round(p.y));
      if (p.kind === 'crescent') {
        const dir = p.vx >= 0 ? 1 : -1;
        ctx.scale(dir, 1);
        ctx.fillStyle = '#0B0718';
        ctx.beginPath();
        ctx.arc(-4, 0, p.radius + 3, -1.15, 1.15);
        ctx.arc(-11, 0, p.radius * 0.72, 1.15, -1.15, true);
        ctx.closePath();
        ctx.fill();

        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(-4, 0, p.radius + 1, -1.1, 1.1);
        ctx.arc(-10, 0, p.radius * 0.78, 1.1, -1.1, true);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = p.coreColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-4, 0, p.radius, -1.0, 1.0);
        ctx.stroke();
      } else if (p.kind === 'witch_bolt') {
        // Animated flapping shadow raven silhouette with golden arcane eye
        const dir = p.vx >= 0 ? 1 : -1;
        const flap = Math.sin(this.ambientTime * 26 + p.x * 0.05) * 9;
        ctx.scale(dir, 1);
        ctx.fillStyle = '#140826';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(4, -5);
        ctx.lineTo(-4, -14 + flap);
        ctx.lineTo(-10, -3);
        ctx.lineTo(-18, -5);
        ctx.lineTo(-13, 0);
        ctx.lineTo(-18, 5);
        ctx.lineTo(-10, 3);
        ctx.lineTo(-2, 12 - flap * 0.7);
        ctx.lineTo(6, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.arc(9, -1.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'meteor') {
        // Spinning 4-point astral star crystal
        ctx.rotate(this.ambientTime * 9 + p.x * 0.03);
        ctx.globalCompositeOperation = 'lighter';
        const r = p.radius + 5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.34, -r * 0.34);
        ctx.lineTo(r, 0);
        ctx.lineTo(r * 0.34, r * 0.34);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.34, r * 0.34);
        ctx.lineTo(-r, 0);
        ctx.lineTo(-r * 0.34, -r * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFFBEB';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.38, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'kunai') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-9, -5);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-9, 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = p.coreColor;
        ctx.fillRect(-4, -1, 12, 2);
      } else if (p.kind === 'fireball') {
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius + 6);
        grad.addColorStop(0, '#FEF08A');
        grad.addColorStop(0.5, '#F97316');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFBEB';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'ice_arrow') {
        const dir = p.vx >= 0 ? 1 : -1;
        ctx.scale(dir, 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-10, -7);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#F0F9FF';
        ctx.fillRect(-6, -2, 16, 4);
      } else if (p.kind === 'aura_fist') {
        // Flaming martial shockwave gauntlet + curved sonic arc
        const dir = p.vx >= 0 ? 1 : -1;
        ctx.scale(dir, 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(-4, 0, p.radius * 0.95, -1.05, 1.05);
        ctx.stroke();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(16, -6);
        ctx.lineTo(20, 0);
        ctx.lineTo(16, 6);
        ctx.lineTo(-8, 10);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-8, -10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.arc(4, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'spear') {
        // Tapered crystal demon lance oriented along velocity vector
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = '#140826';
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(-12, -8);
        ctx.lineTo(-22, 0);
        ctx.lineTo(-12, 8);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = p.coreColor;
        ctx.fillRect(-10, -1.5, 26, 3);
      } else if (p.kind === 'bone') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.rotate(ang);
        ctx.fillStyle = p.coreColor;
        ctx.fillRect(-12, -2, 22, 4);
        ctx.fillStyle = p.color;
        ctx.fillRect(8, -4, 6, 8);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.fillStyle = p.coreColor;
        ctx.fillRect(-p.radius * 0.5, -p.radius * 0.5, p.radius, p.radius);
      }
      ctx.restore();
    }
  }

  private buildLobbyBackdrop(): HTMLCanvasElement {
    const off = document.createElement('canvas');
    off.width = LOBBY_MAIN_W;
    off.height = LOBBY_H;
    const octx = off.getContext('2d')!;
    octx.imageSmoothingEnabled = false;

    // Deep underground cavern & vaulted masonry gradient (dim so characters/NPCs pop)
    const sky = octx.createLinearGradient(0, 0, 0, LOBBY_H - 110);
    sky.addColorStop(0, '#090812');
    sky.addColorStop(0.55, '#131121');
    sky.addColorStop(1, '#0D0C16');
    octx.fillStyle = sky;
    octx.fillRect(0, 0, LOBBY_MAIN_W, LOBBY_H);

    // Subtle cavern ashlar stone wall courses across background (muted contrast)
    for (let y = 24; y < LOBBY_GROUND_Y; y += 28) {
      const rowOffset = ((y / 28) % 2) * 32;
      for (let x = -32 + rowOffset; x < LOBBY_MAIN_W; x += 64) {
        const shade = ((x * 7 + y * 13) % 5);
        octx.fillStyle = shade === 0 ? '#181526' : shade === 1 ? '#141220' : '#100E1B';
        octx.fillRect(x + 1, y + 1, 61, 25);
      }
    }

    // Recessed Gothic Vaulted Alcoves / Arched Windows
    for (let wx = 130; wx < LOBBY_MAIN_W; wx += 360) {
      octx.fillStyle = '#090812';
      octx.beginPath();
      octx.arc(wx + 60, 145, 58, Math.PI, 0);
      octx.lineTo(wx + 118, 390);
      octx.lineTo(wx + 2, 390);
      octx.closePath();
      octx.fill();

      octx.strokeStyle = '#2A253F';
      octx.lineWidth = 6;
      octx.stroke();

      // Muted stained glass glow inside gothic arch
      octx.fillStyle = 'rgba(88, 28, 135, 0.24)';
      octx.fillRect(wx + 20, 145, 80, 230);
      octx.fillStyle = '#1E1A33';
      octx.fillRect(wx + 57, 102, 6, 280);
      octx.fillRect(wx + 16, 210, 88, 6);
    }

    // Carved Ribbed Stone Pillars with Caps & Plinths
    const pillarH = LOBBY_GROUND_Y - 28;
    for (let px = 56; px < LOBBY_MAIN_W; px += 310) {
      octx.fillStyle = '#191728';
      octx.fillRect(px, 28, 64, pillarH);
      octx.fillStyle = '#252238';
      octx.fillRect(px + 8, 28, 14, pillarH);
      octx.fillStyle = '#0E0C18';
      octx.fillRect(px + 44, 28, 12, pillarH);
      // Stone bands & bronze brackets
      octx.fillStyle = '#332E4A';
      octx.fillRect(px - 8, 26, 80, 18);
      octx.fillRect(px - 6, LOBBY_GROUND_Y - 22, 76, 22);
      octx.fillStyle = '#8A6F4D';
      octx.fillRect(px - 4, 44, 72, 4);
      octx.fillRect(px - 4, LOBBY_GROUND_Y - 26, 72, 4);
      for (let py = 86; py < LOBBY_GROUND_Y - 40; py += 46) {
        octx.fillStyle = '#0E0C18';
        octx.fillRect(px, py, 64, 2);
      }
    }

    // Underground Sanctuary Floor Masonry with Warm Rim Top
    octx.fillStyle = '#0D0C16';
    octx.fillRect(0, LOBBY_GROUND_Y, LOBBY_MAIN_W, LOBBY_H - LOBBY_GROUND_Y);
    octx.fillStyle = '#2A263F';
    octx.fillRect(0, LOBBY_GROUND_Y + 5, LOBBY_MAIN_W, 10);
    octx.fillStyle = '#9C7E54';
    octx.fillRect(0, LOBBY_GROUND_Y, LOBBY_MAIN_W, 4);
    for (let x = 0; x < LOBBY_MAIN_W; x += 68) {
      octx.fillStyle = '#1A182B';
      octx.fillRect(x + 3, LOBBY_GROUND_Y + 18, 60, 14);
      octx.fillRect(x + 24, LOBBY_GROUND_Y + 38, 52, 12);
    }

    return off;
  }

  private buildGlowSprite(innerColor: string, midColor: string): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const gctx = c.getContext('2d')!;
    const grad = gctx.createRadialGradient(128, 128, 4, 128, 128, 128);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(0.5, midColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 256, 256);
    return c;
  }

  private buildBakedLobbyImageBackdrop(img: HTMLImageElement): HTMLCanvasElement {
    const tileScale = LOBBY_GROUND_Y / 445;
    const tileW = Math.round(img.naturalWidth * tileScale);
    const tileH = Math.ceil(img.naturalHeight * tileScale);
    this.lobbyTileW = tileW;
    this.lobbyTorchY = Math.round(206 * tileScale);

    const off = document.createElement('canvas');
    off.width = LOBBY_MAIN_W;
    off.height = LOBBY_H;
    const octx = off.getContext('2d')!;
    octx.imageSmoothingEnabled = false;

    const totalTiles = Math.ceil(LOBBY_MAIN_W / tileW);
    for (let t = 0; t < totalTiles; t++) {
      octx.drawImage(img, t * tileW, 0, tileW, tileH);
    }

    // Subtle atmospheric veil preserving warm torch stone ambiance
    octx.fillStyle = 'rgba(7, 8, 15, 0.16)';
    octx.fillRect(0, 0, LOBBY_MAIN_W, LOBBY_H);

    // Seamless soft vertical masonry blend across background tile edges (no protruding pillar with orange square)
    for (let t = 1; t < totalTiles; t++) {
      const seamX = t * tileW;
      const blend = octx.createLinearGradient(seamX - 18, 0, seamX + 18, 0);
      blend.addColorStop(0, 'rgba(13, 12, 22, 0)');
      blend.addColorStop(0.5, 'rgba(13, 12, 22, 0.32)');
      blend.addColorStop(1, 'rgba(13, 12, 22, 0)');
      octx.fillStyle = blend;
      octx.fillRect(seamX - 18, 0, 36, LOBBY_GROUND_Y);
    }

    // Static warm bounce reflection pools along stone flagstones
    const torchNormXs = [26 / 1024, 282 / 1024, 550 / 1024, 800 / 1024];
    octx.save();
    octx.globalCompositeOperation = 'lighter';
    for (let t = 0; t < totalTiles; t++) {
      for (let k = 0; k < torchNormXs.length; k++) {
        const tx = t * tileW + Math.round(torchNormXs[k] * tileW);
        const poolGrad = octx.createRadialGradient(tx, LOBBY_GROUND_Y + 8, 6, tx, LOBBY_GROUND_Y + 8, 114);
        poolGrad.addColorStop(0, 'rgba(251, 146, 60, 0.14)');
        poolGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        octx.fillStyle = poolGrad;
        octx.beginPath();
        octx.ellipse(tx, LOBBY_GROUND_Y + 8, 114, 20, 0, 0, Math.PI * 2);
        octx.fill();
      }
    }
    octx.restore();

    return off;
  }

  private renderLobbyBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    const activeW = this.getActiveWorldW();
    const isEnchant = this.lobbyRoom === 'enchant';

    if (this.lobbyBakedImageCanvas) {
      const sx = Math.max(0, Math.floor(camX - 24));
      const sw = Math.max(1, Math.min(activeW - sx, Math.ceil(this.visibleWorldW + 48)));
      ctx.drawImage(this.lobbyBakedImageCanvas, sx, 0, sw, LOBBY_H, sx, 0, sw, LOBBY_H);

      const tileW = this.lobbyTileW;
      const startTile = Math.max(0, Math.floor((camX - 24) / tileW));
      const endTile = Math.ceil(Math.min(activeW, camX + this.visibleWorldW + 24) / tileW);

      // Lightweight cached torch glow sprite blits (no per-frame gradient allocations)
      const torchNormXs = [26 / 1024, 282 / 1024, 550 / 1024, 800 / 1024];
      const torchY = this.lobbyTorchY;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let t = startTile; t < endTile; t++) {
        for (let k = 0; k < torchNormXs.length; k++) {
          const tx = t * tileW + Math.round(torchNormXs[k] * tileW);
          if (tx + 180 < camX || tx - 180 > camX + this.visibleWorldW) continue;
          const r = 152 + Math.sin(this.ambientTime * 9.5 + tx * 0.05) * 12;
          ctx.drawImage(this.warmGlowCanvas, tx - r, torchY - r, r * 2, r * 2);
        }
      }
      for (let d = 0; d < 20; d++) {
        const dx = ((d * 97 + this.ambientTime * (10 + (d % 4) * 3)) % (activeW + 40)) - 20;
        if (dx < camX - 20 || dx > camX + this.visibleWorldW + 20) continue;
        const dy = 135 + ((d * 61) % 360) + Math.sin(this.ambientTime * 1.4 + d) * 12;
        ctx.fillStyle = isEnchant && d % 3 === 0 ? 'rgba(186, 230, 253, 0.34)' : 'rgba(254, 240, 138, 0.34)';
        ctx.fillRect(Math.round(dx), Math.round(dy), 2, 2);
      }
      ctx.restore();
      return;
    }

    const sx = Math.max(0, Math.floor(camX - 24));
    const sw = Math.max(1, Math.min(activeW - sx, Math.ceil(this.visibleWorldW + 48)));
    ctx.drawImage(this.lobbyBackdropCanvas, sx, 0, sw, LOBBY_H, sx, 0, sw, LOBBY_H);

    for (let x = 370; x < activeW; x += 310) {
      if (x + 220 < camX || x - 220 > camX + this.visibleWorldW) continue;
      const flicker = Math.sin(this.ambientTime * 8.5 + x) * 2.2;
      const r = 155 + Math.sin(this.ambientTime * 11 + x) * 10;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(this.warmGlowCanvas, x - r, 224 - r, r * 2, r * 2);
      ctx.restore();

      ctx.fillStyle = '#2B283A';
      ctx.fillRect(x - 5, 228, 10, 22);
      ctx.fillStyle = '#8A6F4D';
      ctx.fillRect(x - 10, 222, 20, 7);
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(x - 6, 208 + flicker, 12, 14);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(x - 3, 212 + flicker, 6, 8);
    }
  }

  private getStageBackdrop(stage: number, layout: StageLayout = this.currentLayout): HTMLCanvasElement {
    const s = Math.max(1, Math.min(10, Math.floor(stage)));
    const key = `${s}-${layout.templateId}`;
    const cached = this.stageBackdrops.get(key);
    if (cached) return cached;
    const built = this.buildStageBackdrop(s, layout);
    this.stageBackdrops.set(key, built);
    return built;
  }

  private buildStageBackdrop(stage: number, layout: StageLayout): HTMLCanvasElement {
    const theme = getStageTheme(stage);
    const worldW = layout.worldW;
    const worldH = layout.worldH;
    const off = document.createElement('canvas');
    off.width = worldW;
    off.height = worldH;
    const octx = off.getContext('2d')!;
    octx.imageSmoothingEnabled = false;

    const sky = octx.createLinearGradient(0, 0, 0, worldH - 100);
    sky.addColorStop(0, '#06070D');
    sky.addColorStop(0.45, theme.skyTop);
    sky.addColorStop(1, theme.skyBottom);
    octx.fillStyle = sky;
    octx.fillRect(0, 0, worldW, worldH);

    // Rich multi-tone dark dungeon stone brick courses + bevel highlight & shadow mortar
    octx.globalAlpha = 0.62;
    for (let y = 30; y < worldH - 120; y += 26) {
      const rowOffset = ((y / 26) % 2) * 34;
      for (let x = -34 + rowOffset; x < worldW; x += 68) {
        const hash = (x * 13 + y * 29) & 7;
        octx.fillStyle =
          hash <= 1 ? theme.pillarDark : hash <= 4 ? theme.skyTop : theme.skyBottom;
        octx.fillRect(x + 2, y + 2, 63, 22);
        if (hash === 2 || hash === 6) {
          octx.fillStyle = theme.pillarMid;
          octx.fillRect(x + 2, y + 2, 63, 2);
        } else if (hash === 3) {
          octx.fillStyle = 'rgba(255,255,255,0.04)';
          octx.fillRect(x + 2, y + 2, 63, 1);
        }
      }
    }
    octx.globalAlpha = 1;

    // Vaulted Gothic Ceiling Ribs, Hanging Iron Chains & Stalactite Silhouette
    octx.fillStyle = '#06070D';
    octx.fillRect(0, 0, worldW, 40);
    for (let ax = 0; ax < worldW; ax += 220) {
      octx.fillStyle = '#06070D';
      octx.beginPath();
      octx.moveTo(ax, 38);
      octx.lineTo(ax + 110, 96);
      octx.lineTo(ax + 220, 38);
      octx.closePath();
      octx.fill();

      octx.strokeStyle = theme.pillarMid;
      octx.lineWidth = 3;
      octx.beginPath();
      octx.moveTo(ax, 38);
      octx.lineTo(ax + 110, 94);
      octx.lineTo(ax + 220, 38);
      octx.stroke();

      // Hanging iron chains every vault bay
      if ((ax / 220) % 2 === 1) {
        octx.fillStyle = '#1E293B';
        for (let cy = 44; cy < 165; cy += 10) {
          octx.fillRect(ax + 108, cy, 4, 6);
        }
      }
    }

    // Stage-themed arched windows, stained-glass mullions & diagonal volumetric light shafts
    for (let wx = 200; wx < worldW; wx += 440) {
      octx.fillStyle = theme.windowOuter;
      octx.beginPath();
      octx.arc(wx + 56, 128, 56, Math.PI, 0);
      octx.lineTo(wx + 112, 496);
      octx.lineTo(wx, 496);
      octx.closePath();
      octx.fill();

      octx.fillStyle = theme.skyTop;
      octx.fillRect(wx + 12, 126, 88, 354);
      octx.globalAlpha = 0.26;
      octx.fillStyle = theme.windowGlow;
      octx.fillRect(wx + 24, 132, 64, 165);
      octx.globalAlpha = 1;
      octx.fillStyle = theme.windowOuter;
      octx.fillRect(wx + 53, 98, 6, 384);
      octx.fillRect(wx + 12, 265, 88, 6);

      // Soft slanting cathedral light beam from gothic window
      const beam = octx.createLinearGradient(wx + 56, 140, wx + 220, 620);
      beam.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      beam.addColorStop(1, 'rgba(255, 255, 255, 0)');
      octx.fillStyle = beam;
      octx.beginPath();
      octx.moveTo(wx + 22, 145);
      octx.lineTo(wx + 90, 145);
      octx.lineTo(wx + 280, 620);
      octx.lineTo(wx + 110, 620);
      octx.closePath();
      octx.fill();

      // Unique motif decorations per Boss Habitat
      if (theme.motif === 'slime_ruins') {
        octx.fillStyle = '#15803D';
        octx.fillRect(wx + 8, 92, 12, 86);
        octx.fillRect(wx + 88, 96, 10, 68);
      } else if (theme.motif === 'goblin_camp') {
        octx.fillStyle = '#7C2D12';
        octx.fillRect(wx + 24, 136, 64, 105);
        octx.fillStyle = '#CA8A04';
        octx.fillRect(wx + 44, 156, 24, 24);
      } else if (theme.motif === 'spider_crypt') {
        octx.fillStyle = 'rgba(226, 232, 240, 0.2)';
        for (let w = 0; w < 60; w += 12) {
          octx.fillRect(wx + 12 + w, 126, 2, 70 - w);
        }
      } else if (theme.motif === 'siren_ocean') {
        octx.fillStyle = 'rgba(45, 212, 191, 0.12)';
        octx.fillRect(wx + 18, 0, 28, worldH - 180);
      } else if (theme.motif === 'serpent_temple') {
        octx.fillStyle = '#B45309';
        octx.fillRect(wx + 20, 130, 72, 8);
        octx.fillRect(wx + 20, 460, 72, 8);
      } else if (theme.motif === 'magma_cavern' || theme.motif === 'dragon_caldera') {
        octx.fillStyle = '#C2410C';
        octx.fillRect(wx + 38, 480, 36, 160);
      } else if (theme.motif === 'celestial_god') {
        octx.fillStyle = 'rgba(250, 204, 21, 0.28)';
        octx.fillRect(wx + 28, 72, 56, 6);
        octx.fillRect(wx + 53, 52, 6, 42);
      }
    }

    const pillarPositions = [90, 380, 720, 1060, 1400, 1740, 2080, 2420, 2760, 3100, 3440];
    for (let i = 0; i < pillarPositions.length; i++) {
      const x = pillarPositions[i];
      if (x > worldW - 70) continue;
      octx.fillStyle = theme.pillarDark;
      octx.fillRect(x, 36, 68, worldH - 110);
      octx.fillStyle = theme.pillarMid;
      octx.fillRect(x + 8, 36, 16, worldH - 110);
      octx.fillStyle = theme.pillarHighlight;
      octx.fillRect(x + 48, 36, 6, worldH - 110);
      octx.fillStyle = theme.pillarHighlight;
      octx.fillRect(x - 10, 32, 88, 22);
      octx.fillStyle = theme.accentHex;
      octx.fillRect(x - 4, 54, 76, 3);
      octx.fillStyle = theme.floorDeep;
      for (let py = 80; py < worldH - 140; py += 44) {
        octx.fillRect(x, py, 68, 2);
      }
    }

    // Active stage-layout floor terraces + beveled stone bricks & accent trim
    for (const seg of layout.floorSegments) {
      const segW = seg.x2 - seg.x1;
      octx.fillStyle = theme.floorDeep;
      octx.fillRect(seg.x1, seg.y, segW, worldH - seg.y);
      octx.fillStyle = theme.pillarMid;
      octx.fillRect(seg.x1, seg.y, 7, worldH - seg.y);
      octx.fillRect(seg.x2 - 7, seg.y, 7, worldH - seg.y);
      octx.fillStyle = theme.floorMid;
      octx.fillRect(seg.x1, seg.y, segW, 11);
      octx.fillStyle = theme.floorTop;
      octx.fillRect(seg.x1, seg.y, segW, 5);
      octx.fillStyle = 'rgba(255,255,255,0.22)';
      octx.fillRect(seg.x1, seg.y, segW, 1);
      octx.fillStyle = theme.pillarDark;
      for (let x = seg.x1; x < seg.x2; x += 48) {
        const bw = Math.min(40, seg.x2 - x - 4);
        if (bw > 8) {
          octx.fillRect(x + 2, seg.y + 15, bw, 10);
          octx.fillRect(x + 12, seg.y + 29, Math.max(8, bw - 8), 10);
        }
      }
    }

    return off;
  }

  private renderGothicCathedralBackdrop(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number
  ): void {
    const activeW = this.currentLayout.worldW;
    const activeH = this.currentLayout.worldH;
    const sx = Math.max(0, Math.floor(camX - 24));
    const sy = Math.max(0, Math.floor(camY - 12));
    const sw = Math.max(1, Math.min(activeW - sx, Math.ceil(this.visibleWorldW + 48)));
    const sh = Math.max(1, Math.min(activeH - sy, Math.ceil(this.visibleWorldH + 24)));
    ctx.drawImage(this.getStageBackdrop(this.stage, this.currentLayout), sx, sy, sw, sh, sx, sy, sw, sh);

    const theme = getStageTheme(this.stage);
    const torchPillars = [90, 380, 720, 1060, 1400, 1740, 2080, 2420, 2760, 3100, 3440];
    for (let i = 0; i < torchPillars.length; i++) {
      const x = torchPillars[i];
      if (x + 240 < camX || x - 200 > camX + this.visibleWorldW) continue;
      const flicker = Math.sin(this.ambientTime * 11 + i * 2) * 2;
      const glowRadius = 210 + Math.sin(this.ambientTime * 14 + i) * 14;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(this.warmGlowCanvas, x + 34 - glowRadius, 360 - glowRadius, glowRadius * 2, glowRadius * 2);
      ctx.restore();

      ctx.fillStyle = '#1F2937';
      ctx.fillRect(x + 31, 366, 6, 18);
      ctx.fillStyle = theme.torchOuter;
      ctx.fillRect(x + 26, 358, 16, 10);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(x + 28, 346 + flicker, 12, 13);
      ctx.fillStyle = theme.torchInner;
      ctx.fillRect(x + 31, 350 + flicker, 6, 8);
    }

    this.renderLocalizedWeather(ctx, camX, camY);
  }

  private renderLocalizedWeather(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number
  ): void {
    const weather = getStageWeather(this.stage).type;
    const activeW = this.currentLayout.worldW;
    const viewMinX = camX - 40;
    const viewMaxX = camX + this.visibleWorldW + 40;
    const viewMinY = camY - 30;
    const viewMaxY = camY + this.visibleWorldH + 30;

    if (weather === 'ash_mist' || weather === 'spectral_fog') {
      const mistShift = (this.ambientTime * (weather === 'ash_mist' ? 28 : -24)) % 320;
      ctx.fillStyle =
        weather === 'spectral_fog'
          ? 'rgba(192, 132, 252, 0.09)'
          : 'rgba(148, 163, 184, 0.08)';
      for (let x = -320; x < activeW + 320; x += 320) {
        const mx = Math.round(x + mistShift);
        if (mx + 280 < viewMinX || mx - 280 > viewMaxX) continue;
        ctx.fillRect(mx, 640, 240, 52);
        ctx.fillRect(Math.round(x - mistShift * 0.6), 410, 280, 36);
      }
    } else if (weather === 'abyssal_storm') {
      const flashCycle = this.ambientTime % 6.5;
      if (flashCycle < 0.12) {
        ctx.fillStyle = 'rgba(192, 132, 252, 0.1)';
        ctx.fillRect(Math.max(0, camX - 10), Math.max(0, camY - 10), this.visibleWorldW + 20, this.visibleWorldH + 20);
      }
    }

    for (let i = 0; i < this.weatherParticles.length; i++) {
      const p = this.weatherParticles[i];
      if (p.x < viewMinX || p.x > viewMaxX || p.y < viewMinY || p.y > viewMaxY) continue;
      ctx.globalAlpha = p.alpha;
      if (weather === 'violet_embers') {
        // Falling warm-amber & violet embers
        ctx.fillStyle = i % 3 === 0 ? '#FB923C' : i % 2 === 0 ? '#A855F7' : '#FDE68A';
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      } else if (weather === 'ash_mist') {
        ctx.fillStyle = i % 3 === 0 ? '#64748B' : '#94A3B8';
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size + 1, 2);
      } else if (weather === 'spectral_fog') {
        ctx.fillStyle = i % 2 === 0 ? '#C084FC' : '#E2E8F0';
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size + 2, p.size);
      } else if (weather === 'amethyst_rain') {
        ctx.strokeStyle = i % 2 === 0 ? '#C084FC' : '#9333EA';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(p.x), Math.round(p.y));
        ctx.lineTo(Math.round(p.x - 4), Math.round(p.y + p.len));
        ctx.stroke();
      } else {
        ctx.strokeStyle = i % 3 === 0 ? '#FB923C' : i % 2 === 0 ? '#D946EF' : '#E9D5FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(p.x), Math.round(p.y));
        ctx.lineTo(Math.round(p.x - 6), Math.round(p.y + p.len + 6));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
}
