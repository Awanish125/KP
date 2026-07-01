// Layout defaults
export const DEFAULT_SPEED = 10;
export const DEFAULT_GAP = 32;
export const DEFAULT_SEPARATOR_ICON = 'dot';

export const SEPARATOR_ICONS: Record<string, string> = {
  dot:     '·',
  diamond: '◆',
  star:    '★',
  dash:    '—',
  slash:   '/',
  arrow:   '→',
  plus:    '+',
};

// Widths (px) cycled through skeleton items so they look varied
export const SKELETON_WIDTHS = [120, 80, 160, 100, 145, 88, 175, 108];

// Animation tuning — tweak here, not inside hooks
export const PARALLAX_X       = 18;   // max px horizontal parallax
export const PARALLAX_Y       = 7;    // max px vertical parallax
export const CENTER_SCALE     = 1.07; // scale applied to the nearest-center item
export const CENTER_OPACITY   = 0.42; // minimum opacity for off-center items
export const RIPPLE_RADIUS    = 175;  // px — cursor radius that triggers ripple
export const RIPPLE_SCALE     = 0.05; // max scale delta from ripple
export const STRETCH_MAX      = 0.07; // max scaleX stretch from velocity
export const TILT_MAX         = 4;    // max rotateX degrees from scroll velocity
export const ROTATE_MAX       = 3.5;  // max rotate degrees from scroll direction
export const COMPRESS_MAX     = 0.08; // max scaleX compression from velocity
