"use client";

/**
 * Scene.tsx — R3F scene contents.
 *
 * Everything that changes over time lives in the single useFrame loop:
 *   ① Camera position + look-at + FOV   (driven by window.scrollY)
 *   ② Ambient light intensity            (mood per section)
 *   ③ Poster images (front face)         (changePoster called once per section change)
 *   ④ Billboard Y rotation               (360° in the pinned section)
 *
 * Moving all of these into useFrame eliminates the GSAP-ScrollTrigger-Lenis
 * timing race that plagued the earlier approach.
 *
 * Leva "Camera" panel gives full manual override in dev:
 *   • Toggle "Manual Override" → sliders control camera, scroll is ignored
 *   • Drag Position / Target / FOV sliders to find good angles
 *   • "📋 Copy Current State" → copies JSON to clipboard for pasting into KEYFRAMES
 */

import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Environment, Grid } from "@react-three/drei";
import { useControls, button, folder } from "leva";
import * as THREE from "three";
import { CameraController } from "./CameraController";
import { BillboardMesh } from "./BillboardMesh";
import type { BillboardImperativeHandle } from "./types";

/* ── Section poster images ───────────────────────────────────────────────────── */

const POSTER = {
  default:  "/homepage/herosection/kp.png",
  about:    "/homepage/herosection/1.png",
  services: "/homepage/herosection/2.png",
  whyUs:    "/homepage/herosection/3.png",
  campaign: "/homepage/herosection/1.png",
} as const;

/* ── Camera keyframes ──────────────────────────────────────────────────────────
   `scroll` is in units of viewport heights (scrollY / window.innerHeight).
   Total scroll = 7 vh  (800vh page − 100vh viewport).

   Section scroll ranges:
     0–1   hero        camera at start position
     1–2   about       camera swings in from right
     2–3   services    camera slides far left
     3–4   why us      camera swings far right
     4–5   campaign    tight close-up, light dims
     5–7   pinned      3/4 angle + 360° Y rotation
*/
const KEYFRAMES = [
  { scroll: 0, pos: [6,  2,   11 ] as [number,number,number], target: [0, 0.5, 0] as [number,number,number], fov: 45, light: 0.18 },
  { scroll: 1, pos: [5.5,1.2, 9.5] as [number,number,number], target: [0, 0.8, 0] as [number,number,number], fov: 38, light: 0.22 },
  { scroll: 2, pos: [-8, 1.5, 6  ] as [number,number,number], target: [0, 0,   0] as [number,number,number], fov: 42, light: 0.28 },
  { scroll: 3, pos: [8,  1.5, 6  ] as [number,number,number], target: [0, 0,   0] as [number,number,number], fov: 42, light: 0.28 },
  { scroll: 4, pos: [0,  0.5, 4.5] as [number,number,number], target: [0, 0.2, 0] as [number,number,number], fov: 30, light: 0.12 },
  { scroll: 7, pos: [3,  1.2, 7  ] as [number,number,number], target: [0, 0,   0] as [number,number,number], fov: 38, light: 0.08 },
] as const;

const TOTAL_VH = 7;

