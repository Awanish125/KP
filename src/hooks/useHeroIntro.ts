'use client';

import { useLayoutEffect } from "react";
import SplitType from "split-type";
import type { HeroAnimationRefs } from "@/types/hero";
import { ensureGsapPlugins, gsap } from "@/lib/gsap";

export function useHeroIntro({
  viewportRef,
  overlayRef,
  contentRef,
  headlineRef,
  subtitleRef,
  buttonsRef,
  scrollIndicatorRef,
}: Pick<
  HeroAnimationRefs,
  | "viewportRef"
  | "overlayRef"
  | "contentRef"
  | "headlineRef"
  | "subtitleRef"
  | "buttonsRef"
  | "scrollIndicatorRef"
>) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    ensureGsapPlugins();

    const viewport = viewportRef.current;
    const overlay = overlayRef.current;
    const content = contentRef.current;
    const headline = headlineRef.current;
    const subtitle = subtitleRef.current;
    const buttons = buttonsRef.current;
    const scrollIndicator = scrollIndicatorRef.current;

    if (
      !viewport ||
      !overlay ||
      !content ||
      !headline ||
      !subtitle ||
      !buttons ||
      !scrollIndicator
    ) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(overlay, { opacity: 0.55 });
      gsap.set([content, headline, subtitle, buttons, scrollIndicator], {
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    const split = new SplitType(headline, {
      types: "chars",
      tagName: "span",
      charClass: "hero-split-char",
    });

    const chars = split.chars ?? [];
    const ctx = gsap.context(() => {
      gsap.set(overlay, { opacity: 0 });
      gsap.set(content, { opacity: 0, y: 22, scale: 0.985 });
      gsap.set(subtitle, { opacity: 0, y: 24, scale: 0.98 });
      gsap.set(buttons, { opacity: 0, y: 28, scale: 0.98 });
      gsap.set(scrollIndicator, { opacity: 0, y: 14, scale: 0.98 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.to(overlay, { opacity: 0.55, duration: 0.9 }, 0)
        .to(content, { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 0.08)
        .fromTo(
          chars,
          { opacity: 0, y: 42, rotateX: 36, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.95,
            stagger: 0.018,
          },
          0.18
        )
        .to(
          subtitle,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
          },
          0.56
        )
        .to(
          buttons,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
          },
          0.72
        )
        .to(
          scrollIndicator,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
          },
          0.88
        );
    }, viewport);

    return () => {
      split.revert();
      ctx.revert();
    };
  }, [
    viewportRef,
    overlayRef,
    contentRef,
    headlineRef,
    subtitleRef,
    buttonsRef,
    scrollIndicatorRef,
  ]);
}
