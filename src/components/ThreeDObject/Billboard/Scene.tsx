"use client";

/**
 * Scene.tsx — R3F scene contents.
 *
 * ── Camera animation ────────────────────────────────────────────────────────
 * All camera movement lives HERE in useFrame, not in page.tsx GSAP timelines.
 * Reason: GSAP ScrollTrigger + Lenis + useGSAP timing races were making the
 * camera unreliable. useFrame runs every render tick unconditionally, reads
 * window.scrollY, interpolates between keyframe positions, and lerps the
 * camera toward the target. Lenis smooths the HTML scroll; the camera reads
 * the same window.scrollY and adds its own lerp for the "heavy camera" feel.
 *
 * ── Leva full control ──────────────────────────────────────────────────────
 * In dev mode the "Camera" Leva panel lets you:
 *   • Toggle "Manual Override" to drive the camera with sliders instead of scroll
 *   • Adjust position X/Y/Z, look-at target X/Y/Z, FOV, and damping in real time
 *   • Click "📋 Copy State" after scrolling to a position to grab the keyframe values
 */

import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Environment, Grid } from "@react-three/drei";
import { useControls, button, folder } from "leva";
import * as THREE from "three";
import { CameraController } from "./CameraController";
import { BillboardMesh } from "./BillboardMesh";
import type { BillboardImperativeHandle } from "./types";

/* ── Camera keyframes ─────────────────────────────────────────────────────────
   `scroll` is in units of viewport heights from the top of the page.
   Total page scroll = 7 viewport heights  (800vh page − 100vh viewport).

   Section positions:
     0–1 vh  → hero     (OGL canvas covers 3D scene, camera just needs to look nice)
     1–2 vh  → about    → camera swings to front-right of billboard
     2–3 vh  → services → camera slides far left
     3–4 vh  → why us   → camera swings far right
     4–5 vh  → campaign → camera zooms in tight
     5–7 vh  → pinned   → 3/4 angle for Phase 5 rotation
*/
const KEYFRAMES = [
  { scroll: 0, pos: [6,  2,   11 ] as [number,number,number], target: [0, 0.5, 0 ] as [number,number,number], fov: 45, light: 0.18 },
  { scroll: 1, pos: [5.5,1.2, 9.5] as [number,number,number], target: [0, 0.8, 0 ] as [number,number,number], fov: 38, light: 0.22 },
  { scroll: 2, pos: [-8, 1.5, 6  ] as [number,number,number], target: [0, 0,   0 ] as [number,number,number], fov: 42, light: 0.28 },
  { scroll: 3, pos: [8,  1.5, 6  ] as [number,number,number], target: [0, 0,   0 ] as [number,number,number], fov: 42, light: 0.28 },
  { scroll: 4, pos: [0,  0.5, 4.5] as [number,number,number], target: [0, 0.2, 0 ] as [number,number,number], fov: 30, light: 0.12 },
  { scroll: 7, pos: [3,  1.2, 7  ] as [number,number,number], target: [0, 0,   0 ] as [number,number,number], fov: 38, light: 0.08 },
] as const;

const TOTAL_SCROLL_VH = 7; // max scroll in viewport-height units

/** Linearly interpolate between two keyframes at scroll position `svh`. */
function getKeyframeAt(svh: number) {
  const clamped = Math.max(0, Math.min(TOTAL_SCROLL_VH, svh));
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (clamped <= b.scroll) {
      const t = (clamped - a.scroll) / (b.scroll - a.scroll);
      return {
        pos:    [a.pos[0]    + (b.pos[0]    - a.pos[0])    * t,
                 a.pos[1]    + (b.pos[1]    - a.pos[1])    * t,
                 a.pos[2]    + (b.pos[2]    - a.pos[2])    * t] as [number,number,number],
        target: [a.target[0] + (b.target[0] - a.target[0]) * t,
                 a.target[1] + (b.target[1] - a.target[1]) * t,
                 a.target[2] + (b.target[2] - a.target[2]) * t] as [number,number,number],
        fov:    a.fov   + (b.fov   - a.fov)   * t,
        light:  a.light + (b.light - a.light) * t,
      };
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1];
  return { pos: last.pos, target: last.target, fov: last.fov, light: last.light };
}

/* ── Props ──────────────────────────────────────────────────────────────────── */
interface SceneProps {
  billboardRef: React.RefObject<BillboardImperativeHandle | null>;
}

