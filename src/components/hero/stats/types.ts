export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface HeroStatsParticleEffect {
  enableSnapEffect?: boolean;
  particleCount?: number;
  particleSize?: number;
  particleDuration?: number;
  particleColor?: string;
  particleSpeed?: number;
  particleSpread?: number;
  particleOpacity?: number;
  particleGlow?: number;
}

export interface HeroStatsConfig {
  revealStart?: number;
  revealEnd?: number;
  fadeStart?: number;
  fadeEnd?: number;
  mobileGap?: number;
  desktopGap?: number;
  mobileSize?: string;
  desktopSize?: string;
  labelSize?: string;
}
