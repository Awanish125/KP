/**
 * Entrance animation presets.
 *
 * PERFORMANCE CONTRACT:
 *   - fromVars must use ONLY transform properties (x, y, scale, rotation)
 *     plus opacity and filter.
 *   - Scale must stay ≤ 3× to avoid creating oversized compositor layers.
 *   - filter:blur() is cleared with clearProps after animation completes.
 *   - No layout-triggering properties (width, height, top, left, margin …).
 */
import type { AnimationPreset, ImageData } from '../types';
import {
  START_SCALE,
  START_BLUR,
  ENTRANCE_EASE,
  ENTRANCE_DURATION,
  EXPLODE_SCALE_START,
  CAMERA_ZOOM_SCALE_START,
  CAMERA_ZOOM_BLUR_START,
  DEPTH_DROP_SCALE_START,
  ORBIT_RADIUS_FACTOR,
} from '../constants';
import { generateStartPosition, generateStartRotation } from './generateStartPosition';

// ── Stable per-index pseudo-random (avoids Math.random() across renders) ──────
function prand(index: number, offset = 0): number {
  const seed = ((index + 1) * 9301 + (offset + 1) * 49297) % 233280;
  return seed / 233280;
}

function parsePx(css: string, containerSize: number): number {
  if (css.endsWith('%'))  return parseFloat(css) / 100 * containerSize;
  return parseFloat(css);
}

// ── Shared "to" vars — the state every image must reach ───────────────────────
export function buildToVars(image: ImageData): gsap.TweenVars {
  return {
    x:          0,
    y:          0,
    scale:      1,
    opacity:    1,
    rotation:   image.rotation ?? 0,
    filter:     'blur(0px)',
    clearProps: 'filter',
  };
}

// ── Per-image preset result ───────────────────────────────────────────────────
export interface PresetResult {
  fromVars:     gsap.TweenVars;
  toOverrides?: Partial<gsap.TweenVars>;
  ease?:        string;
  duration?:    number;
  /** Sort key for stagger order (lower = animates first). */
  staggerOrder: number;
}

export type PresetOptions = {
  showRotation:  boolean;
  showBlur:      boolean;
  showScale:     boolean;
  showFade:      boolean;
  showOvershoot: boolean;
  showBounce:    boolean;
};

// ── Presets ───────────────────────────────────────────────────────────────────

function assemblePreset(
  index: number, _total: number, image: ImageData,
  cw: number, ch: number, opts: PresetOptions,
): PresetResult {
  const { x: sx, y: sy } = generateStartPosition(image.x, image.y, cw, ch);
  const startRot = opts.showRotation
    ? generateStartRotation(image.rotation ?? 0, index)
    : (image.rotation ?? 0);
  const ease = opts.showBounce
    ? 'elastic.out(0.7, 0.4)'
    : opts.showOvershoot
      ? 'back.out(1.4)'
      : ENTRANCE_EASE;
  return {
    fromVars: {
      x:        sx,
      y:        sy,
      scale:    opts.showScale ? START_SCALE : 1,
      opacity:  opts.showFade  ? 0           : 1,
      rotation: startRot,
      filter:   opts.showBlur  ? `blur(${START_BLUR}px)` : 'none',
    },
    ease,
    staggerOrder: index,
  };
}

function explodePreset(
  index: number, _total: number, image: ImageData,
  cw: number, ch: number, opts: PresetOptions,
): PresetResult {
  // Starts near section centre at elevated scale; scatters to final position.
  // Scale capped at EXPLODE_SCALE_START (≤ 3×) — stays GPU-safe.
  const finalXPx = parsePx(image.x, cw);
  const finalYPx = parsePx(image.y, ch);
  const jitter   = 50;
  return {
    fromVars: {
      x:        cw / 2 - finalXPx + (prand(index, 0) - 0.5) * jitter,
      y:        ch / 2 - finalYPx + (prand(index, 1) - 0.5) * jitter,
      scale:    EXPLODE_SCALE_START,
      opacity:  opts.showFade ? 0.1 : 0.6,
      rotation: opts.showRotation
        ? (prand(index, 2) - 0.5) * 45
        : (image.rotation ?? 0),
      filter:   opts.showBlur ? 'blur(6px)' : 'none',
    },
    ease:         'power4.out',
    duration:     1.2,
    staggerOrder: index,
  };
}

