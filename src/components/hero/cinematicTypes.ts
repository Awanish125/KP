export type HeroIntroState = "Idle" | "Playing" | "Completed" | "Resetting";

export interface HeroIntroConfig {
  camera: {
    initialZoom: number;
    peakZoom: number;
    initialOffsetX: number;
  };
  timing: {
    contentExit: number;
    cameraPush: number;
    cameraReturn: number;
    statsReveal: number;
    counter: number;
    marqueeReveal: number;
  };
  easing: {
    exit: string;
    camera: string;
    reveal: string;
  };
}

export interface HeroStatsPresentation {
  eyebrow: string;
  heading: string;
  location: string;
}

export interface EditorialMarqueeItem {
  text: string;
  color?: string;
  gradient?: string[];
  outline?: boolean;
  outlineColor?: string;
  opacity?: number;
  fontWeight?: number;
  fontSize?: string;
  letterSpacing?: string;
  italic?: boolean;
  spacing?: string;
  animationDelay?: number;
  animationOrder?: number;
}

export interface EditorialMarqueeConfig {
  pixelsPerSecond?: number;
  hoverSpeedFactor?: number;
  gap: number;
  separator?: string;
  separatorColor?: string;
  revealDelay: number;
  items: EditorialMarqueeItem[];
}
