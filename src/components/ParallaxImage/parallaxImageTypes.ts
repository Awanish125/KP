import type { CSSProperties } from "react";

export interface ParallaxImageConfig {
  /** Max vertical drift as a fraction of container height (0.12 = ±12%). */
  amplitude: number;
  /** Lerp factor per tick toward the target offset (0–1). */
  lerp: number;
  /** Extra scale on the inner image so parallax never exposes edges. */
  overscan: number;
}

export interface ParallaxImageProps extends Partial<ParallaxImageConfig> {
  src: string;
  alt: string;
  /** next/image `sizes` — always required to avoid layout shift. */
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Aspect ratio of the frame, e.g. "4 / 5". Defaults to 16/10. */
  aspectRatio?: string;
  borderRadius?: string;
}
