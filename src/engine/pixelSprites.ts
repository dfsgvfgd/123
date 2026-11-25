import {
  BLADE_AURAS,
  LUNA_SCYTHE_STYLES,
  LYRA_WEAPON_STYLES,
  WITCH_WEAPON_STYLES,
} from '../game/progression';
import type {
  BladeAuraId,
  BladeStyleId,
  LyraWeaponId,
  MonsterType,
  ScytheWeaponId,
  WitchWeaponId,
} from '../game/types';

export type VelveraAnimFrame =
  | 'idle0'
  | 'idle1'
  | 'run0'
  | 'run1'
  | 'run2'
  | 'run3'
  | 'jump'
  | 'fall'
  | 'slash1'
  | 'slash2'
  | 'slash3'
  | 'slash_seq_0'
  | 'slash_seq_1'
  | 'slash_seq_2'
  | 'slash_seq_3'
  | 'slash_seq_4'
  | 'slash_seq_5'
  | 'slash_seq_6'
  | 'slash_seq_7'
  | 'slash_seq_8'
  | 'slash_seq_9'
  | 'dash'
  | 'cast';

export type EnemyAnimPose = 'walk' | 'windup' | 'attack';

const spriteCache = new Map<string, HTMLCanvasElement>();

function makeOffscreen(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function linePx(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thickness: number,
  color: string
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  ctx.fillStyle = color;
  const half = Math.floor(thickness / 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(x0 + (x1 - x0) * t) - half;
    const cy = Math.round(y0 + (y1 - y0) * t) - half;
    ctx.fillRect(cx, cy, thickness, thickness);
  }
}

/** Rasterizes a crisp pixel-art filled ellipse (no boxy corners!). */
function fillOval(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string
): void {
  ctx.fillStyle = color;
  const ix = Math.round(cx);
  const iy = Math.round(cy);
  const irx = Math.max(1, Math.round(rx));
  const iry = Math.max(1, Math.round(ry));
  for (let dy = -iry; dy <= iry; dy++) {
    const ratio = dy / iry;
    const span = Math.round(irx * Math.sqrt(Math.max(0, 1 - ratio * ratio)));
    if (span > 0) {
      ctx.fillRect(ix - span, iy + dy, span * 2, 1);
    }
  }
}

/** Rasterizes a smooth tapered limb or horn between two points. */
function fillTaperedCurve(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  rStart: number,
  rEnd: number,
  color: string
): void {
  const steps = Math.max(12, Math.round(Math.hypot(x1 - x0, y1 - y0) * 1.4));
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    const r = Math.max(1, Math.round(rStart + (rEnd - rStart) * t));
    fillOval(ctx, x, y, r, r, color);
  }
}

/** Rasterizes a filled polygon using crisp pixel rows. */
function fillPoly(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color: string
): void {
  if (points.length < 3) return;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of points) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  minY = Math.floor(minY);
  maxY = Math.ceil(maxY);
  ctx.fillStyle = color;

  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        const ix = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1);
        intersections.push(ix);
      }
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const startX = Math.round(intersections[i]);
      const endX = Math.round(intersections[i + 1]);
      if (endX > startX) {
        ctx.fillRect(startX, y, endX - startX, 1);
      }
    }
  }
}

/** Adds a crisp 1px dark Dungeon-Slasher silhouette outline around opaque pixels. */
function applyPixelOutline(
  canvas: HTMLCanvasElement,
  outlineHex = '#100C18'
): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;
  const srcCtx = canvas.getContext('2d')!;
  const img = srcCtx.getImageData(0, 0, w, h);
  const src = img.data;

  const rOut = parseInt(outlineHex.slice(1, 3), 16);
  const gOut = parseInt(outlineHex.slice(3, 5), 16);
  const bOut = parseInt(outlineHex.slice(5, 7), 16);

  const outData = new Uint8ClampedArray(src);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (src[idx + 3] > 20) continue;
      const up = src[((y - 1) * w + x) * 4 + 3] > 120;
      const dn = src[((y + 1) * w + x) * 4 + 3] > 120;
      const lt = src[(y * w + x - 1) * 4 + 3] > 120;
      const rt = src[(y * w + x + 1) * 4 + 3] > 120;
      if (up || dn || lt || rt) {
        outData[idx] = rOut;
        outData[idx + 1] = gOut;
        outData[idx + 2] = bOut;
        outData[idx + 3] = 240;
      }
    }
  }
  img.data.set(outData);
  srcCtx.putImageData(img, 0, 0);
  return canvas;
}

