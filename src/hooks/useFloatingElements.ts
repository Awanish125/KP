'use client';

import { useLayoutEffect } from "react";
import type { HeroAnimationRefs } from "@/types/hero";
import { ensureGsapPlugins, gsap } from "@/lib/gsap";

export function useFloatingElements({
  viewportRef,
  raysRef,
  particlesRef,
  glowRef,
}: Pick<
  HeroAnimationRefs,
  "viewportRef" | "raysRef" | "particlesRef" | "glowRef"
>) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureGsapPlugins();

    const viewport = viewportRef.current;
    const rays = raysRef.current;
    const particles = particlesRef.current;
    const glow = glowRef.current;

    if (!viewport || !rays || !particles || !glow) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(rays, {
        x: 14,
        y: -20,
        rotate: 0.3,
        scale: 1.02,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(particles, {
        x: -10,
        y: 16,
        rotate: -0.6,
        scale: 1.03,
        duration: 11,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(glow, {
        x: 8,
        y: -12,
        scale: 1.05,
        opacity: 0.82,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, viewport);

    return () => {
      ctx.revert();
    };
  }, [viewportRef, raysRef, particlesRef, glowRef]);
}
