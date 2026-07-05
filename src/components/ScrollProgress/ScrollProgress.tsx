"use client";

/**
 * ScrollProgress — thin KP-orange line at the top of the viewport showing
 * page scroll progress.
 *
 * Perf contract:
 *  - Reads scroll position on gsap.ticker (fires after Lenis applies its
 *    interpolated position — never window scroll events).
 *  - Skips the frame entirely when the value hasn't changed (<0.1%).
 *  - Document height cached and refreshed on resize only.
 *  - transform: scaleX — compositor-only, no layout.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { SCROLL_PROGRESS_DEFAULTS } from "./scrollProgressConfig";
import type { ScrollProgressProps } from "./scrollProgressTypes";

export function ScrollProgress({
  className,
  style,
  height = SCROLL_PROGRESS_DEFAULTS.height,
  color = SCROLL_PROGRESS_DEFAULTS.color,
  zIndex = SCROLL_PROGRESS_DEFAULTS.zIndex,
}: ScrollProgressProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const setScaleX = gsap.quickSetter(bar, "scaleX");
    let max = 1;
    let last = -1;

    const measure = () => {
      max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
    };
    measure();

    const tick = () => {
      const p = Math.min(window.scrollY / max, 1);
      if (Math.abs(p - last) < 0.001) return;
      last = p;
      setScaleX(p);
    };

    // Recalculate if the body size shifts during loading
    const ro = new ResizeObserver(() => {
      measure();
      tick();
    });
    ro.observe(document.body);

    if (prefersReducedMotion()) {
      // Still functional, just driven by the native scroll cadence.
      const onScroll = () => tick();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", measure);
      return () => {
        ro.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", measure);
      };
    }

    gsap.ticker.add(tick);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", measure);
    };
  }, [pathname]);

  return (
    <div
      className={className}
      aria-hidden
      data-kp-scroll-progress
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height,
        zIndex,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        ref={barRef}
        style={{
          width: "100%",
          height: "100%",
          background: color,
          transform: "scaleX(0)",
          transformOrigin: "left center",
          boxShadow: "0 0 12px var(--kp-orange-glow)",
        }}
      />
    </div>
  );
}
