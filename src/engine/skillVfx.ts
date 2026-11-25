export type SkillVfxKind =
  | 'eclipse_dome'
  | 'scythe_eclipse'
  | 'blood_scythe_reap'
  | 'cross_slash'
  | 'dash_ribbon'
  | 'curse_sigil'
  | 'drain_tendril'
  | 'sustain_pulse'
  | 'inward_motes'
  | 'launch_flash'
  | 'cast_eclipse_ring'
  | 'cyclone_vortex'
  | 'tornado_column'
  | 'demon_wings'
  | 'star_pillar'
  | 'singularity'
  | 'lightning_bolt'
  | 'frost_ring'
  | 'sonic_cone'
  | 'shadow_blades_spin'
  | 'dark_chain_snare'
  | 'abyss_crystal_spear'
  | 'blood_scythe_burst'
  | 'violet_thunder_pillar'
  | 'floor_shadow_spikes'
  | 'razor_whirl_aura'
  | 'crescent_boomerang'
  | 'vertical_shockwave'
  | 'cosmic_needle_rain'
  | 'boss_cleave_arc'
  | 'boss_shockwave';

export interface PooledSkillVfx {
  active: boolean;
  kind: SkillVfxKind;
  x: number;
  y: number;
  tx: number;
  ty: number;
  facing: 1 | -1;
  radius: number;
  angle: number;
  life: number;
  maxLife: number;
  color: string;
  coreColor: string;
  accentColor: string;
  orbitCount: number;
  seed: number;
  followPlayer: boolean;
  trackTargetToPlayer: boolean;
}

/**
 * Zero-GC ring buffer for mechanically & geometrically distinct skill VFX silhouettes.
 * Keeps actors readable by using crisp dark silhouettes, sharp razor cores, and controlled alpha.
 */
export class SkillVfxPool {
  readonly items: PooledSkillVfx[] = [];
  private cursor = 0;

  constructor(capacity = 64) {
    for (let i = 0; i < capacity; i++) {
      this.items.push({
        active: false,
        kind: 'eclipse_dome',
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
        facing: 1,
        radius: 80,
        angle: 0,
        life: 0,
        maxLife: 0.5,
        color: '#A855F7',
        coreColor: '#E9D5FF',
        accentColor: '#38BDF8',
        orbitCount: 8,
        seed: i * 0.73,
        followPlayer: false,
        trackTargetToPlayer: false,
      });
    }
  }

