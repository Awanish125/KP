"use client";

/**
 * SectionReveal — wraps any section and plays its entrance animation the
 * first time it scrolls into view.
 *
 * Perf contract:
 *  - IntersectionObserver trigger (no ScrollTrigger, no scroll listeners).
 *  - will-change set in onStart, cleared to "auto" in onComplete.
 *  - prefers-reduced-motion → content simply shows, no tween.
 */

import { createElement, useEffect, useRef } from "react";
import gsap from "gsap";
import { observeOnce, prefersReducedMotion, withWillChange } from "@/lib/motion";
import { SECTION_REVEAL_DEFAULTS } from "./sectionRevealConfig";
import type { SectionRevealProps } from "./sectionRevealTypes";

export function SectionReveal({
  children,
  staggerChildren = true,
  as = "section",
  className,
  style,
  id,
  distance = SECTION_REVEAL_DEFAULTS.distance,
  stagger = SECTION_REVEAL_DEFAULTS.stagger,
  duration = SECTION_REVEAL_DEFAULTS.duration,
  ease = SECTION_REVEAL_DEFAULTS.ease,
  rootMargin = SECTION_REVEAL_DEFAULTS.rootMargin,
}: SectionRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) return; // CSS default state is visible

    const targets: Element[] = staggerChildren
      ? Array.from(el.children)
      : [el];
    if (targets.length === 0) return;

    // Hide before first paint of the tween — not in JSX, so reduced-motion
    // and no-JS render the content normally.
    gsap.set(targets, { opacity: 0, y: distance });

    const cancel = observeOnce(
      el,
      () => {
        const wc = withWillChange(targets, "transform, opacity");
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration,
          ease,
          stagger,
          onStart: wc.onStart,
          onComplete: wc.onComplete,
          overwrite: "auto",
        });
      },
      rootMargin,
    );

    return () => {
      cancel();
      gsap.set(targets, { clearProps: "opacity,transform,willChange" });
    };
  }, [staggerChildren, distance, stagger, duration, ease, rootMargin]);

  return createElement(
    as,
    { ref, className, style, id },
    children,
  );
}
