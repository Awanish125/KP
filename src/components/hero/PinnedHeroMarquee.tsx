"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";

interface PinnedHeroMarqueeProps {
  /** When empty/undefined the hero renders normally — no pin, no marquee. */
  scrollText?: string | null;
  children: ReactNode;
}

/**
 * Pins the hero while a single big sentence sweeps right → left, then
 * releases. Implemented with `position: sticky` + a tall spacer (the same
 * pin technique already used by the process section) rather than a scrubbed
 * ScrollTrigger, per this project's Lenis performance rules (memory:
 * feedback-scroll-performance). The sweep is driven by one gsap.ticker
 * callback gated by IntersectionObserver, reading scroll position and
 * writing transform/opacity only.
 *
 * If `scrollText` is falsy the whole mechanism is skipped and the hero is a
 * plain full-height section — no wrapper height inflation, no ticker.
 */
export function PinnedHeroMarquee({ scrollText, children }: PinnedHeroMarqueeProps) {
  const text = scrollText?.trim();
  const wrapRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [wrapHeight, setWrapHeight] = useState<string>("100vh");

  useLayoutEffect(() => {
    if (!text) return;
    const wrap = wrapRef.current;
    const marquee = marqueeRef.current;
    const textEl = textRef.current;
    if (!wrap || !marquee || !textEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // No pin: keep the hero a single viewport tall, hide the marquee.
      setWrapHeight("100vh");
      gsap.set(marquee, { autoAlpha: 0 });
      return;
    }

    const setX = gsap.quickSetter(marquee, "x", "px");
    const setAlpha = gsap.quickSetter(marquee, "opacity");

    let travel = 0;
    let textWidth = 0;

    const measure = () => {
      textWidth = textEl.offsetWidth;
      // Full crossing = enter from the right edge, exit past the left edge.
      travel = window.innerWidth + textWidth;
      setWrapHeight(`${window.innerHeight + travel}px`);
    };

    let lastP = -1;
    const update = () => {
      const rect = wrap.getBoundingClientRect();
      // While pinned, rect.top runs from 0 down to -travel.
      const p = Math.min(Math.max(-rect.top / travel, 0), 1);
      if (p === lastP) return;
      lastP = p;
      setX(window.innerWidth - p * (window.innerWidth + textWidth));
      // Fade in on entry, fade out on exit — never a hard pop.
      const fade = Math.min(p / 0.06, 1) * Math.min((1 - p) / 0.06, 1);
      setAlpha(fade);
    };

    measure();
    update();

    const onResize = () => {
      measure();
      lastP = -1;
      update();
    };
    window.addEventListener("resize", onResize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) gsap.ticker.add(update);
        else gsap.ticker.remove(update);
      },
      { threshold: 0 },
    );
    observer.observe(wrap);

    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      gsap.ticker.remove(update);
    };
  }, [text]);

  // No scroll text → plain hero, unchanged behavior.
  if (!text) {
    return (
      <section id="s1" className="relative h-screen">
        {children}
      </section>
    );
  }

  return (
    <div ref={wrapRef} style={{ height: wrapHeight }} className="relative">
      <section id="s1" className="sticky top-0 h-screen overflow-hidden">
        {children}

        {/* Scroll-driven marquee statement — above the hero content (z-20),
            fully off-screen (and invisible) at rest so it never covers the
            headline until the user scrolls. */}
        <div
          ref={marqueeRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[62%] z-30 -translate-y-1/2 will-change-transform"
          style={{ opacity: 0 }}
        >
          <span
            ref={textRef}
            className="inline-block whitespace-nowrap font-heading text-4xl font-extrabold uppercase leading-none tracking-tight text-white/90 sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ textShadow: "0 2px 40px rgba(0,0,0,0.55)" }}
          >
            {text}
          </span>
        </div>
      </section>
    </div>
  );
}
