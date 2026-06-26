'use client';

import { useLayoutEffect } from "react";
import type { HeroAnimationRefs } from "@/types/hero";
import { ensureGsapPlugins, getHeroScrollRange, gsap } from "@/lib/gsap";

export function useHeroZoom({
  sectionRef,
  viewportRef,
  frameRef,
}: Pick<HeroAnimationRefs, "sectionRef" | "viewportRef" | "frameRef">) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureGsapPlugins();

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const frame = frameRef.current;

    if (!section || !viewport || !frame) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(frame, {
        scale: 1.15,
        transformOrigin: "center center",
      });

      gsap.to(frame, {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getHeroScrollRange(section, viewport)}`,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => {
      ctx.revert();
    };
  }, [sectionRef, viewportRef, frameRef]);
}
