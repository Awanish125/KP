"use client";

/**
 * Scene.tsx — R3F scene contents.
 *
 * Everything that changes over time lives in the single useFrame loop:
 *   ① Camera position + look-at + FOV   (driven by window.scrollY)
 *   ② Ambient light intensity            (mood per section)
 *   ③ Poster images (front face)         (changePoster called once per section change)
 *   ④ Billboard Y rotation               (360° in the pinned section)
 *   ⑤ Model position + scale             (Leva sliders → outer wrapper group)
 *
 * Model position is applied to a wrapper <group ref={modelGroupRef}> that OWNS
 * the position/scale. This prevents R3F from resetting it via BillboardMesh's
 * default position prop on every re-render.
 */

import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Environment, Grid, OrbitControls } from "@react-three/drei";
import { useControls, button, folder } from "leva";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
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
*/
const KEYFRAMES = [
  { scroll: 0, pos: [6,  2,   11 ] as [number,number,number], target: [0, 0.5, 0] as [number,number,number], fov: 45, light: 0.18 },
  { scroll: 1, pos: [5.5,1.2, 9.5] as [number,number,number], target: [0, 0.8, 0] as [number,number,number], fov: 38, light: 0.22 },
  { scroll: 2, pos: [-8, 1.5, 6  ] as [number,number,number], target: [0, 0,   0] as [number,number,number], fov: 42, light: 0.28 },
  { scroll: 3, pos: [8,  1.5, 6  ] as [number,number,number], target: [0, 0,   0] as [number,number,number], fov: 42, light: 0.28 },
  { scroll: 4, pos: [0,  0.5, 4.5] as [number,number,number], target: [0, 0.2, 0] as [number,number,number], fov: 30, light: 0.12 },
  { scroll: 7, pos: [-0.767,  1.194,12.091  ] as [number,number,number], target: [0, 0.5,   0] as [number,number,number], fov: 38, light: 0.08 },
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
  billboardRef:      React.RefObject<BillboardImperativeHandle | null>;
  onManualOverride?: (active: boolean) => void;
}

