import type { ContactGlobeConfig } from "./contactGlobeTypes";

export const CONTACT_GLOBE_DEFAULTS: ContactGlobeConfig = {
  pointCount: 1600,
  radius: 2,
  // Roughly central Maharashtra — the head-office region.
  marker: { lat: 19.6, lng: 76.0 },
  parallax: 0.45,
  lerp: 0.06,
  wobble: 0.35,
};
