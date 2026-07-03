import type { HeroStatsConfig, HeroStatsParticleEffect } from "./types";

export const HERO_STATS_CONFIG: Required<HeroStatsConfig> = {
  revealStart: 0.9,
  revealEnd: 1,
  fadeStart: 0.96,
  fadeEnd: 1,
  mobileGap: 10,
  desktopGap: 24,
  mobileSize: "0.76rem",
  desktopSize: "0.9rem",
  labelSize: "0.65rem",
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
