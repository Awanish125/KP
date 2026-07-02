import { EffectCoverflow, EffectCube, EffectFade, EffectFlip, EffectCards } from "swiper/modules";
import type { CarouselEffectConfig, CarouselEffectName } from "../types/carousel";

/**
 * One registry, one place to add a new effect. Every effect Swiper already
 * ships (coverflow / cube / flip / fade / cards) is used as-is via its
 * official module — no reason to hand-roll 3D carousel math a maintained
 * package already solves. Names beyond Swiper's own vocabulary (`vision`,
 * `premium`, `cinematic`, `gallery`, `stack`, `wheel`) are curated presets
 * that reuse those same modules with different tuning, so `<Carousel effect="vision" />`
 * "just works" without a new implementation.
 */
const REGISTRY: Record<CarouselEffectName, CarouselEffectConfig> = {
  // No rotation at all — cards recede purely via depth + scale (modifier
  // amplifies how aggressively off-center slides shrink/push back). This is
  // the "trending slider" coverflow recipe: flatter, punchier depth than a
  // tilted cover-flow, and it reads as more premium at a glance.
  coverflow: {
    modules: [EffectCoverflow],
    swiperProps: {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      loop: true,
      coverflowEffect: { rotate: 0, stretch: 0, depth: 100, modifier: 2.5, slideShadows: false },
    },
  },
  // VisionOS-style: shallower rotation, deeper spacing, gentler curve.
  vision: {
    modules: [EffectCoverflow],
    swiperProps: {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      coverflowEffect: { rotate: 18, stretch: -10, depth: 380, modifier: 1.1, slideShadows: false },
    },
  },
  // Apple-product-page feel: tighter rotation, punchier depth.
  premium: {
    modules: [EffectCoverflow],
    swiperProps: {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      coverflowEffect: { rotate: 28, stretch: 0, depth: 320, modifier: 1.3, slideShadows: false },
    },
  },
  cinematic: {
    modules: [EffectCoverflow],
    swiperProps: {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      coverflowEffect: { rotate: 45, stretch: -20, depth: 450, modifier: 1, slideShadows: true },
    },
  },
  gallery: {
    modules: [EffectCoverflow],
    swiperProps: {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      coverflowEffect: { rotate: 22, stretch: 0, depth: 200, modifier: 1, slideShadows: false },
    },
  },
  cube: {
    modules: [EffectCube],
    swiperProps: {
      effect: "cube",
      cubeEffect: { shadow: true, slideShadows: true, shadowOffset: 20, shadowScale: 0.94 },
    },
  },
  flip: {
    modules: [EffectFlip],
    swiperProps: { effect: "flip", flipEffect: { slideShadows: true, limitRotation: true } },
  },
  fade: {
    modules: [EffectFade],
    swiperProps: { effect: "fade", fadeEffect: { crossFade: true } },
  },
  cards: {
    modules: [EffectCards],
    swiperProps: { effect: "cards", cardsEffect: { perSlideOffset: 10, perSlideRotate: 3, slideShadows: true } },
  },
  stack: {
    modules: [EffectCards],
    swiperProps: { effect: "cards", cardsEffect: { perSlideOffset: 6, perSlideRotate: 0, slideShadows: false } },
  },
  wheel: {
    modules: [EffectCoverflow],
    swiperProps: {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      coverflowEffect: { rotate: 60, stretch: 0, depth: 180, modifier: 1, slideShadows: false },
    },
  },
};

export function getCarouselEffect(effect: CarouselEffectName): CarouselEffectConfig {
  return REGISTRY[effect] ?? REGISTRY.coverflow;
}
