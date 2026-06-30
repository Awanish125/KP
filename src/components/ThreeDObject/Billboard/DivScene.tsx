"use client";

/**
 * DivScene.tsx — R3F scene for BillboardBlock / TrackingBillboard.
 *
 *   • Model always at world origin [0,0,0].
 *   • Camera always looks at [0,0,0].
 *   • Camera Z auto-calculated every time the canvas resizes so the model
 *     always fits entirely within the canvas — never clipped at top/bottom.
 */

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { BillboardMesh } from "./BillboardMesh";
import type { BillboardImperativeHandle } from "./types";

// Conservative model bounding box in world units.
// Includes billboard face + frame + pole + base plate + 10% headroom.
// Err on the generous side — the model will shrink in the canvas rather than clip.
const MODEL_H = 6.2;   // height: billboard top to pole base
const MODEL_W = 5.8;   // width:  frame edge to frame edge
const PADDING  = 1.18; // 18 % breathing room on all sides

interface DivSceneProps {
  billboardRef: React.MutableRefObject<BillboardImperativeHandle | null>;
  rotationObjRef: React.MutableRefObject<{ y: number }>;
  image?: string;
  backImage?: string;
}

export function DivScene({ billboardRef, rotationObjRef, image, backImage }: DivSceneProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const { camera, size } = useThree();

  /* ── Auto-fit camera Z whenever canvas size changes ────────────────────────
     Three.js `fov` is VERTICAL. Horizontal FOV = 2·atan(tan(vFov/2)·aspect).

     Distance needed so model height fits:  dist_h = (MODEL_H/2) / tan(vFov/2)
     Distance needed so model width fits:   dist_w = (MODEL_W/2) / (aspect·tan(vFov/2))
     Use whichever is larger + PADDING.
  ── */
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect  = size.width / size.height;
    const halfFov = (cam.fov * Math.PI) / 180 / 2;  // radians

    const distH = (MODEL_H / 2) / Math.tan(halfFov) * PADDING;
    const distW = (MODEL_W / 2) / (aspect * Math.tan(halfFov)) * PADDING;
    const dist  = Math.max(distH, distW);

    // Only move along Z — keep x/y from the camera preset (front or quarter).
    cam.position.setZ(dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  /* ── Rotation from GSAP-animated object ─────────────────────────────────── */
  useFrame(() => {
    const bill = billboardRef.current;
    if (!bill?.group) return;
    bill.group.rotation.y = rotationObjRef.current.y;
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} color="#c8d8ff" />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />

      <Environment
        resolution={64}
        environmentIntensity={0.9}
        files="environment/photo_studio_01_4k.hdr"
      />

      <BillboardMesh
        ref={billboardRef}
        frontImage={image}
        backImage={backImage}
        ambientLightRef={ambientRef}
      />
    </>
  );
}
