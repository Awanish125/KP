'use client';

import { useLayoutEffect } from "react";
import type { HeroAnimationRefs } from "@/types/hero";
import { ensureGsapPlugins, getHeroScrollRange, gsap } from "@/lib/gsap";

export function useOverlayFade({
  sectionRef,
  viewportRef,
  overlayRef,
}: Pick<HeroAnimationRefs, "sectionRef" | "viewportRef" | "overlayRef">) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureGsapPlugins();

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const overlay = overlayRef.current;

    if (!section || !viewport || !overlay) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(overlay, {
        opacity: 0.15,
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
  }, [sectionRef, viewportRef, overlayRef]);
}
