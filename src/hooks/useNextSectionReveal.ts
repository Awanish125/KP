'use client';

import { useLayoutEffect } from "react";
import type { HeroAnimationRefs } from "@/types/hero";
import { ensureGsapPlugins, getHeroScrollRange, gsap, ScrollTrigger } from "@/lib/gsap";

export function useNextSectionReveal({
  sectionRef,
  viewportRef,
  nextSectionRef,
}: Pick<
  HeroAnimationRefs,
  "sectionRef" | "viewportRef" | "nextSectionRef"
>) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureGsapPlugins();

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const nextSection = nextSectionRef.current;

    if (!section || !viewport || !nextSection) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(nextSection, { clearProps: "all" });
      gsap.set(viewport, { clearProps: "all" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(nextSection, {
        opacity: 0,
        y: 84,
        scale: 0.96,
        transformOrigin: "center top",
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getHeroScrollRange(section, viewport)}`,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        nextSection,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power4.out",
        },
        0.68
      )
        .to(
          viewport,
          {
            opacity: 0,
            y: -24,
            scale: 0.985,
            ease: "none",
          },
          0.82
        );

      ScrollTrigger.refresh();
    }, viewport);

    return () => {
      ctx.revert();
    };
  }, [sectionRef, viewportRef, nextSectionRef]);
}