function applySoftHurtTint(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(248, 113, 113, 0.56)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Adds a thin top-right directional rim light on opaque interior edge pixels
 * before the 1px dark outer silhouette outline, giving hand-polished pixel volume.
 */
function applyPixelRimLight(
  canvas: HTMLCanvasElement,
  rimHex = '#A5B4FC',
  strength = 0.28
): void {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const rr = parseInt(rimHex.slice(1, 3), 16);
  const rg = parseInt(rimHex.slice(3, 5), 16);
  const rb = parseInt(rimHex.slice(5, 7), 16);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (d[idx + 3] < 180) continue;
      const topEmpty = d[((y - 1) * w + x) * 4 + 3] < 60;
      const rightEmpty = d[(y * w + x + 1) * 4 + 3] < 60;
      if (topEmpty || rightEmpty) {
        d[idx] = Math.min(255, Math.round(d[idx] * (1 - strength) + rr * strength));
        d[idx + 1] = Math.min(255, Math.round(d[idx + 1] * (1 - strength) + rg * strength));
        d[idx + 2] = Math.min(255, Math.round(d[idx + 2] * (1 - strength) + rb * strength));
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Character 0 (Main): Luna — Hooded Dark Assassin with Two-Handed Cosmic Crescent Scythe
 * Faithful to dark red & black hooded assassin stance + glowing cosmic-purple crescent scythe.
 * 160x148 canvas with feet cleanly grounded at y=134 so wide swings & cape flare never clip.
 * Supports 10 sequential attack frames ('slash_seq_0'..'slash_seq_9'):
 *   0-1: Anticipation (low dip, back foot weight, scythe pulled far over shoulder, cape trailing)
 *   2-6: The Swing (explosive forward lunge, hip/shoulder twist, wide scythe arc + cosmic energy blur, cape flare)
 *   7-9: Follow-through / Recovery (momentum deceleration back to two-handed combat-ready stance)
 */
export function getLunaSprite(
  frame: VelveraAnimFrame,
  scytheStyle: ScytheWeaponId = 'umbral_crescent_scythe',
  hurtFlash = false
): HTMLCanvasElement {
  const key = `luna_ds_v3:${frame}:${scytheStyle}:${hurtFlash ? '1' : '0'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(160, 148);
  const sStyle = LUNA_SCYTHE_STYLES[scytheStyle] ?? LUNA_SCYTHE_STYLES.umbral_crescent_scythe;

  // Map legacy slash1/2/3 cleanly into key sequential phases
  const seqIdx = frame.startsWith('slash_seq_')
    ? Math.max(0, Math.min(9, Number(frame.slice(10)) || 0))
    : frame === 'slash1'
      ? 4
      : frame === 'slash2'
        ? 3
        : frame === 'slash3'
          ? 5
          : -1;

  const isIdle1 = frame === 'idle1';
  const isRun0 = frame === 'run0';
  const isRun1 = frame === 'run1';
  const isRun2 = frame === 'run2';
  const isRun3 = frame === 'run3';
  const isRunning = isRun0 || isRun1 || isRun2 || isRun3;
  const isJump = frame === 'jump';
  const isFall = frame === 'fall';
  const isDash = frame === 'dash';
  const isCast = frame === 'cast';
  const isAttacking = seqIdx >= 0;

  // Per-frame sequential pose table (10 distinct sequential frames)
  // lean: horizontal torso offset, drop: crouch drop (+down), hipTwist: shoulder/hip turn,
  // capeBack: cape stretch (-backwards/+relaxed), capeFlareY: vertical flare,
  // scytheAngle: angle in radians from grip-to-head (0=forward, -PI/2=up, -PI=back, +PI/2=down)
  const SEQ_POSES: Array<{
    lean: number;
    drop: number;
    capeBack: number;
    capeFlareY: number;
    gripX: number;
    gripY: number;
    scytheAngle: number;
    headFlip: 1 | -1;
    trailArc?: { startAng: number; endAng: number; alpha: number };
  }> = [
    // 0: Anticipation 1 — dipping low, coiling weight onto back foot
    { lean: -4, drop: 5, capeBack: -10, capeFlareY: -2, gripX: -8, gripY: 68, scytheAngle: -2.25, headFlip: 1 },
    // 1: Anticipation 2 — deep crouch wind-up, scythe pulled far back over shoulder
    { lean: -7, drop: 7, capeBack: -16, capeFlareY: -5, gripX: -14, gripY: 64, scytheAngle: -2.62, headFlip: 1 },
    // 2: Swing 1 — exploding forward, hips twisting, whipping blade over crown
    {
      lean: 3,
      drop: 3,
      capeBack: -24,
      capeFlareY: -9,
      gripX: 6,
      gripY: 56,
      scytheAngle: -1.52,
      headFlip: 1,
      trailArc: { startAng: -2.55, endAng: -1.35, alpha: 0.48 },
    },
    // 3: Swing 2 — fierce upper-diagonal cleave, cape snapping wide back
    {
      lean: 8,
      drop: 2,
      capeBack: -34,
      capeFlareY: -12,
      gripX: 16,
      gripY: 58,
      scytheAngle: -0.68,
      headFlip: 1,
      trailArc: { startAng: -2.15, endAng: -0.45, alpha: 0.78 },
    },
    // 4: Swing 3 (Peak Impact) — full extension forward horizontal slash + massive blurred arc
    {
      lean: 11,
      drop: 4,
      capeBack: -38,
      capeFlareY: -8,
      gripX: 20,
      gripY: 66,
      scytheAngle: 0.16,
      headFlip: 1,
      trailArc: { startAng: -1.55, endAng: 0.34, alpha: 0.95 },
    },
    // 5: Swing 4 — lower-forward sweeping follow arc with swirling cosmic wake
    {
      lean: 10,
      drop: 5,
      capeBack: -34,
      capeFlareY: -4,
      gripX: 18,
      gripY: 72,
      scytheAngle: 0.88,
      headFlip: 1,
      trailArc: { startAng: -0.82, endAng: 1.05, alpha: 0.82 },
    },
    // 6: Swing 5 — blade sweeping low past front foot, energy dissipating
    {
      lean: 8,
      drop: 4,
      capeBack: -26,
      capeFlareY: -1,
      gripX: 14,
      gripY: 75,
      scytheAngle: 1.42,
      headFlip: 1,
      trailArc: { startAng: 0.05, endAng: 1.54, alpha: 0.46 },
    },
    // 7: Recovery 1 — momentum pulls body slightly forward as arc ends
    { lean: 6, drop: 3, capeBack: -18, capeFlareY: 2, gripX: 11, gripY: 74, scytheAngle: 1.72, headFlip: 1 },
    // 8: Recovery 2 — decelerating, re-centering weight & drawing shaft back across guard
    { lean: 3, drop: 1, capeBack: -10, capeFlareY: 1, gripX: 7, gripY: 71, scytheAngle: -0.52, headFlip: 1 },
    // 9: Recovery 3 — settled tensed ready combat stance
    { lean: 1, drop: 0, capeBack: -5, capeFlareY: 0, gripX: 4, gripY: 68, scytheAngle: -0.92, headFlip: 1 },
  ];

  const pose = isAttacking ? SEQ_POSES[seqIdx] : null;
  const bobY = pose
    ? pose.drop
    : isIdle1
      ? 2
      : isRun1 || isRun3
        ? 2
        : isRun0 || isRun2
          ? -1
          : isJump
            ? -5
            : isFall
              ? 2
              : 0;
  const leanX = pose
    ? pose.lean
    : isRunning || isDash
      ? 6
      : isCast
        ? 3
        : 2;
  const cx = 68 + leanX;
  const footY = 134;

  const CLOAK_DEEP = '#14111E';
  const CLOAK_MID = '#252036';
  const CLOAK_HIGHLIGHT = '#3F375B';
  const CRIMSON_DARK = '#591022';
  const CRIMSON_BRIGHT = '#B4203F';
  const HAIR_DARK = '#111019';
  const HAIR_MID = '#272336';
  const HAIR_LIGHT = '#4A4366';
  const SKIN = '#F2DDD5';
  const SKIN_SHADE = '#C8A7A1';
  const ARMOR_DARK = '#1C1929';
  const ARMOR_MID = '#34304B';
  const ARMOR_STEEL = '#676F91';
  const LEATHER = '#4E2D2C';
  const WRAP_LIGHT = '#D6C5B3';
  const WRAP_SHADE = '#A89480';
  const BELT_BUCKLE = '#CBD5E1';

  // Helper: Draw Luna's Iconic Cosmic Crescent-Moon Scythe at arbitrary angle (matching image_b0116cac.png)
  const drawCosmicScytheAngled = (
    gx: number,
    gy: number,
    angle: number,
    headFlip: 1 | -1,
    shaftBack = 24,
    shaftFwd = 46,
    showAuraSparks = true
  ) => {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    // Normal vector (blade curves toward normal * headFlip)
    const nx = -uy * headFlip;
    const ny = ux * headFlip;

    const p0x = gx - ux * shaftBack;
    const p0y = gy - uy * shaftBack;
    const hx = gx + ux * shaftFwd;
    const hy = gy + uy * shaftFwd;

    // 1. Spiked lower hook-pommel & dark segmented metal shaft
    const pomX = p0x - ux * 6;
    const pomY = p0y - uy * 6;
    linePx(ctx, pomX, pomY, p0x, p0y, 4, ARMOR_STEEL);
    fillOval(ctx, pomX + nx * 2, pomY + ny * 2, 2.5, 2.5, ARMOR_DARK);
    linePx(ctx, p0x, p0y, hx, hy, 4, sStyle.shaftHex);
    linePx(ctx, p0x + nx * 1, p0y + ny * 1, hx + nx * 1, hy + ny * 1, 1, ARMOR_STEEL);
    // Segmented metal grip wraps
    for (let s = 0.18; s <= 0.84; s += 0.16) {
      const rx = p0x + (hx - p0x) * s;
      const ry = p0y + (hy - p0y) * s;
      fillOval(ctx, rx, ry, 2.6, 2.6, s === 0.34 || s === 0.66 ? sStyle.bladeMid : ARMOR_MID);
    }

    // 2. Sculpted Twin-Horn Dorsal Collar + Glowing Cosmic Orb (image_b0116cac.png signature silhouette)
    const horn1X = hx - nx * 15 - ux * 6;
    const horn1Y = hy - ny * 15 - uy * 6;
    const horn2X = hx - nx * 12 + ux * 6;
    const horn2Y = hy - ny * 12 + uy * 6;
    fillPoly(
      ctx,
      [
        [hx - ux * 5, hy - uy * 5],
        [horn1X, horn1Y],
        [hx - nx * 5, hy - ny * 5],
        [horn2X, horn2Y],
        [hx + ux * 6, hy + uy * 6],
      ],
      ARMOR_DARK
    );
    fillPoly(
      ctx,
      [
        [hx - ux * 2, hy - uy * 2],
        [horn2X - ux * 1, horn2Y - uy * 1],
        [hx + ux * 4, hy + uy * 4],
      ],
      ARMOR_STEEL
    );

    // Ornate socket + glowing cosmic purple-magenta orb
    fillOval(ctx, hx, hy, 6.5, 6.5, ARMOR_MID);
    fillOval(ctx, hx + ux * 1.5, hy + uy * 1.5, 4.5, 4.5, '#A855F7');
    fillOval(ctx, hx + ux * 1.5, hy + uy * 1.5, 2.8, 2.8, '#F5D0FE');
    px(ctx, hx + ux * 1.5, hy + uy * 1.5, 2, 2, '#FFFFFF');

    // 3. Sweeping Massive Crescent-Moon Blade
    const archX = hx + ux * 12 + nx * 24;
    const archY = hy + uy * 12 + ny * 24;
    const tipX = hx - ux * 14 + nx * 42;
    const tipY = hy - uy * 14 + ny * 42;

    // Dark forged steel outer crescent spine
    fillTaperedCurve(ctx, hx + ux * 4, hy + uy * 4, archX + ux * 4, archY + uy * 4, tipX, tipY, 7, 1, sStyle.bladeDark);
    // Deep nebula violet body
    fillTaperedCurve(ctx, hx + ux * 2, hy + uy * 2, archX + ux * 1, archY + uy * 1, tipX, tipY, 5, 1, sStyle.bladeMid);
    // Glowing cosmic-purple & blue energy wave along inner blade bevel
    fillTaperedCurve(
      ctx,
      hx - ux * 1 + nx * 2,
      hy - uy * 1 + ny * 2,
      archX - ux * 3 + nx * 1,
      archY - uy * 3 + ny * 1,
      tipX - ux * 2,
      tipY - uy * 2,
      3.2,
      1,
      sStyle.bladeGlow
    );
    // Razor luminous cyan-lavender inner edge
    fillTaperedCurve(
      ctx,
      hx - ux * 2 + nx * 4,
      hy - uy * 2 + ny * 4,
      archX - ux * 5 + nx * 1,
      archY - uy * 5 + ny * 1,
      tipX - ux * 1,
      tipY - uy * 1,
      1.6,
      1,
      sStyle.bladeCore
    );

    // Starry cosmic nebula specks + floating purple/blue pixels
    px(ctx, archX + ux * 1, archY + uy * 1, 2, 2, '#E0F2FE');
    px(ctx, (hx + archX) * 0.5, (hy + archY) * 0.5, 2, 2, '#F5D0FE');
    if (showAuraSparks) {
      px(ctx, archX + nx * 7, archY + ny * 7, 2, 2, '#A855F7');
      px(ctx, tipX + ux * 4 + nx * 3, tipY + uy * 4 + ny * 3, 2, 2, '#38BDF8');
      px(ctx, hx + nx * 18 - ux * 3, hy + ny * 18 - uy * 3, 2, 2, '#C084FC');
    }
  };

  // Helper: Swirling Cosmic Energy Trail for Active Swing Frames 2..6
  const drawSwingEnergyTrail = (
    gx: number,
    gy: number,
    startAng: number,
    endAng: number,
    alpha: number
  ) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rOuter = 68;
    const rInner = 46;
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const t1 = (i + 1) / steps;
      const a0 = startAng + (endAng - startAng) * t0;
      const a1 = startAng + (endAng - startAng) * t1;
      const wFactor = Math.sin(t1 * Math.PI);
      const rIn = rOuter - (rOuter - rInner) * Math.min(1, t1 * 1.15);

      ctx.globalAlpha = alpha * (0.28 + t1 * 0.72);
      ctx.fillStyle = i % 3 === 0 ? '#38BDF8' : '#A855F7';
      ctx.beginPath();
      ctx.moveTo(gx + Math.cos(a0) * rIn, gy + Math.sin(a0) * rIn);
      ctx.lineTo(gx + Math.cos(a0) * rOuter, gy + Math.sin(a0) * rOuter);
      ctx.lineTo(gx + Math.cos(a1) * rOuter, gy + Math.sin(a1) * rOuter);
      ctx.lineTo(gx + Math.cos(a1) * rIn, gy + Math.sin(a1) * rIn);
      ctx.closePath();
      ctx.fill();

      if (wFactor > 0.45 && i % 2 === 1) {
        ctx.globalAlpha = alpha * 0.92;
        ctx.fillStyle = '#F5D0FE';
        ctx.fillRect(
          Math.round(gx + Math.cos(a1) * (rOuter - 3)),
          Math.round(gy + Math.sin(a1) * (rOuter - 3)),
          3,
          3
        );
      }
    }
    ctx.restore();
  };

  // 1. Flowing Dark Red & Black Assassin Cape (follows momentum dynamically)
  const cloakFlow = pose
    ? pose.capeBack
    : isRunning || isDash
      ? -20
      : isJump
        ? -10
        : isIdle1
          ? 2
          : -3;
  const cloakLift = pose
    ? pose.capeFlareY
    : isJump
      ? -6
      : isFall
        ? -12
        : isDash
          ? -4
          : 0;
  fillPoly(
    ctx,
    [
      [cx - 8, 56 + bobY],
      [cx - 34 + cloakFlow, 60 + bobY + cloakLift],
      [cx - 52 + cloakFlow * 1.05, 84 + bobY + cloakLift],
      [cx - 38 + cloakFlow * 0.9, 108 + bobY + cloakLift * 0.4],
      [cx - 14, 98 + bobY],
      [cx - 4, 72 + bobY],
    ],
    CLOAK_DEEP
  );
  // Crimson inner cape lining & crisp edge highlight
  fillPoly(
    ctx,
    [
      [cx - 10, 64 + bobY],
      [cx - 40 + cloakFlow, 82 + bobY + cloakLift],
      [cx - 34 + cloakFlow * 0.9, 104 + bobY + cloakLift * 0.4],
      [cx - 12, 92 + bobY],
    ],
    CRIMSON_DARK
  );
  fillTaperedCurve(
    ctx,
    cx - 10,
    58 + bobY,
    cx - 28 + cloakFlow * 0.65,
    60 + bobY + cloakLift,
    cx - 50 + cloakFlow * 1.02,
    82 + bobY + cloakLift,
    3,
    1,
    CLOAK_HIGHLIGHT
  );
  fillTaperedCurve(
    ctx,
    cx - 12,
    90 + bobY,
    cx - 24 + cloakFlow * 0.55,
    98 + bobY + cloakLift * 0.3,
    cx - 34 + cloakFlow * 0.9,
    105 + bobY + cloakLift * 0.4,
    2,
    1,
    CRIMSON_BRIGHT
  );

  // 2. Sculpted Flowing Black Hair behind shoulder
  const hairSwing = isRunning || isDash || (pose && pose.lean > 4) ? -10 : 0;
  fillTaperedCurve(ctx, cx - 6, 44 + bobY, cx - 16 + hairSwing, 62 + bobY, cx - 20 + hairSwing, 82 + bobY, 7, 2, HAIR_DARK);
  fillTaperedCurve(ctx, cx + 6, 46 + bobY, cx + 14 + hairSwing * 0.3, 64 + bobY, cx + 18 + hairSwing * 0.3, 80 + bobY, 5, 1, HAIR_MID);
  fillTaperedCurve(ctx, cx + 8, 50 + bobY, cx + 13, 64 + bobY, cx + 15, 76 + bobY, 2, 1, HAIR_LIGHT);

  // 3. Articulated Legs, Beige Wraps (front thigh) & Armored Knee-High Boots (image_ff598730.png)
  const drawLunaLeg = (
    hx: number,
    hy: number,
    kx: number,
    ky: number,
    fx: number,
    fy: number,
    front: boolean
  ) => {
    // Upper thigh
    fillTaperedCurve(ctx, hx, hy, (hx + kx) / 2, (hy + ky) / 2, kx, ky, 5.5, 4, front ? SKIN : SKIN_SHADE);
    if (front) {
      // Criss-crossed beige bandage wraps matching image_ff598730.png
      const mx = (hx + kx) * 0.5;
      const my = (hy + ky) * 0.5;
      px(ctx, mx - 4, my - 4, 8, 2, WRAP_LIGHT);
      px(ctx, mx - 4, my - 1, 8, 2, WRAP_SHADE);
      px(ctx, mx - 3, my + 2, 7, 2, WRAP_LIGHT);
    } else {
      px(ctx, (hx + kx) / 2 - 3, (hy + ky) / 2 - 2, 7, 2, LEATHER);
      px(ctx, (hx + kx) / 2 - 3, (hy + ky) / 2 + 2, 7, 2, LEATHER);
    }
    // Knee-high dark armored boot
    fillTaperedCurve(ctx, kx, ky, (kx + fx) / 2, (ky + fy) / 2, fx, fy, 4.5, 3, front ? ARMOR_MID : ARMOR_DARK);
    fillOval(ctx, kx + 1, ky, 4.2, 4.2, ARMOR_STEEL);
    px(ctx, kx, ky - 2, 2, 2, '#CBD5E1');
    px(ctx, kx - 2, ky + 3, 5, 1, CRIMSON_BRIGHT);
    // Sleek heeled combat boot anchored to fy
    fillOval(ctx, fx + 3, fy - 1, 6.5, 3, ARMOR_DARK);
    px(ctx, fx + 2, fy - 2, 4, 1, ARMOR_STEEL);
  };

  if (isRun0) {
    drawLunaLeg(cx - 5, 94, cx - 15, 112, cx - 24, footY - 2, false);
    drawLunaLeg(cx + 5, 94, cx + 16, 110, cx + 25, footY - 5, true);
  } else if (isRun1) {
    drawLunaLeg(cx - 3, 95, cx - 4, 114, cx - 6, footY, false);
    drawLunaLeg(cx + 5, 94, cx + 15, 108, cx + 12, footY - 9, true);
  } else if (isRun2) {
    drawLunaLeg(cx + 4, 94, cx + 16, 110, cx + 24, footY - 3, true);
    drawLunaLeg(cx - 5, 94, cx - 14, 112, cx - 22, footY - 2, false);
  } else if (isRun3) {
    drawLunaLeg(cx + 3, 95, cx + 5, 114, cx + 7, footY, true);
    drawLunaLeg(cx - 4, 94, cx - 13, 108, cx - 10, footY - 9, false);
  } else if (isJump) {
    drawLunaLeg(cx - 5, 90, cx - 14, 104, cx - 18, 120, false);
    drawLunaLeg(cx + 6, 90, cx + 14, 103, cx + 18, 119, true);
  } else if (isFall) {
    drawLunaLeg(cx - 5, 93, cx - 10, 110, cx - 12, 128, false);
    drawLunaLeg(cx + 6, 93, cx + 12, 111, cx + 15, 129, true);
  } else if (isDash) {
    drawLunaLeg(cx - 6, 94, cx - 18, 110, cx - 30, 127, false);
    drawLunaLeg(cx + 6, 94, cx + 18, 111, cx + 26, 129, true);
  } else if (pose) {
    // Weight shifts smoothly from back leg (anticipation) to braced front lunge (swing impact)
    const backX = seqIdx <= 1 ? -19 : seqIdx <= 6 ? -26 : -17;
    const frontX = seqIdx <= 1 ? 15 : seqIdx <= 6 ? 27 : 18;
    const kneeBend = Math.round(pose.drop * 0.6);
    drawLunaLeg(cx - 6, 93 + bobY, cx - 14, 112 + kneeBend, cx + backX, footY, false);
    drawLunaLeg(cx + 6, 93 + bobY, cx + 16 + Math.round(pose.lean * 0.4), 111 + kneeBend, cx + frontX, footY, true);
  } else {
    // Combat-ready wide planted stance from image_ff598730.png (feet firmly at y=134)
    drawLunaLeg(cx - 6, 94 + bobY, cx - 14, 113 + bobY * 0.5, cx - 18, footY, false);
    drawLunaLeg(cx + 6, 94 + bobY, cx + 15, 112 + bobY * 0.5, cx + 19, footY, true);
  }

  // 4. Layered Leather/Crimson Combat Bodice, Belt & Battle Tassets
  fillPoly(
    ctx,
    [
      [cx - 9, 61 + bobY],
      [cx + 9, 61 + bobY],
      [cx + 7, 87 + bobY],
      [cx - 7, 87 + bobY],
    ],
    CLOAK_MID
  );
  px(ctx, cx - 7, 64 + bobY, 14, 3, CRIMSON_BRIGHT);
  px(ctx, cx - 6, 70 + bobY, 12, 2, LEATHER);
  px(ctx, cx - 6, 76 + bobY, 12, 2, LEATHER);
  px(ctx, cx - 9, 84 + bobY, 18, 4, LEATHER);
  px(ctx, cx - 2, 84 + bobY, 4, 4, BELT_BUCKLE);
  px(ctx, cx - 11, 86 + bobY, 5, 6, CLOAK_DEEP);
  fillPoly(
    ctx,
    [
      [cx - 9, 87 + bobY],
      [cx + 9, 87 + bobY],
      [cx + 15, 103 + bobY],
      [cx + 4, 98 + bobY],
      [cx - 15, 104 + bobY],
    ],
    CLOAK_DEEP
  );
  linePx(ctx, cx - 14, 102 + bobY, cx + 14, 101 + bobY, 1, CRIMSON_BRIGHT);

  // Engraved Steel Shoulder Pauldron & Collar Scarf
  fillOval(ctx, cx - 9, 61 + bobY, 7, 5, ARMOR_MID);
  fillOval(ctx, cx - 9, 60 + bobY, 5, 3, ARMOR_STEEL);
  px(ctx, cx - 11, 59 + bobY, 3, 2, '#E2E8F0');
  fillOval(ctx, cx, 57 + bobY, 10, 4, CLOAK_DEEP);
  px(ctx, cx - 1, 58 + bobY, 3, 3, CRIMSON_BRIGHT);

  // 5. Pointed Crimson-Lined Assassin Hood & Expressive Face (image_ff598730.png)
  fillOval(ctx, cx - 1, 41 + bobY, 15, 16, CLOAK_MID);
  // Pointed rear hood crest tip
  fillPoly(
    ctx,
    [
      [cx - 10, 26 + bobY],
      [cx - 19, 25 + bobY],
      [cx - 13, 36 + bobY],
    ],
    CLOAK_MID
  );
  fillPoly(
    ctx,
    [
      [cx - 6, 25 + bobY],
      [cx + 8, 27 + bobY],
      [cx - 14, 42 + bobY],
    ],
    CLOAK_HIGHLIGHT
  );
  fillOval(ctx, cx + 2, 43 + bobY, 11, 13, CRIMSON_DARK);
  fillOval(ctx, cx + 3, 44 + bobY, 9, 10, SKIN);
  fillOval(ctx, cx + 4, 50 + bobY, 6, 4, SKIN_SHADE);
  fillTaperedCurve(ctx, cx - 4, 32 + bobY, cx + 2, 37 + bobY, cx + 1, 43 + bobY, 4, 1, HAIR_DARK);
  fillTaperedCurve(ctx, cx + 3, 32 + bobY, cx + 10, 37 + bobY, cx + 11, 49 + bobY, 4, 1, HAIR_MID);
  fillTaperedCurve(ctx, cx - 6, 35 + bobY, cx - 7, 44 + bobY, cx - 5, 54 + bobY, 3, 1, HAIR_DARK);
  // Sharp violet assassin eyes (focused glint during swings)
  px(ctx, cx - 1, 42 + bobY, 4, 3, '#120C1C');
  px(ctx, cx, 43 + bobY, 2, 2, '#A855F7');
  px(ctx, cx + 1, 43 + bobY, 1, 1, '#FFFFFF');
  px(ctx, cx + 6, 42 + bobY, 4, 3, '#120C1C');
  px(ctx, cx + 7, 43 + bobY, 2, 2, '#38BDF8');
  px(ctx, cx + 8, 43 + bobY, 1, 1, '#FFFFFF');
  // Subtle crimson V-trim along hood seams
  fillTaperedCurve(ctx, cx - 11, 35 + bobY, cx, 27 + bobY, cx + 12, 35 + bobY, 2, 1, CRIMSON_BRIGHT);
  linePx(ctx, cx - 7, 29 + bobY, cx - 2, 33 + bobY, 1, CRIMSON_BRIGHT);

  // 6. Two-Handed Combat Grip & Articulated Cosmic Scythe (Idle, Run, Cast, Dash, or 10-Frame Swing)
  if (pose) {
    const gx = cx + pose.gripX;
    const gy = pose.gripY + bobY;
    const ux = Math.cos(pose.scytheAngle);
    const uy = Math.sin(pose.scytheAngle);
    const rearHandX = Math.round(gx - ux * 11);
    const rearHandY = Math.round(gy - uy * 11);
    const leadHandX = Math.round(gx + ux * 9);
    const leadHandY = Math.round(gy + uy * 9);

    // Rear arm reaching to back hand on shaft
    fillTaperedCurve(ctx, cx - 6, 62 + bobY, (cx - 6 + rearHandX) * 0.5, (62 + bobY + rearHandY) * 0.5, rearHandX, rearHandY, 3, 3, ARMOR_DARK);
    // Scythe & swing trail
    if (pose.trailArc) {
      drawSwingEnergyTrail(gx, gy, pose.trailArc.startAng, pose.trailArc.endAng, pose.trailArc.alpha);
    }
    drawCosmicScytheAngled(gx, gy, pose.scytheAngle, pose.headFlip, 24, 48, true);
    // Lead hand + rear hand gripping shaft cleanly
    fillOval(ctx, rearHandX, rearHandY, 3.5, 3.2, LEATHER);
    fillTaperedCurve(ctx, cx + 7, 63 + bobY, (cx + 7 + leadHandX) * 0.5, (63 + bobY + leadHandY) * 0.5, leadHandX, leadHandY, 3, 3, ARMOR_MID);
    fillOval(ctx, leadHandX, leadHandY, 4, 3.5, LEATHER);
    px(ctx, leadHandX - 2, leadHandY - 2, 4, 2, ARMOR_STEEL);
  } else if (isCast) {
    const gx = cx + 12;
    const gy = 58 + bobY;
    drawCosmicScytheAngled(gx, gy, -1.48, 1, 20, 48, true);
    fillOval(ctx, gx + 2, gy - 44, 6, 6, sStyle.bladeCore);
    fillTaperedCurve(ctx, cx + 6, 60 + bobY, cx + 11, 56 + bobY, gx + 2, gy - 8, 3, 3, ARMOR_MID);
    fillOval(ctx, gx + 2, gy - 8, 4, 3.5, LEATHER);
    fillTaperedCurve(ctx, cx - 6, 62 + bobY, cx + 2, 66 + bobY, gx - 2, gy + 10, 3, 3, ARMOR_DARK);
    fillOval(ctx, gx - 2, gy + 10, 3.5, 3, LEATHER);
  } else if (isDash) {
    const gx = cx - 4;
    const gy = 68 + bobY;
    drawCosmicScytheAngled(gx, gy, -2.85, -1, 20, 44, true);
    fillTaperedCurve(ctx, cx - 4, 63 + bobY, cx - 12, 66 + bobY, gx - 10, gy + 2, 3, 3, ARMOR_MID);
    fillOval(ctx, gx - 10, gy + 2, 3.5, 3.5, LEATHER);
  } else {
    // Two-handed combat-ready grip across body (idle & running)
    const gx = cx + 6;
    const gy = 70 + bobY;
    const readyAng = isRunning ? -1.06 : -0.92;
    const ux = Math.cos(readyAng);
    const uy = Math.sin(readyAng);
    const rearHandX = Math.round(gx - ux * 12);
    const rearHandY = Math.round(gy - uy * 12);
    const leadHandX = Math.round(gx + ux * 8);
    const leadHandY = Math.round(gy + uy * 8);

    fillTaperedCurve(ctx, cx - 8, 63 + bobY, cx - 5, 72 + bobY, rearHandX, rearHandY, 3, 3, ARMOR_DARK);
    drawCosmicScytheAngled(gx, gy, readyAng, 1, 24, 46, true);
    fillOval(ctx, rearHandX, rearHandY, 3.5, 3.5, LEATHER);
    fillTaperedCurve(ctx, cx + 7, 63 + bobY, cx + 11, 66 + bobY, leadHandX, leadHandY, 3, 3, ARMOR_MID);
    fillOval(ctx, leadHandX, leadHandY, 4, 3.5, LEATHER);
    px(ctx, leadHandX - 3, leadHandY - 2, 5, 2, ARMOR_STEEL);
  }

  applyPixelRimLight(canvas, sStyle.bladeCore, 0.22);
  applyPixelOutline(canvas, '#0A0814');
  if (hurtFlash) {
    applySoftHurtTint(ctx, canvas.width, canvas.height);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Smooth Dungeon-Slasher Style 112x128 Pixel Art for Velvera (Curved Horns, Flowing Cloak, 4-Frame Run)
 */
export function getVelveraSprite(
  frame: VelveraAnimFrame,
  style: BladeStyleId,
  aura: BladeAuraId,
  hurtFlash = false
): HTMLCanvasElement {
  const key = `velvera_ds_v3:${frame}:${style}:${aura}:${hurtFlash ? '1' : '0'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(112, 128);
  const auraDef = BLADE_AURAS[aura];

  const seqIdx = frame.startsWith('slash_seq_')
    ? Math.max(0, Math.min(9, Number(frame.slice(10)) || 0))
    : -1;
  const isIdle1 = frame === 'idle1';
  const isRun0 = frame === 'run0';
  const isRun1 = frame === 'run1';
  const isRun2 = frame === 'run2';
  const isRun3 = frame === 'run3';
  const isRunning = isRun0 || isRun1 || isRun2 || isRun3;
  const isJump = frame === 'jump';
  const isFall = frame === 'fall';
  const isDash = frame === 'dash';
  const isSlashWindup = seqIdx === 0 || seqIdx === 1;
  const isSlashFollow = seqIdx >= 7;
  const isSlash1 = frame === 'slash1' || seqIdx === 2 || seqIdx === 3;
  const isSlash2 = frame === 'slash2' || seqIdx === 4;
  const isSlash3 = frame === 'slash3' || seqIdx === 5 || seqIdx === 6;
  const isCast = frame === 'cast';

  const bobY = isIdle1
    ? 2
    : isSlashWindup
      ? 3
      : isSlash2 || isSlash3
        ? 1
        : isRun1 || isRun3
          ? 2
          : isRun0 || isRun2
            ? -1
            : isJump
              ? -3
              : isFall
                ? 2
                : 0;
  const leanX = isSlashWindup
    ? -4
    : isRunning || isDash || isSlash1 || isSlash2 || isSlash3
      ? 6
      : isSlashFollow
        ? 2
        : isFall
          ? 2
          : 0;
  const cx = 54 + leanX;

  const HORN_DARK = '#1C1829';
  const HORN_MID = '#3B3156';
  const HORN_RIDGE = '#7A6DA6';
  const HORN_TIP = '#B4A7DB';

  const HAIR_LIGHT = '#F8FAFF';
  const HAIR_MID = '#D5DFF2';
  const HAIR_SHADE = '#92A1BD';

  const SKIN = '#EFE7E4';
  const SKIN_SHADE = '#C9B8BE';
  const EYE_GLOW = '#C084FC';

  const WING_DARK = '#171222';
  const WING_MID = '#2D2145';
  const WING_VEIN = '#6D28D9';
  const WING_RIM = '#C084FC';

  const ARMOR_DARK = '#1A1726';
  const ARMOR_MID = '#312A45';
  const ARMOR_LIGHT = '#4D426E';
  const BRONZE = '#D6B67E';
  const BRONZE_DARK = '#7D6340';

  const BLADE_CORE = auraDef.coreHex;
  const BLADE_GLOW = auraDef.glowHex;
  const BLADE_TRAIL = auraDef.trailHex;

  // 1. Curved Tattered Bat-Demon Wings + Flowing Abyssal Scarf/Cloak
  const wingLift = isJump || isCast || isSlash3 ? -8 : isDash ? 4 : isIdle1 ? 2 : 0;
  fillPoly(
    ctx,
    [
      [cx - 8, 52 + bobY],
      [cx - 34, 34 + bobY + wingLift],
      [cx - 46, 48 + bobY + wingLift],
      [cx - 36, 70 + bobY + wingLift],
      [cx - 24, 64 + bobY],
      [cx - 16, 76 + bobY],
    ],
    WING_DARK
  );
  fillPoly(
    ctx,
    [
      [cx - 10, 53 + bobY],
      [cx - 32, 39 + bobY + wingLift],
      [cx - 40, 50 + bobY + wingLift],
      [cx - 31, 64 + bobY + wingLift],
    ],
    WING_MID
  );
  fillTaperedCurve(ctx, cx - 8, 52 + bobY, cx - 24, 42 + bobY + wingLift, cx - 44, 48 + bobY + wingLift, 2, 1, WING_VEIN);
  fillTaperedCurve(ctx, cx - 10, 55 + bobY, cx - 24, 56 + bobY + wingLift, cx - 35, 68 + bobY + wingLift, 2, 1, WING_RIM);

  // Flowing Rear Scarf/Cloak Ribbon
  const scarfSwing = isRunning || isDash ? -14 : isSlash1 || isSlash3 ? -10 : isIdle1 ? 2 : 0;
  fillPoly(
    ctx,
    [
      [cx - 10, 52 + bobY],
      [cx - 26 + scarfSwing, 76 + bobY],
      [cx - 32 + scarfSwing, 98 + bobY],
      [cx - 18 + scarfSwing, 92 + bobY],
      [cx - 8, 70 + bobY],
    ],
    WING_MID
  );
  fillTaperedCurve(ctx, cx - 10, 53 + bobY, cx - 22 + scarfSwing, 74 + bobY, cx - 31 + scarfSwing, 97 + bobY, 3, 1, WING_VEIN);

  // 2. Smooth Curved Hair Silhouette (back hair)
  const hairTailX = isRunning || isDash ? -9 : 0;
  fillOval(ctx, cx - 3, 39 + bobY, 17, 17, HAIR_SHADE);
  fillTaperedCurve(ctx, cx - 11, 36 + bobY, cx - 19 + hairTailX, 54 + bobY, cx - 24 + hairTailX, 76 + bobY, 8, 2, HAIR_MID);
  fillTaperedCurve(ctx, cx - 6, 40 + bobY, cx - 14 + hairTailX, 58 + bobY, cx - 16 + hairTailX, 79 + bobY, 5, 1, HAIR_LIGHT);

  // 3. Curved Swept Obsidian Horns (bezier curves, zero blocky stairs)
  fillTaperedCurve(ctx, cx - 9, 25 + bobY, cx - 22, 18 + bobY, cx - 27, 4 + bobY, 5, 1, HORN_DARK);
  fillTaperedCurve(ctx, cx - 10, 24 + bobY, cx - 20, 17 + bobY, cx - 25, 6 + bobY, 3, 1, HORN_MID);
  fillTaperedCurve(ctx, cx - 16, 17 + bobY, cx - 21, 11 + bobY, cx - 26, 4 + bobY, 2, 1, HORN_RIDGE);

  fillTaperedCurve(ctx, cx + 8, 25 + bobY, cx + 22, 18 + bobY, cx + 26, 4 + bobY, 5, 1, HORN_DARK);
  fillTaperedCurve(ctx, cx + 8, 24 + bobY, cx + 19, 17 + bobY, cx + 24, 6 + bobY, 3, 1, HORN_MID);
  fillTaperedCurve(ctx, cx + 15, 17 + bobY, cx + 21, 11 + bobY, cx + 25, 4 + bobY, 2, 1, HORN_TIP);

  // Crown Amethyst Gem
  fillOval(ctx, cx + 3, 24 + bobY, 4, 4, '#A855F7');
  px(ctx, cx + 2, 22 + bobY, 2, 2, '#F5E8FF');

  // 4. Sculpted Face, Jawline, Bangs & Glowing Demon Eyes
  fillOval(ctx, cx + 1, 37 + bobY, 12, 12, SKIN);
  fillOval(ctx, cx + 2, 43 + bobY, 9, 5, SKIN_SHADE);
  fillOval(ctx, cx, 38 + bobY, 11, 10, SKIN);
  // Bangs & Cheek Locks
  fillOval(ctx, cx, 26 + bobY, 13, 6, HAIR_LIGHT);
  fillTaperedCurve(ctx, cx - 10, 27 + bobY, cx - 12, 37 + bobY, cx - 10, 48 + bobY, 4, 2, HAIR_LIGHT);
  fillTaperedCurve(ctx, cx + 9, 27 + bobY, cx + 12, 35 + bobY, cx + 10, 45 + bobY, 3, 1, HAIR_MID);
  fillTaperedCurve(ctx, cx - 2, 24 + bobY, cx, 30 + bobY, cx - 1, 34 + bobY, 3, 1, HAIR_MID);
  fillTaperedCurve(ctx, cx + 4, 24 + bobY, cx + 6, 29 + bobY, cx + 6, 33 + bobY, 3, 1, HAIR_LIGHT);
  // Expressive Eyes
  px(ctx, cx - 4, 34 + bobY, 4, 4, '#181024');
  px(ctx, cx - 3, 35 + bobY, 3, 3, EYE_GLOW);
  px(ctx, cx - 2, 35 + bobY, 2, 2, '#FFFFFF');
  px(ctx, cx + 5, 34 + bobY, 4, 4, '#181024');
  px(ctx, cx + 6, 35 + bobY, 3, 3, EYE_GLOW);
  px(ctx, cx + 7, 35 + bobY, 2, 2, '#FFFFFF');

  // 5. Rounded Torso, Pauldrons & Flared Combat Tunic
  fillOval(ctx, cx, 55 + bobY, 14, 9, ARMOR_MID);
  fillOval(ctx, cx - 12, 53 + bobY, 6, 5, ARMOR_LIGHT);
  fillOval(ctx, cx + 12, 53 + bobY, 6, 5, ARMOR_LIGHT);
  px(ctx, cx - 13, 52 + bobY, 3, 2, BRONZE);
  px(ctx, cx + 10, 52 + bobY, 3, 2, BRONZE);

  // Corset waist -> flared battle skirt
  fillPoly(
    ctx,
    [
      [cx - 9, 54 + bobY],
      [cx + 9, 54 + bobY],
      [cx + 7, 75 + bobY],
      [cx - 7, 75 + bobY],
    ],
    ARMOR_DARK
  );
  fillOval(ctx, cx, 67 + bobY, 4, 5, SKIN_SHADE);
  fillOval(ctx, cx, 67 + bobY, 2, 4, SKIN);
  // Bronze Belt & Hip Skirt Flares
  px(ctx, cx - 9, 74 + bobY, 18, 4, BRONZE);
  px(ctx, cx - 2, 73 + bobY, 5, 5, '#A855F7');
  fillPoly(
    ctx,
    [
      [cx - 9, 77 + bobY],
      [cx + 9, 77 + bobY],
      [cx + 15, 91 + bobY],
      [cx - 14, 91 + bobY],
    ],
    ARMOR_MID
  );
  px(ctx, cx - 13, 89 + bobY, 27, 2, BRONZE_DARK);

  // 6. Articulated Legs (Smooth 4-Frame Run, Jump, Fall, Slash stances)
  const drawLeg = (hx: number, hy: number, kx: number, ky: number, fx: number, fy: number, tone: string) => {
    fillTaperedCurve(ctx, hx, hy, (hx + kx) / 2, (hy + ky) / 2, kx, ky, 5, 4, tone);
    fillTaperedCurve(ctx, kx, ky, (kx + fx) / 2, (ky + fy) / 2, fx, fy, 4, 3, ARMOR_DARK);
    fillOval(ctx, fx + 2, fy + 1, 6, 3, ARMOR_LIGHT);
    px(ctx, kx - 3, ky - 1, 7, 3, BRONZE);
  };

  if (isRun0) {
    drawLeg(cx - 4, 84, cx - 10, 100, cx - 18, 115, ARMOR_MID);
    drawLeg(cx + 5, 84, cx + 14, 98, cx + 22, 113, ARMOR_DARK);
  } else if (isRun1) {
    drawLeg(cx - 2, 85, cx - 3, 102, cx - 6, 118, ARMOR_MID);
    drawLeg(cx + 4, 84, cx + 14, 96, cx + 10, 109, ARMOR_DARK);
  } else if (isRun2) {
    drawLeg(cx + 3, 84, cx + 14, 98, cx + 21, 114, ARMOR_MID);
    drawLeg(cx - 4, 84, cx - 12, 100, cx - 20, 115, ARMOR_DARK);
  } else if (isRun3) {
    drawLeg(cx + 2, 85, cx + 4, 102, cx + 6, 118, ARMOR_MID);
    drawLeg(cx - 3, 84, cx - 12, 96, cx - 10, 109, ARMOR_DARK);
  } else if (isJump) {
    drawLeg(cx - 4, 82, cx - 12, 95, cx - 15, 107, ARMOR_MID);
    drawLeg(cx + 5, 82, cx + 12, 94, cx + 16, 108, ARMOR_DARK);
  } else if (isFall) {
    drawLeg(cx - 4, 84, cx - 8, 99, cx - 10, 114, ARMOR_MID);
    drawLeg(cx + 5, 84, cx + 10, 100, cx + 13, 116, ARMOR_DARK);
  } else if (isSlash1 || isSlash3) {
    drawLeg(cx - 6, 84, cx - 14, 100, cx - 20, 116, ARMOR_DARK);
    drawLeg(cx + 6, 84, cx + 15, 99, cx + 21, 116, ARMOR_MID);
  } else {
    drawLeg(cx - 5, 83 + bobY, cx - 6, 100 + bobY, cx - 7, 116, ARMOR_DARK);
    drawLeg(cx + 5, 83 + bobY, cx + 6, 100 + bobY, cx + 7, 116, ARMOR_MID);
  }

  // 7. Curved Dual Blades & Gauntlets
  const drawBlade = (bx: number, by: number, dirX: number, dirY: number, length: number) => {
    const endX = bx + dirX * length;
    const endY = by + dirY * length;
    const midX = (bx + endX) / 2 - dirY * 4;
    const midY = (by + endY) / 2 + dirX * 4;
    fillOval(ctx, bx, by, 4, 4, BRONZE);
    fillTaperedCurve(ctx, bx, by, midX, midY, endX, endY, 4, 1, BLADE_TRAIL);
    fillTaperedCurve(ctx, bx, by, midX, midY, endX, endY, 3, 1, BLADE_GLOW);
    fillTaperedCurve(ctx, bx, by, midX, midY, endX - dirX * 2, endY - dirY * 2, 1, 1, BLADE_CORE);
    if (style === 'amethyst_crescent') {
      fillOval(ctx, midX, midY, 4, 3, BLADE_GLOW);
      px(ctx, midX - 1, midY - 1, 3, 2, BLADE_CORE);
    } else if (style === 'eclipse_edge') {
      linePx(ctx, bx + 2, by, endX, endY - 2, 2, '#F8FAFC');
    }
  };

  if (isSlashWindup) {
    fillTaperedCurve(ctx, cx - 10, 56 + bobY, cx - 19, 51 + bobY, cx - 24, 48 + bobY, 4, 3, BRONZE_DARK);
    drawBlade(cx - 24, 48 + bobY, -0.8, -0.58, 28);
    drawBlade(cx + 12, 62 + bobY, 0.45, 0.72, 24);
  } else if (isSlash1) {
    fillTaperedCurve(ctx, cx + 8, 56, cx + 18, 55, cx + 25, 56, 4, 3, BRONZE);
    drawBlade(cx + 26, 56, 1, -0.18, 32);
    drawBlade(cx - 18, 63, -1, 0.3, 22);
  } else if (isSlash2) {
    fillTaperedCurve(ctx, cx + 8, 53, cx + 17, 49, cx + 24, 48, 4, 3, BRONZE);
    drawBlade(cx + 24, 48, 0.9, -0.58, 32);
    drawBlade(cx + 18, 68, 0.95, 0.35, 28);
  } else if (isSlash3 || isCast) {
    drawBlade(cx + 26, 54, 1, -0.05, 34);
    drawBlade(cx - 22, 54, -1, -0.2, 28);
  } else if (isSlashFollow) {
    drawBlade(cx + 19, 66 + bobY, 0.75, 0.65, 28);
    drawBlade(cx - 17, 64 + bobY, -0.8, 0.55, 24);
  } else if (isDash) {
    drawBlade(cx - 16, 62, -1, 0.14, 30);
    drawBlade(cx - 12, 70, -1, 0.24, 26);
  } else {
    fillTaperedCurve(ctx, cx - 11, 56 + bobY, cx - 16, 61 + bobY, cx - 19, 66 + bobY, 3, 3, BRONZE_DARK);
    drawBlade(cx - 19, 66 + bobY, -0.75, 0.65, 24);
    fillTaperedCurve(ctx, cx + 11, 55 + bobY, cx + 17, 58 + bobY, cx + 21, 61 + bobY, 3, 3, BRONZE);
    drawBlade(cx + 21, 61 + bobY, 0.85, 0.45, 27);
  }

  applyPixelRimLight(canvas, '#E9D5FF', 0.22);
  applyPixelOutline(canvas, '#0A0812');
  if (hurtFlash) {
    applySoftHurtTint(ctx, canvas.width, canvas.height);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Smooth Dungeon-Slasher Style 112x128 Pixel Art for Lyra (Martial Tangan & Kaki)
 */
export function getLyraSprite(
  frame: VelveraAnimFrame,
  auraOverdrive = false,
  hurtFlash = false,
  lyraWeaponId: LyraWeaponId = 'iron_knuckle'
): HTMLCanvasElement {
  const key = `lyra_ds_v3:${frame}:${auraOverdrive ? '1' : '0'}:${hurtFlash ? '1' : '0'}:${lyraWeaponId}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(112, 128);
  const wStyle = LYRA_WEAPON_STYLES[lyraWeaponId] ?? LYRA_WEAPON_STYLES.iron_knuckle;

  const seqIdx = frame.startsWith('slash_seq_')
    ? Math.max(0, Math.min(9, Number(frame.slice(10)) || 0))
    : -1;
  const isIdle1 = frame === 'idle1';
  const isRun0 = frame === 'run0';
  const isRun1 = frame === 'run1';
  const isRun2 = frame === 'run2';
  const isRun3 = frame === 'run3';
  const isRunning = isRun0 || isRun1 || isRun2 || isRun3;
  const isJump = frame === 'jump';
  const isFall = frame === 'fall';
  const isDash = frame === 'dash';
  const isSlashWindup = seqIdx === 0 || seqIdx === 1;
  const isSlash1 = frame === 'slash1' || seqIdx === 2 || seqIdx === 3;
  const isSlash2 = frame === 'slash2' || seqIdx === 4;
  const isSlash3 = frame === 'slash3' || seqIdx === 5 || seqIdx === 6;

  const bobY = isIdle1
    ? 2
    : isSlashWindup
      ? 3
      : isRun1 || isRun3
        ? 2
        : isRun0 || isRun2
          ? -1
          : isJump
            ? -3
            : isFall
              ? 2
              : 0;
  const leanX = isSlashWindup ? -4 : isRunning || isDash || isSlash1 || isSlash2 || isSlash3 ? 6 : 0;
  const cx = 54 + leanX;

  const HAIR_LIGHT = '#FCE7BC';
  const HAIR_MID = '#E2B978';
  const HAIR_SHADE = '#A57E46';
  const RIBBON = '#EFE0C4';
  const SKIN = '#F8E2D4';
  const SKIN_SHADE = '#D6B19C';
  const WRAP_LIGHT = '#F4ECDD';
  const WRAP_SHADE = '#C9B99F';
  const COAT_LIGHT = '#BD383E';
  const COAT_DARK = '#6E1D21';
  const COAT_FUR = '#DEC4A8';
  const BELT_DARK = '#4A382C';
  const BRONZE = wStyle.bootTrim;
  const GAUNTLET_LIGHT = wStyle.gauntletLight;
  const GAUNTLET_DARK = wStyle.gauntletDark;
  const BOOT_LIGHT = wStyle.bootLight;
  const BOOT_DARK = '#2B201C';

  // 1. Flowing Curved Ribbons & Crimson Martial Coat Tails
  const wave = isRunning || isDash || isSlash1 || isSlash2 || isSlash3 ? -10 : isIdle1 ? 2 : 0;
  fillTaperedCurve(ctx, cx - 10, 29 + bobY, cx - 24 + wave, 22 + bobY, cx - 35 + wave, 27 + bobY, 3, 1, RIBBON);
  fillTaperedCurve(ctx, cx - 10, 31 + bobY, cx - 20 + wave, 33 + bobY, cx - 31 + wave, 37 + bobY, 2, 1, HAIR_SHADE);

  fillPoly(
    ctx,
    [
      [cx - 9, 69 + bobY],
      [cx - 24 + wave, 94 + bobY],
      [cx - 12 + wave, 102 + bobY],
      [cx - 2, 82 + bobY],
    ],
    COAT_DARK
  );
  fillPoly(
    ctx,
    [
      [cx + 6, 70 + bobY],
      [cx + 18, 92 + bobY],
      [cx + 8, 96 + bobY],
      [cx + 2, 80 + bobY],
    ],
    COAT_LIGHT
  );
  px(ctx, cx - 23 + wave, 96 + bobY, 13, 4, COAT_FUR);

  // 2. Head & Smooth Blonde Bob
  fillOval(ctx, cx, 34 + bobY, 12, 12, SKIN);
  fillOval(ctx, cx, 24 + bobY, 13, 7, HAIR_MID);
  fillOval(ctx, cx, 22 + bobY, 10, 5, HAIR_LIGHT);
  fillTaperedCurve(ctx, cx - 10, 25 + bobY, cx - 13, 35 + bobY, cx - 11, 44 + bobY, 4, 2, HAIR_MID);
  fillTaperedCurve(ctx, cx + 10, 25 + bobY, cx + 12, 34 + bobY, cx + 11, 41 + bobY, 3, 2, HAIR_MID);
  px(ctx, cx - 3, 33 + bobY, 4, 4, '#2B1F23');
  px(ctx, cx - 2, 33 + bobY, 2, 2, '#FFFFFF');
  px(ctx, cx + 5, 33 + bobY, 4, 4, '#2B1F23');
  px(ctx, cx + 6, 33 + bobY, 2, 2, '#FFFFFF');

  // 3. Athletic Torso, Crimson Martial Jacket & Wrap
  fillPoly(
    ctx,
    [
      [cx - 9, 49 + bobY],
      [cx + 9, 49 + bobY],
      [cx + 7, 71 + bobY],
      [cx - 7, 71 + bobY],
    ],
    SKIN
  );
  fillOval(ctx, cx, 54 + bobY, 9, 5, WRAP_LIGHT);
  px(ctx, cx - 8, 56 + bobY, 16, 2, WRAP_SHADE);
  px(ctx, cx - 9, 69 + bobY, 18, 4, BELT_DARK);
  px(ctx, cx - 2, 69 + bobY, 5, 5, BRONZE);
  fillOval(ctx, cx, 77 + bobY, 10, 5, BOOT_DARK);

  const drawAuraBlob = (ax: number, ay: number, r: number) => {
    fillOval(ctx, ax, ay, r, r, wStyle.auraHex);
    fillOval(ctx, ax, ay, Math.max(2, r - 3), Math.max(2, r - 3), '#F97316');
    fillOval(ctx, ax, ay, 2, 2, '#FEF08A');
  };

  // 4. Articulated Martial Legs (Dynamic High Kicks & Smooth 4-Frame Run)
  const drawMartialLeg = (hx: number, hy: number, kx: number, ky: number, fx: number, fy: number) => {
    fillTaperedCurve(ctx, hx, hy, (hx + kx) / 2, (hy + ky) / 2, kx, ky, 4, 4, SKIN);
    fillTaperedCurve(ctx, kx, ky, (kx + fx) / 2, (ky + fy) / 2, fx, fy, 4, 3, BOOT_LIGHT);
    px(ctx, kx - 3, ky + 1, 7, 3, BRONZE);
    fillOval(ctx, fx + 2, fy + 1, 6, 3, BOOT_DARK);
    if (auraOverdrive) drawAuraBlob(fx, fy, 5);
  };

  if (isSlash2) {
    drawMartialLeg(cx - 5, 81, cx - 6, 99, cx - 7, 116);
    // High crescent kick
    fillTaperedCurve(ctx, cx + 4, 79, cx + 22, 66, cx + 38, 53, 5, 4, SKIN);
    fillTaperedCurve(ctx, cx + 22, 66, cx + 32, 58, cx + 41, 51, 5, 4, BOOT_LIGHT);
    drawAuraBlob(cx + 42, 51, 9);
  } else if (isSlash3) {
    drawMartialLeg(cx - 5, 81, cx - 12, 98, cx - 16, 114);
    fillTaperedCurve(ctx, cx + 5, 79, cx + 22, 70, cx + 38, 61, 5, 4, BOOT_LIGHT);
    drawAuraBlob(cx + 40, 61, 10);
  } else if (isRun0) {
    drawMartialLeg(cx - 4, 80, cx - 12, 98, cx - 20, 115);
    drawMartialLeg(cx + 5, 80, cx + 14, 96, cx + 22, 112);
  } else if (isRun1) {
    drawMartialLeg(cx - 2, 81, cx - 3, 99, cx - 6, 117);
    drawMartialLeg(cx + 4, 80, cx + 14, 93, cx + 10, 107);
  } else if (isRun2) {
    drawMartialLeg(cx + 4, 80, cx + 14, 97, cx + 22, 114);
    drawMartialLeg(cx - 4, 80, cx - 12, 98, cx - 20, 115);
  } else if (isRun3) {
    drawMartialLeg(cx + 2, 81, cx + 4, 99, cx + 6, 117);
    drawMartialLeg(cx - 3, 80, cx - 12, 93, cx - 10, 107);
  } else if (isJump) {
    drawMartialLeg(cx - 4, 78, cx - 10, 92, cx - 13, 104);
    drawMartialLeg(cx + 5, 78, cx + 11, 94, cx + 15, 106);
  } else {
    drawMartialLeg(cx - 5, 80 + bobY, cx - 7, 98 + bobY, cx - 8, 116);
    drawMartialLeg(cx + 5, 80 + bobY, cx + 7, 98 + bobY, cx + 8, 116);
  }

  // 5. Martial Gauntlets
  const drawGauntlet = (gx: number, gy: number, r: number, glow: boolean) => {
    fillOval(ctx, gx, gy, r + 1, r, GAUNTLET_DARK);
    fillOval(ctx, gx, gy - 1, Math.max(3, r - 1), Math.max(3, r - 2), GAUNTLET_LIGHT);
    px(ctx, gx + 1, gy - 2, 3, 2, '#FFFFFF');
    if (glow) drawAuraBlob(gx + 3, gy, 7);
  };

  if (isSlash1) {
    fillTaperedCurve(ctx, cx + 6, 53, cx + 18, 52, cx + 28, 51, 3, 3, SKIN);
    drawGauntlet(cx + 31, 51, 7, true);
    drawGauntlet(cx - 15, 58, 5, auraOverdrive);
  } else if (isSlash2) {
    drawGauntlet(cx - 14, 51, 6, auraOverdrive);
    drawGauntlet(cx + 12, 49, 6, auraOverdrive);
  } else if (isSlash3) {
    drawGauntlet(cx + 23, 53, 7, true);
    drawGauntlet(cx - 16, 56, 6, true);
  } else if (isDash) {
    drawGauntlet(cx - 18, 58, 6, true);
    drawGauntlet(cx - 10, 64, 5, auraOverdrive);
  } else {
    drawGauntlet(cx - 14, 57 + bobY, 6, auraOverdrive);
    drawGauntlet(cx + 15, 54 + bobY, 6, auraOverdrive);
  }

  applyPixelRimLight(canvas, '#FDBA74', 0.22);
  applyPixelOutline(canvas, '#140E13');
  if (hurtFlash) {
    applySoftHurtTint(ctx, canvas.width, canvas.height);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Character 3: Seraphina (Astral Raven Witch) — Inspired by Image 1 (Big Hat w/ Star Charm,
 * Silver Wavy Hair, Flowing Purple Cloak, Dark Dress, Raven Perched on Glowing Lantern Staff)
 */
export function getWitchSprite(
  frame: VelveraAnimFrame,
  witchWeaponId: WitchWeaponId = 'raven_gnarled_staff',
  hurtFlash = false
): HTMLCanvasElement {
  const key = `witch_ds_v3:${frame}:${witchWeaponId}:${hurtFlash ? '1' : '0'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(116, 132);
  const wStyle = WITCH_WEAPON_STYLES[witchWeaponId] ?? WITCH_WEAPON_STYLES.raven_gnarled_staff;

  const seqIdx = frame.startsWith('slash_seq_')
    ? Math.max(0, Math.min(9, Number(frame.slice(10)) || 0))
    : -1;
  const isIdle1 = frame === 'idle1';
  const isRun0 = frame === 'run0';
  const isRun1 = frame === 'run1';
  const isRun2 = frame === 'run2';
  const isRun3 = frame === 'run3';
  const isRunning = isRun0 || isRun1 || isRun2 || isRun3;
  const isJump = frame === 'jump';
  const isFall = frame === 'fall';
  const isDash = frame === 'dash';
  const isAttackWindup = seqIdx === 0 || seqIdx === 1;
  const isAttack =
    frame === 'slash1' ||
    frame === 'slash2' ||
    frame === 'slash3' ||
    frame === 'cast' ||
    (seqIdx >= 2 && seqIdx <= 7);

  const bobY = isIdle1 ? 2 : isAttackWindup ? -2 : isRun1 || isRun3 ? 2 : isRun0 || isRun2 ? -1 : isJump ? -3 : isFall ? 2 : 0;
  const leanX = isAttackWindup ? -3 : isRunning || isDash || isAttack ? 5 : 0;
  const cx = 56 + leanX;

  const HAIR_LIGHT = '#F1F5FF';
  const HAIR_MID = '#CBD5E8';
  const HAIR_SHADE = '#8C9AB8';
  const SKIN = '#F5DFD7';
  const SKIN_SHADE = '#CEADA6';
  const CLOAK_DARK = '#1C162E';
  const CLOAK_PURPLE = '#7E22CE';
  const CLOAK_GLOW = '#A855F7';
  const DRESS_DARK = '#12101D';
  const DRESS_MID = '#251F3B';
  const SLEEVE_CREAM = '#EAE0DA';
  const HAT_DARK = '#1D182C';
  const HAT_MID = '#4C1D95';
  const HAT_TRIM = '#C084FC';
  const GOLD = '#D6B67E';

  // 1. Wide Flowing Starry Purple Cloak behind character
  const cloakSway = isRunning || isDash ? -14 : isAttack ? -8 : isIdle1 ? 2 : 0;
  fillPoly(
    ctx,
    [
      [cx - 10, 52 + bobY],
      [cx - 34 + cloakSway, 96 + bobY],
      [cx - 24 + cloakSway, 112 + bobY],
      [cx + 12, 108 + bobY],
      [cx + 14, 72 + bobY],
    ],
    CLOAK_DARK
  );
  fillPoly(
    ctx,
    [
      [cx - 12, 58 + bobY],
      [cx - 28 + cloakSway, 94 + bobY],
      [cx - 16 + cloakSway, 104 + bobY],
      [cx + 4, 96 + bobY],
    ],
    CLOAK_PURPLE
  );
  // Gold Star Tassel at cloak corner
  px(ctx, cx - 28 + cloakSway, 108 + bobY, 5, 5, GOLD);
  px(ctx, cx - 22 + cloakSway, 88 + bobY, 2, 2, '#FEF08A');

  // 2. Wavy Cascading Silver Hair
  fillTaperedCurve(ctx, cx - 8, 34 + bobY, cx - 24 + cloakSway * 0.5, 56 + bobY, cx - 30 + cloakSway * 0.6, 84 + bobY, 8, 2, HAIR_SHADE);
  fillTaperedCurve(ctx, cx - 5, 36 + bobY, cx - 18 + cloakSway * 0.4, 58 + bobY, cx - 22 + cloakSway * 0.5, 86 + bobY, 6, 2, HAIR_MID);
  fillTaperedCurve(ctx, cx - 2, 38 + bobY, cx - 12 + cloakSway * 0.3, 60 + bobY, cx - 15 + cloakSway * 0.3, 82 + bobY, 4, 1, HAIR_LIGHT);

  // 3. Long Fitted Dark Skirt, Lace Hem & Heeled Witch Boots
  fillPoly(
    ctx,
    [
      [cx - 8, 71 + bobY],
      [cx + 8, 71 + bobY],
      [cx + 12, 105 + bobY],
      [cx - 11, 105 + bobY],
    ],
    DRESS_DARK
  );
  fillPoly(
    ctx,
    [
      [cx - 5, 73 + bobY],
      [cx + 5, 73 + bobY],
      [cx + 7, 102 + bobY],
      [cx - 6, 102 + bobY],
    ],
    DRESS_MID
  );
  // White ruffled skirt petticoat hem
  px(ctx, cx - 11, 104 + bobY, 22, 4, SLEEVE_CREAM);

  // Boots peeking cleanly underneath
  const stepL = isRun0 || isRun1 ? -5 : isRun2 || isRun3 ? 5 : 0;
  const stepR = -stepL;
  const footBaseY = isJump ? 116 : 122;
  fillTaperedCurve(ctx, cx - 4, 105 + bobY, cx - 5 + stepL, 114 + bobY, cx - 6 + stepL, footBaseY - 1, 3, 2, DRESS_DARK);
  fillOval(ctx, cx - 4 + stepL, footBaseY, 5, 2, '#332C4A');
  fillTaperedCurve(ctx, cx + 4, 105 + bobY, cx + 5 + stepR, 114 + bobY, cx + 6 + stepR, footBaseY - 1, 3, 2, DRESS_DARK);
  fillOval(ctx, cx + 7 + stepR, footBaseY, 5, 2, '#332C4A');

  // 4. Cream Puff Sleeves, Gold-Laced Corset & Head
  fillOval(ctx, cx, 59 + bobY, 8, 11, DRESS_DARK);
  px(ctx, cx - 2, 54 + bobY, 4, 14, GOLD); // corset lacing
  fillOval(ctx, cx - 9, 55 + bobY, 5, 5, SLEEVE_CREAM);
  fillOval(ctx, cx + 10, 55 + bobY, 5, 5, SLEEVE_CREAM);

  fillOval(ctx, cx, 36 + bobY, 10, 11, SKIN);
  fillOval(ctx, cx, 42 + bobY, 7, 4, SKIN_SHADE);
  px(ctx, cx - 4, 34 + bobY, 3, 4, '#2E1065');
  px(ctx, cx - 3, 35 + bobY, 2, 2, '#E879F9');
  px(ctx, cx + 4, 34 + bobY, 3, 4, '#2E1065');
  px(ctx, cx + 5, 35 + bobY, 2, 2, '#E879F9');

  // 5. Iconic Large Witch Hat with Purple Ruffle Rim & Gold Star Charm
  fillOval(ctx, cx + 1, 25 + bobY, 22, 6, HAT_MID);
  fillOval(ctx, cx + 1, 23 + bobY, 20, 5, HAT_DARK);
  fillPoly(
    ctx,
    [
      [cx - 12, 22 + bobY],
      [cx + 12, 22 + bobY],
      [cx + 4, 7 + bobY],
      [cx - 10, 4 + bobY],
    ],
    HAT_DARK
  );
  fillTaperedCurve(ctx, cx - 3, 13 + bobY, cx - 10, 7 + bobY, cx - 16, 12 + bobY, 5, 1, HAT_MID);
  px(ctx, cx - 11, 20 + bobY, 22, 3, HAT_TRIM); // purple ribbon band
  // Hanging Gold Star Charm off hat tip
  linePx(ctx, cx - 16, 12 + bobY, cx - 16, 20 + bobY, 1, GOLD);
  px(ctx, cx - 18, 20 + bobY, 5, 5, '#FACC15');

  // 6. Gnarled Raven Lantern Staff (skinned per WitchWeaponId!)
  const staffTilt = isAttack ? 18 : 6;
  const staffTopX = cx + 18 + staffTilt * 0.4;
  const staffTopY = (isAttack ? 24 : 20) + bobY;
  const staffBotX = cx + 12 - staffTilt * 0.2;
  const staffBotY = 114 + bobY;

  fillTaperedCurve(
    ctx,
    staffBotX,
    staffBotY,
    cx + 17 + staffTilt * 0.2,
    68 + bobY,
    staffTopX,
    staffTopY,
    2,
    3,
    wStyle.staffWood
  );
  // Floating Arcane Ribbon from Staff
  fillTaperedCurve(
    ctx,
    staffTopX,
    staffTopY + 4,
    staffTopX - 10,
    staffTopY + 18,
    staffTopX - 16,
    staffTopY + 34,
    2,
    1,
    wStyle.ribbonHex
  );
  // Hanging Glowing Purple Lantern on Staff
  const lanternX = staffTopX - 6;
  const lanternY = staffTopY + 12;
  px(ctx, lanternX - 3, lanternY - 3, 7, 9, GOLD);
  fillOval(ctx, lanternX, lanternY + 1, 3, 4, wStyle.lanternGlow);
  px(ctx, lanternX - 1, lanternY, 2, 3, '#FFFFFF');
  // Perched Black Raven on Staff Top!
  fillOval(ctx, staffTopX + 1, staffTopY - 4, 6, 4, '#111827');
  fillPoly(
    ctx,
    [
      [staffTopX - 1, staffTopY - 5],
      [staffTopX - 9, staffTopY - 12],
      [staffTopX - 2, staffTopY - 10],
      [staffTopX + 4, staffTopY - 4],
    ],
    '#1F2937'
  );
  px(ctx, staffTopX + 5, staffTopY - 6, 4, 2, '#94A3B8'); // beak
  px(ctx, staffTopX + 3, staffTopY - 6, 2, 2, '#FACC15'); // raven eye

  // Casting / Arcane Flash
  if (isAttack) {
    fillOval(ctx, staffTopX + 8, staffTopY + 4, 8, 8, CLOAK_GLOW);
    fillOval(ctx, staffTopX + 8, staffTopY + 4, 4, 4, '#FEF08A');
  }

  applyPixelRimLight(canvas, '#DDD6FE', 0.22);
  applyPixelOutline(canvas, '#100C18');
  if (hurtFlash) {
    applySoftHurtTint(ctx, canvas.width, canvas.height);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * High-Detail Monster & 2x Boss Sprites.
 */
export function getMonsterSprite(
  type: MonsterType | 'boss',
  frame: 0 | 1,
  stage = 1,
  hurtFlash = false,
  pose: EnemyAnimPose = 'walk'
): HTMLCanvasElement {
  const key = `monster_ds_v4:${type}:${frame}:${pose}:${type === 'boss' ? stage : 0}:${hurtFlash ? '1' : '0'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  let w = 68;
  let h = 74;
  if (type === 'skeleton') {
    w = 64;
    h = 84;
  } else if (type === 'kelalawar') {
    w = 80;
    h = 60;
  } else if (type === 'zombie_knight') {
    w = 92;
    h = 102;
  } else if (type === 'boss') {
    w = 156;
    h = 184;
  }

  const [canvas, ctx] = makeOffscreen(w, h);
  const dy = pose === 'windup' ? -2 : pose === 'attack' ? 2 : frame === 1 ? 2 : 0;
  const stride = pose === 'windup' ? -5 : pose === 'attack' ? 6 : frame === 1 ? 4 : -3;
  const OUTLINE = '#0B0A12';

  if (type === 'goblin') {
    // Hunched Goblin Raider: leather skullcap, ragged fur collar, notched cleaver & windup/attack poses
    fillPoly(
      ctx,
      [
        [18, 43 + dy],
        [8 - stride * 0.5, 57 + dy],
        [20, 59 + dy],
      ],
      '#3F2312'
    );
    fillPoly(ctx, [[19, 27 + dy], [3, 19 + dy], [9, 29 + dy], [18, 31 + dy]], '#3F6212');
    fillPoly(ctx, [[45, 27 + dy], [61, 19 + dy], [55, 29 + dy], [46, 31 + dy]], '#4D7C0F');
    fillOval(ctx, 32, 30 + dy, 15, 11, '#65A30D');
    fillOval(ctx, 31, 25 + dy, 12, 6, '#4D7C0F');
    fillPoly(ctx, [[19, 25 + dy], [32, 14 + dy], [44, 24 + dy], [39, 26 + dy], [22, 26 + dy]], '#5C3A21');
    px(ctx, 29, 17 + dy, 5, 3, '#A8A29E');
    fillOval(ctx, 26, 29 + dy, 3.2, 3, '#FACC15');
    fillOval(ctx, 40, 29 + dy, 3.2, 3, '#FACC15');
    px(ctx, 26, 28 + dy, 2, 2, pose === 'windup' ? '#FFFFFF' : '#DC2626');
    px(ctx, 40, 28 + dy, 2, 2, pose === 'windup' ? '#FFFFFF' : '#DC2626');
    fillOval(ctx, 33, 37 + dy, 8, 2.5, '#1A2E05');
    px(ctx, 27, 35 + dy, 3, 4, '#F8FAFC');
    px(ctx, 36, 35 + dy, 3, 4, '#F8FAFC');
    fillPoly(ctx, [[18, 40 + dy], [46, 40 + dy], [48, 59 + dy], [18, 59 + dy]], '#5C2B13');
    fillOval(ctx, 32, 41 + dy, 14, 4, '#78716C');
    fillOval(ctx, 33, 49 + dy, 11, 7, '#9A3412');
    fillTaperedCurve(ctx, 19, 53 + dy, 33, 56 + dy, 47, 53 + dy, 2, 2, '#D6B67E');
    fillOval(ctx, 33, 54 + dy, 3, 3, '#FACC15');
    fillTaperedCurve(ctx, 24, 58, 21 - stride, 65, 19 - stride, 72, 4.5, 3, '#3F6212');
    fillTaperedCurve(ctx, 41, 58 - dy * 0.5, 43 + stride, 65 - dy * 0.5, 45 + stride, 72, 4.5, 3, '#4D7C0F');
    const cleaverY = pose === 'windup' ? -15 : pose === 'attack' ? 8 : -stride * 0.4;
    const cleaverX = pose === 'attack' ? 5 : pose === 'windup' ? -5 : 0;
    fillPoly(
      ctx,
      [
        [45 + cleaverX, 43 + dy + cleaverY],
        [65 + cleaverX, 36 + dy + cleaverY],
        [62 + cleaverX, 45 + dy + cleaverY],
        [56 + cleaverX, 44 + dy + cleaverY],
        [53 + cleaverX, 48 + dy + cleaverY],
        [45 + cleaverX, 49 + dy + cleaverY],
      ],
      '#94A3B8'
    );
    linePx(ctx, 47 + cleaverX, 44 + dy + cleaverY, 63 + cleaverX, 38 + dy + cleaverY, 1, '#F8FAFC');
    px(ctx, 43 + cleaverX, 41 + dy + cleaverY, 4, 10, '#451A03');
  } else if (type === 'skeleton') {
    fillPoly(
      ctx,
      [
        [20, 32 + dy],
        [6 - stride * 0.5, 64 + dy],
        [18, 61 + dy],
        [28, 65 + dy],
      ],
      '#2E1065'
    );
    fillOval(ctx, 32, 20 + dy, 13, 11, '#E2E8F0');
    fillOval(ctx, 31, 15 + dy, 9, 5, '#F8FAFC');
    fillTaperedCurve(ctx, 20, 17 + dy, 32, 13 + dy, 44, 17 + dy, 2, 2, '#475569');
    fillOval(ctx, 26, 20 + dy, 3.2, 3.2, '#0F172A');
    fillOval(ctx, 38, 20 + dy, 3.2, 3.2, '#0F172A');
    px(ctx, 25, 19 + dy, 2, 2, '#F43F5E');
    px(ctx, 37, 19 + dy, 2, 2, '#F43F5E');
    fillPoly(ctx, [[24, 27 + dy], [40, 27 + dy], [37, 32 + dy], [27, 32 + dy]], '#94A3B8');
    fillPoly(ctx, [[19, 33 + dy], [45, 33 + dy], [48, 60 + dy], [16, 60 + dy]], '#4C1D95');
    fillOval(ctx, 20, 35 + dy, 6, 4, '#475569');
    fillOval(ctx, 44, 35 + dy, 6, 4, '#475569');
    fillTaperedCurve(ctx, 32, 34 + dy, 32, 46 + dy, 32, 57 + dy, 3, 2, '#CBD5E1');
    fillTaperedCurve(ctx, 23, 38 + dy, 32, 40 + dy, 41, 38 + dy, 2, 2, '#F8FAFC');
    fillTaperedCurve(ctx, 23, 44 + dy, 32, 46 + dy, 41, 44 + dy, 2, 2, '#E2E8F0');
    fillTaperedCurve(ctx, 25, 50 + dy, 32, 52 + dy, 39, 50 + dy, 2, 2, '#CBD5E1');
    fillOval(ctx, 32, 44 + dy, 3, 4, '#F43F5E');
    fillTaperedCurve(ctx, 25, 60, 23 - stride * 0.7, 71, 22 - stride * 0.8, 81, 3, 3, '#CBD5E1');
    fillTaperedCurve(ctx, 39, 60 - dy * 0.5, 40 + stride * 0.7, 71 - dy * 0.5, 41 + stride * 0.8, 81, 3, 3, '#CBD5E1');
    const bowBend = pose === 'windup' ? 5 : 0;
    fillTaperedCurve(ctx, 47, 24 + dy, 58 + bowBend, 44 + dy, 47, 64 + dy, 3.5, 3.5, '#C4A472');
    linePx(ctx, 46 - (pose === 'windup' ? 5 : 0), 44 + dy, 46, 27 + dy, 1, '#94A3B8');
    linePx(ctx, 46 - (pose === 'windup' ? 5 : 0), 44 + dy, 46, 61 + dy, 1, '#94A3B8');
    if (pose !== 'attack') {
      linePx(ctx, pose === 'windup' ? 35 : 41, 44 + dy, 60, 44 + dy, 2, '#F8FAFC');
      fillPoly(ctx, [[56, 40 + dy], [64, 44 + dy], [56, 48 + dy]], pose === 'windup' ? '#FB7185' : '#F43F5E');
    }
  } else if (type === 'kelalawar') {
    const wingY = pose === 'windup' ? 2 : pose === 'attack' ? 31 : frame === 0 ? 5 : 26;
    const wingTipY = pose === 'windup' ? 10 : pose === 'attack' ? 42 : frame === 0 ? 18 : 38;
    fillPoly(
      ctx,
      [
        [30, 26],
        [2, wingY],
        [7, wingTipY],
        [15, wingTipY - 4],
        [20, wingTipY + 4],
        [29, 36],
      ],
      '#1F1633'
    );
    fillPoly(
      ctx,
      [
        [50, 26],
        [78, wingY],
        [73, wingTipY],
        [65, wingTipY - 4],
        [60, wingTipY + 4],
        [51, 36],
      ],
      '#1F1633'
    );
    fillTaperedCurve(ctx, 29, 26, 15, wingY + 5, 4, wingY + 2, 2, 1, pose === 'windup' ? '#F43F5E' : '#A855F7');
    fillTaperedCurve(ctx, 51, 26, 65, wingY + 5, 76, wingY + 2, 2, 1, pose === 'windup' ? '#F43F5E' : '#A855F7');
    fillOval(ctx, 40, 32, 14, 15, '#2E2244');
    fillOval(ctx, 40, 27, 9, 6, '#581C87');
    fillTaperedCurve(ctx, 30, 19, 28, 11, 26, 5, 3, 1, '#1E1B2E');
    fillTaperedCurve(ctx, 50, 19, 52, 11, 54, 5, 3, 1, '#1E1B2E');
    fillOval(ctx, 34, 28, pose === 'windup' ? 4.5 : 3.5, 3.2, '#F43F5E');
    px(ctx, 34, 27, 2, 2, '#FFE4E6');
    fillOval(ctx, 46, 28, pose === 'windup' ? 4.5 : 3.5, 3.2, '#F43F5E');
    px(ctx, 46, 27, 2, 2, '#FFE4E6');
    px(ctx, 35, 37, 3, 6, '#F8FAFC');
    px(ctx, 42, 37, 3, 6, '#F8FAFC');
  } else if (type === 'zombie_knight') {
    // Complete Dark-Fantasy Redesign: Cracked Rusted Heavy Plate Armor, Tattered Shroud Cape, Horned Undead Helm & Rusted Dark-Energy Greatsword
    const cx = 44 + (pose === 'attack' ? 6 : pose === 'windup' ? -4 : 0);
    const footY = 98;
    const bodyY = dy + (pose === 'windup' ? -3 : pose === 'attack' ? 3 : 0);

    // 1. Tattered Shredded Battle Cape (wind-swept trailing behind)
    fillPoly(
      ctx,
      [
        [cx - 12, 39 + bodyY],
        [cx - 34 - stride * 0.5, 62 + bodyY],
        [cx - 30 - stride * 0.4, 84 + bodyY],
        [cx - 21, 76 + bodyY],
        [cx - 12, 85 + bodyY],
        [cx + 6, 75 + bodyY],
        [cx + 12, 41 + bodyY],
      ],
      '#181224'
    );
    fillPoly(
      ctx,
      [
        [cx - 12, 44 + bodyY],
        [cx - 28 - stride * 0.4, 65 + bodyY],
        [cx - 24, 79 + bodyY],
        [cx - 6, 72 + bodyY],
      ],
      '#31163F'
    );

    // 2. Heavy Armored Greaves & Sabatons grounded cleanly at footY=98
    fillTaperedCurve(ctx, cx - 10, 70 + bodyY, cx - 13 - stride, 84, cx - 14 - stride, footY, 6, 5, '#1E293B');
    fillOval(ctx, cx - 12 - stride, footY - 2, 7, 3.5, '#334155');
    px(ctx, cx - 14 - stride, 80, 5, 3, '#7C2D12'); // rust patina
    fillTaperedCurve(ctx, cx + 9, 70 + bodyY, cx + 11 + stride, 84, cx + 13 + stride, footY, 6, 5, '#334155');
    fillOval(ctx, cx + 15 + stride, footY - 2, 7, 3.5, '#475569');
    px(ctx, cx + 10 + stride, 79, 5, 4, '#64748B');

    // 3. Rusted Cracked Dark-Iron Cuirass & Tassets with Glowing Necrotic Core Fissure
    fillPoly(
      ctx,
      [
        [cx - 18, 39 + bodyY],
        [cx + 18, 39 + bodyY],
        [cx + 14, 70 + bodyY],
        [cx - 14, 70 + bodyY],
      ],
      '#1E293B'
    );
    fillOval(ctx, cx, 50 + bodyY, 15, 11, '#334155');
    // Rust & battle fracture scars across chestplate
    linePx(ctx, cx - 10, 44 + bodyY, cx + 5, 59 + bodyY, 2, '#7C2D12');
    linePx(ctx, cx + 8, 42 + bodyY, cx - 4, 62 + bodyY, 1, '#0F172A');
    px(ctx, cx - 14, 65 + bodyY, 28, 5, '#451A03'); // rusted belt
    px(ctx, cx - 3, 64 + bodyY, 6, 6, '#B45309');
    // Glowing cursed soul crack in center plate
    fillPoly(
      ctx,
      [
        [cx, 43 + bodyY],
        [cx + 5, 50 + bodyY],
        [cx, 58 + bodyY],
        [cx - 5, 50 + bodyY],
      ],
      '#A855F7'
    );
    px(ctx, cx - 1, 47 + bodyY, 2, 7, '#F5D0FE');

    // Layered Tattered Faulds & Knee Plates
    fillPoly(ctx, [[cx - 15, 69 + bodyY], [cx - 3, 69 + bodyY], [cx - 5, 79 + bodyY], [cx - 17, 77 + bodyY]], '#273142');
    fillPoly(ctx, [[cx + 3, 69 + bodyY], [cx + 15, 69 + bodyY], [cx + 17, 77 + bodyY], [cx + 5, 79 + bodyY]], '#334155');

    // 4. Horned Undead Knight Greathelm & Glowing Slit Visor Eyes
    fillOval(ctx, cx, 23 + bodyY, 14, 14, '#334155');
    fillOval(ctx, cx, 17 + bodyY, 10, 5, '#64748B');
    // Jagged rusted war horns
    fillTaperedCurve(ctx, cx - 11, 17 + bodyY, cx - 22, 10 + bodyY, cx - 24, 2 + bodyY, 4.5, 1.5, '#94A3B8');
    fillTaperedCurve(ctx, cx + 11, 17 + bodyY, cx + 22, 10 + bodyY, cx + 24, 2 + bodyY, 4.5, 1.5, '#94A3B8');
    px(ctx, cx - 18, 8 + bodyY, 3, 3, '#7C2D12');
    // Visor grill & blazing undead eyes
    fillPoly(ctx, [[cx - 10, 23 + bodyY], [cx + 10, 23 + bodyY], [cx + 7, 32 + bodyY], [cx - 7, 32 + bodyY]], '#0F172A');
    px(ctx, cx - 7, 25 + bodyY, 5, 2.5, pose === 'windup' ? '#F43F5E' : '#84CC16');
    px(ctx, cx + 2, 25 + bodyY, 5, 2.5, pose === 'windup' ? '#F43F5E' : '#84CC16');
    px(ctx, cx - 5, 29 + bodyY, 10, 1.5, '#475569');

    // Spiked Weathered Pauldrons
    fillOval(ctx, cx - 18, 41 + bodyY, 10, 7, '#475569');
    fillPoly(ctx, [[cx - 25, 38 + bodyY], [cx - 22, 27 + bodyY], [cx - 15, 37 + bodyY]], '#94A3B8');
    fillOval(ctx, cx + 18, 41 + bodyY, 10, 7, '#475569');
    fillPoly(ctx, [[cx + 15, 37 + bodyY], [cx + 22, 27 + bodyY], [cx + 25, 38 + bodyY]], '#94A3B8');

    // 5. Cracked Runic Tower Shield (left arm)
    fillPoly(
      ctx,
      [
        [cx - 32, 41 + bodyY],
        [cx - 15, 41 + bodyY],
        [cx - 17, 68 + bodyY],
        [cx - 24, 78 + bodyY],
        [cx - 31, 68 + bodyY],
      ],
      '#1E293B'
    );
    fillPoly(
      ctx,
      [
        [cx - 29, 44 + bodyY],
        [cx - 18, 44 + bodyY],
        [cx - 20, 65 + bodyY],
        [cx - 24, 72 + bodyY],
        [cx - 28, 65 + bodyY],
      ],
      '#3B0764'
    );
    px(ctx, cx - 25, 49 + bodyY, 3, 15, '#C084FC');
    px(ctx, cx - 28, 54 + bodyY, 9, 2, '#94A3B8');

    // 6. Rusted Dark-Energy Greatsword (Walk = shouldered, Windup = raised high overhead, Attack = fierce forward cleave!)
    if (pose === 'windup') {
      // Raised high overhead ready to cleave down
      linePx(ctx, cx + 16, 42 + bodyY, cx + 6, 18 + bodyY, 4, '#78350F');
      fillPoly(
        ctx,
        [
          [cx + 6, 18 + bodyY],
          [cx - 14, 3 + bodyY],
          [cx - 24, 8 + bodyY],
          [cx - 17, 17 + bodyY],
          [cx + 2, 24 + bodyY],
        ],
        '#94A3B8'
      );
      linePx(ctx, cx + 3, 19 + bodyY, cx - 18, 7 + bodyY, 2, '#C084FC');
      fillOval(ctx, cx + 7, 20 + bodyY, 6, 3, '#B45309');
    } else if (pose === 'attack') {
      // Heavy horizontal forward cleave + dark necrotic edge
      fillOval(ctx, cx + 22, 54 + bodyY, 7, 3, '#B45309');
      fillPoly(
        ctx,
        [
          [cx + 24, 50 + bodyY],
          [cx + 46, 52 + bodyY],
          [cx + 43, 60 + bodyY],
          [cx + 22, 58 + bodyY],
        ],
        '#94A3B8'
      );
      linePx(ctx, cx + 24, 54 + bodyY, cx + 45, 55 + bodyY, 2, '#A855F7');
      px(ctx, cx + 32, 51 + bodyY, 5, 3, '#7C2D12');
    } else {
      const tipLean = frame === 1 ? 4 : 0;
      fillPoly(
        ctx,
        [
          [cx + 22 + tipLean, 16 + bodyY],
          [cx + 27 + tipLean, 8 + bodyY],
          [cx + 32 + tipLean, 16 + bodyY],
          [cx + 29, 59 + bodyY],
          [cx + 20, 59 + bodyY],
        ],
        '#94A3B8'
      );
      px(ctx, cx + 22, 34 + bodyY, 5, 4, '#7C2D12'); // rusted chip
      linePx(ctx, cx + 26 + tipLean, 13 + bodyY, cx + 25, 56 + bodyY, 2, '#C084FC');
      fillOval(ctx, cx + 24, 57 + bodyY, 10, 3.5, '#B45309');
    }
  } else {
    drawStageBossSprite(ctx, stage, dy, frame, pose);
    applyPixelRimLight(canvas, '#CBD5E1', 0.16);
    applyPixelOutline(canvas, OUTLINE);
    if (hurtFlash) applySoftHurtTint(ctx, canvas.width, canvas.height);
    spriteCache.set(key, canvas);
    return canvas;
  }

  applyPixelRimLight(canvas, '#94A3B8', 0.18);
  applyPixelOutline(canvas, OUTLINE);
  if (hurtFlash) {
    applySoftHurtTint(ctx, canvas.width, canvas.height);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * 2x Larger Stage Boss Sprites (156x184 native pixels) matching each Stage's unique habitat.
 */
function drawStageBossSprite(
  ctx: CanvasRenderingContext2D,
  stage: number,
  dy: number,
  frame: 0 | 1,
  pose: EnemyAnimPose = 'walk'
): void {
  const OUTLINE = '#0B0A12';
  const GOLD = '#FACC15';
  const stride = pose === 'windup' ? -7 : pose === 'attack' ? 8 : frame === 1 ? 5 : -4;
  const wShiftY = pose === 'windup' ? -14 : pose === 'attack' ? 11 : 0;

  if (stage === 1) {
    // Stage 1: Abyssal Slime King — layered gelatinous crown beast, trapped skull core & golden crest
    fillOval(ctx, 78, 166, 70, 14, '#052E16');
    fillOval(ctx, 78, 168, 58, 8, '#22C55E');
    fillOval(ctx, 78, 108 + dy, 60, 50, '#14532D');
    fillOval(ctx, 78, 106 + dy, 52, 44, '#16A34A');
    fillOval(ctx, 78, 104 + dy, 42, 34, '#22C55E');
    // Floating engulfed skull & dark ooze bubbles inside translucent gel
    fillOval(ctx, 98, 118 + dy, 10, 9, '#CBD5E1');
    px(ctx, 93, 116 + dy, 3, 3, '#0F172A');
    px(ctx, 100, 116 + dy, 3, 3, '#0F172A');
    fillOval(ctx, 56, 80 + dy, 22, 11, '#86EFAC');
    fillOval(ctx, 52, 76 + dy, 10, 4, '#DCFCE7');
    // Royal Bejeweled Gold Crown
    fillPoly(
      ctx,
      [
        [45, 50 + dy],
        [42, 16 + dy],
        [60, 29 + dy],
        [78, 6 + dy],
        [96, 29 + dy],
        [114, 16 + dy],
        [111, 50 + dy],
      ],
      '#CA8A04'
    );
    fillPoly(
      ctx,
      [
        [49, 48 + dy],
        [47, 22 + dy],
        [62, 32 + dy],
        [78, 12 + dy],
        [94, 32 + dy],
        [109, 22 + dy],
        [107, 48 + dy],
      ],
      GOLD
    );
    fillOval(ctx, 78, 34 + dy, 6, 7, '#EF4444');
    // Slanted Crimson Boss Eyes & Acid Maw
    fillPoly(ctx, [[45, 84 + dy], [65, 90 + dy], [61, 99 + dy], [45, 95 + dy]], OUTLINE);
    fillPoly(ctx, [[111, 84 + dy], [91, 90 + dy], [95, 99 + dy], [111, 95 + dy]], OUTLINE);
    fillOval(ctx, 55, 92 + dy, 4, 3, '#F43F5E');
    fillOval(ctx, 101, 92 + dy, 4, 3, '#F43F5E');
    fillOval(ctx, 78, 128 + dy, 22, 6, '#052E16');
  } else if (stage === 2) {
    // Stage 2: Goblin Warlord King — ragged crimson warcloak, skull-trophied pauldrons & colossal waraxe
    fillPoly(ctx, [[36, 54 + dy], [118, 54 + dy], [134, 152 + dy], [16, 152 + dy]], '#7F1D1D');
    fillPoly(ctx, [[42, 62 + dy], [112, 62 + dy], [122, 142 + dy], [28, 142 + dy]], '#991B1B');
    fillOval(ctx, 74, 44 + dy, 31, 22, '#4D7C0F');
    fillOval(ctx, 72, 35 + dy, 21, 8, '#84CC16');
    fillPoly(ctx, [[44, 36 + dy], [18, 25 + dy], [29, 44 + dy]], '#3F6212');
    fillPoly(ctx, [[104, 36 + dy], [130, 25 + dy], [119, 44 + dy]], '#3F6212');
    fillPoly(
      ctx,
      [[50, 26 + dy], [47, 3 + dy], [63, 14 + dy], [74, 0 + dy], [86, 14 + dy], [101, 3 + dy], [98, 26 + dy]],
      GOLD
    );
    fillOval(ctx, 59, 43 + dy, 5, 4, '#EF4444');
    fillOval(ctx, 89, 43 + dy, 5, 4, '#EF4444');
    fillPoly(ctx, [[51, 63 + dy], [56, 49 + dy], [62, 63 + dy]], '#F8FAFC');
    fillPoly(ctx, [[87, 63 + dy], [92, 49 + dy], [98, 63 + dy]], '#F8FAFC');
    fillPoly(ctx, [[34, 66 + dy], [116, 66 + dy], [105, 124 + dy], [43, 124 + dy]], '#1E293B');
    fillOval(ctx, 75, 90 + dy, 26, 18, '#334155');
    fillOval(ctx, 33, 70 + dy, 16, 12, '#B09567');
    fillOval(ctx, 115, 70 + dy, 16, 12, '#B09567');
    fillTaperedCurve(ctx, 56, 122, 51 - stride, 148, 49 - stride, 178, 12, 9, '#3F6212');
    fillTaperedCurve(ctx, 94, 122 - dy * 0.5, 99 + stride, 148 - dy * 0.5, 101 + stride, 178, 12, 9, '#4D7C0F');
    linePx(ctx, 129, 28 + dy + wShiftY, 129, 146 + dy + wShiftY * 0.4, 8, '#78350F');
    fillPoly(
      ctx,
      [
        [131, 18 + dy + wShiftY],
        [154, 12 + dy + wShiftY],
        [151, 56 + dy + wShiftY],
        [131, 49 + dy + wShiftY],
      ],
      '#CBD5E1'
    );
    linePx(ctx, 151, 16 + dy + wShiftY, 149, 52 + dy + wShiftY, 2, '#F8FAFC');
  } else if (stage === 3) {
    // Stage 3: Abyssal Black Knight — grand tattered cloak, towering curved horns & crimson runeblade
    fillPoly(ctx, [[77, 46 + dy], [10, 142 + dy], [44, 134 + dy], [78, 146 + dy], [114, 134 + dy], [144, 142 + dy]], '#450A0A');
    fillTaperedCurve(ctx, 52, 28 + dy, 34, 16 + dy, 28, 1 + dy, 8, 2, '#1E293B');
    fillTaperedCurve(ctx, 102, 28 + dy, 120, 16 + dy, 126, 1 + dy, 8, 2, '#1E293B');
    fillOval(ctx, 77, 41 + dy, 24, 19, '#1E293B');
    fillOval(ctx, 77, 33 + dy, 16, 7, '#475569');
    px(ctx, 63, 40 + dy, 28, 4, pose === 'windup' ? '#FEF08A' : '#EF4444');
    fillPoly(ctx, [[34, 62 + dy], [120, 62 + dy], [106, 124 + dy], [48, 124 + dy]], '#0F172A');
    fillOval(ctx, 33, 70 + dy, 16, 13, '#334155');
    fillOval(ctx, 121, 70 + dy, 16, 13, '#334155');
    fillPoly(ctx, [[77, 68 + dy], [94, 88 + dy], [77, 108 + dy], [60, 88 + dy]], '#991B1B');
    fillPoly(ctx, [[77, 74 + dy], [87, 88 + dy], [77, 102 + dy], [67, 88 + dy]], '#F43F5E');
    fillTaperedCurve(ctx, 56, 122, 52 - stride, 148, 50 - stride, 178, 12, 9, '#1E293B');
    fillTaperedCurve(ctx, 98, 122 - dy * 0.5, 102 + stride, 148 - dy * 0.5, 104 + stride, 178, 12, 9, '#334155');
    fillPoly(
      ctx,
      [
        [127, 14 + dy + wShiftY],
        [136, 2 + dy + wShiftY],
        [145, 14 + dy + wShiftY],
        [143, 118 + dy + wShiftY * 0.5],
        [129, 118 + dy + wShiftY * 0.5],
      ],
      '#475569'
    );
    linePx(ctx, 136, 14 + dy + wShiftY, 136, 114 + dy + wShiftY * 0.5, 4, '#EF4444');
    fillOval(ctx, 136, 116 + dy + wShiftY * 0.5, 19, 5, '#94A3B8');
  } else if (stage === 4) {
    // Stage 4: Abyssal Spider Matriarch — spiked chitin abdomen, violet-jointed 8 limbs & glowing cluster eyes
    for (let k = 0; k < 4; k++) {
      const ly = 74 + k * 20 + (frame === 1 && k % 2 === 0 ? -8 : 3) + (pose === 'windup' ? -6 : 0);
      fillTaperedCurve(ctx, 48, 84, 22, ly - 22, 6, ly - 10, 6.5, 4, '#1E1B2E');
      fillTaperedCurve(ctx, 6, ly - 10, 12, ly + 16, 16, ly + 42, 4, 2, '#7E22CE');
      fillTaperedCurve(ctx, 108, 84, 134, ly - 22, 150, ly - 10, 6.5, 4, '#1E1B2E');
      fillTaperedCurve(ctx, 150, ly - 10, 144, ly + 16, 140, ly + 42, 4, 2, '#7E22CE');
    }
    fillOval(ctx, 78, 54 + dy, 40, 30, '#3B0764');
    fillOval(ctx, 78, 50 + dy, 24, 16, '#A855F7');
    fillOval(ctx, 78, 50 + dy, 10, 8, '#F5D0FE');
    fillOval(ctx, 78, 106 + dy, 31, 23, '#1E1B2E');
    fillOval(ctx, 56, 101 + dy, 5, 5, '#EF4444');
    fillOval(ctx, 68, 97 + dy, 4, 4, '#FACC15');
    fillOval(ctx, 78, 100 + dy, 6, 6, '#F43F5E');
    fillOval(ctx, 88, 97 + dy, 4, 4, '#FACC15');
    fillOval(ctx, 100, 101 + dy, 5, 5, '#EF4444');
    fillPoly(ctx, [[55, 124 + dy], [66, 124 + dy], [60, 150 + dy]], '#E2E8F0');
    fillPoly(ctx, [[90, 124 + dy], [101, 124 + dy], [96, 150 + dy]], '#E2E8F0');
  } else if (stage === 5) {
    // Stage 5: Abyssal Mermaid Queen — iridescent fin ribbons, coral-gold diadem & storm trident
    fillPoly(ctx, [[42, 144], [114, 144], [136, 178], [92, 168], [78, 180], [64, 168], [20, 178]], '#0F766E');
    fillOval(ctx, 78, 132, 34, 22, '#14B8A6');
    fillOval(ctx, 78, 66 + dy, 38, 34, '#1E3A8A');
    fillOval(ctx, 78, 40 + dy, 24, 18, '#E2E8F0');
    fillOval(ctx, 78, 82 + dy, 22, 26, '#0D9488');
    fillPoly(ctx, [[52, 24 + dy], [58, 2 + dy], [78, 14 + dy], [98, 2 + dy], [104, 24 + dy]], '#F43F5E');
    fillOval(ctx, 78, 11 + dy, 6, 8, GOLD);
    fillOval(ctx, 66, 39 + dy, 4, 3, '#38BDF8');
    fillOval(ctx, 90, 39 + dy, 4, 3, '#38BDF8');
    linePx(ctx, 130, 22 + dy + wShiftY, 130, 170 + dy + wShiftY * 0.3, 7, GOLD);
    fillTaperedCurve(ctx, 112, 22 + dy + wShiftY, 130, 28 + dy + wShiftY, 148, 22 + dy + wShiftY, 4, 4, GOLD);
    fillPoly(ctx, [[109, 22 + dy + wShiftY], [113, 2 + dy + wShiftY], [118, 22 + dy + wShiftY]], '#7DD3FC');
    fillPoly(ctx, [[126, 22 + dy + wShiftY], [130, 0 + dy + wShiftY], [134, 22 + dy + wShiftY]], '#E0F2FE');
    fillPoly(ctx, [[142, 22 + dy + wShiftY], [147, 2 + dy + wShiftY], [151, 22 + dy + wShiftY]], '#7DD3FC');
  } else if (stage === 6) {
    // Stage 6: Naga Serpent Sovereign (Manusia Ular) — coiled scales, wide cobra hood & venomous glaive
    fillTaperedCurve(ctx, 36, 172, 78, 138, 126, 166, 20, 13, '#14532D');
    fillTaperedCurve(ctx, 44, 168, 78, 142, 118, 162, 12, 8, '#22C55E');
    fillPoly(ctx, [[78, 8 + dy], [126, 38 + dy], [112, 74 + dy], [44, 74 + dy], [30, 38 + dy]], '#14532D');
    fillOval(ctx, 78, 42 + dy, 26, 20, '#4ADE80');
    fillOval(ctx, 65, 36 + dy, 5, 4, '#EF4444');
    fillOval(ctx, 91, 36 + dy, 5, 4, '#EF4444');
    fillOval(ctx, 78, 96 + dy, 30, 26, '#14532D');
    fillOval(ctx, 78, 94 + dy, 21, 17, '#D6B67E');
    linePx(ctx, 132, 20 + dy + wShiftY, 132, 152 + dy + wShiftY * 0.4, 6, '#78350F');
    fillPoly(ctx, [[128, 22 + dy + wShiftY], [144, 6 + dy + wShiftY], [148, 38 + dy + wShiftY], [130, 44 + dy + wShiftY]], '#4ADE80');
  } else if (stage === 7) {
    // Stage 7: Obsidian Magma Lizar — volcanic magma fissures, sweeping fire horns & blazing halberd
    fillTaperedCurve(ctx, 64, 28 + dy, 52, 14 + dy, 46, 2 + dy, 8, 2, '#F97316');
    fillTaperedCurve(ctx, 92, 28 + dy, 104, 14 + dy, 110, 2 + dy, 8, 2, '#F97316');
    fillOval(ctx, 78, 40 + dy, 34, 20, '#991B1B');
    fillOval(ctx, 66, 38 + dy, 5, 4, '#FACC15');
    fillOval(ctx, 92, 38 + dy, 5, 4, '#FACC15');
    fillOval(ctx, 78, 90 + dy, 38, 30, '#451A03');
    fillOval(ctx, 78, 90 + dy, 24, 20, '#EA580C');
    fillOval(ctx, 78, 90 + dy, 10, 12, '#FEF08A');
    fillTaperedCurve(ctx, 60, 118, 55 - stride, 148, 52 - stride, 178, 12, 9, '#9A3412');
    fillTaperedCurve(ctx, 96, 118 - dy * 0.5, 101 + stride, 148 - dy * 0.5, 104 + stride, 178, 12, 9, '#9A3412');
    linePx(ctx, 132, 14 + dy + wShiftY, 132, 166 + dy + wShiftY * 0.3, 8, '#451A03');
    fillOval(ctx, 132, 34 + dy + wShiftY, 18, 18, '#F97316');
    fillOval(ctx, 132, 34 + dy + wShiftY, 10, 10, '#FEF08A');
  } else if (stage === 8) {
    // Stage 8: Granite Titan Golem — monolithic faceted stone plates & amethyst crystal core
    fillPoly(ctx, [[50, 24 + dy], [106, 24 + dy], [116, 56 + dy], [40, 56 + dy]], '#334155');
    fillOval(ctx, 78, 40 + dy, 20, 6, pose === 'windup' ? '#FDE047' : '#C084FC');
    fillPoly(ctx, [[32, 60 + dy], [124, 60 + dy], [112, 130 + dy], [44, 130 + dy]], '#1E293B');
    fillPoly(ctx, [[78, 68 + dy], [96, 92 + dy], [78, 116 + dy], [60, 92 + dy]], '#A855F7');
    fillPoly(ctx, [[78, 76 + dy], [88, 92 + dy], [78, 108 + dy], [68, 92 + dy]], '#F5D0FE');
    fillPoly(ctx, [[6, 52 + dy + wShiftY], [34, 46 + dy + wShiftY], [36, 128 + dy + wShiftY * 0.5], [10, 138 + dy + wShiftY * 0.5]], '#475569');
    fillPoly(ctx, [[122, 46 + dy + wShiftY], [150, 52 + dy + wShiftY], [146, 138 + dy + wShiftY * 0.5], [120, 128 + dy + wShiftY * 0.5]], '#475569');
    fillTaperedCurve(ctx, 56, 128, 52 - stride * 0.5, 152, 52 - stride * 0.5, 178, 14, 11, '#334155');
    fillTaperedCurve(ctx, 100, 128 - dy * 0.5, 104 + stride * 0.5, 152 - dy * 0.5, 104 + stride * 0.5, 178, 14, 11, '#334155');
  } else if (stage === 9) {
    // Stage 9: Infernal Dragon — veined demon-dragon wings, sweeping golden horns & furnace core
    const wingLift = pose === 'windup' ? -14 : pose === 'attack' ? 16 : frame === 0 ? -4 : 14;
    fillPoly(ctx, [[48, 64], [2, 16 + wingLift], [10, 92 + wingLift], [44, 96]], '#DC2626');
    fillTaperedCurve(ctx, 48, 64, 24, 42 + wingLift, 4, 18 + wingLift, 3.5, 1, GOLD);
    fillPoly(ctx, [[108, 64], [154, 16 + wingLift], [146, 92 + wingLift], [112, 96]], '#DC2626');
    fillTaperedCurve(ctx, 108, 64, 132, 42 + wingLift, 152, 18 + wingLift, 3.5, 1, GOLD);
    fillTaperedCurve(ctx, 54, 28 + dy, 42, 14 + dy, 36, 1 + dy, 7, 2, GOLD);
    fillTaperedCurve(ctx, 102, 28 + dy, 114, 14 + dy, 120, 1 + dy, 7, 2, GOLD);
    fillOval(ctx, 78, 42 + dy, 28, 22, '#7F1D1D');
    fillOval(ctx, 66, 40 + dy, 6, 4, '#FEF08A');
    fillOval(ctx, 90, 40 + dy, 6, 4, '#FEF08A');
    fillOval(ctx, 78, 96 + dy, 36, 33, '#450A0A');
    fillOval(ctx, 78, 92 + dy, 16, 18, '#F97316');
    fillOval(ctx, 78, 92 + dy, 8, 10, '#FEF08A');
    fillTaperedCurve(ctx, 56, 128, 52 - stride, 154, 50 - stride, 180, 12, 9, '#7F1D1D');
    fillTaperedCurve(ctx, 100, 128 - dy * 0.5, 104 + stride, 154 - dy * 0.5, 106 + stride, 180, 12, 9, '#7F1D1D');
  } else {
    // Stage 10: Celestial GOD — radiant sacred halo, quad seraph wings & luminous astral spear
    fillOval(ctx, 78, 14 + dy, 34, 7, GOLD);
    const wingShift = pose === 'windup' ? -10 : pose === 'attack' ? 12 : frame === 0 ? -4 : 8;
    fillPoly(ctx, [[48, 66], [2, 28 + wingShift], [12, 96 - wingShift], [46, 100]], '#F8FAFC');
    fillPoly(ctx, [[108, 66], [154, 28 + wingShift], [144, 96 - wingShift], [110, 100]], '#F8FAFC');
    fillOval(ctx, 78, 40 + dy, 24, 20, '#F8FAFC');
    fillOval(ctx, 78, 40 + dy, 16, 14, '#1E1B4B');
    fillOval(ctx, 78, 34 + dy, 5, 5, GOLD);
    fillOval(ctx, 67, 45 + dy, 5, 3, '#C084FC');
    fillOval(ctx, 89, 45 + dy, 5, 3, '#C084FC');
    fillOval(ctx, 78, 98 + dy, 36, 36, '#312E81');
    fillOval(ctx, 78, 96 + dy, 26, 28, '#F8FAFC');
    fillOval(ctx, 78, 90 + dy, 12, 16, GOLD);
    fillTaperedCurve(ctx, 58, 132, 56 - stride * 0.5, 156, 54 - stride * 0.5, 180, 11, 8, '#1E1B4B');
    fillTaperedCurve(ctx, 98, 132 - dy * 0.5, 100 + stride * 0.5, 156 - dy * 0.5, 102 + stride * 0.5, 180, 11, 8, '#1E1B4B');
    linePx(ctx, 136, 14 + dy + wShiftY, 136, 162 + dy + wShiftY * 0.4, 8, GOLD);
    fillOval(ctx, 136, 12 + dy + wShiftY, 12, 12, '#FEF08A');
  }
}

export function getOneEyedBatSprite(
  frame: 0 | 1,
  hurtFlash = false,
  pose: EnemyAnimPose = 'walk'
): HTMLCanvasElement {
  const key = `boss_bat_ds_v3:${frame}:${pose}:${hurtFlash ? '1' : '0'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(104, 84);
  const wingY = pose === 'windup' ? 3 : pose === 'attack' ? 34 : frame === 0 ? 7 : 30;
  fillPoly(ctx, [[36, 36], [2, wingY], [8, wingY + 22], [22, wingY + 18], [34, 48]], '#7F1D1D');
  fillPoly(ctx, [[68, 36], [102, wingY], [96, wingY + 22], [82, wingY + 18], [70, 48]], '#7F1D1D');
  fillTaperedCurve(ctx, 36, 36, 20, wingY + 8, 5, wingY + 3, 2, 1, pose === 'windup' ? '#FDE047' : '#F43F5E');
  fillTaperedCurve(ctx, 68, 36, 84, wingY + 8, 99, wingY + 3, 2, 1, pose === 'windup' ? '#FDE047' : '#F43F5E');
  fillOval(ctx, 52, 39, 18, 21, '#3B0764');
  fillOval(ctx, 52, 36, pose === 'windup' ? 13 : 11, 8, '#F8FAFC');
  fillOval(ctx, 52, 36, pose === 'windup' ? 7 : 6, 5, '#EF4444');
  px(ctx, 50, 34, 4, 4, '#FEF08A');
  px(ctx, 43, 50, 5, 8, '#F8FAFC');
  px(ctx, 56, 50, 5, 8, '#F8FAFC');

  applyPixelOutline(canvas, '#0B0A12');
  if (hurtFlash) {
    applySoftHurtTint(ctx, canvas.width, canvas.height);
  }
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Lobby NPC: Pedagang Senjata (Weapon Shop Merchant) — placed on the right near Portal!
 */
export function getWeaponNpcSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `lobby_weapon_npc_profile_v2:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(92, 118);
  const bob = frame === 1 ? 1 : 0;

  // Compact Wooden Weapon Pack & Hanging Rack behind his back (left side, flush y=118)
  px(ctx, 10, 48, 22, 6, '#5C3A21');
  px(ctx, 14, 54, 5, 64, '#451A03');
  linePx(ctx, 12, 34, 24, 62, 3, '#A855F7');
  px(ctx, 9, 32, 7, 4, '#FACC15');
  fillOval(ctx, 22, 46, 5, 5, '#F97316');

  // Traveling Cloak & Merchant Pack behind shoulder (left side)
  fillPoly(
    ctx,
    [
      [28, 46 + bob],
      [44, 46 + bob],
      [34, 96 + bob],
      [20, 92 + bob],
    ],
    '#431407'
  );

  // Merchant Head in 3/4 Profile Facing RIGHT (+X), Bandana & Brass Goggles
  fillOval(ctx, 49, 34 + bob, 12, 12, '#F3D2BD');
  fillOval(ctx, 47, 24 + bob, 14, 7, '#9A3412');
  // Brass goggles angled rightward
  px(ctx, 43, 21 + bob, 8, 6, '#FACC15');
  px(ctx, 53, 21 + bob, 7, 5, '#FACC15');
  px(ctx, 45, 22 + bob, 4, 4, '#38BDF8');
  px(ctx, 54, 22 + bob, 4, 3, '#38BDF8');
  // Eyes & nose ridge looking right
  px(ctx, 49, 33 + bob, 3, 3, '#1E1B18');
  px(ctx, 57, 33 + bob, 2, 3, '#1E1B18');
  px(ctx, 59, 36 + bob, 3, 3, '#E2B49A');
  // Swept beard pointing forward-right
  fillPoly(
    ctx,
    [
      [42, 41 + bob],
      [60, 40 + bob],
      [63, 47 + bob],
      [45, 48 + bob],
    ],
    '#64748B'
  );

  // Tunic, Leather Apron & Gold Merchant Sash
  fillPoly(
    ctx,
    [
      [34, 47 + bob],
      [60, 47 + bob],
      [63, 91 + bob],
      [31, 91 + bob],
    ],
    '#7C2D12'
  );
  px(ctx, 40, 52 + bob, 20, 35, '#334155');
  px(ctx, 34, 66 + bob, 28, 5, '#FACC15');
  px(ctx, 51, 65 + bob, 7, 7, '#F97316');

  // Boots firmly grounded at y=118 (stride angled right)
  px(ctx, 35, 91, 9, 27, '#1E1B18');
  px(ctx, 49, 91, 10, 27, '#1E1B18');
  px(ctx, 56, 112, 5, 6, '#332C26');

  // Welcoming Merchant Arm & Glowing Weapon Appraisal Lantern extended RIGHT (+X)
  fillTaperedCurve(ctx, 56, 54 + bob, 66, 62 + bob, 74, 58 + bob, 6, 4, '#9A3412');
  px(ctx, 72, 55 + bob, 6, 6, '#F3D2BD');
  // Merchant Forge Hammer held forward-right
  px(ctx, 73, 52 + bob, 4, 24, '#78350F');
  px(ctx, 68, 45 + bob, 14, 8, '#94A3B8');
  px(ctx, 72, 47 + bob, 6, 4, '#FDE047');

  applyPixelOutline(canvas, '#100C18');
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Redesigned Monumental Dark-Fantasy Sanctuary Statue (Patung Dewi Penjaga Takdir) — 220x320 pixels.
 * Ancient carved obsidian-granite monument with ornate gold relief filigree, geometric astral halo,
 * layered sculpted wings & swirling violet-gold Wish Crystal core anchored cleanly to ground y=320.
 */
export function getGachaStatueSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `lobby_gacha_statue_goddess_v3:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(220, 320);
  const pulse = frame === 1 ? -3 : 0;

  // 1. Ornate 3-Tier Carved Obsidian & Gold Relief Pedestal (flush to bottom y=320)
  fillPoly(ctx, [[12, 320], [20, 286], [200, 286], [208, 320]], '#141722');
  px(ctx, 20, 286, 180, 5, '#3A4159');
  px(ctx, 26, 260, 168, 26, '#1E2233');
  px(ctx, 30, 260, 160, 4, '#525C7D');
  px(ctx, 42, 238, 136, 22, '#2B3147');
  px(ctx, 46, 238, 128, 4, '#707CA3');
  // Sculpted gold trim arches & corner buttresses
  px(ctx, 46, 243, 128, 4, '#EAB308');
  px(ctx, 30, 289, 160, 3, '#A16207');
  fillPoly(ctx, [[16, 288], [32, 264], [38, 318], [16, 318]], '#252B3D');
  fillPoly(ctx, [[204, 288], [188, 264], [182, 318], [204, 318]], '#252B3D');
  px(ctx, 24, 294, 4, 18, '#D4AF37');
  px(ctx, 192, 294, 4, 18, '#D4AF37');
  // Central Faceted Astral Summon Seal
  fillPoly(ctx, [[110, 255], [136, 272], [110, 289], [84, 272]], '#170B2B');
  fillPoly(ctx, [[110, 260], [129, 272], [110, 284], [91, 272]], '#9333EA');
  fillPoly(ctx, [[110, 264], [122, 272], [110, 280], [98, 272]], '#E9D5FF');
  px(ctx, 108, 270, 4, 4, '#FFFFFF');
  // Ancient moss weathering
  px(ctx, 22, 312, 20, 6, '#1B3A2A');
  px(ctx, 174, 284, 18, 5, '#1B3A2A');

  // 2. Intricate Geometric Celestial Astral Ring Halo behind Statue
  fillOval(ctx, 110, 74, 46, 46, '#78350F');
  fillOval(ctx, 110, 74, 42, 42, '#FACC15');
  fillOval(ctx, 110, 74, 35, 35, '#171926');
  fillOval(ctx, 110, 74, 28, 28, '#2D2047');
  fillOval(ctx, 110, 74, 24, 24, '#12131E');
  // Cardinal gold crown spires on halo
  fillPoly(ctx, [[105, 29], [110, 12], [115, 29]], '#FDE047');
  fillPoly(ctx, [[64, 69], [48, 74], [64, 79]], '#FDE047');
  fillPoly(ctx, [[156, 69], [172, 74], [156, 79]], '#FDE047');
  px(ctx, 78, 38, 4, 4, '#A855F7');
  px(ctx, 138, 38, 4, 4, '#A855F7');

  // 3. Sweeping Layered Sanctuary Angel Wings with Gold Filigree Ribs
  for (const side of [-1, 1] as const) {
    const xBase = 110 + side * 20;
    fillPoly(
      ctx,
      [
        [xBase, 130],
        [110 + side * 98, 56],
        [110 + side * 102, 124],
        [110 + side * 86, 182],
        [110 + side * 46, 202],
        [xBase + side * 4, 196],
      ],
      '#283044'
    );
    fillPoly(
      ctx,
      [
        [xBase, 134],
        [110 + side * 88, 72],
        [110 + side * 90, 124],
        [110 + side * 74, 170],
        [110 + side * 42, 188],
      ],
      '#3F4A66'
    );
    fillPoly(
      ctx,
      [
        [xBase, 140],
        [110 + side * 72, 92],
        [110 + side * 72, 132],
        [110 + side * 56, 164],
      ],
      '#64748B'
    );
    for (let f = 0; f < 5; f++) {
      linePx(ctx, xBase + side * 4, 136 + f * 9, 110 + side * (94 - f * 7), 80 + f * 19, 2, f === 0 ? '#D4AF37' : '#94A3B8');
    }
  }

  // 4. Sculpted Draped Sanctuary Priestess Robes with Gold Trim & Mantle
  fillPoly(ctx, [[80, 102], [140, 102], [160, 238], [60, 238]], '#334155');
  fillPoly(ctx, [[86, 106], [134, 106], [148, 236], [72, 236]], '#475569');
  fillPoly(ctx, [[94, 110], [126, 110], [136, 234], [84, 234]], '#94A3B8');
  linePx(ctx, 96, 130, 84, 232, 3, '#CBD5E1');
  linePx(ctx, 110, 138, 110, 234, 3, '#E2E8F0');
  linePx(ctx, 124, 130, 136, 232, 3, '#CBD5E1');
  px(ctx, 84, 158, 52, 7, '#CA8A04');
  px(ctx, 88, 160, 44, 3, '#FDE047');
  px(ctx, 64, 230, 92, 6, '#B45309');
  px(ctx, 68, 232, 84, 2, '#FACC15');

  // 5. Veiled Hooded Goddess Visage & Gold Diadem
  fillPoly(ctx, [[86, 58], [134, 58], [144, 114], [76, 114]], '#475569');
  fillOval(ctx, 110, 74, 20, 22, '#94A3B8');
  fillOval(ctx, 110, 76, 15, 17, '#CBD5E1');
  px(ctx, 98, 76, 7, 3, '#475569');
  px(ctx, 115, 76, 7, 3, '#475569');
  px(ctx, 107, 83, 6, 2, '#64748B');
  fillPoly(ctx, [[91, 60], [110, 48], [129, 60], [124, 65], [96, 65]], '#FACC15');
  fillOval(ctx, 110, 56, 4, 5, '#A855F7');

  // 6. Clasped Hands Cradling Swirling Faceted Cosmic Wish Crystal + Orbiting Shards
  fillTaperedCurve(ctx, 84, 114, 84, 138, 104, 138, 7, 5, '#CBD5E1');
  fillTaperedCurve(ctx, 136, 114, 136, 138, 116, 138, 7, 5, '#CBD5E1');
  fillOval(ctx, 110, 134, 8, 12, '#E2E8F0');

  // Faceted diamond wish crystal core
  fillPoly(
    ctx,
    [
      [110, 86 + pulse],
      [124, 106 + pulse],
      [110, 126 + pulse],
      [96, 106 + pulse],
    ],
    '#7E22CE'
  );
  fillPoly(
    ctx,
    [
      [110, 91 + pulse],
      [120, 106 + pulse],
      [110, 121 + pulse],
      [100, 106 + pulse],
    ],
    '#C084FC'
  );
  fillPoly(
    ctx,
    [
      [110, 96 + pulse],
      [115, 106 + pulse],
      [110, 116 + pulse],
      [105, 106 + pulse],
    ],
    '#F5D0FE'
  );
  px(ctx, 108, 104 + pulse, 4, 4, '#FFFFFF');
  // Floating crystal shards & star rays
  px(ctx, 85, 98 + pulse, 4, 6, '#38BDF8');
  px(ctx, 131, 98 + pulse, 4, 6, '#38BDF8');
  px(ctx, 109, 77 + pulse, 2, 7, '#FDE047');
  px(ctx, 90, 105 + pulse, 5, 2, '#E9D5FF');
  px(ctx, 125, 105 + pulse, 5, 2, '#E9D5FF');

  applyPixelOutline(canvas, '#0D0E16');
  spriteCache.set(key, canvas);
  return canvas;
}

export function getTrainingDummySprite(hitShake: boolean): HTMLCanvasElement {
  const key = `lobby_dummy_uhd3:${hitShake ? '1' : '0'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(64, 96);
  const sx = hitShake ? 3 : 0;
  // Heavy iron-bound timber base & crossbeam
  px(ctx, 16, 88, 32, 8, '#3B2314');
  px(ctx, 18, 88, 28, 3, '#5C3A21');
  px(ctx, 28, 42, 8, 48, '#52321C');
  px(ctx, 30, 44, 3, 44, '#6E462A');
  fillTaperedCurve(ctx, 8 + sx, 49, 32 + sx, 48, 56 + sx, 49, 4, 4, '#784A2A');
  px(ctx, 6 + sx, 46, 5, 6, '#92400E');
  px(ctx, 53 + sx, 46, 5, 6, '#92400E');

  // Woven Straw Conical Hat with bamboo shading
  fillPoly(
    ctx,
    [
      [8 + sx, 24],
      [32 + sx, 7],
      [56 + sx, 24],
    ],
    '#B45309'
  );
  fillPoly(
    ctx,
    [
      [14 + sx, 22],
      [32 + sx, 9],
      [50 + sx, 22],
    ],
    '#D97706'
  );
  fillPoly(
    ctx,
    [
      [22 + sx, 20],
      [32 + sx, 11],
      [42 + sx, 20],
    ],
    '#F59E0B'
  );

  // Stitched burlap head
  fillOval(ctx, 32 + sx, 33, 10, 10, '#C29B6C');
  fillOval(ctx, 31 + sx, 32, 7, 7, '#DFBE92');
  px(ctx, 26 + sx, 30, 3, 3, '#1E1B18');
  px(ctx, 35 + sx, 30, 3, 3, '#1E1B18');
  px(ctx, 27 + sx, 37, 10, 2, '#78350F');

  // Armored straw torso + bullseye target
  fillPoly(
    ctx,
    [
      [19 + sx, 42],
      [45 + sx, 42],
      [47 + sx, 74],
      [17 + sx, 74],
    ],
    '#9A7245'
  );
  px(ctx, 21 + sx, 44, 22, 26, '#B88D5B');
  px(ctx, 19 + sx, 62, 26, 4, '#78350F'); // rope belt
  fillOval(ctx, 32 + sx, 53, 8, 8, '#DC2626');
  fillOval(ctx, 32 + sx, 53, 5, 5, '#F8FAFC');
  fillOval(ctx, 32 + sx, 53, 2, 2, '#DC2626');

  applyPixelOutline(canvas, '#140F0B');
  spriteCache.set(key, canvas);
  return canvas;
}

export function getEnchantAltarSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `lobby_enchant_altar_uhd2:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(88, 96);
  // Beveled stone altar base with gold rune trim
  px(ctx, 10, 74, 68, 22, '#1A1D2B');
  px(ctx, 12, 74, 64, 4, '#333952');
  px(ctx, 16, 60, 56, 14, '#262B3D');
  px(ctx, 22, 42, 44, 18, '#3B425E');
  px(ctx, 14, 35, 60, 9, '#576185');
  px(ctx, 16, 35, 56, 3, '#94A3B8');
  px(ctx, 26, 38, 36, 4, '#38BDF8');
  px(ctx, 34, 48, 20, 8, '#0EA5E9');
  px(ctx, 38, 50, 12, 4, '#E0F2FE');

  // Floating faceted arcane prism
  const cy = frame === 0 ? 11 : 7;
  fillPoly(
    ctx,
    [
      [44, cy - 2],
      [54, cy + 12],
      [44, cy + 26],
      [34, cy + 12],
    ],
    '#0284C7'
  );
  fillPoly(
    ctx,
    [
      [44, cy],
      [50, cy + 12],
      [44, cy + 22],
      [38, cy + 12],
    ],
    '#38BDF8'
  );
  fillOval(ctx, 44, cy + 11, 3, 6, '#F0F9FF');

  applyPixelOutline(canvas, '#0D111A');
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Dark Fantasy Gothic Carved Stone Archway — Enchant Portal (104x152 pixels, grounded flush at y=152)
 */
export function getEnchantPortalSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `enchant_portal_fantasy_v3:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(104, 152);
  // Sculpted Gothic Pointed Stone Archway Outer Silhouette (no boxy rectangle frame!)
  fillPoly(
    ctx,
    [
      [52, 2],
      [76, 16],
      [91, 42],
      [96, 138],
      [102, 144],
      [102, 152],
      [2, 152],
      [2, 144],
      [8, 138],
      [13, 42],
      [28, 16],
    ],
    '#1A2133'
  );
  // Inner carved basalt arch bevel
  fillPoly(
    ctx,
    [
      [52, 8],
      [72, 20],
      [85, 44],
      [89, 138],
      [15, 138],
      [19, 44],
      [32, 20],
    ],
    '#2C3652'
  );
  // Stepped weathered sanctuary plinth anchored at y=152
  fillPoly(ctx, [[4, 143], [100, 143], [102, 152], [2, 152]], '#171C2B');
  fillPoly(ctx, [[8, 137], [96, 137], [99, 143], [5, 143]], '#394566');
  px(ctx, 14, 139, 16, 3, '#1E3A2F');
  px(ctx, 74, 145, 14, 3, '#1E3A2F');
  px(ctx, 42, 140, 20, 4, '#38BDF8');

  // Carved Pointed Portal Aperture Void
  fillPoly(
    ctx,
    [
      [52, 21],
      [67, 32],
      [76, 52],
      [77, 137],
      [27, 137],
      [28, 52],
      [37, 32],
    ],
    '#070B14'
  );

  // Swirling Mystical Azure-Gold Portal Core
  fillOval(ctx, 52, 84, 23, 52, '#075985');
  fillOval(ctx, 52, 84, 18, 44, '#0284C7');
  fillOval(ctx, 52, 84, 13, 34, '#38BDF8');
  fillTaperedCurve(ctx, 35, 96, 48, 62 + (frame === 1 ? -4 : 3), 68, 72, 3, 1, '#BAE6FD');
  fillTaperedCurve(ctx, 68, 102, 54, 114 - (frame === 1 ? -4 : 3), 38, 86, 3, 1, '#7DD3FC');
  fillOval(ctx, 52, frame === 0 ? 82 : 86, 8, 22, '#E0F2FE');
  fillOval(ctx, 52, frame === 0 ? 84 : 80, 4, 11, '#FEF9C3');

  // Sculpted keystone sigil & weathered arch runes
  fillPoly(ctx, [[52, 2], [59, 12], [52, 21], [45, 12]], '#D4AF37');
  fillOval(ctx, 52, 11, 3, 4, '#FEF08A');
  px(ctx, 16, 70, 5, 10, '#38BDF8');
  px(ctx, 83, 70, 5, 10, '#38BDF8');
  px(ctx, 15, 96, 4, 7, '#818CF8');
  px(ctx, 85, 96, 4, 7, '#818CF8');

  applyPixelOutline(canvas, '#090D16');
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Dark Fantasy Gothic Carved Stone Archway — Stage / Return Portal (104x152 pixels, grounded flush at y=152)
 */
export function getPortalSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `portal_fantasy_v3:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(104, 152);
  // Sculpted Gothic Pointed Stone Archway Outer Silhouette (no boxy Minecraft blocks)
  fillPoly(
    ctx,
    [
      [52, 2],
      [76, 16],
      [91, 42],
      [96, 138],
      [102, 144],
      [102, 152],
      [2, 152],
      [2, 144],
      [8, 138],
      [13, 42],
      [28, 16],
    ],
    '#1C172B'
  );
  // Chiseled dark-granite arch masonry & weathered stone ribs
  fillPoly(
    ctx,
    [
      [52, 8],
      [72, 20],
      [85, 44],
      [89, 138],
      [15, 138],
      [19, 44],
      [32, 20],
    ],
    '#302847'
  );
  fillTaperedCurve(ctx, 18, 136, 19, 42, 52, 10, 4, 2, '#4A3F6E');
  fillTaperedCurve(ctx, 86, 136, 85, 42, 52, 10, 4, 2, '#4A3F6E');

  // Stepped cracked runic base anchored cleanly at y=152
  fillPoly(ctx, [[4, 143], [100, 143], [102, 152], [2, 152]], '#171324');
  fillPoly(ctx, [[8, 137], [96, 137], [99, 143], [5, 143]], '#3F355C');
  px(ctx, 18, 139, 14, 3, '#1E3A2A');
  px(ctx, 72, 145, 15, 3, '#1E3A2A');
  px(ctx, 41, 140, 22, 4, '#C084FC');

  // Deep Gothic Pointed Portal Aperture
  fillPoly(
    ctx,
    [
      [52, 21],
      [67, 32],
      [76, 52],
      [77, 137],
      [27, 137],
      [28, 52],
      [37, 32],
    ],
    '#080510'
  );

  // Swirling Abyssal-Violet & Crimson-Spark Vortex Core
  fillOval(ctx, 52, 84, 23, 52, '#3B0764');
  fillOval(ctx, 52, 84, 18, 44, '#6B21A8');
  fillOval(ctx, 52, 84, 13, 34, '#A855F7');
  fillTaperedCurve(ctx, 35, 98, 49, 60 + (frame === 1 ? -4 : 4), 68, 74, 3, 1, '#F5D0FE');
  fillTaperedCurve(ctx, 68, 100, 52, 114 - (frame === 1 ? -4 : 4), 38, 84, 3, 1, '#E879F9');
  fillOval(ctx, 52, frame === 0 ? 82 : 86, 8, 22, '#F3E8FF');
  fillOval(ctx, 52, frame === 0 ? 84 : 80, 4, 11, '#FFFFFF');

  // Crown rune keystone & glowing side carved runes
  fillPoly(ctx, [[52, 2], [59, 12], [52, 21], [45, 12]], '#D4AF37');
  fillOval(ctx, 52, 11, 3, 4, '#F5D0FE');
  px(ctx, 16, 68, 5, 11, '#A855F7');
  px(ctx, 83, 68, 5, 11, '#A855F7');
  px(ctx, 15, 95, 4, 8, '#F43F5E');
  px(ctx, 85, 95, 4, 8, '#F43F5E');

  applyPixelOutline(canvas, '#0A0712');
  spriteCache.set(key, canvas);
  return canvas;
}

export function getChestSprite(opened: boolean): HTMLCanvasElement {
  const key = `chest_uhd2:${opened ? 'open' : 'closed'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(56, 48);
  px(ctx, 6, 22, 44, 24, '#181524');
  px(ctx, 8, 25, 40, 18, '#28213D');
  px(ctx, 6, 22, 44, 4, '#D4AF37');
  px(ctx, 6, 42, 44, 4, '#A16207');
  px(ctx, 10, 26, 6, 16, '#8A7656');
  px(ctx, 40, 26, 6, 16, '#8A7656');
  px(ctx, 23, 24, 10, 10, '#FACC15');
  px(ctx, 26, 26, 4, 6, '#FEF08A');
  if (!opened) {
    px(ctx, 4, 10, 48, 13, '#2E2842');
    px(ctx, 6, 12, 44, 7, '#453C63');
    px(ctx, 4, 10, 48, 4, '#FACC15');
    px(ctx, 24, 14, 8, 8, '#A855F7');
    px(ctx, 26, 16, 4, 4, '#F3E8FF');
  } else {
    px(ctx, 4, 2, 48, 9, '#2E2842');
    px(ctx, 4, 2, 48, 3, '#D4AF37');
    px(ctx, 10, 12, 36, 10, '#A855F7');
    px(ctx, 17, 14, 22, 6, '#F5E8FF');
  }

  spriteCache.set(key, canvas);
  return canvas;
}

export function getOrangeChestSprite(opened: boolean): HTMLCanvasElement {
  const key = `orange_chest_uhd2:${opened ? 'open' : 'closed'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(56, 48);
  px(ctx, 6, 22, 44, 24, '#431407');
  px(ctx, 8, 25, 40, 18, '#C2410C');
  px(ctx, 12, 28, 32, 12, '#EA580C');
  px(ctx, 6, 22, 44, 4, '#FACC15');
  px(ctx, 6, 42, 44, 4, '#B45309');
  px(ctx, 11, 26, 6, 16, '#D97706');
  px(ctx, 39, 26, 6, 16, '#D97706');
  px(ctx, 23, 24, 10, 10, '#FDE047');
  px(ctx, 26, 26, 4, 6, '#FFFFFF');
  if (!opened) {
    px(ctx, 4, 10, 48, 13, '#EA580C');
    px(ctx, 6, 12, 44, 8, '#FB923C');
    px(ctx, 4, 10, 48, 4, '#FACC15');
    px(ctx, 23, 14, 10, 8, '#FEF08A');
    px(ctx, 25, 16, 6, 4, '#FFFFFF');
  } else {
    px(ctx, 4, 2, 48, 9, '#9A3412');
    px(ctx, 4, 2, 48, 3, '#FACC15');
    px(ctx, 10, 12, 36, 10, '#FB923C');
    px(ctx, 18, 14, 20, 6, '#FEF08A');
  }

  spriteCache.set(key, canvas);
  return canvas;
}

export const getSupplyChestSprite = getOrangeChestSprite;

export function getTombSprite(awakened: boolean): HTMLCanvasElement {
  const key = `tomb_uhd2:${awakened ? 'awakened' : 'sealed'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(64, 84);
  px(ctx, 4, 72, 56, 12, '#1B1D29');
  px(ctx, 6, 72, 52, 3, '#3F445E');
  px(ctx, 10, 64, 44, 8, '#2B2F42');
  px(ctx, 14, 16, 36, 48, '#232636');
  px(ctx, 18, 18, 28, 44, '#30344A');
  px(ctx, 18, 8, 28, 10, '#2E3247');
  px(ctx, 24, 2, 16, 8, '#424763');
  px(ctx, 8, 20, 6, 14, '#33374B');
  px(ctx, 50, 20, 6, 14, '#33374B');
  px(ctx, 17, 18, 3, 44, '#14151E');
  px(ctx, 44, 18, 3, 44, '#14151E');
  const runeMain = awakened ? '#475569' : '#A855F7';
  const runeCore = awakened ? '#64748B' : '#F5E8FF';
  px(ctx, 30, 22, 4, 28, runeMain);
  px(ctx, 22, 30, 20, 4, runeMain);
  px(ctx, 28, 28, 8, 8, runeCore);
  if (!awakened) {
    px(ctx, 24, 54, 16, 5, '#C084FC');
    px(ctx, 28, 55, 8, 3, '#F5E8FF');
  }

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Enchant Room Decor: Merchant Display Table & Arcane Goods Stall (116x84, anchored flush at y=84)
 */
export function getMerchantDisplayTableSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `enchant_merchant_table_v1:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(116, 84);
  const lanternGlow = frame === 1 ? '#FEF08A' : '#FDE047';

  // Wooden canopy posts & hanging brass lantern
  px(ctx, 10, 14, 6, 70, '#451A03');
  px(ctx, 100, 14, 6, 70, '#451A03');
  px(ctx, 6, 10, 104, 8, '#7C2D12');
  px(ctx, 8, 12, 100, 3, '#D97706');
  // Hanging warm lantern on left beam
  px(ctx, 20, 18, 2, 7, '#64748B');
  px(ctx, 16, 25, 10, 11, '#F59E0B');
  px(ctx, 18, 27, 6, 7, lanternGlow);

  // Heavy oak counter table + crimson runner cloth
  px(ctx, 8, 48, 100, 7, '#78350F');
  px(ctx, 10, 48, 96, 3, '#B45309');
  px(ctx, 16, 55, 84, 29, '#2D1A12');
  px(ctx, 36, 55, 44, 22, '#7F1D1D');
  px(ctx, 38, 74, 40, 3, '#D4AF37');
  px(ctx, 12, 55, 7, 29, '#451A03');
  px(ctx, 97, 55, 7, 29, '#451A03');

  // Displayed merchandise: cosmic dagger, rune orb, potion vials, scrolls & coin pouch
  linePx(ctx, 22, 46, 36, 35, 3, '#A855F7');
  px(ctx, 19, 44, 6, 4, '#FACC15');
  px(ctx, 44, 38, 7, 10, '#0EA5E9');
  px(ctx, 45, 35, 5, 3, '#CBD5E1');
  px(ctx, 54, 40, 7, 8, '#DC2626');
  px(ctx, 55, 37, 5, 3, '#CBD5E1');
  fillOval(ctx, 72, 42, 6, 6, '#9333EA');
  px(ctx, 71, 40, 3, 3, '#F5D0FE');
  px(ctx, 84, 41, 12, 7, '#E7E5E4');
  px(ctx, 87, 43, 6, 3, '#B45309');

  applyPixelOutline(canvas, '#100C18');
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Enchant Room Decor: Ancient Carved Basalt Rune Obelisk (72x156, anchored flush at y=156)
 */
export function getAncientObeliskSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `enchant_obelisk_v1:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(72, 156);
  const pulseCol = frame === 1 ? '#7DD3FC' : '#38BDF8';

  // Stepped carved stone plinth
  px(ctx, 6, 140, 60, 16, '#151824');
  px(ctx, 8, 140, 56, 4, '#333A52');
  px(ctx, 12, 126, 48, 14, '#202538');
  px(ctx, 14, 126, 44, 3, '#47506E');

  // Tapered basalt obelisk shaft
  fillPoly(
    ctx,
    [
      [20, 30],
      [36, 10],
      [52, 30],
      [54, 126],
      [18, 126],
    ],
    '#23283B'
  );
  fillPoly(
    ctx,
    [
      [36, 10],
      [52, 30],
      [54, 126],
      [36, 126],
    ],
    '#191D2C'
  );
  // Gold filigree collar & glowing arcane glyphs
  px(ctx, 18, 30, 36, 4, '#B48E54');
  px(ctx, 32, 42, 8, 14, pulseCol);
  px(ctx, 29, 46, 14, 4, '#E0F2FE');
  px(ctx, 33, 68, 6, 14, '#A855F7');
  px(ctx, 33, 94, 6, 12, pulseCol);
  fillOval(ctx, 36, 22, 4, 4, '#F5D0FE');

  applyPixelOutline(canvas, '#0A0D16');
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Enchant Room Decor: Ancient Arcane Forge Anvil & Grimoire Lectern (104x108, anchored flush at y=108)
 */
export function getArcaneForgeStationSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `enchant_forge_station_v1:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(104, 108);
  const ember = frame === 1 ? '#FB923C' : '#F97316';

  // Stone forge hearth pedestal (left half)
  px(ctx, 6, 94, 92, 14, '#181B29');
  px(ctx, 8, 94, 88, 3, '#3B425E');
  // Glowing Forge Brazier
  px(ctx, 14, 54, 30, 40, '#23283B');
  px(ctx, 10, 48, 38, 8, '#3B425E');
  px(ctx, 16, 42, 26, 7, ember);
  px(ctx, 21, 38 + (frame === 1 ? -2 : 0), 16, 8, '#FEF08A');

  // Heavy Runic Steel Anvil (right half)
  px(ctx, 56, 72, 34, 22, '#2B3045');
  px(ctx, 48, 56, 48, 14, '#47506E');
  px(ctx, 50, 56, 44, 4, '#94A3B8');
  px(ctx, 64, 62, 16, 5, '#38BDF8');
  // Forged crystal hammer resting on anvil
  px(ctx, 68, 42, 6, 14, '#78350F');
  px(ctx, 60, 38, 20, 8, '#64748B');
  px(ctx, 64, 40, 12, 4, '#C084FC');

  applyPixelOutline(canvas, '#0A0D16');
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Mystical Traveling Dungeon Merchant: Kucing Putih (84x96 pixels, grounded flush at y=96).
 * Spawns every 3 stages selling Run Items & Sub-Skills for Silver.
 */
export function getWhiteCatNpcSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `white_cat_npc_v1:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = makeOffscreen(84, 96);
  const bob = frame === 1 ? -1 : 0;

  // Curled fluffy white cat tail swaying softly
  fillTaperedCurve(ctx, 25, 76 + bob, 9, 72 + bob, 12, 46 + (frame === 1 ? -4 : 0), 5, 3, '#E2E8F0');
  fillTaperedCurve(ctx, 25, 76 + bob, 11, 70 + bob, 13, 47 + (frame === 1 ? -4 : 0), 3, 2, '#FFFFFF');

  // Wooden traveling merchant crate / satchel beside cat (grounded y=96)
  px(ctx, 54, 62, 22, 34, '#451A03');
  px(ctx, 56, 64, 18, 28, '#78350F');
  px(ctx, 54, 70, 22, 4, '#D97706');
  px(ctx, 62, 58, 7, 5, '#FACC15'); // silver/gold bell clasp
  // Hanging warm lantern on staff pole behind crate
  linePx(ctx, 73, 28, 73, 94, 3, '#5C3A21');
  linePx(ctx, 73, 28, 63, 28, 3, '#5C3A21');
  px(ctx, 60, 31, 7, 9, '#F59E0B');
  px(ctx, 62, 33, 3, 5, frame === 1 ? '#FEF08A' : '#FDE047');

  // Fluffy snow-white paws grounded cleanly at y=96
  fillOval(ctx, 32, 91, 6, 4, '#CBD5E1');
  fillOval(ctx, 32, 90, 5, 3, '#FFFFFF');
  fillOval(ctx, 47, 91, 6, 4, '#CBD5E1');
  fillOval(ctx, 47, 90, 5, 3, '#FFFFFF');

  // Crimson & obsidian velvet merchant cloak & white belly fur
  fillPoly(
    ctx,
    [
      [25, 50 + bob],
      [53, 50 + bob],
      [58, 86 + bob],
      [20, 86 + bob],
    ],
    '#7F1D1D'
  );
  fillPoly(
    ctx,
    [
      [29, 52 + bob],
      [49, 52 + bob],
      [52, 83 + bob],
      [26, 83 + bob],
    ],
    '#B91C1C'
  );
  fillOval(ctx, 39, 69 + bob, 8, 12, '#F8FAFC');
  // Silver coin pouch & collar bell
  px(ctx, 27, 50 + bob, 24, 4, '#D4AF37');
  fillOval(ctx, 39, 54 + bob, 4, 4, '#FACC15');
  px(ctx, 38, 53 + bob, 2, 2, '#FFFFFF');

  // Pointed Cat Ears with pink inner ear + round snow-white cat head
  fillPoly(ctx, [[26, 31 + bob], [22, 13 + bob], [35, 24 + bob]], '#E2E8F0');
  fillPoly(ctx, [[26, 29 + bob], [25, 18 + bob], [32, 24 + bob]], '#FDA4AF');
  fillPoly(ctx, [[52, 31 + bob], [56, 13 + bob], [43, 24 + bob]], '#E2E8F0');
  fillPoly(ctx, [[52, 29 + bob], [53, 18 + bob], [46, 24 + bob]], '#FDA4AF');

  fillOval(ctx, 39, 36 + bob, 16, 14, '#E2E8F0');
  fillOval(ctx, 39, 35 + bob, 14, 12, '#FFFFFF');
  // Expressive Mystic Amber-Violet Cat Eyes, cute pink nose & whiskers
  fillOval(ctx, 32, 35 + bob, 3.2, frame === 1 ? 2.2 : 3.2, '#1E1B2E');
  fillOval(ctx, 46, 35 + bob, 3.2, frame === 1 ? 2.2 : 3.2, '#1E1B2E');
  px(ctx, 31, 34 + bob, 2, 2, '#C084FC');
  px(ctx, 45, 34 + bob, 2, 2, '#C084FC');
  px(ctx, 38, 39 + bob, 3, 2, '#F43F5E');
  // Forehead amethyst moon charm
  fillPoly(ctx, [[39, 25 + bob], [42, 28 + bob], [39, 31 + bob], [36, 28 + bob]], '#A855F7');

  applyPixelOutline(canvas, '#100C18');
  spriteCache.set(key, canvas);
  return canvas;
}
