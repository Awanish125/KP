"use client";

/**
 * ScrambleText — Atlas Brut-style decode animation for any inline text.
 *
 * Characters scramble through glyphs, then resolve left→right.
 *
 * trigger="inview"     — fires once when element enters the viewport (default)
 * trigger="immediate"  — fires as soon as the component mounts
 * trigger="manual"     — call the returned ref's .play() method yourself
 *
 * SSR-safe: renders real text on the server so crawlers + no-JS see content.
 * Reduced-motion: skips the scramble, shows final text immediately.
 */

import { createElement, useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { scrambleDecode } from "@/lib/scramble";

type Tag = keyof React.JSX.IntrinsicElements;

interface ScrambleTextProps {
  text: string;
  duration?: number;
  delay?: number;
  trigger?: "inview" | "immediate";
  as?: Tag;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrambleText({
  text,
  duration = 0.75,
  delay    = 0,
  trigger  = "inview",
  as       = "span",
  className,
  style,
}: ScrambleTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.textContent = text;
      return;
    }

    const run = () => scrambleDecode(el, text, duration, delay);

    if (trigger === "immediate") {
      run();
      return;
    }

    // "inview" — fire once on first intersection
    el.textContent = text; // visible until the IO fires (good for SSR)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        run();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text, duration, delay, trigger]);

  return createElement(as, { ref, className, style }, text);
}
