"use client";

/**
 * TextReveal — word-by-word rise (masked yPercent) or whole-element
 * clip-path wipe, fired once on IntersectionObserver enter.
 *
 * Words are split in JSX (not with SplitType) so SSR markup already
 * contains the final text — no layout shift, no hydration mismatch.
 */

import { createElement, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { observeOnce, prefersReducedMotion, withWillChange } from "@/lib/motion";
import { TEXT_REVEAL_DEFAULTS } from "./textRevealConfig";
import type { TextRevealProps } from "./textRevealTypes";

export function TextReveal({
  text,
  as = "h2",
  className,
  style,
  mode = TEXT_REVEAL_DEFAULTS.mode,
  duration = TEXT_REVEAL_DEFAULTS.duration,
  stagger = TEXT_REVEAL_DEFAULTS.stagger,
  ease = TEXT_REVEAL_DEFAULTS.ease,
  delay = TEXT_REVEAL_DEFAULTS.delay,
  rootMargin = TEXT_REVEAL_DEFAULTS.rootMargin,
}: TextRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let targets: Element[];
    if (mode === "words") {
      targets = Array.from(el.querySelectorAll("[data-word]"));
      gsap.set(targets, { yPercent: 110 });
    } else {
      targets = [el];
      gsap.set(el, { clipPath: "inset(0 100% 0 0)" });
    }

    const cancel = observeOnce(
      el,
      () => {
        const wc = withWillChange(
          targets,
          mode === "words" ? "transform" : "clip-path",
        );
        gsap.to(targets, {
          ...(mode === "words"
            ? { yPercent: 0 }
            : { clipPath: "inset(0 0% 0 0)" }),
          duration,
          ease,
          delay,
          stagger: mode === "words" ? stagger : 0,
          onStart: wc.onStart,
          onComplete: wc.onComplete,
        });
      },
      rootMargin,
    );

    return () => {
      cancel();
      gsap.set(targets, { clearProps: "all" });
    };
  }, [mode, duration, stagger, ease, delay, rootMargin, words]);

  const content =
    mode === "words"
      ? words.map((w, i) => (
          // Outer span is the mask; inner span slides up into it.
          // The joining space lives OUTSIDE the mask so it isn't clipped.
          <span key={`${w}-${i}`}>
            <span
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "bottom",
              }}
            >
              <span data-word style={{ display: "inline-block" }}>
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        ))
      : text;

  return createElement(as, { ref, className, style }, content);
}
