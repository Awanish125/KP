import type { ReactNode } from "react";

export interface HeroMarqueeIconToken {
  type: "icon";
  icon: string;
  size?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
  className?: string;
  margin?: string;
  animation?: "spin" | "pulse" | "none";
}

export interface HeroMarqueeImageToken {
  type: "image";
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  opacity?: number;
  margin?: string;
}

export interface HeroMarqueeTextToken {
  type: "text";
  value: string;
  color?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  fontSize?: string;
  italic?: boolean;
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: string;
  gradient?: string[];
  uppercase?: boolean;
  tracking?: string;
  opacity?: number;
  animation?:
    | "fade"
    | "lift"
    | "slideLeft"
    | "slideRight"
    | "maskReveal"
    | "blur"
    | "scale"
    | "flip"
    | "chars"
    | "punch"
    | "skew"
    | "sweep";   // legacy value — treated as "fade" by the entrance registry
  iconBefore?: HeroMarqueeToken;
  iconAfter?: HeroMarqueeToken;
  separator?: HeroMarqueeToken;
  customClass?: string;
}

export type HeroMarqueeToken =
  | HeroMarqueeIconToken
  | HeroMarqueeImageToken
  | HeroMarqueeTextToken;

export interface HeroMarqueeLayer {
  items: HeroMarqueeTextToken[];
  speed: number;
  direction?: "left" | "right";
  opacity?: number;
  y?: number;
  scale?: number;
  gap?: number;
  repeat?: number;
  delay?: number;
  className?: string;
  separator?: HeroMarqueeToken;
}

export interface HeroMarqueeGlass {
  color?: string;
  opacityStart?: number;
  opacityMid?: number;
  opacityMax?: number;
  blurStart?: number;
  blurMid?: number;
  blurMax?: number;
}

export interface HeroMarqueeParticleEffect {
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

export interface HeroMarqueeConfig {
  travelFactor?: number;
  textBandY?: string;
  layers: HeroMarqueeLayer[];
  glass?: HeroMarqueeGlass;
  particleEffect?: HeroMarqueeParticleEffect;
  billboardGlow?: {
    x?: string;
    y?: string;
    color?: string;
  };
}

export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface PinnedHeroMarqueeProps {
  marquee?: HeroMarqueeConfig | null;
  stats?: HeroStat[] | null;
  children: ReactNode;
}
