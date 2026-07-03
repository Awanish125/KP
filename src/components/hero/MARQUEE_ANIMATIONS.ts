/**
 * MARQUEE_ANIMATIONS.ts
 *
 * Starter animation registry for the Hero marquee.
 * This file centralizes GSAP-based enter/exit animations and is intended
 * to replace hardcoded opacity/transform logic inside PinnedHeroMarquee.
 *
 * NOTE:
 * - Requires: gsap
 * - Optional: split-type (only for "chars")
 */

import { gsap } from "gsap";

export type MarqueeAnimation =
  | "fade"
  | "lift"
  | "slideLeft"
  | "slideRight"
  | "maskReveal"
  | "blur"
  | "scale"
  | "flip"
  | "chars"
  | "punch"
  | "skew"
  | "sweep";

export interface PlayOptions {
  duration?: number;
  delay?: number;
  ease?: string;
}

const defaults: Required<PlayOptions> = {
  duration: 0.75,
  delay: 0,
  ease: "power3.out",
};

export function playMarqueeEnter(
  element: HTMLElement,
  animation: MarqueeAnimation = "fade",
  options: PlayOptions = {},
) {
  const o = { ...defaults, ...options };

  switch (animation) {
    case "lift":
      return gsap.fromTo(
        element,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: o.duration, delay: o.delay, ease: o.ease },
      );

    case "slideLeft":
      return gsap.fromTo(
        element,
        { opacity: 0, x: -120 },
        { opacity: 1, x: 0, duration: o.duration, delay: o.delay, ease: o.ease },
      );

    case "slideRight":
      return gsap.fromTo(
        element,
        { opacity: 0, x: 120 },
        { opacity: 1, x: 0, duration: o.duration, delay: o.delay, ease: o.ease },
      );

    case "blur":
      return gsap.fromTo(
        element,
        { opacity: 0, filter: "blur(18px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: o.duration,
          delay: o.delay,
          ease: o.ease,
        },
      );

    case "scale":
      return gsap.fromTo(
        element,
        { opacity: 0, scale: 0.88 },
        { opacity: 1, scale: 1, duration: o.duration, delay: o.delay, ease: o.ease },
      );

    case "flip":
      gsap.set(element, { transformPerspective: 1000 });
      return gsap.fromTo(
        element,
        { opacity: 0, rotationX: -80 },
        { opacity: 1, rotationX: 0, duration: o.duration, delay: o.delay, ease: o.ease },
      );

    case "skew":
      return gsap.fromTo(
        element,
        { opacity: 0, skewX: -18 },
        { opacity: 1, skewX: 0, duration: o.duration, delay: o.delay, ease: o.ease },
      );

    case "punch":
      return gsap.fromTo(
        element,
        { opacity: 0, scale: 0.7 },
        {
          opacity: 1,
          scale: 1,
          duration: o.duration,
          delay: o.delay,
          ease: "back.out(2)",
        },
      );

    case "maskReveal":
      gsap.set(element, { overflow: "hidden" });
      return gsap.fromTo(
        element,
        { clipPath: "inset(0 100% 0 0)", opacity: 1 },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: o.duration,
          delay: o.delay,
          ease: o.ease,
        },
      );

    case "sweep":
      return gsap.fromTo(
        element,
        { opacity: 0, x: -60, skewX: -12 },
        {
          opacity: 1,
          x: 0,
          skewX: 0,
          duration: o.duration,
          delay: o.delay,
          ease: o.ease,
        },
      );

    case "chars":
      console.warn(
        'The "chars" animation requires SplitType integration. Implement character splitting before calling this animation.',
      );
      return gsap.fromTo(
        element,
        { opacity: 0 },
        { opacity: 1, duration: o.duration, delay: o.delay },
      );

    case "fade":
    default:
      return gsap.fromTo(
        element,
        { opacity: 0 },
        { opacity: 1, duration: o.duration, delay: o.delay, ease: o.ease },
      );
  }
}

export function playMarqueeExit(
  element: HTMLElement,
  direction: "left" | "right" | "fade" = "left",
  duration = 0.7,
) {
  switch (direction) {
    case "fade":
      return gsap.to(element, {
        opacity: 0,
        duration,
        ease: "power2.inOut",
      });

    case "right":
      return gsap.to(element, {
        x: window.innerWidth * 1.15,
        opacity: 0,
        duration,
        ease: "power3.inOut",
      });

    case "left":
    default:
      return gsap.to(element, {
        x: -window.innerWidth * 1.15,
        opacity: 0,
        duration,
        ease: "power3.inOut",
      });
  }
}
