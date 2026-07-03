/**
 * heroConfig.ts — Master animation timeline for the Hero section.
 *
 * All chapter boundaries are normalised scroll progress values (0–1).
 * Editing this file is the only change required to re-time any chapter.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  SCROLL 1  (0 → HERO_PUSH_END ≈ 0.28)                              │
 * │  Hero headline/text fades out. Marquee is INVISIBLE.                │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │  SCROLL 2  (HERO_PUSH_END → MARQUEE_HOLD_END ≈ 0.56)               │
 * │  Heading is gone. Marquee rows fade in and hold — fully readable.   │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │  SCROLL 3  (MARQUEE_HOLD_END → ROW2_EXIT_END ≈ 0.78)               │
 * │  Rows exit simultaneously:                                           │
 * │    Row 0 (top):    slides left off-screen                           │
 * │    Row 1 (middle): fades in place                                   │
 * │    Row 2 (bottom): slides left off-screen (tiny cascade delay)      │
 * │  Statistics count up as rows clear. Billboard is the backdrop.      │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │  SCROLL 3 tail (ROW2_EXIT_END → 1.0)                                │
 * │  Stats hold. Pin releases. Next section scrolls in underneath.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export const HERO_CONFIG = {
  // ── Chapter 1: hero content exit ──────────────────────────────────────
  /** Heading/subtitle/description fully faded by this progress. */
  HERO_PUSH_END: 0.28,

  // ── Chapter 2: marquee entrance + hold ────────────────────────────────
  /**
   * Rows are fully visible (opacity 1) by this progress.
   * Entrance spans from HERO_PUSH_END to MARQUEE_ENTER_END.
   * Keep the gap small for a crisp appearance.
   */
  MARQUEE_ENTER_END: 0.40,

  /**
   * Rows stop holding and begin their exit at this progress.
   * The window from MARQUEE_ENTER_END to MARQUEE_HOLD_END is the
   * readable pause — long enough to read, short enough to feel alive.
   */
  MARQUEE_HOLD_END: 0.56,

  // ── Chapter 3: marquee exit ────────────────────────────────────────────
  /** Top and middle rows fully exited (off-screen or invisible). */
  ROW_EXIT_END: 0.74,

  /**
   * Bottom row exits slightly later for a cinematic cascade.
   * Must be ≤ heroStatsData.revealStart to avoid overlap with stats.
   */
  ROW2_EXIT_END: 0.78,

  // ── Glass morphism (builds as heading fades) ───────────────────────────
  GLASS_DEFAULT: {
    color:        "rgba(255,255,255,0.08)" as const,
    opacityStart: 0,
    opacityMid:   0.16,
    opacityMax:   0.16,
    blurStart:    0,
    blurMid:      22,
    blurMax:      22,
  },

  // ── Marquee layout ─────────────────────────────────────────────────────
  /** Z-depth offsets for the 3D perspective stack (top → bottom row). */
  LAYER_ROW_DEPTHS: [160, 72, 0] as const,

  /**
   * Number of word-list copies inside each track.
   * Keep at 1 for the centered readable layout.
   */
  REPEAT_COUNT: 1,
} as const;
