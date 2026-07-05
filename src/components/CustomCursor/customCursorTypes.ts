export interface CustomCursorConfig {
  /** Dot diameter in px. */
  dotSize: number;
  /** Ring diameter in px. */
  ringSize: number;
  /** Ring lerp toward the pointer per tick (0–1). */
  lerp: number;
  /** Ring scale when hovering an interactive element. */
  hoverScale: number;
  /** Selector that triggers the hover state. */
  interactiveSelector: string;
}

export type CustomCursorProps = Partial<CustomCursorConfig>;
