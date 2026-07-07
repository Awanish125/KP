"use client";

/**
 * Billboard.tsx — The top-level Billboard component.
 *
 * Three positioning modes:
 *
 *   DEFAULT (fixed background)
 *     <Billboard />
 *     Canvas is position:fixed, full-viewport, z-0. The 3D scene is a
 *     background layer behind all HTML content.
 *
 *   INLINE (fills a parent div)
 *     <div style={{ position:'relative', width:600, height:400 }}>
 *       <Billboard inline />
 *     </div>
 *     Canvas is position:absolute, inset:0. It fills whatever div you put it in.
 *     The parent div must have position:relative (or absolute/fixed/sticky).
 *
 *   CONTAINER REF (overlays an external div)
 *     const myRef = useRef<HTMLDivElement>(null);
 *     <div ref={myRef} style={{ width:600, height:400 }}>…</div>
 *     <Billboard containerRef={myRef} />
 *     The canvas floats (position:fixed) over the target div, tracks its
 *     screen position via ResizeObserver + scroll listener, and always fills
 *     that exact rect — even when the page is scrolled.
 */

import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Bvh } from "@react-three/drei";
import { Scene } from "./Scene";
import type { BillboardImperativeHandle, BillboardProps } from "./types";

export default function Billboard({
  height = "100vh",
  showControls = false,
  className,
  children,
  onReady,
  inline = false,
  containerRef,
}: BillboardProps) {
  const internalRef   = useRef<BillboardImperativeHandle>(null);
  const onReadyRef    = useRef(onReady);
  onReadyRef.current  = onReady;

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [visible,        setVisible]        = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  /* ── containerRef mode: sync canvas position to external div ────────────── */
  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const target = containerRef?.current;
    if (!wrap || !target) return;

    const sync = () => {
      const r = target.getBoundingClientRect();
      wrap.style.top    = `${r.top}px`;
      wrap.style.left   = `${r.left}px`;
      wrap.style.width  = `${r.width}px`;
      wrap.style.height = `${r.height}px`;
    };

    const ro = new ResizeObserver(sync);
    ro.observe(target);
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [containerRef]);

  /* ── Canvas wrapper style ─────────────────────────────────────────────────
     inline     → absolute, fills parent div
     containerRef → fixed, tracks target div (updated by the effect above)
     default    → fixed, full viewport
  */
  // When Manual Override is on, the canvas must sit ABOVE the HTML sections
  // (sections use z-10 / z-index:10) so it can receive mouse events for OrbitControls.
  // z-20 puts it on top; cursor changes to grab so it's obvious drag mode is active.
  const activeZ = manualOverride ? 20 : 0;

  const wrapStyle: React.CSSProperties = inline
    ? { position: "absolute", inset: 0, zIndex: activeZ,
        opacity: visible ? 1 : 0, transition: "opacity 0.6s ease",
        cursor: manualOverride ? "grab" : "auto" }
    : containerRef
    ? { position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: activeZ,
        opacity: visible ? 1 : 0, transition: "opacity 0.6s ease",
        cursor: manualOverride ? "grab" : "auto" }
    : { position: "fixed", top: 0, left: 0,
        width: "100%", height,
        zIndex: activeZ,
        opacity: visible ? 1 : 0, transition: "opacity 0.6s ease",
        cursor: manualOverride ? "grab" : "auto" };

  /* ── Outer wrapper ────────────────────────────────────────────────────────
     In inline mode the outer wrapper needs position:relative so the absolute
     canvas sits inside it. In other modes position:relative is harmless.     */
  const outerStyle: React.CSSProperties = inline
    ? { position: "relative", width: "100%", height: "100%" }
    : { position: "relative" };

  return (
    <div className={className} style={outerStyle}>

      

      {/* Canvas wrapper — see wrapStyle comment above */}
      <div ref={canvasWrapRef} style={wrapStyle}>
        <Canvas
          dpr={[1, 1.25]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [6, 2, 11], fov: 45 }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
          onCreated={() => {
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                setVisible(true);
                if (internalRef.current && onReadyRef.current) {
                  onReadyRef.current(internalRef.current);
                }
              }),
            );
          }}
        >
          <Bvh>
            <AdaptiveDpr pixelated={false} />
            <AdaptiveEvents />
            <Scene billboardRef={internalRef} onManualOverride={setManualOverride} />
          </Bvh>
        </Canvas>
      </div>

      {/* Scrollable HTML content (used in default mode only) */}
      {children && (
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      )}
    </div>
  );
}
