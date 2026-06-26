'use client';

import { useLayoutEffect } from "react";
import type { HeroAnimationRefs } from "@/types/hero";
import { ensureGsapPlugins, getHeroScrollRange, gsap, ScrollTrigger } from "@/lib/gsap";

export function useVideoScrub({
  sectionRef,
  viewportRef,
  videoRef,
  videoSrc,
}: Pick<HeroAnimationRefs, "sectionRef" | "viewportRef" | "videoRef"> & {
  videoSrc: string;
}) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureGsapPlugins();

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const video = videoRef.current;

    if (!section || !viewport || !video) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    video.pause();
    video.currentTime = 0;

    if (prefersReducedMotion) {
      return;
    }

    let removeMetadataListener = () => {};

    const ctx = gsap.context(() => {
      const build = () => {
        gsap.fromTo(
          video,
          { currentTime: 0 },
          {
            currentTime: video.duration || 0,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${getHeroScrollRange(section, viewport)}`,
              scrub: 0.9,
              invalidateOnRefresh: true,
            },
          }
        );

        ScrollTrigger.refresh();
      };

      if (video.readyState >= 1 && video.duration) {
        build();
      } else {
        video.addEventListener("loadedmetadata", build, { once: true });
        removeMetadataListener = () => {
          video.removeEventListener("loadedmetadata", build);
        };
      }
    }, section);

    return () => {
      removeMetadataListener();
      ctx.revert();
    };
  }, [sectionRef, viewportRef, videoRef, videoSrc]);
}
