// ── Entrance ──────────────────────────────────────────────────────────────────
export const ENTRANCE_DURATION     = 1.0;
export const ENTRANCE_EASE         = 'power3.out';
/** Default gap between sequential images (seconds). Tune via staggerAmount prop. */
export const ENTRANCE_STAGGER      = 0.18;

export const START_SCALE           = 0.55;
export const START_BLUR            = 14;     // px

// ── Floating ──────────────────────────────────────────────────────────────────
export const FLOAT_AMP_Y           = 11;    // px max vertical amplitude
export const FLOAT_AMP_X           = 4;     // px max horizontal amplitude
export const FLOAT_DURATION_MIN    = 2.8;   // seconds per half-cycle
export const FLOAT_DURATION_MAX    = 4.2;
/** Extra time (s) after entrance before floating kicks in — prevents both running together. */
export const FLOAT_ENTRANCE_BUFFER = 0.5;

// ── Mouse parallax ────────────────────────────────────────────────────────────
export const MOUSE_PARALLAX_MAX    = 20;    // px at full depth
export const MOUSE_LERP_DURATION   = 0.8;   // quickTo smoothing seconds

// ── Scroll parallax ───────────────────────────────────────────────────────────
export const SCROLL_PARALLAX_MAX   = 50;    // px max vertical shift

// ── Depth tiers ───────────────────────────────────────────────────────────────
export const DEPTH_CONFIG = {
  foreground: { mouseStrength: 1.0,  floatStrength: 1.3, scrollStrength: 1.0  },
  middle:     { mouseStrength: 0.55, floatStrength: 0.8, scrollStrength: 0.55 },
  background: { mouseStrength: 0.22, floatStrength: 0.4, scrollStrength: 0.2  },
} as const;

// ── Preset-specific ───────────────────────────────────────────────────────────
/**
 * cameraZoom: blur is the primary depth cue (not scale).
 * Large scale = huge compositor layers = lag. Keep ≤ 2×.
 */
export const CAMERA_ZOOM_SCALE_START = 1.6;  // 1.6× — cinematic but GPU-safe
export const CAMERA_ZOOM_BLUR_START  = 30;   // px — heavy blur sells "close to lens"

export const EXPLODE_SCALE_START     = 2.8;  // 2.8× — dramatic without huge layers
export const DEPTH_DROP_SCALE_START  = 1.3;
export const ORBIT_RADIUS_FACTOR     = 0.28; // fraction of min(vw, vh)
