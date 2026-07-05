import type { HorizontalScrollGalleryConfig } from "./horizontalScrollGalleryTypes";

export const HORIZONTAL_SCROLL_GALLERY_DEFAULTS: HorizontalScrollGalleryConfig = {
  label: "Recent Placements",
  heading: "Scroll sideways through the streets.",
  // Shorter pin + tighter lerp: the section must always feel connected to
  // the wheel — a long, loosely-coupled pin reads as "the page froze".
  vhPerItem: 0.38,
  lerp: 0.18,
};
