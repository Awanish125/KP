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
   * Reference: last word (index 10 globally) finishes its entrance at
   * HERO_PUSH_END + 10 × WORD_STAGGER + WORD_ENTRANCE_WINDOW ≈ 0.53.
   * Set slightly above that so the hold window starts clean.
   */
  MARQUEE_ENTER_END: 0.54,

  /**
   * Rows stop holding and begin their exit at this progress.
   * Hold window (0.54 → 0.62) is the readable pause.
   */
  MARQUEE_HOLD_END: 0.62,

  // ── Chapter 3: marquee exit ────────────────────────────────────────────
  /** Top and middle rows fully exited (off-screen or invisible). */
  ROW_EXIT_END: 0.80,

  /**
   * Bottom row exits slightly later for a cinematic cascade.
   * Stats begin revealing (revealStart ≈ 0.76) before this, giving
   * a smooth overlap between row exit and count-up.
   */
  ROW2_EXIT_END: 0.84,

  // ── Per-word stagger entrance ──────────────────────────────────────────
  /** Progress gap between each word's entrance start (global stagger). */
  WORD_STAGGER: 0.015,
  /** How long a single word takes to complete its entrance animation. */
  WORD_ENTRANCE_WINDOW: 0.10,

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
  LAYER_ROW_DEPTHS: [60, 72, 0] as const,

  /**
   * Number of word-list copies inside each track.
   * Keep at 1 for the centered readable layout.
   */
  REPEAT_COUNT: 1,
} as const;
