"use client";

/**
 * ParallaxWordmark — Atlas Brut `.epi-bg` effect.
 *
 * Giant outline text that drifts horizontally against scroll direction
 * as its section passes through the viewport. Pure GPU transform —
 * no layout, no clip repaints.
 *
 * xFrom / xTo are percentage values for translateX (as xPercent).
 * Default: -58 → -42 (drifts 16% rightward as you scroll down through it).
 *
 * No ScrollTrigger — GSAP ticker + IntersectionObserver.
 */

import { useEffect, useRef } from "react";
import { tickWhileVisible, prefersReducedMotion } from "@/lib/motion";

interface ParallaxWordmarkProps {
  text?: string;
  /** Pass children instead of text to render colored segments — outer stroke is disabled. */
  children?: React.ReactNode;
  /** translateX start (xPercent) when section top is at viewport bottom. Default -58 */
  xFrom?: number;
  /** translateX end (xPercent) when section bottom is at viewport top. Default -42 */
  xTo?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ParallaxWordmark({
  text,
  children,
  xFrom = -58,
  xTo   = -42,
  className,
  style,
}: ParallaxWordmarkProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef    = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const el      = textRef.current;
    if (!section || !el || prefersReducedMotion()) return;

    el.style.willChange = "transform";

    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));

    const tick = () => {
      const rect = section.getBoundingClientRect();
      const vh   = window.innerHeight;
      // p = 0 when section top hits viewport bottom; p = 1 when bottom hits top
      const p    = clamp((vh - rect.top) / (rect.height + vh), 0, 1);
      const x    = xFrom + (xTo - xFrom) * p;
      el.style.transform = `translateX(${x}%)`;
    };

    const cleanup = tickWhileVisible(section, tick, {
      onLeave: () => { el.style.willChange = "auto"; },
      onEnter: () => { el.style.willChange = "transform"; },
    });

    return () => {
      cleanup();
      el.style.willChange = "auto";
    };
  }, [xFrom, xTo]);

  return (
    <div
      ref={sectionRef}
      className={`kp-pw-wrap ${className ?? ""}`}
      style={{
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "none",
        lineHeight: 0.85,
        ...style,
      }}
    >
      <span
        ref={textRef}
        aria-hidden
        style={{
          display: "inline-block",
          fontFamily: "var(--kp-font-display, sans-serif)",
          fontWeight: 900,
          fontSize: "clamp(18vw, 28vw, 32vw)",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap",
          color: "transparent",
          // Outer stroke only when rendering plain text — children supply their own per-segment stroke
          ...(children ? {} : { WebkitTextStroke: "1px color-mix(in srgb, var(--text) 12%, transparent)" }),
          transform: `translateX(${xFrom}%)`,
        }}
      >
        {children ?? text}
      </span>
    </div>
  );
}
