"use client";

/**
 * BillboardBlock.tsx
 *
 * Drop-in 3D billboard that lives in your JSX layout like any div.
 * Size it with className / style. It fills its container automatically.
 *
 * Quick start:
 *   <BillboardBlock className="w-1/2 h-full" image="/kp.png" rotateOnEnter={180} />
 *
 * Full API is documented in SETUP.md.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Bvh } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Leva } from "leva";
import { DivScene } from "./DivScene";
import type {
  BillboardImperativeHandle,
  BillboardBlockHandle,
  BillboardBlockProps,
  RotateOptions,
  RotationImage,
  CameraAngle,
} from "./types";

gsap.registerPlugin(ScrollTrigger);

/* ── Camera presets ────────────────────────────────────────────────────────── */

const CAMERA_PRESETS: Record<
  "front" | "quarter",
  { position: [number, number, number]; fov: number }
> = {
  front:   { position: [0,   0.5, 8  ], fov: 38 },
  quarter: { position: [2.5, 1.2, 7  ], fov: 42 },
};

function getCameraConfig(angle: CameraAngle = "front") {
  if (angle === "front" || angle === "quarter") return CAMERA_PRESETS[angle];
  return { position: angle as [number, number, number], fov: 42 };
}

/* ── Helper — apply poster swaps when rotation crosses a degree threshold ──── */

function checkImages(
  currentDeg: number,
  images: RotationImage[],
  applied: Set<number>,
  bill: BillboardImperativeHandle | null,
) {
  if (!bill || images.length === 0) return;
  for (const img of images) {
    if (currentDeg >= img.atDegrees && !applied.has(img.atDegrees)) {
      applied.add(img.atDegrees);
      if (img.front) bill.changePoster("front", img.front);
      if (img.back)  bill.changePoster("back",  img.back);
    }
  }
}

/* ── Component ─────────────────────────────────────────────────────────────── */

