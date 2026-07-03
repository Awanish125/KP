import type { HeroStat as HeroMarqueeStat } from "../marqueeTypes";

export type HeroStat = HeroMarqueeStat;

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

export interface HeroStatsProps {
  heroStats: HeroStat[];
  progress: number;
  className?: string;
  config?: HeroStatsConfig;
  particleEffect?: HeroStatsParticleEffect;
}
