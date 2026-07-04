import type { CSSProperties } from "react";

export interface ScrollProgressConfig {
  /** Bar thickness in px. */
  height: number;
  /** CSS color — defaults to the KP orange token. */
  color: string;
  zIndex: number;
}

export interface ScrollProgressProps extends Partial<ScrollProgressConfig> {
  className?: string;
  style?: CSSProperties;
}
