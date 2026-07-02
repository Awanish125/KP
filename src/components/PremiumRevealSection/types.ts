export type DepthTier = 'foreground' | 'middle' | 'background';

/**
 * 8 entrance-animation presets + "random".
 *
 * - assemble   : fly in from nearest viewport edge
 * - explode    : burst outward from large scale near center
 * - cameraZoom : each image starts huge / blurred and shrinks into place (cinematic pull-back)
 * - depthDrop  : fall from above with organic overshoot
 * - orbit      : images expand outward from a circular cluster around the section center
 * - wave       : left-to-right (or top-to-bottom) staggered entrance
 * - cascade    : largest images first, then progressively smaller
 * - random     : randomly choose one of the above on each mount
 */
export type AnimationPreset =
  | 'assemble'
  | 'explode'
  | 'cameraZoom'
  | 'depthDrop'
  | 'orbit'
  | 'wave'
  | 'cascade'
  | 'random';

export interface ImageData {
  src: string;
  alt?: string;
  /** CSS left value – e.g. "15%" or "120px". Final resting position. */
  x: string;
  /** CSS top value – e.g. "25%" or "80px". Final resting position. */
  y: string;
  /** Width of the image in pixels. */
  width: number;
  /** Final rotation in degrees. Entrance animates from a generated start value. */
  rotation?: number;
  /** Stacking order – also used to infer depth tier when `depth` is omitted. */
  zIndex?: number;
  /** Explicit depth tier; overrides zIndex-based inference. */
  depth?: DepthTier;
  /** Render a coloured glow halo behind this image when `showGlow` is on. */
  glowColor?: string;
}

export interface PremiumRevealSectionProps {
  /** Decorative floating images. When empty only children are rendered. */
  images?: ImageData[];
  children?: React.ReactNode;
  className?: string;
  /** Minimum section height (CSS value). Defaults to "100vh". */
  minHeight?: string;

  // ── Master switch ────────────────────────────────────────────────────────────
  /** Set to false to disable all GSAP animations (images render in final state). */
  animationEnabled?: boolean;

  // ── Animation style ──────────────────────────────────────────────────────────
  /** Which entrance animation preset to use. Defaults to "assemble". */
  animationStyle?: AnimationPreset;

  // ── Repeat control ───────────────────────────────────────────────────────────
  /**
   * When true the entrance animation replays every time the section re-enters
   * the viewport. When false (default) it plays only once.
   */
  repeatOnScroll?: boolean;

  // ── ScrollTrigger thresholds ─────────────────────────────────────────────────
  /** GSAP ScrollTrigger `start` value. Default: "top 80%". */
  scrollStart?: string;
  /** GSAP ScrollTrigger `end` value (used for scroll-parallax range). Default: "bottom top". */
  scrollEnd?: string;

  // ── Entrance feature flags ───────────────────────────────────────────────────
  showEntranceAnimation?: boolean;
  showBlurEffect?:        boolean;
  showScaleAnimation?:    boolean;
  showFadeAnimation?:     boolean;
  showRotation?:          boolean;
  showStaggerAnimation?:  boolean;
  showOvershoot?:         boolean;
  showBounceEffect?:      boolean;
  /** Small scale-punch + rotation-wiggle when each card lands. Default: false. */
  showLandingJerk?:       boolean;
  /**
   * Gap between images in the stagger (seconds). Lower = more images animate
   * at once. Higher = one-at-a-time. Default: 0.18.
   * Set to roughly `animationDuration` for fully sequential reveal.
   */
  staggerAmount?:         number;
  /**
   * Duration of each image's entrance tween (seconds). Overrides the
   * preset's built-in default. Default: 1.0.
   * Lower = snappier (0.4–0.6), Higher = slower/cinematic (1.2–2.0).
   */
  animationDuration?:     number;

  // ── Post-reveal motion ───────────────────────────────────────────────────────
  showFloatingAnimation?: boolean;
  showMouseParallax?:     boolean;
  showScrollParallax?:    boolean;
  showDepthEffect?:       boolean;
  showHoverInteraction?:  boolean;

  // ── Visual effects ───────────────────────────────────────────────────────────
  showGlow?:               boolean;
  showPerspective?:        boolean;
  showBackgroundGradient?: boolean;
  showNoiseTexture?:       boolean;

  // ── Background ───────────────────────────────────────────────────────────────
  /** Tailwind background-colour class, e.g. "bg-white dark:bg-secondary". */
  backgroundColorClass?: string;
  /** Tailwind gradient class, e.g. "bg-gradient-to-br from-purple-900 to-slate-900". */
  backgroundGradientClass?: string;
}
