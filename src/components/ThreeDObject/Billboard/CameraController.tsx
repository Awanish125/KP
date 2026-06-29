"use client";

/**
 * CameraController.tsx — PerspectiveCamera + OrbitControls with Leva debug panel.
 *
 * Extracted from the old SceneContents so camera logic lives in one place.
 * Phase 2 will add GSAP animation methods here (e.g. flyTo, zoomIn).
 *
 * The "📋 Copy Current State" button is essential during development — it
 * copies the live camera position + target + fov to clipboard so you can
 * paste exact values into GSAP keyframes without guessing.
 */

import React from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useControls, folder, button } from "leva";
import * as THREE from "three";

interface CameraControllerProps {
  // React 19: useRef<T>(null) returns RefObject<T | null>, not RefObject<T>
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  orbitRef:  React.RefObject<OrbitControlsImpl | null>;
}

export function CameraController({ cameraRef, orbitRef }: CameraControllerProps) {
  // useThree gives us the live camera object for the clipboard button below.
  const { camera } = useThree();

  const cameraCtl = useControls("Camera", {
    position: { value: [5.5, 1.2, 9.5] as [number, number, number] },
    rotation: { value: [0, 0, 0]       as [number, number, number] },
    target:   { value: [0, 0.8, 0]     as [number, number, number] },
    fov:      { value: 38,  min: 10, max: 100, step: 1    },
    zoom:     { value: 1,   min: 0.2, max: 3,  step: 0.05 },
    Interaction: folder({
      controlsEnabled: { value: true,  label: "Enable Drag" },
      enableZoom:      { value: true,  label: "Zoom"   },
      enableRotate:    { value: true,  label: "Rotate" },
      enablePan:       { value: true,  label: "Pan"    },
    }),
    // Copies the current live camera state to clipboard.
    // Use this to record exact camera positions for GSAP keyframes.
    "📋 Copy Current State": button(() => {
      const pos = camera.position;
      const tgt = orbitRef.current?.target ?? new THREE.Vector3();
      const state = {
        cameraPosition: [+pos.x.toFixed(3), +pos.y.toFixed(3), +pos.z.toFixed(3)],
        cameraTarget:   [+tgt.x.toFixed(3), +tgt.y.toFixed(3), +tgt.z.toFixed(3)],
        fov: (camera as THREE.PerspectiveCamera).fov,
      };
      navigator.clipboard
        .writeText(JSON.stringify(state, null, 2))
        .then(() => console.info("📋 Camera state copied:", state))
        .catch(() => console.info("📋 Camera state:", state));
    }),
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={cameraCtl.position}
        rotation={cameraCtl.rotation}
        fov={cameraCtl.fov}
        zoom={cameraCtl.zoom}
      />
      <OrbitControls
        // drei's OrbitControls ref type doesn't perfectly match OrbitControlsImpl
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={orbitRef as any}
        target={cameraCtl.target}
        enabled={cameraCtl.controlsEnabled}
        enableZoom={cameraCtl.enableZoom}
        enableRotate={cameraCtl.enableRotate}
        enablePan={cameraCtl.enablePan}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={30}
      />
    </>
  );
}
