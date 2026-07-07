"use client";

/**
 * TrackingBillboard.tsx
 *
 * ONE canvas, ONE WebGL context, ONE model.
 *
 * The canvas is position:fixed. Its top/left/width/height are animated by
 * the parent (page.tsx) via GSAP ScrollTrigger so the model appears to fly
 * from section to section as the user scrolls.
 *
 * The parent places invisible "slot" divs (w-1/2, h-full, pointer-events-none)
 * in each section to mark where the billboard should appear. GSAP scrubs the
 * canvas rect between those slot positions.
 *
 * Exposes:
 *   wrapRef       — pass to GSAP for position / opacity / scale tweens
 *   rotateTo      — GSAP-eased imperative rotation
 *   resetRotation — back to 0°
 *   changePoster  — crossfade poster image
 *   startScrollRotation — wire 360° rotation to a pinned section
 *   stopScrollRotation  — kill that ScrollTrigger
 */

import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  MutableRefObject,
  Suspense,
} from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Bvh } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DivScene } from "./DivScene";
import type {
  BillboardImperativeHandle,
  CameraAngle,
  RotateOptions,
  RotationImage,
} from "./types";

gsap.registerPlugin(ScrollTrigger);

/* ── helpers ─────────────────────────────────────────────────────────────── */

const CAMERA_PRESETS = {
  front:   { position: [0, 0.5, 8]   as [number, number, number], fov: 38 },
  quarter: { position: [2.5, 1.2, 7] as [number, number, number], fov: 42 },
};

function getCameraConfig(angle: CameraAngle = "front") {
  if (angle === "front" || angle === "quarter") return CAMERA_PRESETS[angle];
  return { position: angle as [number, number, number], fov: 42 };
}

function checkImages(
  deg: number,
  images: RotationImage[],
  applied: Set<number>,
  bill: BillboardImperativeHandle | null,
) {
  for (const img of images) {
    if (deg >= img.atDegrees && !applied.has(img.atDegrees)) {
      applied.add(img.atDegrees);
      if (img.front) bill?.changePoster("front", img.front);
      if (img.back)  bill?.changePoster("back",  img.back);
    }
  }
}

/* ── public types ─────────────────────────────────────────────────────────── */

export interface TrackingBillboardHandle {
  /** The canvas wrapper div — animate top/left/width/height/opacity/scale with GSAP. */
  wrapRef: MutableRefObject<HTMLDivElement | null>;
  rotateTo: (degrees: number, options?: RotateOptions) => void;
  resetRotation: (options?: { duration?: number; ease?: string }) => void;
  /**
   * Set rotation instantly (no GSAP tween) — for scroll-scrubbed transit animations
   * where the scroll progress directly drives the rotation value.
   */
  setRotationDirect: (degrees: number) => void;
  changePoster: (face: "front" | "back", url: string, duration?: number) => void;
  /**
   * Wire scroll-driven rotation to a tall wrapper element.
   * `triggerSelector` is a CSS selector for the 300–400 vh wrapper div.
   */
  startScrollRotation: (
    totalDegrees: number,
    triggerSelector: string,
    images?: RotationImage[],
  ) => void;
  stopScrollRotation: () => void;
}

interface TrackingBillboardProps {
  initialImage?: string;
  cameraAngle?:  CameraAngle;
  /** Controls the R3F render loop. Use "demand" to suspend rendering (no GPU
   *  cost) while the canvas is invisible; switch to "always" when it should render. */
  frameloop?: 'always' | 'demand' | 'never';
}

/* ── component ──────────────────────────────────────────────────────────── */

export const TrackingBillboard = forwardRef<
  TrackingBillboardHandle,
  TrackingBillboardProps
>(function TrackingBillboard({ initialImage, cameraAngle = "front", frameloop = 'always' }, ref) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const billRef  = useRef<BillboardImperativeHandle>(null);
  const rotObj   = useRef<{ y: number }>({ y: 0 });
  const scrollST = useRef<ScrollTrigger | null>(null);

  const camConfig = getCameraConfig(cameraAngle);

  useImperativeHandle(ref, () => ({
    wrapRef,

    rotateTo(degrees, options = {}) {
      const { duration = 1.5, ease = "power2.inOut", images = [] } = options;
      const applied = new Set<number>();
      const startY  = rotObj.current.y;
      gsap.to(rotObj.current, {
        y: (degrees * Math.PI) / 180,
        duration,
        ease,
        overwrite: true,
        onUpdate() {
          const deg = ((rotObj.current.y - startY) * 180) / Math.PI;
          checkImages(deg, images, applied, billRef.current);
        },
      });
    },

    resetRotation({ duration = 0.8, ease = "power2.inOut" } = {}) {
      gsap.to(rotObj.current, { y: 0, duration, ease, overwrite: true });
    },

    setRotationDirect(degrees) {
      gsap.killTweensOf(rotObj.current);
      rotObj.current.y = (degrees * Math.PI) / 180;
    },

    changePoster(face, url, duration) {
      billRef.current?.changePoster(face, url, duration);
    },

    startScrollRotation(totalDegrees, triggerSelector, images = []) {
      scrollST.current?.kill();
      const applied = new Set<number>();
      const endRad  = (totalDegrees * Math.PI) / 180;
      scrollST.current = ScrollTrigger.create({
        trigger: triggerSelector,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate(self) {
          const deg = totalDegrees * self.progress;
          rotObj.current.y = endRad * self.progress;
          if (self.progress < 0.01) applied.clear();
          checkImages(deg, images, applied, billRef.current);
        },
      });
    },

    stopScrollRotation() {
      scrollST.current?.kill();
      scrollST.current = null;
    },
  }));

  return (
    <>
    {/* Canvas wrapper — page.tsx GSAP controls top/left/width/height/opacity */}
    <div
      ref={wrapRef}
      style={{
        position:      "fixed",
        top:           0,
        left:          0,
        width:         "50%",
        height:        "100vh",
        zIndex:        2,
        opacity:       0,
        pointerEvents: "none",
        willChange:    "opacity, transform",
      }}
    >
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: camConfig.position, fov: camConfig.fov, near: 0.1, far: 200 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        onCreated={() => {
          // Two rAF frames so the first rendered frame is actually on screen
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              window.dispatchEvent(new Event('kp:sceneReady'))
            )
          );
        }}
      >
        <Bvh>
          <AdaptiveDpr pixelated={false} />
          <AdaptiveEvents />
          <Suspense fallback={null}>
            <DivScene
              billboardRef={billRef}
              rotationObjRef={rotObj}
              image={initialImage}
            />
          </Suspense>
        </Bvh>
      </Canvas>
    </div>
    </>
  );
});

TrackingBillboard.displayName = "TrackingBillboard";
