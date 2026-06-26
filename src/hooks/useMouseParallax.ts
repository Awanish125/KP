'use client';

import { useLayoutEffect } from "react";
import type { HeroAnimationRefs } from "@/types/hero";
import { ensureGsapPlugins, gsap } from "@/lib/gsap";

type ParallaxTarget = {
  element: HTMLElement;
  intensityX: number;
  intensityY: number;
};

export function useMouseParallax({
  viewportRef,
  overlayRef,
  headlineRef,
  subtitleRef,
  buttonsRef,
}: Pick<
  HeroAnimationRefs,
  | "viewportRef"
  | "overlayRef"
  | "headlineRef"
  | "subtitleRef"
  | "buttonsRef"
>) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureGsapPlugins();

    const viewport = viewportRef.current;
    const overlay = overlayRef.current;
    const headline = headlineRef.current;
    const subtitle = subtitleRef.current;
    const buttons = buttonsRef.current;

    if (!viewport || !overlay || !headline || !subtitle || !buttons) {
      return;
    }

    const isTouch =
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isTouch || prefersReducedMotion) {
      return;
    }

    const targets: ParallaxTarget[] = [
      { element: headline, intensityX: 20, intensityY: 16 },
      { element: subtitle, intensityX: 14, intensityY: 12 },
      { element: buttons, intensityX: 10, intensityY: 8 },
      { element: overlay, intensityX: 6, intensityY: 6 },
    ];

    let motion: Array<{
      xTo: (value: number) => void;
      yTo: (value: number) => void;
    }> = [];

    const ctx = gsap.context(() => {
      motion = targets.map((target) => ({
        xTo: gsap.quickTo(target.element, "x", {
          duration: 0.7,
          ease: "power3.out",
        }),
        yTo: gsap.quickTo(target.element, "y", {
          duration: 0.7,
          ease: "power3.out",
        }),
      }));
    }, viewport);

    const reset = () => {
      motion.forEach(({ xTo, yTo }) => {
        xTo(0);
        yTo(0);
      });
    };

    const handleMove = (event: PointerEvent) => {
      const rect = viewport.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (event.clientX - centerX) / (rect.width / 2);
      const deltaY = (event.clientY - centerY) / (rect.height / 2);

      motion.forEach(({ xTo, yTo }, index) => {
        const target = targets[index];
        xTo(deltaX * target.intensityX);
        yTo(deltaY * target.intensityY);
      });
    };

    viewport.addEventListener("pointermove", handleMove);
    viewport.addEventListener("pointerleave", reset);

    return () => {
      viewport.removeEventListener("pointermove", handleMove);
      viewport.removeEventListener("pointerleave", reset);
      reset();
      ctx.revert();
    };
  }, [viewportRef, overlayRef, headlineRef, subtitleRef, buttonsRef]);
}
