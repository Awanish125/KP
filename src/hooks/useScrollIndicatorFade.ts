'use client';

import { useLayoutEffect } from "react";
import type { HeroAnimationRefs } from "@/types/hero";
import { ensureGsapPlugins, getHeroScrollRange, gsap } from "@/lib/gsap";

export function useScrollIndicatorFade({
  sectionRef,
  viewportRef,
  scrollIndicatorRef,
}: Pick<
  HeroAnimationRefs,
  "sectionRef" | "viewportRef" | "scrollIndicatorRef"
>) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureGsapPlugins();

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const indicator = scrollIndicatorRef.current;

    if (!section || !viewport || !indicator) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(indicator, {
        opacity: 0,
        y: -10,
        scale: 0.96,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(getHeroScrollRange(section, viewport) * 0.12, 180)}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, viewport);

    return () => {
      ctx.revert();
    };
  }, [sectionRef, viewportRef, scrollIndicatorRef]);
}