/* ── Scene ───────────────────────────────────────────────────────────────────── */
export function Scene({ billboardRef, onManualOverride }: SceneProps) {
  const cameraRef       = useRef<THREE.PerspectiveCamera>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const orbitRef        = useRef<OrbitControlsImpl>(null);

  // ── Outer wrapper group — owns model position + scale ────────────────────────
  // BillboardMesh is nested inside this group. We set position/scale HERE in
  // useFrame so R3F's reconciler never touches it (no position prop passed).
  const modelGroupRef = useRef<THREE.Group>(null);

  // Smooth camera state
  const curPos    = useRef(new THREE.Vector3(6, 2, 11));
  const curTarget = useRef(new THREE.Vector3(0, 0.5, 0));
  const curFov    = useRef(45);
  const curRotY   = useRef(0);

  // Pre-allocated vectors
  const _wPos = useRef(new THREE.Vector3());
  const _wTgt = useRef(new THREE.Vector3());

  // Poster change tracking
  const activePoster = useRef<string>("");

  /* ── Leva: Lighting ──────────────────────────────────────────────────────── */
  const lightCtl = useControls("Lighting", {
    hdrIntensity: { value: 0.6,  min: 0, max: 3,   step: 0.05, label: "HDR Intensity" },
    exposure:     { value: 1.2,  min: 0.1, max: 3, step: 0.05, label: "Exposure"      },
  });

  /* ── Leva: Camera ────────────────────────────────────────────────────────── */
  const camCtl = useControls("Camera", {
    manualOverride: { value: false, label: "🖱 Manual Override — drag mouse to orbit" },
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
      const cam   = cameraRef.current;
      const orbit = orbitRef.current;
      if (!cam) return;
      const tgt = orbit?.enabled ? orbit.target : curTarget.current;
      const s = {
        pos:    [+cam.position.x.toFixed(3), +cam.position.y.toFixed(3), +cam.position.z.toFixed(3)],
        target: [+tgt.x.toFixed(3),          +tgt.y.toFixed(3),          +tgt.z.toFixed(3)         ],
        fov:    +cam.fov.toFixed(1),
      };
      navigator.clipboard
        .writeText(JSON.stringify(s, null, 2))
        .then(() => console.info("📋 Copied:", s))
        .catch(() => console.info("📋 Camera state:", s));
    }),
  });

  const camCtlRef = useRef(camCtl);
  camCtlRef.current = camCtl;

  // Notify parent when manualOverride changes (canvas z-index)
  const onManualOverrideRef = useRef(onManualOverride);
  onManualOverrideRef.current = onManualOverride;
  useEffect(() => {
    onManualOverrideRef.current?.(camCtl.manualOverride);
  }, [camCtl.manualOverride]);

  // When manual override turns ON, set OrbitControls target to the model's
  // current world position so the camera orbits around the billboard,
  // not the origin. This is done imperatively because setting `target` as a
  // JSX prop resets it on EVERY React render (discovered from drei source).
  useEffect(() => {
    if (camCtl.manualOverride && orbitRef.current && modelGroupRef.current) {
      const g = modelGroupRef.current;
      orbitRef.current.target.set(g.position.x, g.position.y + 0.5, g.position.z);
      orbitRef.current.update();
    }
  }, [camCtl.manualOverride]);

  /* ── Leva: Model ─────────────────────────────────────────────────────────────
     Position + scale applied to modelGroupRef (outer wrapper) in useFrame.
     Never set as JSX props — that would let R3F reset them on re-render.
  */
  const modelCtl = useControls("Model", {
    x:     { value: 0,   min: -10, max: 10, step: 0.05, label: "Position X (left ↔ right)" },
    y:     { value: 0,   min: -5,  max: 5,  step: 0.05, label: "Position Y (down ↕ up)"    },
    z:     { value: 0,   min: -10, max: 10, step: 0.05, label: "Position Z (back ↔ front)"  },
    scale: { value: 1,   min: 0.1, max: 5,  step: 0.05, label: "Scale"                      },
    "📋 Copy Model Transform": button(() => {
      const g = modelGroupRef.current;
      if (!g) return;
      const s = {
        position: [+g.position.x.toFixed(3), +g.position.y.toFixed(3), +g.position.z.toFixed(3)],
        scale:    +g.scale.x.toFixed(3),
      };
      navigator.clipboard
        .writeText(JSON.stringify(s))
        .then(() => console.info("📋 Model transform:", s))
        .catch(() => console.info("📋 Model transform:", s));
    }),
  });

  const modelCtlRef = useRef(modelCtl);
  modelCtlRef.current = modelCtl;

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

  /* ── Animation loop ─────────────────────────────────────────────────────── */
  useFrame(({ camera }, delta) => {
    const cam   = camera as THREE.PerspectiveCamera;
    const ctl   = camCtlRef.current;
    const orbit = orbitRef.current;
    const factor = 1 - Math.pow(ctl.damping, delta);

    const vh        = window.innerHeight || 1;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    const scrollVH  = (window.scrollY / maxScroll) * TOTAL_VH;

    // ── ① Camera ─────────────────────────────────────────────────────────────
    if (ctl.manualOverride) {
      // OrbitControls owns camera movement. Sync smooth-state so switching back
      // to scroll animation is seamless.
      if (orbit) {
        curPos.current.copy(cam.position);
        curTarget.current.copy(orbit.target);
      }
    } else {
      const kf = getKeyframeAt(scrollVH);
      const m  = modelCtlRef.current;
      // Offset both camera position AND lookAt by model world position so the
      // camera always frames the billboard regardless of where the Leva sliders
      // have moved it. Without this, moving the model off-center causes
      // perspective distortion (viewed from the side) and the Y-rotation appears
      // to happen around the wrong pivot.
      _wPos.current.set(kf.pos[0] + m.x, kf.pos[1] + m.y, kf.pos[2] + m.z);
      _wTgt.current.set(kf.target[0] + m.x, kf.target[1] + m.y, kf.target[2] + m.z);

      curPos.current.lerp(_wPos.current, factor);
      cam.position.copy(curPos.current);

      curTarget.current.lerp(_wTgt.current, factor);
      cam.lookAt(curTarget.current);

      const wantFov = kf.fov;
      curFov.current += (wantFov - curFov.current) * factor;
      if (Math.abs(cam.fov - curFov.current) > 0.01) {
        cam.fov = curFov.current;
        cam.updateProjectionMatrix();
      }
    }

    // ── ② Ambient light ───────────────────────────────────────────────────────
    const wantLight = ctl.manualOverride ? 0.18 : getKeyframeAt(scrollVH).light;
    const light = ambientLightRef.current;
    if (light) light.intensity += (wantLight - light.intensity) * factor;

    // ── ③ Poster images ───────────────────────────────────────────────────────
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

    // ── ④ Model position + scale (Leva → outer wrapper group) ─────────────────
    // We set position/scale on modelGroupRef — the <group> wrapping BillboardMesh
    // in JSX. Because that group has NO position/scale prop in JSX, R3F never
    // calls position.set() on it during reconciliation, so our values stick.
    const mg = modelGroupRef.current;
    if (mg) {
      const m = modelCtlRef.current;

      // Responsive scale: smaller on mobile so the model fits the screen
      const vw = window.innerWidth;
      const vpFactor = vw < 640 ? 0.5 : vw < 1024 ? 0.75 : 1;

      mg.position.set(m.x, m.y, m.z);
      mg.scale.setScalar(m.scale * vpFactor);
    }

    // ── ⑤ Billboard Y rotation (360° through pinned section scrollVH 5–7) ────
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

      {/*
        OrbitControls — enabled by React prop (camCtl.manualOverride).
        NO `target` prop here: drei's source applies all restProps to the
        underlying OrbitControls instance on every React render via primitive,
        which would reset the target after every pan. Instead we set target
        imperatively in the useEffect above when manual override turns on.
        enablePan={false} prevents accidental orbit-circumference drift —
        use the X/Y/Z Leva sliders to reposition the model instead.
      */}
      <OrbitControls
        ref={orbitRef}
        enabled={camCtl.manualOverride}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={2}
        maxDistance={25}
      />

      <ambientLight ref={ambientLightRef} intensity={0.18} color="#c8d8ff" />

      <Environment
        resolution={64}
        environmentIntensity={lightCtl.hdrIntensity}
        files="environment/photo_studio_01_4k.hdr"
      />

      {debugCtl.grid && <Grid args={[20, 20]} position={[0, -3, 0]} />}

      {/*
        Outer wrapper group — owned entirely by useFrame.
        No position/scale props → R3F reconciler never calls position.set() here.
        This is the key fix: previously we set position on bill.group (inside
        BillboardMesh) which got reset because BillboardMesh's <group> had a
        default position prop that R3F re-applied on every Leva re-render.
      */}
      <group ref={modelGroupRef}>
        <BillboardMesh
          ref={billboardRef}
          cameraRef={cameraRef}
          ambientLightRef={ambientLightRef}
          wireframe={debugCtl.wireframe}
        />
      </group>
    </>
  );
}
