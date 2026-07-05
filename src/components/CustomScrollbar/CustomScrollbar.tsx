"use client";

/**
 * CustomScrollbar — replaces the native scrollbar with a slim KP-orange
 * thumb that fades in while scrolling and supports dragging.
 *
 * Perf contract:
 *  - Thumb position updates on gsap.ticker (after Lenis applies its
 *    position); the frame is skipped when scroll hasn't changed.
 *  - Page height cached; refreshed by ResizeObserver, not per frame.
 *  - Drag scrolls through the shared Lenis instance (window.__kpLenis)
 *    with immediate:true so the thumb stays glued to the pointer.
 *  - Desktop fine-pointer only; reduced-motion users keep the native bar.
 *    The native bar is hidden via the `kp-scrollbar-active` html class,
 *    added only when this component actually activates.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { CUSTOM_SCROLLBAR_DEFAULTS } from "./customScrollbarConfig";
import type { CustomScrollbarProps } from "./customScrollbarTypes";

export function CustomScrollbar({
  width = CUSTOM_SCROLLBAR_DEFAULTS.width,
  inset = CUSTOM_SCROLLBAR_DEFAULTS.inset,
  minThumb = CUSTOM_SCROLLBAR_DEFAULTS.minThumb,
  hideAfter = CUSTOM_SCROLLBAR_DEFAULTS.hideAfter,
}: CustomScrollbarProps) {
  const [active, setActive] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer || prefersReducedMotion()) return;
    setActive(true);
    document.documentElement.classList.add("kp-scrollbar-active");
    return () => {
      document.documentElement.classList.remove("kp-scrollbar-active");
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    let max = 1; // max scrollable distance
    let trackH = 1;
    let thumbH = minThumb;
    let lastY = -1;
    let dragging = false;
    // Timestamp-based auto-hide: zero timer churn (no setTimeout per frame).
    let hideAt = 0;
    let shown = false;

    const measure = () => {
      max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      trackH = track.clientHeight;
      const ratio = window.innerHeight / (max + window.innerHeight);
      thumbH = Math.max(minThumb, Math.round(trackH * ratio));
      thumb.style.height = `${thumbH}px`;
      lastY = -1; // force repaint next tick
    };

    const show = () => {
      hideAt = performance.now() + hideAfter;
      if (!shown) {
        shown = true;
        track.style.opacity = "1";
      }
    };

    const tick = () => {
      const y = window.scrollY;
      if (y === lastY) {
        // Idle: only the cheap hide check remains.
        if (shown && !dragging && performance.now() > hideAt) {
          shown = false;
          track.style.opacity = "0";
        }
        return;
      }
      lastY = y;
      const t = Math.min(y / max, 1) * (trackH - thumbH);
      thumb.style.transform = `translateY(${t}px)`;
      show();
    };

    measure();
    gsap.ticker.add(tick);

    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);

    /* ── Drag to scroll ────────────────────────────────────────────── */
    let startPointerY = 0;
    let startScroll = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const delta = e.clientY - startPointerY;
      const target = startScroll + (delta / (trackH - thumbH)) * max;
      const lenis = window.__kpLenis;
      if (lenis) {
        lenis.scrollTo(Math.max(0, Math.min(target, max)), { immediate: true });
      } else {
        window.scrollTo(0, Math.max(0, Math.min(target, max)));
      }
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = "";
      show();
    };

    const onThumbDown = (e: PointerEvent) => {
      dragging = true;
      startPointerY = e.clientY;
      startScroll = window.scrollY;
      document.body.style.userSelect = "none";
      e.preventDefault();
    };

    thumb.addEventListener("pointerdown", onThumbDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endDrag);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      thumb.removeEventListener("pointerdown", onThumbDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      document.body.style.userSelect = "";
    };
  }, [active, minThumb, hideAfter, pathname]);

  if (!active) return null;

  return (
    <div
      ref={trackRef}
      aria-hidden
      style={{
        position: "fixed",
        top: inset,
        bottom: inset,
        right: 4,
        width,
        zIndex: 1500,
        borderRadius: 999,
        background: "var(--border-soft)",
        opacity: 0,
        transition: "opacity 350ms ease",
      }}
    >
      <div
        ref={thumbRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          borderRadius: 999,
          background: "var(--kp-orange)",
          boxShadow: "0 0 10px var(--kp-orange-glow)",
          cursor: "grab",
          pointerEvents: "auto",
          touchAction: "none",
        }}
      />
    </div>
  );
}
