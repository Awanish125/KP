import type { ReactNode } from "react";

export interface PageTransitionConfig {
  /** Sweep duration in seconds. */
  duration: number;
  /** Delay before the sweep starts revealing. */
  delay: number;
}

export interface PageTransitionProps extends Partial<PageTransitionConfig> {
  children: ReactNode;
}
