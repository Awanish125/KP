"use client";

/**
 * BeforeAfterSlider — drag the orange handle to compare the empty
 * structure with the live campaign.
 *
 *  - Position is written straight to clip-path/left during drag (refs,
 *    no React state per move — zero re-renders).
 *  - On first reveal the handle glides 0 → resting position so visitors
 *    instantly understand it's draggable.
 *  - Keyboard accessible: role="slider", arrow keys step 5%.
 *  - will-change only during the intro tween; drags are user-paced.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { observeOnce, prefersReducedMotion } from "@/lib/motion";
import { BEFORE_AFTER_SLIDER_DEFAULTS } from "./beforeAfterSliderConfig";
import type { BeforeAfterSliderProps } from "./beforeAfterSliderTypes";

export function BeforeAfterSlider({
  before,
  after,
  alt,
  className,
  initial = BEFORE_AFTER_SLIDER_DEFAULTS.initial,
  beforeLabel = BEFORE_AFTER_SLIDER_DEFAULTS.beforeLabel,
  afterLabel = BEFORE_AFTER_SLIDER_DEFAULTS.afterLabel,
  aspectRatio = BEFORE_AFTER_SLIDER_DEFAULTS.aspectRatio,
}: BeforeAfterSliderProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(initial);

  useEffect(() => {
    const frame = frameRef.current;
    const top = topRef.current;
    const handle = handleRef.current;
    if (!frame || !top || !handle) return;

    const apply = (p: number) => {
      posRef.current = p;
      top.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      handle.style.left = `${p}%`;
      handle.setAttribute("aria-valuenow", String(Math.round(p)));
    };

    /* Intro: glide from the left edge to the resting split. */
    if (prefersReducedMotion()) {
      apply(initial);
    } else {
      apply(0);
      const state = { p: 0 };
      let tween: gsap.core.Tween | null = null;
      const cancel = observeOnce(frame, () => {
        top.style.willChange = "clip-path";
        tween = gsap.to(state, {
          p: initial,
          duration: 1.4,
          ease: "power3.inOut",
          onUpdate: () => apply(state.p),
          onComplete: () => {
            top.style.willChange = "auto";
          },
        });
      });
      // Register cleanup for the intro path.
      const cleanupIntro = () => {
        cancel();
        tween?.kill();
        top.style.willChange = "auto";
      };
      /* Drag */
      let dragging = false;
      const fromClientX = (clientX: number) => {
        const rect = frame.getBoundingClientRect();
        const p = ((clientX - rect.left) / rect.width) * 100;
        apply(Math.max(0, Math.min(100, p)));
      };
      const onDown = (e: PointerEvent) => {
        dragging = true;
        tween?.kill(); // user takes over from the intro
        fromClientX(e.clientX);
        frame.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (dragging) fromClientX(e.clientX);
      };
      const onUp = () => {
        dragging = false;
      };
      frame.addEventListener("pointerdown", onDown);
      frame.addEventListener("pointermove", onMove);
      frame.addEventListener("pointerup", onUp);
      frame.addEventListener("pointercancel", onUp);
      return () => {
        cleanupIntro();
        frame.removeEventListener("pointerdown", onDown);
        frame.removeEventListener("pointermove", onMove);
        frame.removeEventListener("pointerup", onUp);
        frame.removeEventListener("pointercancel", onUp);
      };
    }

    /* Reduced-motion path still gets pointer control. */
    const fromClientX = (clientX: number) => {
      const rect = frame.getBoundingClientRect();
      const p = ((clientX - rect.left) / rect.width) * 100;
      apply(Math.max(0, Math.min(100, p)));
    };
    let dragging = false;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      fromClientX(e.clientX);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) fromClientX(e.clientX);
    };
    const onUp = () => {
      dragging = false;
    };
    frame.addEventListener("pointerdown", onDown);
    frame.addEventListener("pointermove", onMove);
    frame.addEventListener("pointerup", onUp);
    return () => {
      frame.removeEventListener("pointerdown", onDown);
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerup", onUp);
    };
  }, [initial]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const top = topRef.current;
    const handle = handleRef.current;
    if (!top || !handle) return;
    let p = posRef.current;
    if (e.key === "ArrowLeft") p -= 5;
    else if (e.key === "ArrowRight") p += 5;
    else return;
    e.preventDefault();
    p = Math.max(0, Math.min(100, p));
    posRef.current = p;
    top.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    handle.style.left = `${p}%`;
    handle.setAttribute("aria-valuenow", String(Math.round(p)));
  };

  const chip: React.CSSProperties = {
    fontFamily: "var(--kp-font-mono)",
    fontSize: "0.62rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    padding: "0.4rem 0.9rem",
    borderRadius: 999,
    background: "var(--scrim)",
    color: "var(--text)",
    border: "1px solid var(--border-soft)",
    pointerEvents: "none",
  };

  return (
    <div
      ref={frameRef}
      className={className}
      style={{
        position: "relative",
        aspectRatio,
        borderRadius: "1.25rem",
        overflow: "hidden",
        cursor: "ew-resize",
        touchAction: "pan-y",
        userSelect: "none",
      }}
    >
      {/* AFTER (base layer) */}
      <Image src={after} alt={alt} fill sizes="(max-width: 1024px) 100vw, 900px" style={{ objectFit: "cover" }} />

      {/* BEFORE (clipped on top) */}
      <div ref={topRef} style={{ position: "absolute", inset: 0, clipPath: "inset(0 50% 0 0)" }}>
        <Image
          src={before}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1024px) 100vw, 900px"
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* Labels */}
      <span className="absolute top-4 left-4" style={chip}>
        {beforeLabel}
      </span>
      <span className="absolute top-4 right-4" style={chip}>
        {afterLabel}
      </span>

      {/* Handle */}
      <div
        ref={handleRef}
        role="slider"
        aria-label="Compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={initial}
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${initial}%`,
          width: 2,
          background: "var(--kp-orange)",
          boxShadow: "0 0 20px var(--kp-orange-glow)",
          transform: "translateX(-1px)",
          outline: "none",
        }}
      >
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{
            background: "var(--kp-orange)",
            color: "var(--kp-dark)",
            boxShadow: "0 6px 24px var(--kp-orange-glow)",
            fontFamily: "var(--kp-font-mono)",
            fontSize: "0.8rem",
            letterSpacing: "0.05em",
          }}
        >
          ⇄
        </span>
      </div>
    </div>
  );
}
