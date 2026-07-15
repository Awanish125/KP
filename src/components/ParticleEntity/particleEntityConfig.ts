/**
 * particleEntityConfig.ts
 *
 * All tuning knobs for the scroll-morphing particle backdrop.
 * Colors intentionally mirror the brand icon colors (kp-orange / kp-blue)
 * and switch with the site theme (.dark class on <html>).
 */

export const PARTICLE_COUNT = { desktop: 9000, mobile: 3200 } as const;

/** Shape order the scroll walks through (see particleShapes.ts).
 *  All but the wordmark are sampled from real SVGs in public/shapes/. */
export const SHAPE_NAMES = [
  "billboard", // hero — the billboard artwork SVG
  "skyline",   // scale — the city skyline SVG
  "india",     // reach — the India map SVG (warm states tint orange)
  "wordmark",  // brand — "KIRAN PUBLICITY" (PUBLICITY tinted orange)
  "logo",      // finale — the actual KP logo SVG, exact orange/blue split
] as const;

export const SHAPE_COUNT = SHAPE_NAMES.length;

/**
 * Per-shape base particle color + the orange accent tint, per theme.
 * Base colors follow the brand logo: KIRAN blue #1555C2 / kp-blue #0D5AA7;
 * accent is always the brand orange (#F5821F family) — same as the icons.
 * fadeMin = opacity floor at screen center (content safe zone).
 */
export const PALETTES = {
  dark: {
    shapes: ["#F58320", "#4A90D9", "#5B9BD5", "#4A90D9", "#4A90D9"],
    accent: "#F58320",
    // small + near-solid = crisp; large + translucent = the blur we removed
    opacity: 0.85,
    sizeMul: 0.5,
    fadeMin: 0.35,
  },
  light: {
    // deeper, high-contrast colors so dots read against a white/cream page
    shapes: ["#B85000", "#08408A", "#0F55A8", "#08408A", "#08408A"],
    accent: "#C86010",
    opacity: 0.94,
    sizeMul: 0.58,
    fadeMin: 0.32,
  },
} as const;

export const ENTITY_CONFIG = {
  /** Camera distance — shapes are authored to fit this frustum (fov 50). */
  cameraZ: 16,
  /** Scroll fraction of the page where the morph journey starts / ends.
   *  The pinned hero covers the first ~15% of the document, so the
   *  billboard shape holds through it and the first morph begins as the
   *  hero releases. */
  scrollStart: 0.06,
  scrollEnd: 0.96,
  /** Inertia on the morph scrub — lower = heavier, driftier. */
  morphLerp: 0.055,
  /** Constant breathing amplitude (kept small so shapes stay crisp). */
  idleAmp: 0.018,
  /** Scatter amplitude at the middle of a morph. */
  stormAmp: 0.85,
  /** Noise wavelength — lower = smoother, more liquid. */
  flowFreq: 0.22,
  /** Cursor repulsion field (world units). */
  mouse: { radius: 2.4, force: 0.9, lerp: 0.08 },
  /** Slow ambient yaw of the whole cloud. */
  wobble: { amp: 0.1, speed: 0.05 },
} as const;
