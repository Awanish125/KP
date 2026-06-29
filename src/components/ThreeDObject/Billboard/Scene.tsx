"use client";

/**
 * Scene.tsx — Full Three.js scene contents (must render inside a R3F Canvas).
 *
 * Assembles:
 *   CameraController — PerspectiveCamera + OrbitControls
 *   Lighting         — ambient light (ref exposed via BillboardImperativeHandle)
 *   Environment      — IBL HDR map for PBR reflections
 *   BillboardMesh    — the procedural 3D billboard
 *
 * The ambient light ref is threaded all the way to the imperative handle so
 * GSAP can animate light intensity directly without triggering React re-renders.
 */

import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Grid } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useControls } from "leva";
import * as THREE from "three";
import { CameraController } from "./CameraController";
import { BillboardMesh } from "./BillboardMesh";
import type { BillboardImperativeHandle } from "./types";

interface SceneProps {
  billboardRef: React.RefObject<BillboardImperativeHandle | null>;
}

export function Scene({ billboardRef }: SceneProps) {
  const cameraRef      = useRef<THREE.PerspectiveCamera>(null);
  const orbitRef       = useRef<OrbitControlsImpl>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  /* ── Lighting Leva controls ─────────────────────────────────────────────── */
  const lightingCtl = useControls("Lighting", {
    ambientIntensity: { value: 0.18, min: 0, max: 2,   step: 0.01 },
    hdrIntensity:     { value: 0.6,  min: 0, max: 3,   step: 0.05 },
    exposure:         { value: 1.2,  min: 0.1, max: 3, step: 0.05 },
  });

  /* ── Debug Leva controls (merge with BillboardMesh's "Debug" folder) ─────── */
  const debugCtl = useControls("Debug", {
    wireframe: false,
    grid:      false,
  });

  /* ── Renderer settings ───────────────────────────────────────────────────── */
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping         = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = lightingCtl.exposure;
    gl.outputColorSpace    = THREE.SRGBColorSpace;
  }, [gl, lightingCtl.exposure]);

  return (
    <>
      <CameraController cameraRef={cameraRef} orbitRef={orbitRef} />

      {/* Ambient light — ref is passed through to BillboardImperativeHandle
          so GSAP can animate .intensity per section (hero dim → reveal bright
          → campaign spotlight). Leva's ambientIntensity sets the initial value. */}
      <ambientLight
        ref={ambientLightRef}
        intensity={lightingCtl.ambientIntensity}
        color="#c8d8ff"
      />

      {/*
        Environment IBL — provides PBR reflections on the metal frame.
        resolution={64} only controls PMREM cube map sampling fidelity,
        which is cheap since reflections here are always blurry.
        Use a 1k/2k HDR file — the 4k detail is never visible on a billboard frame.
        Alternatively: <Environment preset="city" /> to skip the file download.
      */}
      <Environment
        resolution={64}
        environmentIntensity={lightingCtl.hdrIntensity}
        files="environment/photo_studio_01_4k.hdr"
      />

      {debugCtl.grid && <Grid args={[20, 20]} position={[0, -3, 0]} />}

      <BillboardMesh
        ref={billboardRef}
        cameraRef={cameraRef}
        orbitRef={orbitRef}
        ambientLightRef={ambientLightRef}
        wireframe={debugCtl.wireframe}
      />
    </>
  );
}
