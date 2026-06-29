"use client";

import { useRef } from "react";
import { HeroSection } from "@/components/ui";
import { useBillboardScroll } from "@/hooks/useBillboardScroll";
import BillboardScrollScene from "@/components/ThreeDObject/BillboardScrollScene";
import type { BillboardSceneHandle } from "@/components/ThreeDObject/BillboardScrollScene";

const IMAGES = [
  "/homepage/herosection/1.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/2.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/3.png",
  "/homepage/herosection/kp.png",
];

function HomeContent() {
  /**
   * triggerRef wraps Hero + spacer (200vh total).
   * ScrollTrigger runs from top to end of spacer — no pin needed,
   * so Lenis smooth scroll stays uninterrupted.
   */
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<BillboardSceneHandle | null>(null);

  useBillboardScroll({ triggerRef, sceneRef });

  return (
    <>
      {/* Billboard canvas: fixed overlay, z-index below content section */}
      <BillboardScrollScene
        ref={sceneRef}
        frontImage="/homepage/herosection/1.png"
        backImage="/homepage/herosection/kp.png"
      />

      {/*
       * Trigger zone: Hero (100vh) + animation spacer (100vh) = 200vh.
       * As user scrolls through this zone, ScrollTrigger drives the
       * billboard animation. No pin — page scrolls normally.
       */}
      <div ref={triggerRef}>
        {/* Hero occupies first viewport */}
        <div style={{ height: "100vh", position: "relative", zIndex: 5 }}>
          <HeroSection images={IMAGES} />
        </div>

        {/* Spacer: gives scroll room for billboard to complete its animation */}
        <div style={{ height: "100vh", position: "relative" }} aria-hidden="true" />
      </div>

      {/* Content sits above the fixed billboard */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          background: "var(--background)",
          minHeight: "100vh",
          padding: "4rem 2rem",
        }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 700 }}>Our Work</h2>
        <p style={{ marginTop: "1rem", opacity: 0.7 }}>
          Billboard advertising across the city — reaching millions of eyes daily.
        </p>
        <div style={{ height: "200vh" }} />
      </div>
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
