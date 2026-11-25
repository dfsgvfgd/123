import React, { useEffect, useState } from 'react';
import type { CharacterId } from '../game/types';

const processedCache = new Map<string, string>();

type CleanMode = 'none' | 'checker' | 'solid';

function getFaceCropRect(
  charId: CharacterId,
  w: number,
  h: number
): { sx: number; sy: number; sw: number; sh: number } {
  if (charId === 'luna') {
    const side = Math.round(w * 0.38);
    return {
      sx: Math.max(0, Math.round(w * 0.59 - side * 0.5)),
      sy: Math.max(0, Math.round(h * 0.085)),
      sw: Math.min(w, side),
      sh: Math.min(h, side),
    };
  }
  if (charId === 'witch') {
    const side = Math.round(w * 0.4);
    return {
      sx: Math.max(0, Math.round(w * 0.67 - side * 0.5)),
      sy: Math.max(0, Math.round(h * 0.16)),
      sw: Math.min(w, side),
      sh: Math.min(h, side),
    };
  }
  if (charId === 'lyra') {
    const side = Math.round(w * 0.54);
    return {
      sx: Math.max(0, Math.round(w * 0.5 - side * 0.5)),
      sy: Math.max(0, Math.round(h * 0.05)),
      sw: Math.min(w, side),
      sh: Math.min(h, side),
    };
  }
  // Velvera
  const side = Math.round(w * 0.64);
  return {
    sx: Math.max(0, Math.round(w * 0.5 - side * 0.5)),
    sy: Math.max(0, Math.round(h * 0.02)),
    sw: Math.min(w, side),
    sh: Math.min(h, side),
  };
}

/**
 * Strips baked neutral checkerboard or uniform solid studio background using border-seeded
 * flood fill so character portraits blend cleanly onto dark Sanctuary cards.
 */
function stripBackground(
  img: HTMLImageElement,
  mode: Exclude<CleanMode, 'none'> | 'none',
  faceCrop?: CharacterId
): string {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return img.src;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img.src;

  ctx.drawImage(img, 0, 0);

  if (mode !== 'none') {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Sample top-left & top-right corners as reference for uniform solid backgrounds
    const c1Idx = 0;
    const c2Idx = (w - 1) * 4;
    const refR = Math.round((data[c1Idx] + data[c2Idx]) * 0.5);
    const refG = Math.round((data[c1Idx + 1] + data[c2Idx + 1]) * 0.5);
    const refB = Math.round((data[c1Idx + 2] + data[c2Idx + 2]) * 0.5);

    const colorDist = (idx: number): number => {
      const dr = data[idx] - refR;
      const dg = data[idx + 1] - refG;
      const db = data[idx + 2] - refB;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    const isBgPixel = (idx: number): boolean => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a < 30) return true;
      if (mode === 'solid') {
        return colorDist(idx) <= 44;
      }
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      // Neutral light gray or white checkerboard tiles (typical ~180-255, low saturation)
      return min >= 165 && max - min <= 20;
    };

    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const tryPush = (x: number, y: number) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const pos = y * w + x;
      if (visited[pos]) return;
      if (!isBgPixel(pos * 4)) return;
      visited[pos] = 1;
      queue[tail++] = pos;
    };

    // Seed flood fill strictly from outer edges so internal clothing/hair stays intact
    for (let x = 0; x < w; x++) {
      tryPush(x, 0);
      tryPush(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      tryPush(0, y);
      tryPush(w - 1, y);
    }

    while (head < tail) {
      const pos = queue[head++];
      const x = pos % w;
      const y = (pos - x) / w;
      data[pos * 4 + 3] = 0;

      if (x > 0) tryPush(x - 1, y);
      if (x + 1 < w) tryPush(x + 1, y);
      if (y > 0) tryPush(x, y - 1);
      if (y + 1 < h) tryPush(x, y + 1);
    }

    // Soft 1px edge feathering on pixels adjacent to removed background
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const pos = y * w + x;
        if (visited[pos]) continue;
        const idx = pos * 4;
        const shouldFeather =
          mode === 'solid'
            ? colorDist(idx) <= 72
            : Math.min(data[idx], data[idx + 1], data[idx + 2]) >= 145 &&
              Math.max(data[idx], data[idx + 1], data[idx + 2]) -
                Math.min(data[idx], data[idx + 1], data[idx + 2]) <=
                24;
        if (shouldFeather) {
          const hasBgNeighbor =
            visited[pos - 1] ||
            visited[pos + 1] ||
            visited[pos - w] ||
            visited[pos + w];
          if (hasBgNeighbor) {
            data[idx + 3] = Math.round(data[idx + 3] * 0.2);
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  if (faceCrop) {
    const rect = getFaceCropRect(faceCrop, w, h);
    const out = document.createElement('canvas');
    out.width = 160;
    out.height = 160;
    const octx = out.getContext('2d');
    if (octx) {
      octx.drawImage(canvas, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, 160, 160);
      return out.toDataURL('image/png');
    }
  }

  return canvas.toDataURL('image/png');
}

interface CleanPortraitProps {
  src: string;
  alt: string;
  removeCheckerboard?: boolean;
  removeSolidBg?: boolean;
  faceCrop?: CharacterId;
  className?: string;
}

export const CleanPortrait: React.FC<CleanPortraitProps> = ({
  src,
  alt,
  removeCheckerboard = false,
  removeSolidBg = false,
  faceCrop,
  className = '',
}) => {
  const mode: CleanMode = removeSolidBg ? 'solid' : removeCheckerboard ? 'checker' : 'none';
  const cacheKey = `${mode}:${faceCrop ?? 'full'}:${src}`;

  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    if (mode === 'none' && !faceCrop) return src;
    return processedCache.get(cacheKey) ?? src;
  });

  useEffect(() => {
    if (mode === 'none' && !faceCrop) {
      setResolvedSrc(src);
      return;
    }
    const cached = processedCache.get(cacheKey);
    if (cached) {
      setResolvedSrc(cached);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const cleaned = stripBackground(img, mode, faceCrop);
        processedCache.set(cacheKey, cleaned);
        setResolvedSrc(cleaned);
      } catch {
        setResolvedSrc(src);
      }
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, mode, faceCrop, cacheKey]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};

