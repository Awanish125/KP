"use client";

/**
 * PremiumLoader — Atlas Brut-style curtain split + scramble decode.
 *
 * Sequence:
 *   • Title scrambles from block glyphs → "KIRAN PUBLICITY" (left→right reveal)
 *   • Subtitle scrambles in — "OUTDOOR ADVERTISING · PAN INDIA"
 *   • Counter 0→100 runs against a hairline progress bar
 *   • Orange bloom breathes behind the wordmark
 *   • Console content fades out
 *   • Two curtain halves fly apart (left → xPercent -101, right → xPercent +101)
 *     with expo.inOut — the same Atlas Brut curtain split
 *
 * First-paint contract (unchanged):
 *  - SSR-rendered — covers the page before any JS runs.
 *  - CSS-gated: `kp-first-visit` on <html> makes it visible; without it the
 *    component is invisible so repeat visitors never flash.
 *
 * Reveal contract (unchanged):
 *  - `page-revealed` on <html> + `kp:loaded` event fire on wipe complete.
 *  - pointer-events: none throughout.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { onPageReady } from "@/lib/pageReady";
import { PREMIUM_LOADER_DEFAULTS } from "./premiumLoaderConfig";
import type { PremiumLoaderProps } from "./premiumLoaderTypes";

import { scrambleDecode } from "@/lib/scramble";

/* ── Reveal signals ─────────────────────────────────────────────────────── */
function emitRevealSignals() {
  document.documentElement.classList.add("page-revealed");
  window.dispatchEvent(new Event("kp:loaded"));
}

function emitRevealSignalsAfterVeil() {
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    emitRevealSignals();
  };
  if (window.__kpVeilActive) {
    window.addEventListener("kp:veil-done", fire, { once: true });
    window.setTimeout(fire, 1600);
  } else {
    fire();
  }
}

