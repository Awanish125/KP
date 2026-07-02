"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard, Mousewheel, A11y } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";
import { getCarouselEffect } from "./effects";
import type { CarouselEffectName } from "./types/carousel";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/effect-cube";
import "swiper/css/effect-flip";
import "swiper/css/effect-fade";
import "swiper/css/effect-cards";

export interface CarouselHandle {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

interface CarouselProps {
  effect?: CarouselEffectName;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  enableKeyboard?: boolean;
  enableMouseWheel?: boolean;
  className?: string;
  slideClassName?: string;
  children: React.ReactNode[];
}

/**
 * Thin, registry-driven wrapper around Swiper. To add a new visual style,
 * register it once in `carousel/effects/index.ts` — nothing here changes.
 */
export const Carousel = forwardRef<CarouselHandle, CarouselProps>(function Carousel(
  {
    effect = "coverflow",
    initialIndex = 0,
    onIndexChange,
    enableKeyboard = true,
    enableMouseWheel = true,
    className,
    slideClassName,
    children,
  },
  ref,
) {
  const swiperRef = useRef<SwiperClass | null>(null);
  const { modules, swiperProps } = getCarouselEffect(effect);

  useImperativeHandle(ref, () => ({
    next: () => swiperRef.current?.slideNext(),
    prev: () => swiperRef.current?.slidePrev(),
    goTo: (index: number) => swiperRef.current?.slideToLoop(index),
  }));

  return (
    <Swiper
      modules={[...modules, ...(enableKeyboard ? [Keyboard] : []), ...(enableMouseWheel ? [Mousewheel] : []), A11y]}
      initialSlide={initialIndex}
      loop
      grabCursor
      keyboard={enableKeyboard ? { enabled: true, onlyInViewport: false } : undefined}
      mousewheel={enableMouseWheel ? { forceToAxis: true, sensitivity: 0.6 } : undefined}
      onSwiper={(s) => {
        swiperRef.current = s;
      }}
      onSlideChange={(s) => onIndexChange?.(s.realIndex)}
      className={className}
      {...swiperProps}
    >
      {children.map((child, i) => (
        <SwiperSlide key={i} className={slideClassName}>
          {child}
        </SwiperSlide>
      ))}
    </Swiper>
  );
});
