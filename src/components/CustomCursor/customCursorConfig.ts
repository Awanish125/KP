import type { CustomCursorConfig } from "./customCursorTypes";

export const CUSTOM_CURSOR_DEFAULTS: CustomCursorConfig = {
  dotSize: 7,
  ringSize: 38,
  lerp: 0.16,
  hoverScale: 1.9,
  interactiveSelector:
    "a, button, [role='button'], input, select, textarea, label, [data-cursor]",
};
