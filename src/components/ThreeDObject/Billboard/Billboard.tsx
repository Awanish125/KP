"use client";

/**
 * Billboard.tsx — The top-level Billboard component.
 *
 * Owns:
 *   - The R3F Canvas (fixed to the viewport, behind all HTML content)
 *   - The Leva debug panel gate (only mounted when showControls is true)
 *   - The fade-in reveal (avoids a flash of fallback colours on first paint)
 *
 * Children render as scrollable HTML overlaid on top of the fixed canvas.
 * This lets section content scroll past the 3D scene while the canvas stays put.
 *
 * The onReady callback fires once the scene has mounted and exposes the
 * imperative handle so the page can pass it to GSAP.
 */

import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Bvh } from "@react-three/drei";
import { Leva } from "leva";
import { Scene } from "./Scene";
import type { BillboardImperativeHandle, BillboardProps } from "./types";

export default function Billboard({
  height = "100vh",
  showControls = false,
  className,
  children,
  onReady,
}: BillboardProps) {
  const internalRef = useRef<BillboardImperativeHandle>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const [visible, setVisible] = useState(false);

  return (
    <div className={className} style={{ position: "relative" }}>

      {/* Only mount the Leva panel when explicitly requested.
          Previously it was always mounted (just hidden), which still cost
          DOM nodes and JS. Now it truly doesn't exist in production. */}
      {showControls && <Leva collapsed />}

      {/* Fixed canvas — stays pinned to the viewport while page content scrolls */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height,
          zIndex: 0,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        <Canvas
          dpr={[1, 1.25]} // ceiling at 1.25x — AdaptiveDpr handles dropping it further under load
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ position: [5.5, 1.2, 9.5], fov: 38 }}
          style={{ background: "transparent" }}
          onCreated={() => {
            // Two rAF ticks gives textures time to start uploading to the GPU
            // before we reveal the canvas. We also fire onReady here (not on
            // component mount) because camera and orbit refs are only populated
            // after the Canvas renders its first frame.
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
            <Scene billboardRef={internalRef} />
          </Bvh>
        </Canvas>
      </div>

      {/* Scrollable HTML content renders above the fixed canvas */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>

    </div>
  );
}
