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
  /**
   * Odometer mode — digits roll into place like a mechanical counter
   * instead of counting up numerically. Each digit gets its own 0–9
   * strip that scrolls to the target position with a staggered delay.
   */
  odometer?: boolean;
}
