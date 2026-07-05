"use client";

/**
 * PremiumLoader — minimal, cinematic first-visit reveal.
 *
 * Sequence: wordmark letters rise in and tracking widens → counter runs
 * 0→100 against a hairline progress bar → a soft orange bloom breathes
 * behind the wordmark → the whole field wipes upward, unveiling the page.
 *
 * First-paint contract (the loader must NEVER appear late):
 *  - Rendered in the SSR HTML (no portal, no state gate), so it covers
 *    the page from the first frame even while everything else loads.
 *  - Visibility is CSS-gated: the inline head script in layout.tsx adds
 *    `kp-first-visit` to <html> BEFORE paint when the session is new;
 *    repeat visitors never see a flash (display: none).
 *
 * Reveal contract (same as the original Loading.tsx):
 *  - `page-revealed` on <html> + `kp:loaded` fire when the timeline ENDS,
 *    so the hero entrance plays in full view.
 *  - When the loader is skipped (repeat visit / reduced motion), the same
 *    signals fire — but only after the PageTransition veil has finished,
 *    so the hero entrance is never hidden behind the veil.
 *  - pointer-events: none — the page underneath is interactive throughout.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { PREMIUM_LOADER_DEFAULTS } from "./premiumLoaderConfig";
import type { PremiumLoaderProps } from "./premiumLoaderTypes";

function emitRevealSignals() {
  document.documentElement.classList.add("page-revealed");
  window.dispatchEvent(new Event("kp:loaded"));
}

/** Fire the reveal signals once the route veil (if any) is out of the way. */
function emitRevealSignalsAfterVeil() {
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    emitRevealSignals();
  };
  if (window.__kpVeilActive) {
    window.addEventListener("kp:veil-done", fire, { once: true });
    window.setTimeout(fire, 1600); // safety net — never leave the hero hidden
  } else {
    fire();
  }
}

export function PremiumLoader({
  word1 = PREMIUM_LOADER_DEFAULTS.word1,
  word2 = PREMIUM_LOADER_DEFAULTS.word2,
  countDuration = PREMIUM_LOADER_DEFAULTS.countDuration,
  exitDuration = PREMIUM_LOADER_DEFAULTS.exitDuration,
}: PremiumLoaderProps) {
  const [done, setDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The pre-paint flag marks a HARD document load (the inline head
    // script sets it; we retire it below, so SPA navigations never see
    // it). Every hard load gets covered — the full cinematic for a brand
    // new session, a quick brand wipe for refreshes/returns — so raw
    // half-loaded content is never the first paint.
    const hardLoad = document.documentElement.classList.contains("kp-first-visit");
    let seen = false;
    try {
      seen = !!sessionStorage.getItem("kp-visited");
    } catch {
      /* storage blocked — treat as seen */
      seen = true;
    }

    if (!hardLoad || prefersReducedMotion()) {
      document.documentElement.classList.remove("kp-first-visit");
      emitRevealSignalsAfterVeil();
      setDone(true);
      return;
    }

    const short = seen; // refresh / returning this session → quick wipe

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
      onComplete: () => {
        // Same contract as the original Loading.tsx: signals fire when the
        // loader timeline ENDS, so the hero entrance plays in full view
        // after the wipe — never hidden behind the overlay. The CSS gate
        // is retired so later mounts (SPA navs) never replay the reveal.
        document.documentElement.classList.remove("kp-first-visit");
        emitRevealSignals();
        setDone(true);
      },
    });

    if (short) {
      // ── Quick brand wipe (~1.3s) for refreshes / returning sessions ──
      gsap.set(foot, { opacity: 0 });
      tl.fromTo(
        letters,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.5, stagger: 0.018 },
        0.05,
      );
      tl.fromTo(
        bloom,
        { opacity: 0, scale: 0.7 },
        { opacity: 0.45, scale: 1.05, duration: 0.5, ease: "power2.inOut" },
        0.15,
      );
      tl.to(
        word,
        { yPercent: -160, opacity: 0, duration: 0.4, ease: "power3.in" },
        0.72,
      );
      tl.to(
        overlay,
        { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "power4.inOut" },
        0.8,
      );
      return () => {
        tl.kill();
      };
    }

    // ── Full cinematic (first visit of the session) ──────────────────

    // 1 — letters rise into view, tracking breathes open.
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

    // 4 — exit wipe. Reveal signals fire in onComplete (above), not here.
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
  }, [countDuration, exitDuration]);

  if (done) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="kp-loader-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "var(--kp-dark)",
        clipPath: "inset(0 0 0% 0)",
        pointerEvents: "none",
        alignItems: "center",
        justifyContent: "center",
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
    </div>
  );
}
