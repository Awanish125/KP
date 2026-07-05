import type { CSSProperties, ReactNode } from "react";

export interface SectionRevealConfig {
  /** Distance (px) children travel up as they enter. */
  distance: number;
  /** Seconds between each direct child starting. */
  stagger: number;
  /** Tween duration in seconds. */
  duration: number;
  /** GSAP ease string. */
  ease: string;
  /** IntersectionObserver rootMargin — when the reveal fires. */
  rootMargin: string;
}

export interface SectionRevealProps extends Partial<SectionRevealConfig> {
  children: ReactNode;
  /** Animate direct children with a stagger (true) or the wrapper as one block (false). */
  staggerChildren?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  id?: string;
}
