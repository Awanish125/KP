"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { BillboardSceneHandle } from "@/components/ThreeDObject/BillboardScrollScene";
import { ANIM_START, ANIM_END } from "@/components/ThreeDObject/BillboardScrollScene";

gsap.registerPlugin(ScrollTrigger);

interface UseBillboardScrollOptions {
  /** The element that acts as scroll trigger (the hero + spacer wrapper) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerRef: React.RefObject<any>;
  /** The fixed billboard scene ref */
  sceneRef: React.RefObject<BillboardSceneHandle | null>;
}

export function useBillboardScroll({ triggerRef, sceneRef }: UseBillboardScrollOptions) {
  const cleanupRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let retries = 0;
    let rafId = 0;
    let st: ScrollTrigger | null = null;

    function setup() {
      const trigger = triggerRef.current;
      const scene = sceneRef.current;

      if (!trigger || !scene) {
        if (++retries < 30) {
          rafId = requestAnimationFrame(setup);
        }
        return;
      }

      const anim = scene.anim;

      // NO pin:true — that fights with Lenis.
      // Instead we scroll over a 200vh trigger zone naturally.
      st = ScrollTrigger.create({
        trigger,
        start: "top top",
        end: "+=100%",          // 1 full viewport height of scroll drives the animation
        scrub: 0.6,
        onUpdate: (self) => {
          // Only render Three.js when the billboard is actually being animated —
          // zero GPU cost when hero is at top or content section is visible
          scene.invalidate();
          const p = self.progress;
          const wrapper = scene.wrapperEl;

          // Fade billboard in quickly, keep it visible the rest of the journey
          if (wrapper) wrapper.style.opacity = String(Math.min(p * 5, 1));

          // Lerp every animated property
          const lerp = (a: number, b: number) => a + (b - a) * p;

          anim.groupPosY         = lerp(ANIM_START.groupPosY,         ANIM_END.groupPosY);
          anim.groupRotY         = lerp(ANIM_START.groupRotY,         ANIM_END.groupRotY);
          anim.groupScaleUniform = lerp(ANIM_START.groupScaleUniform, ANIM_END.groupScaleUniform);
          anim.cameraX           = lerp(ANIM_START.cameraX,           ANIM_END.cameraX);
          anim.cameraY           = lerp(ANIM_START.cameraY,           ANIM_END.cameraY);
          anim.cameraZ           = lerp(ANIM_START.cameraZ,           ANIM_END.cameraZ);
          anim.ambientIntensity  = lerp(ANIM_START.ambientIntensity,  ANIM_END.ambientIntensity);
          anim.dirIntensity      = lerp(ANIM_START.dirIntensity,      ANIM_END.dirIntensity);
          anim.fillIntensity     = lerp(ANIM_START.fillIntensity,     ANIM_END.fillIntensity);
          anim.envIntensity      = lerp(ANIM_START.envIntensity,      ANIM_END.envIntensity);
        },
        onLeave: () => {
          // Animation complete — billboard fully visible, stop continuous renders
          // until user scrolls back
        },
        onLeaveBack: () => {
          const wrapper = scene.wrapperEl;
          if (wrapper) wrapper.style.opacity = "0";
        },
      });
    }

    rafId = requestAnimationFrame(setup);

    cleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      st?.kill();
    };

    return () => cleanupRef.current();
  }, [triggerRef, sceneRef]);
}
