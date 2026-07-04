'use client';

import type { HeroIndicatorProps } from "@/types/hero";

type ScrollIndicatorProps = HeroIndicatorProps;

export function ScrollIndicator({ scrollIndicatorRef }: ScrollIndicatorProps) {
  return (
    <div
      ref={scrollIndicatorRef}
      data-scroll-indicator
      className="pointer-events-none absolute inset-x-0 bottom-7 z-30 flex justify-center opacity-100"
    >
      <div className="hero-bounce flex flex-col items-center gap-3 text-white/72">
        <span className="text-[10px] font-semibold uppercase tracking-[0.45em]">
          Scroll
        </span>
        <div className="h-14 w-px bg-gradient-to-b from-white/80 via-white/45 to-transparent" />
      </div>
    </div>
  );
}
