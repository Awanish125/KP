"use client";

/**
 * CustomCursor — orange dot tracks the pointer 1:1; a soft ring trails it
 * with a lerp and swells over interactive elements.
 *
 * Perf contract:
 *  - Dot moves inside the pointermove handler (no per-frame cost).
 *  - Ring lerp runs on gsap.ticker ONLY while the pointer is inside the
 *    window; removed on pointerout/blur.
 *  - Desktop-only (pointer: fine) and disabled for prefers-reduced-motion —
 *    in both cases the native cursor is left untouched.
 *  - Hover detection via one delegated pointerover listener.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { CUSTOM_CURSOR_DEFAULTS } from "./customCursorConfig";
import type { CustomCursorProps } from "./customCursorTypes";

export function CustomCursor({
  dotSize = CUSTOM_CURSOR_DEFAULTS.dotSize,
  ringSize = CUSTOM_CURSOR_DEFAULTS.ringSize,
  lerp = CUSTOM_CURSOR_DEFAULTS.lerp,
  hoverScale = CUSTOM_CURSOR_DEFAULTS.hoverScale,
  interactiveSelector = CUSTOM_CURSOR_DEFAULTS.interactiveSelector,
}: CustomCursorProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer || prefersReducedMotion()) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("kp-cursor-active");

    const setDot = gsap.quickSetter(dot, "css") as (v: object) => void;
    const setRing = gsap.quickSetter(ring, "css") as (v: object) => void;
    const toRingScale = gsap.quickTo(ring, "scale", { duration: 0.35, ease: "power3.out" });

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let ticking = false;
    let visible = false;

    const tick = () => {
      pos.x += (target.x - pos.x) * lerp;
      pos.y += (target.y - pos.y) * lerp;
      setRing({ x: pos.x, y: pos.y });
    };

    const startTicking = () => {
      if (!ticking) {
        ticking = true;
        gsap.ticker.add(tick);
      }
    };
    const stopTicking = () => {
      if (ticking) {
        ticking = false;
        gsap.ticker.remove(tick);
      }
    };

    const show = () => {
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };
    const hide = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setDot({ x: e.clientX, y: e.clientY });
      show();
      startTicking();
    };

    // Delegated hover state for interactive elements.
    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(interactiveSelector);
      toRingScale(el ? hoverScale : 1);
      ring.style.borderColor = el ? "var(--kp-orange)" : "var(--kp-orange-glow)";
    };

    const onLeaveWindow = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        hide();
        stopTicking();
      }
    };
    const onBlur = () => {
      hide();
      stopTicking();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onLeaveWindow, { passive: true });
    window.addEventListener("blur", onBlur);

    return () => {
      document.documentElement.classList.remove("kp-cursor-active");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onLeaveWindow);
      window.removeEventListener("blur", onBlur);
      stopTicking();
    };
  }, [lerp, hoverScale, interactiveSelector]);

  const common: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    pointerEvents: "none",
    borderRadius: "50%",
    opacity: 0,
    zIndex: 2000,
  };

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        style={{
          ...common,
          width: dotSize,
          height: dotSize,
          marginLeft: -dotSize / 2,
          marginTop: -dotSize / 2,
          background: "var(--kp-orange)",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        style={{
          ...common,
          width: ringSize,
          height: ringSize,
          marginLeft: -ringSize / 2,
          marginTop: -ringSize / 2,
          border: "1.5px solid var(--kp-orange-glow)",
          transition: "border-color 250ms ease, opacity 250ms ease",
          // NOTE: no mix-blend-mode here — blend modes on a fixed overlay
          // force the entire page into expensive compositing every frame.
        }}
      />
    </>
  );
}