function cameraZoomPreset(
  index: number, _total: number, image: ImageData,
  cw: number, ch: number, opts: PresetOptions,
): PresetResult {
  /**
   * "Throwing card" effect — cinematic, GPU-safe, visually heavy.
   *
   * EVERY card starts near the viewport centre at a large scale (50–85% of
   * viewport width) with heavy blur and near-zero opacity.  Then it flies to
   * its final corner/edge position while shrinking, sharpening and appearing —
   * exactly like a card being thrown across a table.
   *
   * Scale performance note: CSS filter:blur() is computed at the element's
   * NATURAL size (e.g. 150 px), then transform:scale() stretches the result
   * on the compositor layer for free.  A 150 px image at scale(5) uses the
   * same GPU memory as at scale(1) — texture size is unchanged.
   * Perceived blur = blurValue × scaleStart (e.g. 14 px × 5 = 70 px visual blur).
   */
  const finalXPx = parsePx(image.x, cw);
  const finalYPx = parsePx(image.y, ch);

  // Scale so the card fills 55–85 % of the viewport width on entry.
  const targetFraction = 0.55 + prand(index, 5) * 0.30;   // 55–85 %
  const rawScale       = (cw * targetFraction) / image.width;
  const scaleStart     = Math.min(8.0, Math.max(3.5, rawScale));

  // Blur computed on natural-size element → cheap.
  // Perceived blur at scaleStart ≈ blurVal × scale ≈ 14 × 5 = 70 px → near-invisible.
  const blurVal = 12 + prand(index, 2) * 5; // 12–17 px

  // Cards originate near the centre, with small random offset per card.
  const jx = (prand(index, 0) - 0.5) * cw * 0.12;
  const jy = (prand(index, 1) - 0.5) * ch * 0.10;

  // Exaggerated rotation during the throw; settles at image.rotation.
  const rotSpin = opts.showRotation ? (prand(index, 3) - 0.5) * 38 : 0;

  return {
    fromVars: {
      x:        cw / 2 - finalXPx + jx,   // centre → final position (the "throw")
      y:        ch / 2 - finalYPx + jy,
      scale:    opts.showScale ? scaleStart : 1,
      opacity:  opts.showFade  ? 0           : 1,
      rotation: (image.rotation ?? 0) + rotSpin,
      filter:   opts.showBlur ? `blur(${blurVal}px)` : 'none',
    },
    // power4.out: card leaves the hand fast, decelerates gracefully onto the table.
    ease:         'power4.out',
    duration:     1.0,
    // Shuffle stagger order so cards fly out in a natural-feeling sequence.
    staggerOrder: prand(index, 7),
  };
}

function depthDropPreset(
  index: number, _total: number, image: ImageData,
  _cw: number, ch: number, opts: PresetOptions,
): PresetResult {
  const ease = opts.showBounce
    ? 'elastic.out(0.75, 0.35)'
    : opts.showOvershoot
      ? 'back.out(1.6)'
      : 'power3.out';
  return {
    fromVars: {
      x:        (prand(index, 0) - 0.5) * 55,
      y:        -ch * 0.65,
      scale:    opts.showScale ? DEPTH_DROP_SCALE_START + prand(index) * 0.15 : 1,
      opacity:  opts.showFade ? 0 : 1,
      rotation: opts.showRotation
        ? (image.rotation ?? 0) + (prand(index, 1) - 0.5) * 45
        : (image.rotation ?? 0),
      filter:   opts.showBlur ? `blur(${START_BLUR * 0.6}px)` : 'none',
    },
    ease,
    duration:     1.15,
    staggerOrder: index,
  };
}

