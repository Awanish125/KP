import type { SwiperModule } from "swiper/types";

export type CarouselEffectName =
  | "coverflow"
  | "cube"
  | "flip"
  | "fade"
  | "cards"
  | "stack"
  | "vision"
  | "premium"
  | "cinematic"
  | "gallery"
  | "wheel";

export interface CarouselEffectConfig {
  /** Swiper modules required to render this effect. */
  modules: SwiperModule[];
  /** Props forwarded straight onto <Swiper>. */
  swiperProps: Record<string, unknown>;
}

export interface CarouselProps {
  effect?: CarouselEffectName;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  enableKeyboard?: boolean;
  enableMouseWheel?: boolean;
  className?: string;
  children: React.ReactNode[];
}