function getKeyframeAt(svh: number) {
  const c = Math.max(0, Math.min(TOTAL_VH, svh));
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
    if (c <= b.scroll) {
      const t = (c - a.scroll) / (b.scroll - a.scroll);
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
  const z = KEYFRAMES[KEYFRAMES.length - 1];
  return { pos: z.pos, target: z.target, fov: z.fov, light: z.light };
}

/* ── Props ───────────────────────────────────────────────────────────────────── */
interface SceneProps {
  billboardRef: React.RefObject<BillboardImperativeHandle | null>;
}

/* ── Scene ───────────────────────────────────────────────────────────────────── */
export function Scene({ billboardRef }: SceneProps) {
  const cameraRef       = useRef<THREE.PerspectiveCamera>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  // Smooth state — lerped every frame toward the keyframe target
  const curPos    = useRef(new THREE.Vector3(6, 2, 11));
  const curTarget = useRef(new THREE.Vector3(0, 0.5, 0));
  const curFov    = useRef(45);
  const curRotY   = useRef(0);

  // Pre-allocated vectors (avoid per-frame allocations)
  const _wPos = useRef(new THREE.Vector3());
  const _wTgt = useRef(new THREE.Vector3());

  // Poster change tracking — only call changePoster when the section changes
  const activePoster = useRef<string>("");

  /* ── Leva: Lighting ──────────────────────────────────────────────────────── */
  const lightCtl = useControls("Lighting", {
    hdrIntensity: { value: 0.6,  min: 0, max: 3,   step: 0.05, label: "HDR Intensity" },
    exposure:     { value: 1.2,  min: 0.1, max: 3, step: 0.05, label: "Exposure"      },
  });

  /* ── Leva: Camera full control ───────────────────────────────────────────── */
  const camCtl = useControls("Camera", {
    manualOverride: { value: false, label: "Manual Override (disable scroll)" },
    Position: folder({
      posX: { value: 6,   min: -30, max: 30, step: 0.1, label: "X" },
      posY: { value: 2,   min: -10, max: 20, step: 0.1, label: "Y" },
      posZ: { value: 11,  min: -30, max: 30, step: 0.1, label: "Z" },
    }),
    "Look At": folder({
      tgtX: { value: 0,   min: -10, max: 10, step: 0.1, label: "X" },
      tgtY: { value: 0.5, min: -5,  max: 10, step: 0.1, label: "Y" },
      tgtZ: { value: 0,   min: -10, max: 10, step: 0.1, label: "Z" },
    }),
    Optics: folder({
      fov:     { value: 45,    min: 10,    max: 120, step: 1,      label: "FOV"           },
      damping: { value: 0.005, min: 0.0001,max: 0.5, step: 0.0001, label: "Damping (lower = slower)" },
    }),
    "📋 Copy State": button(() => {
      const cam = cameraRef.current;
      if (!cam) return;
      const s = {
        pos:    [+cam.position.x.toFixed(3), +cam.position.y.toFixed(3), +cam.position.z.toFixed(3)],
        target: [+curTarget.current.x.toFixed(3), +curTarget.current.y.toFixed(3), +curTarget.current.z.toFixed(3)],
        fov:    +cam.fov.toFixed(1),
      };
      navigator.clipboard
        .writeText(JSON.stringify(s, null, 2))
        .then(() => console.info("📋 Copied:", s))
        .catch(() => console.info("📋 Camera state:", s));
    }),
  });

  // Mirror to ref so useFrame can read without stale closures
  const camCtlRef = useRef(camCtl);
  camCtlRef.current = camCtl;

  /* ── Leva: Debug ─────────────────────────────────────────────────────────── */
  const debugCtl = useControls("Debug", {
    wireframe: false,
    grid:      false,
  });

  /* ── Renderer setup ──────────────────────────────────────────────────────── */
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping         = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = lightCtl.exposure;
    gl.outputColorSpace    = THREE.SRGBColorSpace;
  }, [gl, lightCtl.exposure]);

  /* ── Animation loop ──────────────────────────────────────────────────────────
     Single useFrame handles all animation:
       ① Camera position + look-at + FOV
       ② Ambient light intensity
       ③ Poster image per section
       ④ Billboard Y rotation (360° in pinned section)
  */
  useFrame(({ camera }, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    const ctl = camCtlRef.current;
    const factor = 1 - Math.pow(ctl.damping, delta); // frame-rate independent

    // ── Scroll position ──────────────────────────────────────────────────────
    const vh        = window.innerHeight || 1;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    const scrollVH  = (window.scrollY / maxScroll) * TOTAL_VH;

    // ── ① Camera ─────────────────────────────────────────────────────────────
    let wantFov   = ctl.fov;
    let wantLight = 0.18;

    if (ctl.manualOverride) {
      _wPos.current.set(ctl.posX, ctl.posY, ctl.posZ);
      _wTgt.current.set(ctl.tgtX, ctl.tgtY, ctl.tgtZ);
    } else {
      const kf = getKeyframeAt(scrollVH);
      _wPos.current.set(...kf.pos);
      _wTgt.current.set(...kf.target);
      wantFov   = kf.fov;
      wantLight = kf.light;
    }

    curPos.current.lerp(_wPos.current, factor);
    cam.position.copy(curPos.current);

    curTarget.current.lerp(_wTgt.current, factor);
    cam.lookAt(curTarget.current);

    curFov.current += (wantFov - curFov.current) * factor;
    if (Math.abs(cam.fov - curFov.current) > 0.01) {
      cam.fov = curFov.current;
      cam.updateProjectionMatrix();
    }

    // ── ② Ambient light ───────────────────────────────────────────────────────
    const light = ambientLightRef.current;
    if (light) light.intensity += (wantLight - light.intensity) * factor;

    // ── ③ Poster images (only call changePoster when section changes) ──────────
    if (!ctl.manualOverride) {
      let wantPoster: string;
      if      (scrollVH <  1) wantPoster = POSTER.default;
      else if (scrollVH <  2) wantPoster = POSTER.about;
      else if (scrollVH <  3) wantPoster = POSTER.services;
      else if (scrollVH <  4) wantPoster = POSTER.whyUs;
      else                    wantPoster = POSTER.campaign;

      if (wantPoster !== activePoster.current) {
        activePoster.current = wantPoster;
        billboardRef.current?.changePoster("front", wantPoster);
      }
    }

    // ── ④ Billboard Y rotation (360° through the pinned section) ─────────────
    //     Pinned section occupies scrollVH 5–7 (300vh section starting at 500vh).
    //     As the user scrolls from 5 to 7, the billboard rotates 0 → 360°.
    const bill = billboardRef.current;
    if (bill?.group) {
      let wantRotY = 0;
      if (scrollVH > 5 && scrollVH <= 7) {
        wantRotY = ((scrollVH - 5) / 2) * Math.PI * 2;
      }
      curRotY.current += (wantRotY - curRotY.current) * factor;
      bill.group.rotation.y = curRotY.current;
    }
  });

  return (
    <>
      <CameraController
        cameraRef={cameraRef}
        initialPosition={[6, 2, 11]}
      />

      <ambientLight ref={ambientLightRef} intensity={0.18} color="#c8d8ff" />

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