function orbitPreset(
  index: number, total: number, image: ImageData,
  cw: number, ch: number, opts: PresetOptions,
): PresetResult {
  const finalXPx = parsePx(image.x, cw);
  const finalYPx = parsePx(image.y, ch);
  const r        = Math.min(cw, ch) * ORBIT_RADIUS_FACTOR;
  const angle    = (index / total) * Math.PI * 2;

  return {
    fromVars: {
      x:        cw / 2 + Math.cos(angle) * r - finalXPx,
      y:        ch / 2 + Math.sin(angle) * r - finalYPx,
      scale:    opts.showScale ? 0.2 : 1,
      opacity:  opts.showFade ? 0 : 1,
      rotation: opts.showRotation ? angle * (180 / Math.PI) : (image.rotation ?? 0),
    },
    ease:         'power2.inOut',
    duration:     1.3,
    staggerOrder: index,
  };
}

function wavePreset(
  index: number, _total: number, image: ImageData,
  _cw: number, ch: number, opts: PresetOptions,
): PresetResult {
  const fromBelow = prand(index) > 0.4;
  return {
    fromVars: {
      x:        0,
      y:        fromBelow ? ch * 0.4 : -ch * 0.3,
      scale:    opts.showScale ? START_SCALE + 0.1 : 1,
      opacity:  opts.showFade ? 0 : 1,
      rotation: opts.showRotation
        ? (image.rotation ?? 0) + (prand(index, 1) - 0.5) * 30
        : (image.rotation ?? 0),
      filter:   opts.showBlur ? `blur(${START_BLUR * 0.6}px)` : 'none',
    },
    ease:         opts.showOvershoot ? 'back.out(1.2)' : ENTRANCE_EASE,
    staggerOrder: parsePx(image.x, 10000), // sort left → right
  };
}

function cascadePreset(
  index: number, _total: number, image: ImageData,
  _cw: number, ch: number, opts: PresetOptions,
): PresetResult {
  return {
    fromVars: {
      x:        (prand(index, 0) - 0.5) * 40,
      y:        ch * 0.5,
      scale:    opts.showScale ? 0.45 : 1,
      opacity:  opts.showFade ? 0 : 1,
      rotation: opts.showRotation
        ? (image.rotation ?? 0) + (prand(index, 1) - 0.5) * 20
        : (image.rotation ?? 0),
      filter:   opts.showBlur ? `blur(${START_BLUR}px)` : 'none',
    },
    ease:         opts.showOvershoot ? 'back.out(1.3)' : ENTRANCE_EASE,
    duration:     0.95,
    staggerOrder: -image.width, // larger first (more negative = earlier)
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

const NAMED_PRESETS: AnimationPreset[] = [
  'assemble', 'explode', 'cameraZoom', 'depthDrop', 'orbit', 'wave', 'cascade',
];

export function resolvePreset(preset: AnimationPreset, imageCount: number): AnimationPreset {
  if (preset !== 'random') return preset;
  // Stable seed so HMR / StrictMode double-invoke produces the same value.
  return NAMED_PRESETS[(imageCount * 7 + 3) % NAMED_PRESETS.length];
}

export function getPresetResult(
  preset:         AnimationPreset,
  index:          number,
  total:          number,
  image:          ImageData,
  containerWidth: number,
  containerHeight:number,
  opts:           PresetOptions,
): PresetResult {
  switch (preset) {
    case 'explode':    return explodePreset   (index, total, image, containerWidth, containerHeight, opts);
    case 'cameraZoom': return cameraZoomPreset(index, total, image, containerWidth, containerHeight, opts);
    case 'depthDrop':  return depthDropPreset (index, total, image, containerWidth, containerHeight, opts);
    case 'orbit':      return orbitPreset     (index, total, image, containerWidth, containerHeight, opts);
    case 'wave':       return wavePreset      (index, total, image, containerWidth, containerHeight, opts);
    case 'cascade':    return cascadePreset   (index, total, image, containerWidth, containerHeight, opts);
    default:           return assemblePreset  (index, total, image, containerWidth, containerHeight, opts);
  }
}

/** Duration of the full entrance sequence (last image finishes at this time). */
export function totalEntranceDuration(
  imageCount:    number,
  staggerAmount: number,
  baseDuration:  number,
): number {
  return Math.max(0, imageCount - 1) * staggerAmount + baseDuration;
}
