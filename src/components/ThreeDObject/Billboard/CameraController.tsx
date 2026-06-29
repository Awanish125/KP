"use client";

/**
 * CameraController.tsx
 *
 * Creates the PerspectiveCamera and sets it as the default R3F camera.
 * All camera ANIMATION is handled by Scene.tsx's useFrame loop — which reads
 * window.scrollY and lerps the camera every tick, overwriting any position
 * that React props may try to set. So the `initialPosition` prop here only
 * matters for the very first frame before useFrame takes over.
 *
 * All Leva controls for the camera (position, target, FOV, manual override)
 * live in Scene.tsx — not here — to keep this file simple.
 */

import React from "react";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface CameraControllerProps {
  cameraRef:       React.RefObject<THREE.PerspectiveCamera | null>;
  initialPosition: [number, number, number];
}

export function CameraController({ cameraRef, initialPosition }: CameraControllerProps) {
  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={initialPosition}
      fov={45}
      near={0.1}
      far={200}
    />
  );
}
