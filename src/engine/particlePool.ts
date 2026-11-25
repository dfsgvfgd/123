export type CombatTextKind =
  | 'normal'
  | 'crit'
  | 'burn'
  | 'freeze'
  | 'poison'
  | 'heal'
  | 'chain'
  | 'hurt';

export interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
  additive: boolean;
}

export type SlashArcVariant = 'basic' | 'skill' | 'sub';

export interface PooledSlashArc {
  active: boolean;
  x: number;
  y: number;
  facing: 1 | -1;
  radius: number;
  angleStart: number;
  angleEnd: number;
  life: number;
  maxLife: number;
  coreColor: string;
  glowColor: string;
  thickness: number;
  variant: SlashArcVariant;
}

export interface PooledFloatingText {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  subText: string;
  color: string;
  strokeColor: string;
  scale: number;
  life: number;
  maxLife: number;
  kind: CombatTextKind;
}

export interface PooledAfterimage {
  active: boolean;
  x: number;
  y: number;
  facing: 1 | -1;
  life: number;
  maxLife: number;
  tint: string;
}

/**
 * Zero-GC fixed-capacity ring buffers for smooth 60fps performance on mid-range mobile devices.
 */
export class VisualPool {
  readonly particles: PooledParticle[] = [];
  readonly arcs: PooledSlashArc[] = [];
  readonly texts: PooledFloatingText[] = [];
  readonly afterimages: PooledAfterimage[] = [];

  private pCursor = 0;
  private aCursor = 0;
  private tCursor = 0;
  private iCursor = 0;

