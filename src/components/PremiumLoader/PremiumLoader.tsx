"use client";

/**
 * PremiumLoader — minimal, cinematic first-visit reveal.
 *
 * Sequence: wordmark letters rise in and tracking widens → counter runs
 * 0→100 against a hairline progress bar → a soft orange bloom breathes
 * behind the wordmark → the whole field wipes upward, unveiling the page.
 *
 * Contract (same as the old loader, so nothing downstream changes):
 *  - adds `page-revealed` to <html> and dispatches `kp:loaded` as the exit
 *    wipe begins — the hero entrance plays WHILE being revealed.
 *  - pointer-events: none — the page underneath is interactive throughout.
 *  - prefers-reduced-motion → signals fire immediately, nothing renders.
 *  - Unmounts itself when done (no lingering DOM).
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { PREMIUM_LOADER_DEFAULTS } from "./premiumLoaderConfig";
import type { PremiumLoaderProps } from "./premiumLoaderTypes";

function emitRevealSignals() {
  document.documentElement.classList.add("page-revealed");
  window.dispatchEvent(new Event("kp:loaded"));
}

export function PremiumLoader({
  word1 = PREMIUM_LOADER_DEFAULTS.word1,
  word2 = PREMIUM_LOADER_DEFAULTS.word2,
  countDuration = PREMIUM_LOADER_DEFAULTS.countDuration,
  exitDuration = PREMIUM_LOADER_DEFAULTS.exitDuration,
}: PremiumLoaderProps) {
  const [done, setDone] = useState(false);
  // Portal target: pages with ScrollTrigger pinning restructure their own
  // DOM (pin-spacers), which breaks sibling insertion for late-mounting
  // components. Rendering into <body> avoids that entirely.
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      emitRevealSignals();
      setDone(true);
      return;
    }
    if (!portalReady) return; // refs exist only after the portal mounts

    const overlay = overlayRef.current;
    const word = wordRef.current;
    const bloom = bloomRef.current;
    const counter = counterRef.current;
    const bar = barRef.current;
    const foot = footRef.current;
    if (!overlay || !word || !bloom || !counter || !bar || !foot) return;

    const letters = Array.from(word.querySelectorAll("[data-letter]"));
    const count = { v: 0 };

    const tl = gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: () => setDone(true),
    });

    // 1 — letters rise into view, tracking breathes open.
    tl.set(overlay, { autoAlpha: 1 });
    tl.fromTo(
      letters,
      { yPercent: 120 },
      { yPercent: 0, duration: 0.9, stagger: 0.035 },
      0.15,
    );
    tl.fromTo(
      word,
      { letterSpacing: "0.02em" },
      { letterSpacing: "0.18em", duration: 2.2, ease: "power2.inOut" },
      0.15,
    );
    tl.fromTo(foot, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.5);

    // 2 — counter + hairline progress (single tween drives both).
    tl.to(
      count,
      {
        v: 100,
        duration: countDuration,
        ease: "power2.inOut",
        onUpdate: () => {
          counter.textContent = String(Math.round(count.v)).padStart(2, "0");
          bar.style.transform = `scaleX(${count.v / 100})`;
        },
      },
      0.35,
    );

    // 3 — orange bloom swells behind the wordmark as loading completes.
    tl.fromTo(
      bloom,
      { opacity: 0, scale: 0.6 },
      { opacity: 0.55, scale: 1.15, duration: 1.1, ease: "power2.inOut" },
      countDuration - 0.55,
    );

    // 4 — exit: signals fire as the wipe starts so the hero entrance
    //     plays while being unveiled.
    tl.call(emitRevealSignals);
    tl.to(
      [word, foot],
      { yPercent: -160, opacity: 0, duration: exitDuration * 0.7, ease: "power3.in" },
      ">-0.05",
    );
    tl.to(
      overlay,
      {
        clipPath: "inset(0 0 100% 0)",
        duration: exitDuration,
        ease: "power4.inOut",
      },
      "<0.12",
    );

    return () => {
      tl.kill();
    };
  }, [portalReady, countDuration, exitDuration]);

  if (done || !portalReady) return null;

  return createPortal(
    <div
      ref={overlayRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "var(--kp-dark)",
        clipPath: "inset(0 0 0% 0)",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        visibility: "hidden",
      }}
    >
      {/* Orange bloom */}
      <div
        ref={bloomRef}
        style={{
          position: "absolute",
          width: "min(70vw, 640px)",
          aspectRatio: "1",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--kp-orange-glow) 0%, transparent 62%)",
          filter: "blur(10px)",
          opacity: 0,
        }}
      />

      {/* Wordmark — each letter masked, rises in */}
      <div
        ref={wordRef}
        style={{
          position: "relative",
          display: "flex",
          gap: "0.35em",
          fontFamily: "var(--kp-font-display)",
          fontSize: "clamp(1.4rem, 4.5vw, 3rem)",
          fontWeight: 600,
          textTransform: "uppercase",
          color: "var(--kp-light)",
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        {[word1, word2].map((w, wi) => (
          <span key={wi} style={{ display: "inline-flex" }}>
            {w.split("").map((ch, i) => (
              <span key={i} style={{ overflow: "hidden", display: "inline-block" }}>
                <span
                  data-letter
                  style={{
                    display: "inline-block",
                    color: wi === 1 ? "var(--kp-orange)" : undefined,
                  }}
                >
                  {ch}
                </span>
              </span>
            ))}
          </span>
        ))}
      </div>

      {/* Foot row: counter + hairline */}
      <div
        ref={footRef}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "0 clamp(1.5rem, 5vw, 4rem) clamp(1.25rem, 4vh, 2.5rem)",
          opacity: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "var(--kp-light)",
              opacity: 0.45,
            }}
          >
            Outdoor Advertising · Pan India
          </span>
          <span
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "clamp(2.4rem, 7vw, 5rem)",
              lineHeight: 0.9,
              color: "var(--kp-light)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span ref={counterRef}>00</span>
            <span style={{ color: "var(--kp-orange)" }}>%</span>
          </span>
        </div>
        <div
          style={{
            height: 1,
            background: "rgba(245, 247, 250, 0.14)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            ref={barRef}
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--kp-orange)",
              transform: "scaleX(0)",
              transformOrigin: "left center",
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
