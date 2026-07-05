import type { CSSProperties, ReactNode } from "react";

export interface MagneticButtonConfig {
  /** How far the element pulls toward the cursor (0–1 of the distance). */
  strength: number;
  /** Inner content moves a bit more than the shell for depth. */
  innerStrength: number;
  /** Seconds for the pull to catch up. */
  duration: number;
}

export interface MagneticButtonProps extends Partial<MagneticButtonConfig> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}