  clear(): void {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].active = false;
    }
  }

  spawn(cfg: Omit<PooledSkillVfx, 'active' | 'life' | 'seed'> & { seed?: number }): void {
    const v = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;
    v.active = true;
    v.kind = cfg.kind;
    v.x = cfg.x;
    v.y = cfg.y;
    v.tx = cfg.tx;
    v.ty = cfg.ty;
    v.facing = cfg.facing;
    v.radius = cfg.radius;
    v.angle = cfg.angle;
    v.life = cfg.maxLife;
    v.maxLife = cfg.maxLife;
    v.color = cfg.color;
    v.coreColor = cfg.coreColor;
    v.accentColor = cfg.accentColor;
    v.orbitCount = cfg.orbitCount;
    v.seed = cfg.seed ?? Math.random() * 6.28;
    v.followPlayer = cfg.followPlayer;
    v.trackTargetToPlayer = cfg.trackTargetToPlayer;
  }

  update(dt: number, playerCx: number, playerCy: number): void {
    for (let i = 0; i < this.items.length; i++) {
      const v = this.items[i];
      if (!v.active) continue;
      v.life -= dt;
      if (v.life <= 0) {
        v.active = false;
        continue;
      }
      if (v.followPlayer) {
        v.x = playerCx;
        v.y = playerCy;
      }
      if (v.trackTargetToPlayer) {
        v.tx = playerCx;
        v.ty = playerCy;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.items.length; i++) {
      const v = this.items[i];
      if (!v.active) continue;
      const alpha = Math.max(0, Math.min(1, v.life / Math.max(0.01, v.maxLife)));
      const progress = 1 - alpha;

      switch (v.kind) {
        case 'eclipse_dome':
          this.drawEclipseDome(ctx, v, alpha, progress);
          break;
        case 'scythe_eclipse':
          this.drawScytheEclipse(ctx, v, alpha, progress);
          break;
        case 'blood_scythe_reap':
          this.drawBloodScytheReap(ctx, v, alpha, progress);
          break;
        case 'cross_slash':
          this.drawCrossSlash(ctx, v, alpha, progress);
          break;
        case 'dash_ribbon':
          this.drawDashRibbon(ctx, v, alpha, progress);
          break;
        case 'curse_sigil':
          this.drawCurseSigil(ctx, v, alpha, progress);
          break;
        case 'drain_tendril':
          this.drawDrainTendril(ctx, v, alpha, progress);
          break;
        case 'sustain_pulse':
          this.drawSustainPulse(ctx, v, alpha, progress);
          break;
        case 'inward_motes':
          this.drawInwardMotes(ctx, v, alpha, progress);
          break;
        case 'launch_flash':
          this.drawLaunchFlash(ctx, v, alpha, progress);
          break;
        case 'cast_eclipse_ring':
          this.drawCastEclipseRing(ctx, v, alpha, progress);
          break;
        case 'cyclone_vortex':
          this.drawCycloneVortex(ctx, v, alpha, progress);
          break;
        case 'tornado_column':
          this.drawTornadoColumn(ctx, v, alpha, progress);
          break;
        case 'demon_wings':
          this.drawDemonWings(ctx, v, alpha, progress);
          break;
        case 'star_pillar':
          this.drawStarPillar(ctx, v, alpha, progress);
          break;
        case 'singularity':
          this.drawSingularity(ctx, v, alpha, progress);
          break;
        case 'lightning_bolt':
          this.drawLightningBolt(ctx, v, alpha);
          break;
        case 'frost_ring':
          this.drawFrostRing(ctx, v, alpha, progress);
          break;
        case 'sonic_cone':
          this.drawSonicCone(ctx, v, alpha, progress);
          break;
        case 'shadow_blades_spin':
          this.drawShadowBladesSpin(ctx, v, alpha, progress);
          break;
        case 'dark_chain_snare':
          this.drawDarkChainSnare(ctx, v, alpha, progress);
          break;
        case 'abyss_crystal_spear':
          this.drawAbyssCrystalSpear(ctx, v, alpha, progress);
          break;
        case 'blood_scythe_burst':
          this.drawBloodScytheBurst(ctx, v, alpha, progress);
          break;
        case 'violet_thunder_pillar':
          this.drawVioletThunderPillar(ctx, v, alpha, progress);
          break;
        case 'floor_shadow_spikes':
          this.drawFloorShadowSpikes(ctx, v, alpha, progress);
          break;
        case 'razor_whirl_aura':
          this.drawRazorWhirlAura(ctx, v, alpha, progress);
          break;
        case 'crescent_boomerang':
          this.drawCrescentBoomerang(ctx, v, alpha, progress);
          break;
        case 'vertical_shockwave':
          this.drawVerticalShockwave(ctx, v, alpha, progress);
          break;
        case 'cosmic_needle_rain':
          this.drawCosmicNeedleRain(ctx, v, alpha, progress);
          break;
        case 'boss_cleave_arc':
          this.drawBossCleaveArc(ctx, v, alpha, progress);
          break;
        case 'boss_shockwave':
          this.drawBossShockwave(ctx, v, alpha, progress);
          break;
      }
    }
  }

  private drawScytheEclipse(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    // Luna Skill 3 (Gerhana): Colossal Eclipsed Moon Disc + Blazing Crimson-Violet Corona + Detonation Wave + Ash Embers
    const bloom = Math.sin(Math.min(1, progress * 1.35) * Math.PI * 0.5);
    const r = v.radius * (0.72 + 0.36 * bloom);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    // 1. Eclipsed Total-Dark Moon Disc + Luminous Rim Corona
    const moonR = r * 0.56;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const corona = ctx.createRadialGradient(0, -18, moonR * 0.65, 0, -18, moonR * 1.48);
    corona.addColorStop(0, 'rgba(244, 63, 94, 0)');
    corona.addColorStop(0.68, 'rgba(168, 85, 247, 0.42)');
    corona.addColorStop(0.84, 'rgba(251, 146, 60, 0.55)');
    corona.addColorStop(1, 'rgba(129, 140, 248, 0)');
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(0, -18, moonR * 1.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pitch-black shadow moon silhouette
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = '#06040D';
    ctx.beginPath();
    ctx.arc(0, -18, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Inner razor silver-violet lunar corona ring
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.94;
    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, -18, moonR + 2, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Twin Giant Counter-Sweeping Eclipse Scythe Arcs around the Moon
    for (let s = 0; s < 2; s++) {
      ctx.save();
      const dir = s === 0 ? 1 : -1;
      ctx.rotate((-0.45 + progress * 1.9 * dir) * v.facing + s * Math.PI);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = '#0B0616';
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.98 - s * 0.1), -1.25, 1.25);
      ctx.arc(-20, 0, r * (0.74 - s * 0.08), 1.25, -1.25, true);
      ctx.closePath();
      ctx.fill();

      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.92;
      ctx.fillStyle = s === 0 ? v.color : '#F43F5E';
      ctx.beginPath();
      ctx.arc(2, 0, r * (0.96 - s * 0.1), -1.18, 1.18);
      ctx.arc(-14, 0, r * (0.78 - s * 0.08), 1.18, -1.18, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Expanding Eclipse Detonation Shockwave Ring
    const waveR = r * (0.55 + progress * 0.72);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = '#090612';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, waveR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.92;
    ctx.strokeStyle = v.accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, waveR, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Scattering Dark & Light Eclipse Ash/Ember Flecks
    const emberCount = Math.max(12, v.orbitCount * 2);
    for (let o = 0; o < emberCount; o++) {
      const ang = v.seed + (o * Math.PI * 2) / emberCount + progress * 0.65;
      const dist = r * (0.4 + progress * (0.75 + (o % 3) * 0.18));
      const ex = Math.cos(ang) * dist;
      const ey = Math.sin(ang) * dist * 0.85 - progress * 16;
      ctx.globalCompositeOperation = o % 3 === 0 ? 'source-over' : 'lighter';
      ctx.globalAlpha = alpha * (o % 3 === 0 ? 0.88 : 0.95);
      ctx.fillStyle = o % 3 === 0 ? '#0A0614' : o % 2 === 0 ? v.coreColor : '#FB923C';
      ctx.fillRect(Math.round(ex - 2), Math.round(ey - 2), 4, 4);
    }

    ctx.restore();
  }

  private drawBloodScytheReap(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.78 + 0.26 * Math.sin(Math.min(1, progress * 1.6) * (Math.PI * 0.5)));
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.scale(v.facing, 1);

    // Twin razor crimson-violet scythe reaping crescents (zero hexagram mage circles)
    for (let k = 0; k < 2; k++) {
      ctx.save();
      ctx.rotate((k === 0 ? -0.35 : 0.45) + progress * 0.85);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.78;
      ctx.fillStyle = '#14051A';
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.94 - k * 0.14), -1.35, 1.35);
      ctx.arc(-18, 0, r * (0.72 - k * 0.12), 1.35, -1.35, true);
      ctx.closePath();
      ctx.fill();

      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.92;
      ctx.fillStyle = k === 0 ? v.color : v.accentColor;
      ctx.beginPath();
      ctx.arc(2, 0, r * (0.92 - k * 0.14), -1.28, 1.28);
      ctx.arc(-13, 0, r * (0.76 - k * 0.12), 1.28, -1.28, true);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = v.coreColor;
      ctx.lineWidth = k === 0 ? 2.6 : 1.8;
      ctx.beginPath();
      ctx.arc(2, 0, r * (0.92 - k * 0.14), -1.2, 1.2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawEclipseDome(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.76 + 0.28 * Math.sin(Math.min(1, progress * 1.45) * (Math.PI * 0.5)));
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    // Translucent lunar eclipse dome veil (low alpha so characters remain sharp)
    const domeGrad = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
    domeGrad.addColorStop(0, 'rgba(10, 8, 26, 0.04)');
    domeGrad.addColorStop(0.68, 'rgba(30, 27, 75, 0.16)');
    domeGrad.addColorStop(0.92, 'rgba(129, 140, 248, 0.24)');
    domeGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer dark ink silhouette ring + crisp bright rim
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = '#090714';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = v.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.stroke();

    // Twin sweeping crescent moon-phase arcs rotating around the dome
    const rot = v.seed + progress * Math.PI * 2.4 * v.facing;
    for (let k = 0; k < 2; k++) {
      const a0 = rot + k * Math.PI;
      ctx.save();
      ctx.rotate(a0);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.88, -0.95, 0.95);
      ctx.arc(-14, 0, r * 0.74, 0.95, -0.95, true);
      ctx.closePath();
      ctx.globalAlpha = alpha * 0.62;
      ctx.fillStyle = k === 0 ? v.accentColor : v.color;
      ctx.fill();
      ctx.globalAlpha = alpha * 0.95;
      ctx.strokeStyle = v.coreColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Sharp intersecting razor light-lines cutting across the dome
    const rayCount = 4;
    for (let j = 0; j < rayCount; j++) {
      const rayAng = v.seed * 0.5 + (j * Math.PI) / rayCount + progress * 0.8;
      const len = r * (0.85 + 0.18 * Math.sin(progress * Math.PI));
      ctx.save();
      ctx.rotate(rayAng);
      ctx.globalAlpha = alpha * 0.82;
      ctx.strokeStyle = j % 2 === 0 ? v.coreColor : v.accentColor;
      ctx.lineWidth = j % 2 === 0 ? 2.5 : 1.6;
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Orbiting astral shards revolving along perimeter
    const count = Math.max(4, v.orbitCount);
    for (let o = 0; o < count; o++) {
      const oa = rot * 1.35 + (o * Math.PI * 2) / count;
      const ox = Math.cos(oa) * r * 0.9;
      const oy = Math.sin(oa) * r * 0.9;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(oa + Math.PI * 0.5);
      ctx.globalAlpha = alpha * 0.95;
      ctx.fillStyle = o % 2 === 0 ? v.coreColor : v.accentColor;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(0, -3.5);
      ctx.lineTo(-7, 0);
      ctx.lineTo(0, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  private drawCrossSlash(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const len = v.radius * (0.72 + progress * 0.38);
    const width = Math.max(3, 12 * alpha);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    const angles = [v.angle, v.angle + Math.PI * 0.48];
    for (let idx = 0; idx < angles.length; idx++) {
      ctx.save();
      ctx.rotate(angles[idx]);
      // Dark outline for high contrast
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.65;
      ctx.fillStyle = '#090714';
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.quadraticCurveTo(0, -width * 1.2, len, 0);
      ctx.quadraticCurveTo(0, width * 1.2, -len, 0);
      ctx.fill();

      // Luminous slash blade
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.92;
      ctx.fillStyle = idx === 0 ? v.color : v.accentColor;
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.quadraticCurveTo(0, -width * 0.78, len, 0);
      ctx.quadraticCurveTo(0, width * 0.78, -len, 0);
      ctx.fill();

      // Razor white/cyan center gleam
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = v.coreColor;
      ctx.lineWidth = Math.max(1.5, width * 0.28);
      ctx.beginPath();
      ctx.moveTo(-len * 0.92, 0);
      ctx.lineTo(len * 0.92, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawDashRibbon(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    const dx = v.tx - v.x;
    const dy = v.ty - v.y;
    const len = Math.hypot(dx, dy);
    if (len < 4) {
      ctx.restore();
      return;
    }
    const ang = Math.atan2(dy, dx);
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.rotate(ang);

    // Dark shadow speed wake
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = '#0B0718';
    ctx.beginPath();
    ctx.moveTo(0, -14 * alpha);
    ctx.lineTo(len, -3);
    ctx.lineTo(len, 3);
    ctx.lineTo(0, 14 * alpha);
    ctx.closePath();
    ctx.fill();

    // Glowing shadow-lightning streaks along dash vector
    ctx.globalCompositeOperation = 'lighter';
    for (let s = -1; s <= 1; s++) {
      const yOff = s * 9 * alpha;
      ctx.globalAlpha = alpha * (s === 0 ? 0.95 : 0.65);
      ctx.strokeStyle = s === 0 ? v.coreColor : v.color;
      ctx.lineWidth = s === 0 ? 3.5 : 2;
      ctx.beginPath();
      ctx.moveTo(len * progress * 0.35, yOff);
      ctx.lineTo(len * 0.45, yOff + (s === 0 ? 0 : Math.sin(v.seed + s) * 6));
      ctx.lineTo(len, yOff * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCurseSigil(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.78 + 0.25 * Math.sin(Math.min(1, progress * 1.5) * (Math.PI * 0.5)));
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.rotate(v.seed + progress * 2.2);

    // Subtle dark curse circle
    ctx.globalAlpha = alpha * 0.38;
    ctx.fillStyle = '#120721';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer dashed rune ring
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = v.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner hexagram / occult diamond sigil
    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 1.8;
    for (let t = 0; t < 2; t++) {
      ctx.beginPath();
      for (let p = 0; p < 3; p++) {
        const a = t * (Math.PI / 3) + (p * Math.PI * 2) / 3;
        const px = Math.cos(a) * r * 0.74;
        const py = Math.sin(a) * r * 0.74;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawDrainTendril(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    const mx = (v.x + v.tx) * 0.5;
    const my = (v.y + v.ty) * 0.5 - 42 * Math.sin(v.seed * 3.1 + progress * 2.5);

    // Outer dark curse tendril
    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = '#140826';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.quadraticCurveTo(mx, my, v.tx, v.ty);
    ctx.stroke();

    // Inner glowing soul-drain tendril
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.88;
    ctx.strokeStyle = v.color;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.quadraticCurveTo(mx, my, v.tx, v.ty);
    ctx.stroke();

    // Traveling light particles pulled from enemy -> character along quadratic curve
    for (let k = 0; k < 3; k++) {
      const t = Math.min(1, Math.max(0, (progress * 1.35 + k * 0.24) % 1));
      const inv = 1 - t;
      const ox = inv * inv * v.x + 2 * inv * t * mx + t * t * v.tx;
      const oy = inv * inv * v.y + 2 * inv * t * my + t * t * v.ty;
      ctx.globalAlpha = alpha * 0.95;
      ctx.fillStyle = k === 0 ? v.accentColor : v.coreColor;
      ctx.beginPath();
      ctx.arc(ox, oy, 4.5 - k * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawSustainPulse(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.45 + 0.65 * Math.sin(progress * Math.PI * 0.75));
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.globalCompositeOperation = 'lighter';

    ctx.globalAlpha = alpha * 0.78;
    ctx.strokeStyle = v.accentColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.55;
    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawInwardMotes(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    // Sharp shadow-crimson inward scythe streaks converging onto Luna
    const count = Math.max(6, v.orbitCount);
    const easeIn = progress * progress;
    for (let i = 0; i < count; i++) {
      const baseAng = v.seed + (i * Math.PI * 2) / count + progress * 1.4;
      const dist = v.radius * (1.1 - easeIn * 0.9);
      const px = Math.cos(baseAng) * dist;
      const py = Math.sin(baseAng) * dist * 0.72;
      const tailX = Math.cos(baseAng - 0.16) * (dist + 16);
      const tailY = Math.sin(baseAng - 0.16) * (dist + 16) * 0.72;

      ctx.globalAlpha = alpha * 0.75;
      ctx.strokeStyle = '#090612';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.92;
      ctx.strokeStyle = i % 2 === 0 ? v.accentColor : v.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  private drawLaunchFlash(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.scale(v.facing, 1);

    // Crisp dark silhouette crescent behind launch burst
    const r = v.radius * (0.72 + progress * 0.35);
    ctx.globalAlpha = alpha * 0.65;
    ctx.fillStyle = '#090714';
    ctx.beginPath();
    ctx.arc(4, 0, r * 0.78, -1.05, 1.05);
    ctx.arc(-8, 0, r * 0.62, 1.05, -1.05, true);
    ctx.closePath();
    ctx.fill();

    // Sharp directional crescent flash & speed needles at dash origin
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.arc(6, 0, r * 0.75, -0.95, 0.95);
    ctx.arc(-4, 0, r * 0.62, 0.95, -0.95, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(6, 0, r * 0.75, -0.88, 0.88);
    ctx.stroke();

    // Backward air-cleave needles from launch point
    for (let k = -2; k <= 2; k++) {
      const sy = k * 9;
      const sx = -12 - Math.abs(k) * 9 - progress * 30;
      ctx.globalAlpha = alpha * 0.88;
      ctx.strokeStyle = k === 0 ? v.coreColor : v.accentColor;
      ctx.lineWidth = k === 0 ? 2.6 : 1.6;
      ctx.beginPath();
      ctx.moveTo(sx + 20, sy);
      ctx.lineTo(sx, sy + k * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCastEclipseRing(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.62 + progress * 0.45);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    // Sharp eclipsed dark disc + razor crescent scythe arc (zero floating sparkles)
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = '#080512';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    ctx.save();
    ctx.rotate(v.seed + progress * Math.PI * 2.1 * v.facing);
    ctx.globalAlpha = alpha * 0.96;
    ctx.fillStyle = v.coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.96, -1.05, 1.05);
    ctx.arc(-10, 0, r * 0.78, 1.05, -1.05, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = v.accentColor;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  private drawCycloneVortex(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.72 + progress * 0.32);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.globalCompositeOperation = 'lighter';

    const baseRot = v.seed + progress * Math.PI * 4.5;
    for (let arm = 0; arm < 4; arm++) {
      const a0 = baseRot + (arm * Math.PI) / 2;
      ctx.save();
      ctx.rotate(a0);
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = arm % 2 === 0 ? v.color : v.coreColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(10, 0, r * 0.72, -0.7, 0.85);
      ctx.stroke();

      // Razor wind needle
      ctx.fillStyle = v.accentColor;
      ctx.beginPath();
      ctx.moveTo(r * 0.96, 0);
      ctx.lineTo(r * 0.62, -5);
      ctx.lineTo(r * 0.68, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawTornadoColumn(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const h = v.radius * 1.45;
    const baseW = v.radius * 0.55;
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.globalCompositeOperation = 'lighter';

    // Tilted fiery martial heel-kick spiral rings rising upward
    for (let layer = 0; layer < 5; layer++) {
      const frac = layer / 4;
      const ry = 35 - frac * h - progress * 35;
      const rx = baseW * (0.45 + frac * 0.75);
      ctx.save();
      ctx.translate(0, ry);
      ctx.rotate(Math.sin(progress * 10 + layer) * 0.16);
      ctx.globalAlpha = alpha * (0.85 - frac * 0.25);
      ctx.strokeStyle = layer % 2 === 0 ? v.color : v.coreColor;
      ctx.lineWidth = 4.5 - frac * 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, Math.max(8, rx * 0.28), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawDemonWings(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const spread = 0.6 + 0.5 * Math.sin(Math.min(1, progress * 1.8) * (Math.PI * 0.5));
    const span = v.radius * spread;
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y - 14));

    for (const side of [-1, 1] as const) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = '#190829';
      ctx.strokeStyle = v.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(span * 0.55, -span * 0.52);
      ctx.lineTo(span, -span * 0.34);
      ctx.lineTo(span * 0.72, 6);
      ctx.lineTo(span * 0.85, span * 0.22);
      ctx.lineTo(span * 0.42, span * 0.16);
      ctx.lineTo(14, span * 0.24);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.9;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawStarPillar(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const w = 38 * (1 - progress * 0.55);
    const h = v.radius * 2.1;
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.globalCompositeOperation = 'lighter';

    // Vertical astral starlight beam
    const grad = ctx.createLinearGradient(0, -h, 0, 10);
    grad.addColorStop(0, 'rgba(250, 204, 21, 0)');
    grad.addColorStop(0.55, v.color);
    grad.addColorStop(1, v.coreColor);
    ctx.globalAlpha = alpha * 0.65;
    ctx.fillStyle = grad;
    ctx.fillRect(-w * 0.5, -h, w, h);

    // Bright center ray
    ctx.globalAlpha = alpha * 0.95;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-w * 0.16, -h * 0.85, w * 0.32, h * 0.85);

    // Ground 4-point star seal
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = v.accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 52 * (0.6 + progress * 0.5), 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawSingularity(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius;
    const pulse = 1 + Math.sin(progress * Math.PI * 10) * 0.08;
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    // Accretion gravity field
    const field = ctx.createRadialGradient(0, 0, 12, 0, 0, r * pulse);
    field.addColorStop(0, 'rgba(8, 4, 18, 0.92)');
    field.addColorStop(0.28, 'rgba(88, 28, 135, 0.5)');
    field.addColorStop(0.75, 'rgba(192, 132, 252, 0.16)');
    field.addColorStop(1, 'rgba(192, 132, 252, 0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = field;
    ctx.beginPath();
    ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Spiraling inward gravity arcs
    ctx.globalCompositeOperation = 'lighter';
    const rot = progress * Math.PI * 6;
    for (let s = 0; s < 3; s++) {
      const a0 = rot + (s * Math.PI * 2) / 3;
      ctx.save();
      ctx.rotate(a0);
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = s === 0 ? v.accentColor : v.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.4 + s * 0.16), -0.9, 1.1);
      ctx.stroke();
      ctx.restore();
    }

    // Dark event-horizon core with luminous violet rim
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#06040C';
    ctx.beginPath();
    ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  private drawLightningBolt(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const segs = 6;
    const dx = v.tx - v.x;
    const dy = v.ty - v.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;

    for (let pass = 0; pass < 2; pass++) {
      ctx.globalAlpha = alpha * (pass === 0 ? 0.65 : 0.98);
      ctx.strokeStyle = pass === 0 ? v.accentColor : v.coreColor;
      ctx.lineWidth = pass === 0 ? 6 : 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      for (let s = 1; s < segs; s++) {
        const t = s / segs;
        const jitter = Math.sin(v.seed * 17 + s * 9.3) * 18;
        ctx.lineTo(v.x + dx * t + nx * jitter, v.y + dy * t + ny * jitter);
      }
      ctx.lineTo(v.tx, v.ty);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawFrostRing(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.45 + progress * 0.6);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.globalCompositeOperation = 'lighter';

    ctx.globalAlpha = alpha * 0.88;
    ctx.strokeStyle = v.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = v.seed + (i * Math.PI) / 3;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // 6 radial crystal ice spikes
    ctx.fillStyle = v.coreColor;
    for (let i = 0; i < 6; i++) {
      const a = v.seed + (i * Math.PI) / 3;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(r * 1.15, 0);
      ctx.lineTo(r * 0.72, -5);
      ctx.lineTo(r * 0.72, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawSonicCone(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.scale(v.facing, 1);
    ctx.globalCompositeOperation = 'lighter';

    for (let k = 0; k < 2; k++) {
      const r = v.radius * (0.55 + progress * 0.55 + k * 0.22);
      ctx.globalAlpha = alpha * (0.88 - k * 0.25);
      ctx.strokeStyle = k === 0 ? v.coreColor : v.color;
      ctx.lineWidth = 5 - k * 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, -0.78, 0.78);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawShadowBladesSpin(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.85 + Math.sin(progress * Math.PI) * 0.2);
    const blades = Math.max(4, v.orbitCount);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    const spin = v.seed + progress * Math.PI * 5.2;

    ctx.globalAlpha = alpha * 0.35;
    ctx.strokeStyle = '#090612';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();

    for (let b = 0; b < blades; b++) {
      const a = spin + (b * Math.PI * 2) / blades;
      const bx = Math.cos(a) * r * 0.86;
      const by = Math.sin(a) * r * 0.86;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a + Math.PI * 0.5);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = '#0A0614';
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(-4, -6);
      ctx.lineTo(-13, 0);
      ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.fill();

      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = b % 2 === 0 ? v.color : v.accentColor;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-3, -3.5);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-3, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawDarkChainSnare(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    const dx = v.tx - v.x;
    const dy = v.ty - v.y;
    const dist = Math.max(8, Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx);
    const links = Math.max(5, Math.floor(dist / 18));

    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(ang);
    for (let i = 0; i < links; i++) {
      const lx = (i + 0.5) * (dist / links);
      const wave = Math.sin(progress * 10 + i * 0.9) * 3.5;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = '#0B0618';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(lx, wave, 8, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = i % 2 === 0 ? v.color : v.accentColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(lx, wave, 7, 3.2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Snare cuffs / dark iron bind ring around target
    ctx.translate(Math.round(v.tx), Math.round(v.ty));
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.92;
    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 * (1 - progress * 0.25), 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawAbyssCrystalSpear(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.rotate(v.angle);
    const len = v.radius * (0.7 + progress * 0.35);

    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = '#070A18';
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(len * 0.22, -13);
    ctx.lineTo(-len * 0.6, -5);
    ctx.lineTo(-len * 0.72, 0);
    ctx.lineTo(-len * 0.6, 5);
    ctx.lineTo(len * 0.22, 13);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.94;
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.moveTo(len * 0.96, 0);
    ctx.lineTo(len * 0.22, -9);
    ctx.lineTo(-len * 0.55, -2.5);
    ctx.lineTo(-len * 0.55, 2.5);
    ctx.lineTo(len * 0.22, 9);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-len * 0.5, 0);
    ctx.lineTo(len * 0.95, 0);
    ctx.stroke();
    ctx.restore();
  }

  private drawBloodScytheBurst(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.65 + progress * 0.45);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    for (let k = 0; k < 2; k++) {
      ctx.save();
      ctx.rotate(v.seed + k * Math.PI * 0.55 + progress * 2.1 * (k === 0 ? 1 : -1));
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.82;
      ctx.fillStyle = '#19040B';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, -1.2, 1.2);
      ctx.arc(-16, 0, r * 0.72, 1.2, -1.2, true);
      ctx.closePath();
      ctx.fill();

      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = k === 0 ? v.color : '#FB7185';
      ctx.beginPath();
      ctx.arc(2, 0, r * 0.92, -1.14, 1.14);
      ctx.arc(-12, 0, r * 0.74, 1.14, -1.14, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawVioletThunderPillar(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const h = v.radius * 2.2;
    const w = 36 * (1 - progress * 0.45);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha * 0.65;
    ctx.fillStyle = '#1E0836';
    ctx.fillRect(-w * 0.62, -h, w * 1.24, h);

    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createLinearGradient(0, -h, 0, 8);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
    grad.addColorStop(0.4, v.color);
    grad.addColorStop(1, v.coreColor);
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = grad;
    ctx.fillRect(-w * 0.45, -h, w * 0.9, h);

    // Jagged inner lightning bolt down pillar center
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    for (let s = 1; s <= 5; s++) {
      const jitter = Math.sin(v.seed * 19 + s * 7.1 + progress * 12) * 14;
      ctx.lineTo(jitter, -h + (h * s) / 5);
    }
    ctx.stroke();

    // Ground impact ring
    ctx.strokeStyle = v.accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 48 * (0.5 + progress * 0.65), 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawFloorShadowSpikes(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const count = Math.max(5, v.orbitCount);
    const erupt = Math.min(1, progress * 3.2);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    for (let i = 0; i < count; i++) {
      const frac = count === 1 ? 0 : i / (count - 1) - 0.5;
      const sx = frac * v.radius * 1.5;
      const sh = (46 + (i % 2) * 20) * erupt;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.92;
      ctx.fillStyle = '#090614';
      ctx.beginPath();
      ctx.moveTo(sx - 10, 4);
      ctx.lineTo(sx + Math.sin(v.seed + i) * 5, -sh);
      ctx.lineTo(sx + 10, 4);
      ctx.closePath();
      ctx.fill();

      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = i % 2 === 0 ? v.color : v.coreColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawRazorWhirlAura(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius;
    const count = Math.max(4, v.orbitCount);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.globalCompositeOperation = 'lighter';

    ctx.globalAlpha = alpha * 0.45;
    ctx.strokeStyle = v.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();

    const rot = v.seed + progress * Math.PI * 6;
    for (let i = 0; i < count; i++) {
      const a = rot + (i * Math.PI * 2) / count;
      const ox = Math.cos(a) * r;
      const oy = Math.sin(a) * r * 0.48;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(a + Math.PI * 0.5);
      ctx.globalAlpha = alpha * 0.95;
      ctx.fillStyle = i % 2 === 0 ? v.coreColor : v.accentColor;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawCrescentBoomerang(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = Math.max(24, v.radius * 0.34);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.rotate(v.seed + progress * Math.PI * 8);

    ctx.globalAlpha = alpha * 0.82;
    ctx.fillStyle = '#0D061A';
    ctx.beginPath();
    ctx.arc(0, 0, r, -1.5, 1.5);
    ctx.arc(-10, 0, r * 0.65, 1.5, -1.5, true);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.95;
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.arc(2, 0, r * 0.96, -1.4, 1.4);
    ctx.arc(-8, 0, r * 0.68, 1.4, -1.4, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  private drawVerticalShockwave(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const w = 44 * (1 - progress * 0.35);
    const h = v.radius * (1.2 + progress * 0.55);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = '#180804';
    ctx.beginPath();
    ctx.moveTo(-w * 0.6, 8);
    ctx.quadraticCurveTo(0, -h * 1.15, w * 0.6, 8);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, 6);
    ctx.quadraticCurveTo(0, -h * 1.05, w * 0.42, 6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-w * 0.25, 4);
    ctx.lineTo(0, -h * 0.95);
    ctx.lineTo(w * 0.25, 4);
    ctx.stroke();
    ctx.restore();
  }

  private drawCosmicNeedleRain(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    ctx.save();
    const dx = v.tx - v.x;
    const dy = v.ty - v.y;
    const ang = Math.atan2(dy, dx);
    const curX = v.x + dx * Math.min(1, progress * 1.25);
    const curY = v.y + dy * Math.min(1, progress * 1.25);

    ctx.translate(curX, curY);
    ctx.rotate(ang);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.95;

    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-14, -3.5);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-14, 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();
    ctx.restore();
  }

  private drawBossCleaveArc(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const r = v.radius * (0.78 + progress * 0.28);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.scale(v.facing, 1);

    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = '#140507';
    ctx.beginPath();
    ctx.arc(0, 0, r, -1.15, 1.15);
    ctx.arc(-18, 0, r * 0.72, 1.15, -1.15, true);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.94;
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.arc(2, 0, r * 0.96, -1.08, 1.08);
    ctx.arc(-12, 0, r * 0.76, 1.08, -1.08, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = v.coreColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  private drawBossShockwave(
    ctx: CanvasRenderingContext2D,
    v: PooledSkillVfx,
    alpha: number,
    progress: number
  ): void {
    const rx = v.radius * (0.4 + progress * 0.85);
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));

    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = '#09060E';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, Math.max(12, rx * 0.26), 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.92;
    ctx.strokeStyle = v.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, Math.max(12, rx * 0.26), 0, 0, Math.PI * 2);
    ctx.stroke();

    // Jagged ground impact fissures erupting upward
    for (let k = -2; k <= 2; k++) {
      const fx = k * rx * 0.32;
      const fh = (36 - Math.abs(k) * 7) * (1 - progress * 0.45);
      ctx.fillStyle = k === 0 ? v.coreColor : v.accentColor;
      ctx.beginPath();
      ctx.moveTo(fx - 7, 2);
      ctx.lineTo(fx, -fh);
      ctx.lineTo(fx + 7, 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