/* ── Component ──────────────────────────────────────────────────────────── */
export function PremiumLoader({
  word1 = PREMIUM_LOADER_DEFAULTS.word1,
  word2 = PREMIUM_LOADER_DEFAULTS.word2,
  countDuration = PREMIUM_LOADER_DEFAULTS.countDuration,
  exitDuration = PREMIUM_LOADER_DEFAULTS.exitDuration,
}: PremiumLoaderProps) {
  const [done, setDone] = useState(false);

  // Two curtain halves — the new exit mechanism
  const rootRef   = useRef<HTMLDivElement>(null);
  const leftRef   = useRef<HTMLDivElement>(null);
  const rightRef  = useRef<HTMLDivElement>(null);
  // Console content
  const titleRef    = useRef<HTMLParagraphElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const bloomRef    = useRef<HTMLDivElement>(null);
  const counterRef  = useRef<HTMLSpanElement>(null);
  const barRef      = useRef<HTMLDivElement>(null);
  const footRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hardLoad = document.documentElement.classList.contains("kp-first-visit");

    if (!hardLoad || prefersReducedMotion()) {
      document.documentElement.classList.remove("kp-first-visit");
      emitRevealSignalsAfterVeil();
      setDone(true);
      return;
    }

    // Full cinematic on every hard load — no short path
    const short = false;

    const root     = rootRef.current;
    const left     = leftRef.current;
    const right    = rightRef.current;
    const title    = titleRef.current;
    const subtitle = subtitleRef.current;
    const bloom    = bloomRef.current;
    const counter  = counterRef.current;
    const bar      = barRef.current;
    const foot     = footRef.current;

    if (!root || !left || !right || !title || !subtitle || !bloom || !counter || !bar || !foot) return;

    const titleText    = `${word1} ${word2}`;
    const subtitleText = "OUTDOOR ADVERTISING · PAN INDIA";
    const count = { v: 0 };

    let exitTl: gsap.core.Timeline | null = null;
    let alive = true;

    /* doExit — curtain split.
       1. Snap Lenis + start it so scroll is live during the wipe.
       2. Pin the root visible via inline style (overrides CSS class removal).
       3. Fade console, then both curtains fly apart simultaneously.
       4. On complete: clear inline styles, remove CSS gate, emit signals.    */
    const doExit = (wipeDuration: number) => {
      if (!alive) return;

      const lenis = window.__kpLenis;
      lenis?.scrollTo(0, { immediate: true });
      lenis?.start();

      // Keep the root on screen through the animation
      root.style.visibility = "visible";

      exitTl = gsap.timeline({
        onComplete: () => {
          if (!alive) return;
          root.style.visibility = "";
          document.documentElement.classList.remove("kp-first-visit");
          emitRevealSignals();
          setDone(true);
        },
      });

      // Console fades just before the curtains part
      exitTl.to([title, subtitle, foot], {
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
      });

      // Both curtain halves fly out simultaneously — the Atlas Brut split
      exitTl.to(left,  { xPercent: -101, duration: wipeDuration, ease: "expo.inOut" }, "-=0.05");
      exitTl.to(right, { xPercent:  101, duration: wipeDuration, ease: "expo.inOut" }, "<");
    };

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    if (short) {
      /* ── Quick wipe for returning sessions ─────────────────────────────
         Scramble the title once, bloom in, then curtain split.           */
      tl.add(scrambleDecode(title, titleText, 0.6), 0);
      tl.fromTo(
        bloom,
        { opacity: 0, scale: 0.7 },
        { opacity: 0.45, scale: 1.05, duration: 0.5, ease: "power2.inOut" },
        0.15,
      );
      tl.add(() => onPageReady(() => doExit(0.75)));

    } else {
      /* ── Full cinematic (first visit) ──────────────────────────────────
         1. Title scramble decodes (1.5 s)
         2. Subtitle scramble decodes (1.2 s, slight offset)
         3. Foot fades in; counter runs 0→100 with hairline bar
         4. Orange bloom swells
         5. Console fades; curtain split                                   */

      // foot is visible from frame 0 — counter always shows progress
      gsap.set(foot, { opacity: 1 });

      // 1 — scramble decode both lines concurrently with the counter
      tl.add(scrambleDecode(title, titleText, 1.5), 0);
      tl.add(scrambleDecode(subtitle, subtitleText, 1.2), 0.25);

      // 2 — counter + hairline bar run from the very first frame
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
        0,
      );

      // 3 — bloom swells as counter nears 100
      tl.fromTo(
        bloom,
        { opacity: 0, scale: 0.6 },
        { opacity: 0.55, scale: 1.15, duration: 1.1, ease: "power2.inOut" },
        countDuration - 0.55,
      );

      // 5 — curtain split (deferred so WebGL scene is warm first)
      tl.add(() => onPageReady(() => doExit(exitDuration)));
    }

    return () => {
      alive = false;
      tl.kill();
      exitTl?.kill();
    };
  }, [word1, word2, countDuration, exitDuration]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="kp-loader-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        pointerEvents: "none",
        overflow: "hidden", // clips curtain halves as they fly out
      }}
    >
      {/* ── Left curtain half ── */}
      <div
        ref={leftRef}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "50.5%",           // 0.5% overlap kills the 1-px seam
          background: "var(--bg)",
          willChange: "transform",
        }}
      />

      {/* ── Right curtain half ── */}
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

      {/* ── Orange bloom — sits above the curtains ── */}
      <div
        ref={bloomRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(70vw, 640px)",
          aspectRatio: "1",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--kp-orange-glow) 0%, transparent 62%)",
          filter: "blur(10px)",
          opacity: 0,
        }}
      />

      {/* ── Console — center content ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
          textAlign: "center",
        }}
      >
        {/* Scramble title: KIRAN PUBLICITY */}
        <p
          ref={titleRef}
          style={{
            fontFamily: "var(--kp-font-display)",
            fontSize: "clamp(1.4rem, 4.5vw, 3rem)",
            fontWeight: 600,
            textTransform: "uppercase",
            background: "linear-gradient(90deg, #0065B1 0%, #0065B1 36%, #F58420 52%, #F58420 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            letterSpacing: "0.12em",
            lineHeight: 1,
            margin: 0,
          }}
        />

        {/* Scramble subtitle: OUTDOOR ADVERTISING · PAN INDIA */}
        <p
          ref={subtitleRef}
          style={{
            fontFamily: "var(--kp-font-mono, monospace)",
            fontSize: "0.68rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--kp-orange)",
            margin: 0,
          }}
        />
      </div>

      {/* ── Foot row: counter + hairline ── */}
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
              fontFamily: "var(--kp-font-mono, monospace)",
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Outdoor Advertising · Pan India
          </span>
          <span
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "clamp(2.4rem, 7vw, 5rem)",
              lineHeight: 0.9,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span ref={counterRef}>00</span>
            <span style={{ color: "var(--kp-orange)" }}>%</span>
          </span>
        </div>

        {/* Hairline progress bar */}
        <div
          style={{
            height: 1,
            background: "var(--text-subtle)",
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