/* ── Scene ──────────────────────────────────────────────────────────────────── */
export function Scene({ billboardRef }: SceneProps) {
  const cameraRef       = useRef<THREE.PerspectiveCamera>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  // Smooth camera state — lerped every frame toward the keyframe target
  const currentPos    = useRef(new THREE.Vector3(6, 2, 11));
  const currentTarget = useRef(new THREE.Vector3(0, 0.5, 0));
  const currentFov    = useRef(45);

  // Reusable vectors to avoid per-frame allocations
  const _wantPos    = useRef(new THREE.Vector3());
  const _wantTarget = useRef(new THREE.Vector3());

  /* ── Leva: Lighting ────────────────────────────────────────────────────── */
  const lightCtl = useControls("Lighting", {
    hdrIntensity: { value: 0.6,  min: 0, max: 3,   step: 0.05, label: "HDR Intensity" },
    exposure:     { value: 1.2,  min: 0.1, max: 3, step: 0.05, label: "Exposure"      },
  });

  /* ── Leva: Camera (full manual override) ───────────────────────────────── */
  const camCtl = useControls("Camera", {
    manualOverride: { value: false, label: "Manual Override (disable scroll)" },
    Camera: folder({
      posX: { value: 6,    min: -30, max: 30, step: 0.1, label: "Position X" },
      posY: { value: 2,    min: -10, max: 20, step: 0.1, label: "Position Y" },
      posZ: { value: 11,   min: -30, max: 30, step: 0.1, label: "Position Z" },
      tgtX: { value: 0,    min: -10, max: 10, step: 0.1, label: "Target X"   },
      tgtY: { value: 0.5,  min: -5,  max: 10, step: 0.1, label: "Target Y"   },
      tgtZ: { value: 0,    min: -10, max: 10, step: 0.1, label: "Target Z"   },
      fov:  { value: 45,   min: 10,  max: 120, step: 1,  label: "FOV"        },
    }),
    Animation: folder({
      damping: { value: 0.005, min: 0.0001, max: 0.5, step: 0.0001, label: "Damping (lower = slower)" },
    }),
    "📋 Copy Current State": button(() => {
      const cam = cameraRef.current;
      if (!cam) return;
      const state = {
        pos:    [+cam.position.x.toFixed(3), +cam.position.y.toFixed(3), +cam.position.z.toFixed(3)],
        target: [+currentTarget.current.x.toFixed(3), +currentTarget.current.y.toFixed(3), +currentTarget.current.z.toFixed(3)],
        fov:    +cam.fov.toFixed(1),
      };
      navigator.clipboard
        .writeText(JSON.stringify(state, null, 2))
        .then(() => console.info("📋 Copied:", state))
        .catch(() => console.info("📋 Camera state (clipboard blocked):", state));
    }),
  });

  // Mirror Leva state to a ref so useFrame can read it without closure stale values
  const camCtlRef = useRef(camCtl);
  camCtlRef.current = camCtl;

  /* ── Leva: Debug ────────────────────────────────────────────────────────── */
  const debugCtl = useControls("Debug", {
    wireframe: false,
    grid:      false,
  });

  /* ── Renderer ───────────────────────────────────────────────────────────── */
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping         = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = lightCtl.exposure;
    gl.outputColorSpace    = THREE.SRGBColorSpace;
  }, [gl, lightCtl.exposure]);

  /* ── Camera + lighting animation loop ──────────────────────────────────────
     Runs every R3F frame. Reads window.scrollY (updated by Lenis each frame),
     calculates the target camera state from the KEYFRAMES above, and lerps
     the current camera toward it. The lerp gives the "heavy camera" feel
     without any GSAP dependency.
  */
  useFrame(({ camera }, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    const ctl = camCtlRef.current;

    // Frame-rate-independent lerp factor.
    // damping = 0.005 → camera takes ~1 second to catch up; 0.05 → ~0.2 seconds.
    const factor = 1 - Math.pow(ctl.damping, delta);

    let wantPos    = _wantPos.current;
    let wantTarget = _wantTarget.current;
    let wantFov    = ctl.fov;
    let wantLight  = 0.18;

    if (ctl.manualOverride) {
      // Leva sliders control the camera directly — useful for finding keyframe values
      wantPos.set(ctl.posX, ctl.posY, ctl.posZ);
      wantTarget.set(ctl.tgtX, ctl.tgtY, ctl.tgtZ);
      wantFov   = ctl.fov;
      wantLight = 0.18;
    } else {
      // Scroll-driven: map window.scrollY to a scroll-in-vh value
      const vh        = window.innerHeight || 1;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
      const scrollVH  = (window.scrollY / maxScroll) * TOTAL_SCROLL_VH;

      const kf = getKeyframeAt(scrollVH);
      wantPos.set(...kf.pos);
      wantTarget.set(...kf.target);
      wantFov   = kf.fov;
      wantLight = kf.light;
    }

    // Lerp position
    currentPos.current.lerp(wantPos, factor);
    cam.position.copy(currentPos.current);

    // Lerp look-at target
    currentTarget.current.lerp(wantTarget, factor);
    cam.lookAt(currentTarget.current);

    // Lerp FOV
    currentFov.current += (wantFov - currentFov.current) * factor;
    if (Math.abs(cam.fov - currentFov.current) > 0.01) {
      cam.fov = currentFov.current;
      cam.updateProjectionMatrix();
    }

    // Lerp ambient light intensity
    const light = ambientLightRef.current;
    if (light) {
      light.intensity += (wantLight - light.intensity) * factor;
    }
  });

  return (
    <>
      <CameraController
        cameraRef={cameraRef}
        initialPosition={[6, 2, 11]}
      />

      <ambientLight
        ref={ambientLightRef}
        intensity={0.18}
        color="#c8d8ff"
      />

      <Environment
        resolution={64}
        environmentIntensity={lightCtl.hdrIntensity}
        files="environment/photo_studio_01_4k.hdr"
      />

      {debugCtl.grid && <Grid args={[20, 20]} position={[0, -3, 0]} />}

      <BillboardMesh
        ref={billboardRef}
        cameraRef={cameraRef}
        ambientLightRef={ambientLightRef}
        wireframe={debugCtl.wireframe}
      />
    </>
  );
}
