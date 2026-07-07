"use client";

/**
 * PageTransition — cinematic route-change reveal, mounted via
 * src/app/template.tsx (templates remount on every navigation, so the
 * sweep replays for each page).
 *
 * A dark veil covers the incoming page and wipes upward with a trailing
 * orange hairline. Implementation notes:
 *  - The veil is its own fixed overlay; the content wrapper is NEVER
 *    transformed or clipped (that would break position:fixed children
 *    like the navbar and ScrollTrigger pinning).
 *  - useLayoutEffect shows the veil BEFORE first paint — no flash of the
 *    new page. SSR/no-JS renders it hidden, so crawlers see content.
 *  - Skipped on first visit (PremiumLoader owns that reveal) and for
 *    prefers-reduced-motion.
 */

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { PAGE_TRANSITION_DEFAULTS } from "./pageTransitionConfig";
import type { PageTransitionProps } from "./pageTransitionTypes";

declare global {
  interface Window {
    /** True while the route veil is sweeping — PremiumLoader waits on it. */
    __kpVeilActive?: boolean;
  }
}

export function PageTransition({
  children,
  duration = PAGE_TRANSITION_DEFAULTS.duration,
  delay = PAGE_TRANSITION_DEFAULTS.delay,
}: PageTransitionProps) {
  const veilRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const veil = veilRef.current;
    const line = lineRef.current;
    if (!veil || !line) return;

    // The kp-first-visit class marks a HARD document load — those are
    // covered by PremiumLoader (full or short). The veil only plays for
    // SPA navigations, where the class has already been retired.
    const hardLoad = document.documentElement.classList.contains("kp-first-visit");
    if (hardLoad || prefersReducedMotion()) return; // stays hidden

    // Cover before paint, then sweep up with the hairline chasing the edge.
    // Flag the sweep so reveal signals (hero entrance) wait for it.
    window.__kpVeilActive = true;
    const veilDone = () => {
      if (!window.__kpVeilActive) return;
      window.__kpVeilActive = false;
      window.dispatchEvent(new Event("kp:veil-done"));
    };
    gsap.set(veil, { visibility: "visible", clipPath: "inset(0 0 0% 0)" });
    veil.style.willChange = "clip-path";
    const tl = gsap.timeline({
      onComplete: () => {
        veil.style.willChange = "auto";
        gsap.set(veil, { visibility: "hidden" });
        veilDone();
      },
    });
    tl.to(veil, {
      clipPath: "inset(0 0 100% 0)",
      duration,
      ease: "power4.inOut",
      delay,
    });
    tl.fromTo(
      line,
      { top: "100%", opacity: 1 },
      { top: "0%", opacity: 0, duration, ease: "power4.inOut" },
      delay,
    );

    return () => {
      tl.kill();
      gsap.set(veil, { visibility: "hidden" });
      veil.style.willChange = "auto";
      veilDone(); // never leave waiters hanging if unmounted mid-sweep
    };
  }, [duration, delay]);

  return (
    <>
      <div
        ref={veilRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 900,
          background: "var(--kp-dark)",
          pointerEvents: "none",
          visibility: "hidden",
        }}
      >
        <div
          ref={lineRef}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            height: 2,
            background: "var(--kp-orange)",
            boxShadow: "0 0 24px var(--kp-orange-glow), 0 0 60px var(--kp-orange-glow)",
          }}
        />
      </div>
      {children}
    </>
  );
}
