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
    const pos = { x: 0, y: 0 };
    let snapNext = true;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX + offsetX;
      target.y = e.clientY + offsetY;
      if (snapNext) {
        // First frame after showing: appear at the cursor, don't fly in.
        pos.x = target.x;
        pos.y = target.y;
        snapNext = false;
      }
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * lerp;
      pos.y += (target.y - pos.y) * lerp;
      setXY({ x: pos.x, y: pos.y });
    };

    if (src) {
      snapNext = true;
      window.addEventListener("pointermove", onMove, { passive: true });
      gsap.ticker.add(tick);
      frame.style.willChange = "transform, opacity";
      gsap.to(frame, {
        opacity: 1,
        scale: 1,
        rotation: -3,
        duration: 0.45,
        ease: "back.out(1.8)",
      });
    } else {
      gsap.to(frame, {
        opacity: 0,
        scale: 0.85,
        rotation: 2,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          frame.style.willChange = "auto";
        },
      });
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
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
