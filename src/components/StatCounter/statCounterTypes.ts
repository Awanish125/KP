import type { CSSProperties } from "react";

export interface StatCounterConfig {
  /** Count-up duration in seconds. */
  duration: number;
  ease: string;
  rootMargin: string;
}

export interface StatCounterProps extends Partial<StatCounterConfig> {
  value: number;
  suffix?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Styles for the number itself (font, size). */
  numberClassName?: string;
  labelClassName?: string;
}
