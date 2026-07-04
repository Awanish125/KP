import type { CSSProperties } from "react";

export type TextRevealMode = "words" | "clip";

export interface TextRevealConfig {
  /** Word-by-word rise, or a single clip-path wipe. */
  mode: TextRevealMode;
  duration: number;
  stagger: number;
  ease: string;
  /** Delay (s) after entering view before the reveal starts. */
  delay: number;
  rootMargin: string;
}

export interface TextRevealProps extends Partial<TextRevealConfig> {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}