const BillboardBlock = forwardRef<BillboardBlockHandle, BillboardBlockProps>(
  function BillboardBlock(props, ref) {
    const {
      className,
      style,
      image,
      backImage,
      cameraAngle      = "front",
      defaultRotation  = 0,
      rotateOnEnter,
      rotateDuration   = 1.5,
      rotateEase       = "power2.inOut",
      rotateImages     = [],
      scrollRotate,
      scrollTrigger: scrollTriggerTarget,
      scrollImages     = [],
      mobileLayout     = "stack",
      onEnter,
      onLeave,
      showControls     = false,
    } = props;

    const wrapRef = useRef<HTMLDivElement>(null);
    const billRef = useRef<BillboardImperativeHandle>(null);
    const [ready, setReady] = useState(false);

    // GSAP tweens this object's `.y` property (radians).
    // useRef with an object literal → MutableRefObject → current is never null.
    const rotObj = useRef<{ y: number }>({ y: (defaultRotation * Math.PI) / 180 });

    const camConfig = getCameraConfig(cameraAngle);

    /* ── Imperative handle ─────────────────────────────────────────────────── */
    useImperativeHandle(ref, () => ({
      rotateTo(degrees: number, options: RotateOptions = {}) {
        const {
          duration = rotateDuration,
          ease     = rotateEase,
          images   = [],
        } = options;
        const applied = new Set<number>();
        gsap.to(rotObj.current, {
          y: (degrees * Math.PI) / 180,
          duration,
          ease,
          overwrite: true,
          onUpdate() {
            checkImages(
              (rotObj.current.y * 180) / Math.PI,
              images,
              applied,
              billRef.current,
            );
          },
        });
      },

      resetRotation({ duration = 0.8, ease = "power2.inOut" } = {}) {
        gsap.to(rotObj.current, { y: 0, duration, ease, overwrite: true });
      },

      changePoster(face, imageUrl, duration) {
        billRef.current?.changePoster(face, imageUrl, duration);
      },

      getRotation() {
        return (rotObj.current.y * 180) / Math.PI;
      },
    }), [rotateDuration, rotateEase]);

    /* ── GSAP scroll effects ──────────────────────────────────────────────── */
    useEffect(() => {
      if (!ready || !wrapRef.current) return;
      const kills: (() => void)[] = [];

      // ── Enter-viewport rotation + onEnter/onLeave callbacks ──────────────
      if (rotateOnEnter !== undefined || onEnter || onLeave) {
        const applied = new Set<number>();
        let enterTween: gsap.core.Tween | null = null;

        const st = ScrollTrigger.create({
          trigger: wrapRef.current,
          start: "top 80%",
          end:   "bottom 20%",
          onEnter() {
            onEnter?.();
            if (rotateOnEnter !== undefined) {
              applied.clear();
              enterTween = gsap.to(rotObj.current, {
                y: (rotateOnEnter * Math.PI) / 180,
                duration: rotateDuration,
                ease: rotateEase,
                overwrite: true,
                onUpdate() {
                  checkImages(
                    (rotObj.current.y * 180) / Math.PI,
                    rotateImages,
                    applied,
                    billRef.current,
                  );
                },
              });
            }
          },
          onLeave() { onLeave?.(); },
          onEnterBack() {
            onEnter?.();
            // Re-run enter animation on scroll-back
            if (rotateOnEnter !== undefined) {
              applied.clear();
              enterTween?.kill();
              // Reset then animate forward again
              gsap.to(rotObj.current, {
                y: 0,
                duration: 0.3,
                ease: "power1.in",
                onComplete() {
                  applied.clear();
                  gsap.to(rotObj.current, {
                    y: (rotateOnEnter * Math.PI) / 180,
                    duration: rotateDuration,
                    ease: rotateEase,
                    onUpdate() {
                      checkImages(
                        (rotObj.current.y * 180) / Math.PI,
                        rotateImages,
                        applied,
                        billRef.current,
                      );
                    },
                  });
                },
              });
            }
          },
          onLeaveBack() { onLeave?.(); },
        });
        kills.push(() => st.kill());
      }

      // ── Scroll-driven rotation (pinned / tall-wrapper sections) ──────────
      if (scrollRotate !== undefined && scrollTriggerTarget) {
        const applied = new Set<number>();
        const endRad  = (scrollRotate * Math.PI) / 180;

        const st = ScrollTrigger.create({
          trigger: scrollTriggerTarget,
          start:   "top top",
          end:     "bottom bottom",
          scrub:   true,
          onUpdate(self) {
            const currentDeg = scrollRotate * self.progress;
            rotObj.current.y = endRad * self.progress;
            // Reset applied set when rewinding past 0
            if (self.progress < 0.01) applied.clear();
            checkImages(currentDeg, scrollImages, applied, billRef.current);
          },
        });
        kills.push(() => st.kill());
      }

      return () => kills.forEach((k) => k());
    }, [
      ready,
      rotateOnEnter,
      rotateDuration,
      rotateEase,
      rotateImages,
      scrollRotate,
      scrollTriggerTarget,
      scrollImages,
      onEnter,
      onLeave,
    ]);

    /* ── Mobile "behind" — fixed bottom strip when div is off-screen ─────── */
    const [mobileBehind, setMobileBehind] = useState(false);

    useEffect(() => {
      if (mobileLayout !== "behind") return;
      const el = wrapRef.current;
      if (!el) return;

      const io = new IntersectionObserver(
        ([entry]) => {
          const isMobile = window.innerWidth < 768;
          setMobileBehind(isMobile && !entry.isIntersecting);
        },
        { threshold: 0.05 },
      );
      io.observe(el);

      const onResize = () => {
        if (window.innerWidth >= 768) setMobileBehind(false);
      };
      window.addEventListener("resize", onResize);

      return () => {
        io.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }, [mobileLayout]);

    /* ── Canvas wrapper style ─────────────────────────────────────────────── */
    const canvasWrapStyle: React.CSSProperties = mobileBehind
      ? {
          // Drift to a fixed strip at the bottom of the viewport so the model
          // remains visible behind the stacked HTML content on mobile.
          position:      "fixed",
          bottom:        0,
          left:          0,
          right:         0,
          height:        "45vh",
          zIndex:        0,
          pointerEvents: "none",
          opacity:       0.85,
        }
      : {
          position: "absolute",
          inset:    0,
        };

    return (
      <div
        ref={wrapRef}
        className={className}
        style={{ position: "relative", overflow: "hidden", ...style }}
      >
        {showControls && <Leva collapsed />}

        <div style={canvasWrapStyle}>
          <Canvas
            dpr={[1, 1.5]}
            gl={{
              antialias:        true,
              alpha:            true,
              powerPreference:  "high-performance",
            }}
            camera={{
              position: camConfig.position,
              fov:      camConfig.fov,
              near:     0.1,
              far:      200,
            }}
            style={{ background: "transparent", width: "100%", height: "100%" }}
            onCreated={() => {
              // Two rAF frames to let the canvas settle before GSAP fires
              requestAnimationFrame(() =>
                requestAnimationFrame(() => setReady(true)),
              );
            }}
          >
            <Bvh>
              <AdaptiveDpr pixelated={false} />
              <AdaptiveEvents />
              <DivScene
                billboardRef={billRef}
                rotationObjRef={rotObj}
                image={image}
                backImage={backImage}
              />
            </Bvh>
          </Canvas>
        </div>
      </div>
    );
  },
);

BillboardBlock.displayName = "BillboardBlock";
export default BillboardBlock;
export type { BillboardBlockHandle, BillboardBlockProps };