  constructor(
    particleCap = 420,
    arcCap = 28,
    textCap = 72,
    afterimageCap = 18
  ) {
    for (let i = 0; i < particleCap; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        life: 0,
        maxLife: 1,
        color: '#A855F7',
        gravity: 0,
        additive: false,
      });
    }
    for (let i = 0; i < arcCap; i++) {
      this.arcs.push({
        active: false,
        x: 0,
        y: 0,
        facing: 1,
        radius: 50,
        angleStart: -0.9,
        angleEnd: 0.9,
        life: 0,
        maxLife: 0.16,
        coreColor: '#E9D5FF',
        glowColor: '#A855F7',
        thickness: 6,
        variant: 'basic',
      });
    }
    for (let i = 0; i < textCap; i++) {
      this.texts.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: -48,
        text: '',
        subText: '',
        color: '#FFFFFF',
        strokeColor: '#09090E',
        scale: 1,
        life: 0,
        maxLife: 0.72,
        kind: 'normal',
      });
    }
    for (let i = 0; i < afterimageCap; i++) {
      this.afterimages.push({
        active: false,
        x: 0,
        y: 0,
        facing: 1,
        life: 0,
        maxLife: 0.22,
        tint: '#9333EA',
      });
    }
  }

  clear(): void {
    for (let i = 0; i < this.particles.length; i++) this.particles[i].active = false;
    for (let i = 0; i < this.arcs.length; i++) this.arcs[i].active = false;
    for (let i = 0; i < this.texts.length; i++) this.texts[i].active = false;
    for (let i = 0; i < this.afterimages.length; i++) this.afterimages[i].active = false;
  }

  spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    maxLife: number,
    color: string,
    gravity = 240,
    additive = false
  ): void {
    const p = this.particles[this.pCursor];
    this.pCursor = (this.pCursor + 1) % this.particles.length;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.color = color;
    p.gravity = gravity;
    p.additive = additive;
  }

  spawnBurst(
    x: number,
    y: number,
    count: number,
    colors: string[],
    speedMin = 60,
    speedMax = 240,
    size = 4,
    additive = false
  ): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = speedMin + Math.random() * (speedMax - speedMin);
      const col = colors[i % colors.length];
      this.spawnParticle(
        x,
        y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd - 40,
        size + (i % 2),
        0.24 + Math.random() * 0.25,
        col,
        320,
        additive
      );
    }
  }

  spawnSlashArc(
    x: number,
    y: number,
    facing: 1 | -1,
    radius: number,
    angleStart: number,
    angleEnd: number,
    coreColor: string,
    glowColor: string,
    thickness = 7,
    maxLife = 0.16,
    variant: SlashArcVariant = 'basic'
  ): void {
    const a = this.arcs[this.aCursor];
    this.aCursor = (this.aCursor + 1) % this.arcs.length;
    a.active = true;
    a.x = x;
    a.y = y;
    a.facing = facing;
    a.radius = radius;
    a.angleStart = angleStart;
    a.angleEnd = angleEnd;
    a.coreColor = coreColor;
    a.glowColor = glowColor;
    a.thickness = thickness;
    a.life = maxLife;
    a.maxLife = maxLife;
    a.variant = variant;
  }

  spawnText(
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1,
    kind: CombatTextKind = 'normal',
    subText = ''
  ): void {
    const t = this.texts[this.tCursor];
    this.tCursor = (this.tCursor + 1) % this.texts.length;
    t.active = true;
    t.x = x + (Math.random() * 18 - 9);
    t.y = y;
    t.vx = kind === 'crit' ? (Math.random() - 0.5) * 32 : (Math.random() - 0.5) * 16;
    t.vy = kind === 'crit' ? -72 : kind === 'chain' ? -60 : -52;
    t.text = text;
    t.subText = subText;
    t.color = color;
    t.strokeColor = kind === 'crit' ? '#451A03' : '#09090E';
    t.scale = scale;
    t.life = kind === 'chain' ? 1.1 : kind === 'crit' ? 0.85 : 0.68;
    t.maxLife = t.life;
    t.kind = kind;
  }

  spawnAfterimage(x: number, y: number, facing: 1 | -1, tint: string): void {
    const img = this.afterimages[this.iCursor];
    this.iCursor = (this.iCursor + 1) % this.afterimages.length;
    img.active = true;
    img.x = x;
    img.y = y;
    img.facing = facing;
    img.tint = tint;
    img.life = 0.2;
    img.maxLife = 0.2;
  }

  update(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    for (let i = 0; i < this.arcs.length; i++) {
      const a = this.arcs[i];
      if (!a.active) continue;
      a.life -= dt;
      if (a.life <= 0) a.active = false;
    }

    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i];
      if (!t.active) continue;
      t.life -= dt;
      if (t.life <= 0) {
        t.active = false;
        continue;
      }
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy *= 0.93;
      t.vx *= 0.92;
    }

    for (let i = 0; i < this.afterimages.length; i++) {
      const img = this.afterimages[i];
      if (!img.active) continue;
      img.life -= dt;
      if (img.life <= 0) img.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 1. Tapered Crescent Slash Arcs (Basic vs Skill vs Sub-Skill hierarchy)
    const ARC_SEGMENTS = 14;
    for (let i = 0; i < this.arcs.length; i++) {
      const a = this.arcs[i];
      if (!a.active) continue;
      const alpha = Math.max(0, a.life / a.maxLife);
      const progress = 1 - alpha;
      ctx.save();
      ctx.translate(Math.round(a.x), Math.round(a.y));
      ctx.scale(a.facing, 1);

      if (a.variant === 'sub') {
        // Compact, clean distinct ring for auto sub-skills without obscuring actors
        ctx.globalAlpha = alpha * 0.48;
        ctx.strokeStyle = a.glowColor;
        ctx.lineWidth = Math.max(3, a.thickness * 0.85);
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, a.radius * (0.85 + progress * 0.25), a.angleStart, a.angleEnd);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = a.coreColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, a.radius * (0.82 + progress * 0.25), a.angleStart, a.angleEnd);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const span = a.angleEnd - a.angleStart;
      const rScale = a.variant === 'skill' ? 0.94 + progress * 0.14 : 0.96 + progress * 0.08;
      const rBase = a.radius * rScale;
      const outerThickness = a.variant === 'skill' ? a.thickness * 2.2 : a.thickness * 1.45;

      // Build tapered crescent path (sharp leading & trailing tips, thick cutting belly)
      ctx.beginPath();
      for (let s = 0; s <= ARC_SEGMENTS; s++) {
        const t = s / ARC_SEGMENTS;
        const ang = a.angleStart + span * t;
        const bulge = Math.pow(Math.sin(t * Math.PI), 0.72) * outerThickness * alpha;
        const ro = rBase + bulge * 0.52;
        const px = Math.cos(ang) * ro;
        const py = Math.sin(ang) * ro;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let s = ARC_SEGMENTS; s >= 0; s--) {
        const t = s / ARC_SEGMENTS;
        const ang = a.angleStart + span * t;
        const bulge = Math.pow(Math.sin(t * Math.PI), 0.72) * outerThickness * alpha;
        const ri = Math.max(4, rBase - bulge * 0.78);
        ctx.lineTo(Math.cos(ang) * ri, Math.sin(ang) * ri);
      }
      ctx.closePath();

      // Subtle dark outer contrast edge so luminous slash pops over dark stone & fire
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = '#090714';
      ctx.lineWidth = a.variant === 'skill' ? 4 : 2.5;
      ctx.stroke();

      // Luminous energy fill
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * (a.variant === 'skill' ? 0.85 : 0.72);
      ctx.fillStyle = a.glowColor;
      ctx.fill();

      // Razor-sharp inner highlight core along the outer cutting rim
      ctx.globalAlpha = alpha * 0.96;
      ctx.strokeStyle = a.coreColor;
      ctx.lineWidth = Math.max(2, a.thickness * (a.variant === 'skill' ? 0.55 : 0.42));
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let s = 1; s < ARC_SEGMENTS; s++) {
        const t = s / ARC_SEGMENTS;
        const ang = a.angleStart + span * t;
        const rRim = rBase + Math.pow(Math.sin(t * Math.PI), 0.72) * outerThickness * alpha * 0.34;
        const px = Math.cos(ang) * rRim;
        const py = Math.sin(ang) * rRim;
        if (s === 1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Secondary dramatic inner shock arc for Main Skills
      if (a.variant === 'skill') {
        ctx.globalAlpha = alpha * 0.55;
        ctx.strokeStyle = a.coreColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(12, rBase * 0.72), a.angleStart + span * 0.14, a.angleEnd - span * 0.14);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Standard pixel particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active || p.additive) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const s = Math.max(2, Math.round(p.size * (0.5 + 0.5 * alpha)));
      ctx.fillRect(Math.round(p.x - s * 0.5), Math.round(p.y - s * 0.5), s, s);
    }

    // 2b. Additive glow shader particles (elemental fire/ice/poison/arcane)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active || !p.additive) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha * 0.78;
      ctx.fillStyle = p.color;
      const s = Math.max(2, Math.round(p.size * (0.65 + 0.5 * alpha)));
      ctx.fillRect(Math.round(p.x - s * 0.5), Math.round(p.y - s * 0.5), s, s);
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillRect(Math.round(p.x - s), Math.round(p.y - s), s * 2, s * 2);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // 3. Floating Combat Text (Damage numbers, Critical Hit indicators, Elemental Status & Combo Chain)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i];
      if (!t.active) continue;
      const progress = 1 - t.life / t.maxLife;
      const pop = progress < 0.16 ? 0.8 + (progress / 0.16) * 0.42 : 1.22 - (progress - 0.16) * 0.26;
      const alpha = Math.min(1, (t.life / t.maxLife) * 1.45);
      ctx.globalAlpha = alpha;

      const rx = Math.round(t.x);
      const ry = Math.round(t.y);
      const pxSize = Math.round(14 * t.scale * pop);
      ctx.font = `700 ${pxSize}px "JetBrains Mono", monospace`;
      ctx.lineWidth = t.kind === 'crit' ? 4 : 3;
      ctx.strokeStyle = t.strokeColor;
      ctx.strokeText(t.text, rx, ry);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, rx, ry);

      if (t.subText) {
        ctx.font = `700 ${Math.max(9, Math.round(10 * t.scale))}px "Plus Jakarta Sans", sans-serif`;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#09090E';
        ctx.strokeText(t.subText, rx, ry - Math.round(pxSize * 0.78));
        ctx.fillStyle = t.kind === 'crit' ? '#FEF08A' : t.color;
        ctx.fillText(t.subText, rx, ry - Math.round(pxSize * 0.78));
      }
    }
    ctx.globalAlpha = 1;
  }
}
