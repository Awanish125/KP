"use client";

/**
 * TestimonialSlider — infinite horizontal carousel of quote cards.
 *
 * Perf contract:
 *  - Drift runs on gsap.ticker ONLY while on screen (tickWhileVisible).
 *  - Pause on hover is a speed lerp toward 0 — no tween churn.
 *  - Items rendered twice; x wraps at -setWidth for a seamless loop.
 *  - will-change managed on IO enter/leave; reduced motion → static row.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import { onSpotMove, onSpotLeave } from "@/lib/cursorGlow";
import { TESTIMONIAL_SLIDER_DEFAULTS } from "./testimonialSliderConfig";
import type { Testimonial, TestimonialSliderProps } from "./testimonialSliderTypes";

function QuoteCard({ t, width }: { t: Testimonial; width: number }) {
  return (
    <figure
      onPointerMove={onSpotMove}
      onPointerLeave={onSpotLeave}
      className="group relative flex shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-8"
      style={{
        width: `min(${width}px, 82vw)`,
        background: "var(--kp-glass-bg)",
        border: "1px solid var(--kp-glass-border)",
        backdropFilter: "var(--kp-glass-blur)",
        WebkitBackdropFilter: "var(--kp-glass-blur)",
        margin: 0,
      }}
    >
      <span aria-hidden className="kp-card-glow" />
      <blockquote
        className="relative"
        style={{
          fontFamily: "var(--kp-font-body)",
          fontSize: "1.05rem",
          lineHeight: 1.65,
          color: "var(--kp-glass-text)",
          margin: 0,
        }}
      >
        <span aria-hidden style={{ color: "var(--kp-orange)", fontFamily: "var(--kp-font-display)", fontSize: "1.6rem", lineHeight: 1, display: "block", marginBottom: "0.75rem" }}>
          &ldquo;
        </span>
        {t.quote}
      </blockquote>
      <figcaption className="relative mt-6">
        <div style={{ fontFamily: "var(--kp-font-body)", fontWeight: 700, fontSize: "0.95rem", color: "var(--kp-glass-text)" }}>
          {t.name}
        </div>
        <div
          style={{
            fontFamily: "var(--kp-font-mono)",
            fontSize: "0.72rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--kp-glass-text-muted)",
            marginTop: "0.25rem",
          }}
        >
          {t.role}
        </div>
      </figcaption>
    </figure>
  );
}

export function TestimonialSlider({
  items,
  className,
  speed = TESTIMONIAL_SLIDER_DEFAULTS.speed,
  lerp = TESTIMONIAL_SLIDER_DEFAULTS.lerp,
  gap = TESTIMONIAL_SLIDER_DEFAULTS.gap,
  cardWidth = TESTIMONIAL_SLIDER_DEFAULTS.cardWidth,
}: TestimonialSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || prefersReducedMotion()) return;

    const setX = gsap.quickSetter(track, "x", "px");
    let x = 0;
    let currentSpeed = speed;
    let setWidth = 0;

    const measure = () => {
      // First half of the duplicated track = one full set.
      setWidth = track.scrollWidth / 2;
    };
    measure();
    window.addEventListener("resize", measure);

    const tick = () => {
      const target = hoverRef.current ? 0 : speed;
      currentSpeed += (target - currentSpeed) * lerp;
      // deltaRatio normalises to 60fps so speed is real px/second.
      x -= (currentSpeed / 60) * gsap.ticker.deltaRatio(60);
      if (setWidth > 0 && x <= -setWidth) x += setWidth;
      setX(x);
    };

    const cleanup = tickWhileVisible(viewport, tick, {
      onEnter: () => {
        track.style.willChange = "transform";
      },
      onLeave: () => {
        track.style.willChange = "auto";
      },
    });

    return () => {
      cleanup();
      window.removeEventListener("resize", measure);
      track.style.willChange = "auto";
    };
  }, [speed, lerp, items.length]);

  if (reduced) {
    // Static, scrollable row — content fully accessible without motion.
    return (
      <div className={className} style={{ overflowX: "auto", display: "flex", gap }}>
        {items.map((t, i) => (
          <QuoteCard key={i} t={t} width={cardWidth} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className={className}
      style={{ overflow: "hidden" }}
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
      <div ref={trackRef} style={{ display: "flex", gap, width: "max-content" }}>
        {[...items, ...items].map((t, i) => (
          <div key={i} aria-hidden={i >= items.length ? true : undefined}>
            <QuoteCard t={t} width={cardWidth} />
          </div>
        ))}
      </div>
    </div>
  );
}
