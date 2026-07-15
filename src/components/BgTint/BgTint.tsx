"use client";

/**
 * BgTint — Atlas Brut `[data-tint]` background crossfade.
 *
 * Drop <BgTint color="#0D0F13" /> anywhere inside a section. When that
 * section crosses the viewport centre, the page body background
 * crossfades to `color` over 0.9 s. When the section leaves, the
 * background fades back to transparent (revealing the CSS-variable
 * --bg beneath).
 *
 * Multiple BgTints coexist — last IO callback to fire wins, which is
 * the natural "section in view" priority (furthest-scrolled section).
 *
 * Usage:
 *   <section>
 *     <BgTint color="#14100C" />
 *     … content …
 *   </section>
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

interface BgTintProps {
  color: string;
}

export function BgTint({ color }: BgTintProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || prefersReducedMotion()) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        gsap.to(document.body, {
          backgroundColor: entry.isIntersecting ? color : "",
          duration: 0.9,
          ease: "power2.out",
          overwrite: "auto",
        });
      },
      {
        // Fire when the section crosses the viewport's 45% mark
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      // Don't reset on unmount — next section's BgTint takes over naturally
    };
  }, [color]);

  // Zero-size sentinel — carries the section position without affecting layout
  return (
    <span
      ref={sentinelRef}
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1,
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
