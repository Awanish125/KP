"use client";

/**
 * PageTransition — curtain-split route reveal with brand name.
 *
 * On every SPA navigation (template.tsx remounts), two curtain halves
 * cover the screen instantly before first paint. The brand name and
 * tagline sit in the centre while the curtains hold, then both halves
 * fly apart to unveil the new page — mirroring the PremiumLoader exit.
 *
 * Sequence (duration ≈ 0.83 s):
 *   0 ms    — curtains already closed, brand visible
 *   80 ms   — curtains begin flying out (expo.inOut) + brand fades
 *   830 ms  — curtains gone, new page fully revealed
 *
 * Theme: uses --bg / --text / --kp-orange CSS tokens so it matches
 * both light and dark modes automatically.
 *
 * Skipped on:
 *   - hard document loads (PremiumLoader owns those)
 *   - prefers-reduced-motion
 */

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { PAGE_TRANSITION_DEFAULTS } from "./pageTransitionConfig";
import type { PageTransitionProps } from "./pageTransitionTypes";

declare global {
  interface Window {
    __kpVeilActive?: boolean;
  }
}

export function PageTransition({
  children,
  duration = PAGE_TRANSITION_DEFAULTS.duration,
  delay = PAGE_TRANSITION_DEFAULTS.delay,
}: PageTransitionProps) {
  const rootRef  = useRef<HTMLDivElement>(null);
  const leftRef  = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root  = rootRef.current;
    const left  = leftRef.current;
    const right = rightRef.current;
    const brand = brandRef.current;
    if (!root || !left || !right || !brand) return;

    // Hard loads are covered by PremiumLoader — skip the veil.
    const hardLoad = document.documentElement.classList.contains("kp-first-visit");
    if (hardLoad || prefersReducedMotion()) return;

    // Signal that a veil is active so reveal-dependent code waits for it.
    window.__kpVeilActive = true;
    const veilDone = () => {
      if (!window.__kpVeilActive) return;
      window.__kpVeilActive = false;
      window.dispatchEvent(new Event("kp:veil-done"));
    };

    // Show the curtains before first paint (useLayoutEffect = synchronous).
    gsap.set(root,  { visibility: "visible" });
    gsap.set(left,  { xPercent: 0 });
    gsap.set(right, { xPercent: 0 });
    gsap.set(brand, { autoAlpha: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(root, { visibility: "hidden" });
        veilDone();
      },
    });

    // Brand fades as the curtains start to part
    tl.to(brand, {
      autoAlpha: 0,
      duration: duration * 0.5,
      ease: "power2.in",
    }, delay);

    // Both curtain halves fly out simultaneously
    tl.to(left,  { xPercent: -101, duration, ease: "expo.inOut" }, delay);
    tl.to(right, { xPercent:  101, duration, ease: "expo.inOut" }, delay);

    return () => {
      tl.kill();
      gsap.set(root, { visibility: "hidden" });
      veilDone();
    };
  }, [duration, delay]);

  return (
    <>
      {/* ── Transition overlay ── */}
      <div
        ref={rootRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 900,
          pointerEvents: "none",
          overflow: "hidden",
          visibility: "hidden", // shown synchronously in useLayoutEffect
        }}
      >
        {/* Left curtain */}
        <div
          ref={leftRef}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "50.5%",
            background: "var(--bg)",
            willChange: "transform",
          }}
        />

        {/* Right curtain */}
        <div
          ref={rightRef}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "50.5%",
            background: "var(--bg)",
            willChange: "transform",
          }}
        />

        {/* Brand — centred above the curtain seam */}
        <div
          ref={brandRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            textAlign: "center",
            // sits above both curtain halves
            zIndex: 1,
          }}
        >
          <p
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "clamp(1.2rem, 3.5vw, 2.4rem)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              lineHeight: 1,
              margin: 0,
            }}
          >
            <span style={{ color: "#0065B1" }}>KIRAN</span>{" "}
            <span style={{ color: "#F58420" }}>PUBLICITY</span>
          </p>
          <p
            style={{
              fontFamily: "var(--kp-font-mono, monospace)",
              fontSize: "0.62rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--kp-orange)",
              margin: 0,
            }}
          >
            OUTDOOR ADVERTISING · PAN INDIA
          </p>
        </div>
      </div>

      {children}
    </>
  );
}
