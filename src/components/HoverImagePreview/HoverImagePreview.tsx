"use client";

/**
 * HoverImagePreview — a floating image frame that chases the cursor while
 * the parent reports an active src (e.g. hovering ServicesStrip rows).
 *
 * Perf contract:
 *  - gsap.ticker runs ONLY while a src is active (added on show, removed
 *    on hide) — zero per-frame cost otherwise.
 *  - Show/hide is a scale+opacity pop via one tween; will-change managed.
 *  - Desktop fine-pointer only; reduced motion → renders nothing.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { HOVER_IMAGE_PREVIEW_DEFAULTS } from "./hoverImagePreviewConfig";
import type { HoverImagePreviewProps } from "./hoverImagePreviewTypes";

export function HoverImagePreview({
  src,
  alt = "",
  width = HOVER_IMAGE_PREVIEW_DEFAULTS.width,
  lerp = HOVER_IMAGE_PREVIEW_DEFAULTS.lerp,
  offsetX = HOVER_IMAGE_PREVIEW_DEFAULTS.offsetX,
  offsetY = HOVER_IMAGE_PREVIEW_DEFAULTS.offsetY,
}: HoverImagePreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  // Keep the last src so the image stays during the hide animation.
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(
      window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion(),
    );
  }, []);

  useEffect(() => {
    if (src) setDisplaySrc(src);
  }, [src]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !enabled) return;

    const setXY = gsap.quickSetter(frame, "css") as (v: object) => void;
    const target = { x: 0, y: 0 };
    const pos    = { x: 0, y: 0 };

    // Ticker is added lazily on the first pointermove — prevents the frame
    // from rendering at (0,0) on show before any cursor data arrives.
    let tickerAdded = false;
    const tick = () => {
      pos.x += (target.x - pos.x) * lerp;
      pos.y += (target.y - pos.y) * lerp;
      setXY({ x: pos.x, y: pos.y });
    };
    const addTicker = () => { if (!tickerAdded) { tickerAdded = true; gsap.ticker.add(tick); } };
    const removeTicker = () => { if (tickerAdded) { tickerAdded = false; gsap.ticker.remove(tick); } };

    // Immediately hides and stops tracking — used both for the hide tween
    // and as the scroll handler so scrolling always dismisses the preview.
    const hideAndStop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", hideAndStop);
      (window.__kpLenis as any)?.off?.("scroll", hideAndStop);
      removeTicker();
      gsap.to(frame, {
        opacity: 0, scale: 0.85, rotation: 2,
        duration: 0.3, ease: "power2.in",
        onComplete: () => { frame.style.willChange = "auto"; },
      });
    };

    let shown = false;
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX + offsetX;
      target.y = e.clientY + offsetY;
      // Snap pos to cursor on the very first move so the frame never
      // "flies in" from (0,0); after that the lerp takes over.
      if (!tickerAdded) {
        pos.x = target.x;
        pos.y = target.y;
        addTicker();
      }
      // Delay the show tween until we have real cursor coords — prevents
      // the frame from flashing at top:0/left:0 before the first pointermove.
      if (!shown) {
        shown = true;
        frame.style.willChange = "transform, opacity";
        gsap.to(frame, {
          opacity: 1, scale: 1, rotation: -3,
          duration: 0.45, ease: "back.out(1.8)",
        });
      }
    };

    if (src) {
      window.addEventListener("pointermove", onMove, { passive: true });
      // Belt-and-suspenders: hide as soon as any scroll starts, regardless
      // of whether the parent row fires mouseleave (it often doesn't on scroll).
      window.addEventListener("scroll", hideAndStop, { passive: true, once: true });
      (window.__kpLenis as any)?.on?.("scroll", hideAndStop);
    } else {
      hideAndStop();
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", hideAndStop);
      (window.__kpLenis as any)?.off?.("scroll", hideAndStop);
      removeTicker();
    };
  }, [src, enabled, lerp, offsetX, offsetY]);

  if (!enabled || !displaySrc) return null;

  return (
    <div
      ref={frameRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 60,
        width,
        aspectRatio: "4 / 3",
        borderRadius: "1rem",
        overflow: "hidden",
        pointerEvents: "none",
        opacity: 0,
        transform: "scale(0.85)",
        border: "1px solid var(--kp-orange-glow)",
        boxShadow: "var(--shadow-ambient)",
        // Frame anchors at the cursor's top-left; translate handled by GSAP.
        marginTop: 0,
      }}
    >
      {/* Plain img: src swaps rapidly on row changes — next/image adds no
          value for a decorative, pointer-events-none preview. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
