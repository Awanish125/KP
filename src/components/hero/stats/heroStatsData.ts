import type { HeroStatsConfig, HeroStatsParticleEffect } from "./types";

export const HERO_STATS_CONFIG: Required<HeroStatsConfig> = {
  // Count-up starts just as marquee rows are finishing their exit (ROW2_EXIT_END = 0.78).
  // Slight overlap so there's never a dead moment on screen.
  revealStart: 0.76,
  revealEnd:   0.94,

  // Stats never fade — billboard stays visible until the pin releases.
  fadeStart: 1.1,
  fadeEnd:   1.1,

  mobileGap:   8,
  desktopGap:  28,

  // Large enough to read clearly against the billboard.
  mobileSize:  "2rem",
  desktopSize: "3.5rem",
  labelSize:   "0.6rem",
};

export const HERO_STATS_PARTICLE_DEFAULTS: Required<HeroStatsParticleEffect> = {
  enableSnapEffect: true,
  particleCount: 10,
  particleSize: 4,
  particleDuration: 0.85,
  particleColor: "rgba(255,255,255,0.7)",
  particleSpeed: 1,
  particleSpread: 30,
  particleOpacity: 0.75,
  particleGlow: 0.16,
};
