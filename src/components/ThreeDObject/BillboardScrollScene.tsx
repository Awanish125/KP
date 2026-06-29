"use client";

/**
 * BillboardScrollScene
 * Fixed-position billboard canvas driven by GSAP ScrollTrigger.
 * - frameloop="demand": renders ONLY when GSAP ticker calls invalidate()
 * - useFrame applies GSAP-tweened animState each render tick
 * - Zero GPU cost when hidden (GSAP ticker pauses when scroll stops)
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { BillboardMesh, BillboardImperativeHandle } from "./Billboard";

/* -------------------------------------------------------------------------- */
/*  Animation state — GSAP tweens plain fields on this object                 */
/* -------------------------------------------------------------------------- */

export interface BillboardAnimState {
  groupPosY: number;
  groupRotY: number;
  groupScaleUniform: number;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  ambientIntensity: number;
  dirIntensity: number;
  fillIntensity: number;
  envIntensity: number;
}

export const ANIM_START: BillboardAnimState = {
  groupPosY: -8,
  groupRotY: Math.PI,
  groupScaleUniform: 0.85,
  cameraX: 5.5,
  cameraY: 6.5,
  cameraZ: 14,
  ambientIntensity: 0.02,
  dirIntensity: 0.05,
  fillIntensity: 0.02,
  envIntensity: 0.03,
};

export const ANIM_END: BillboardAnimState = {
  groupPosY: 0,
  groupRotY: 0,
  groupScaleUniform: 1,
  cameraX: 4.5,
  cameraY: 4.2,
  cameraZ: 9,
  ambientIntensity: 0.35,
  dirIntensity: 1.4,
  fillIntensity: 0.4,
  envIntensity: 1.0,
};

/* -------------------------------------------------------------------------- */
/*  Inner scene — applies animState on every render via useFrame              */
/* -------------------------------------------------------------------------- */

interface InnerSceneProps {
  animState: BillboardAnimState;
  billboardRef: React.RefObject<BillboardImperativeHandle | null>;
  onInvalidate: (fn: () => void) => void;
  frontImage?: string;
  backImage?: string;
}

function InnerScene({
  animState,
  billboardRef,
  onInvalidate,
  frontImage,
  backImage,
}: InnerSceneProps) {
  const { camera, invalidate, gl, scene } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    onInvalidate(invalidate);
  }, [invalidate, onInvalidate]);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  // Apply GSAP-driven animState every rendered frame
  useFrame(() => {
    const s = animState;
    const cam = camera as THREE.PerspectiveCamera;

    cam.position.set(s.cameraX, s.cameraY, s.cameraZ);
    cam.lookAt(0, 0.8, 0);

    const grp = billboardRef.current?.group;
    if (grp) {
      grp.position.y = s.groupPosY;
      grp.rotation.y = s.groupRotY;
      const sc = s.groupScaleUniform;
      grp.scale.set(sc, sc, sc);
    }

    if (ambientRef.current) ambientRef.current.intensity = s.ambientIntensity;
    if (dirRef.current) dirRef.current.intensity = s.dirIntensity;
    if (fillRef.current) fillRef.current.intensity = s.fillIntensity;
    scene.environmentIntensity = s.envIntensity;
  });

  return (
    <>
      <ambientLight ref={ambientRef} color="#c8d8ff" intensity={ANIM_START.ambientIntensity} />
      <directionalLight
        ref={dirRef}
        position={[2, 6, 5]}
        intensity={ANIM_START.dirIntensity}
        color="#fff5e0"
      />
      <directionalLight
        ref={fillRef}
        position={[-5, 1, -4]}
        intensity={ANIM_START.fillIntensity}
        color="#8ab0ff"
      />
      <directionalLight position={[0, 2, -8]} intensity={0.3} color="#6688cc" />
      <directionalLight position={[0, -6, 3]} intensity={0.15} color="#ffb060" />

      <Environment resolution={64} environmentIntensity={ANIM_START.envIntensity}>
        <Lightformer intensity={1.2} color="#c8d8ff" position={[0, 10, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]} />
        <Lightformer intensity={0.8} color="#ff9944" position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[15, 15, 1]} />
        <Lightformer intensity={1.5} color="#fff5e0" position={[0, 3, 8]} scale={[10, 6, 1]} />
      </Environment>

      <BillboardMesh
        ref={billboardRef}
        frontImage={frontImage}
        backImage={backImage}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public handle exposed to useBillboardScroll                               */
/* -------------------------------------------------------------------------- */

export interface BillboardSceneHandle {
  wrapperEl: HTMLDivElement | null;
  anim: BillboardAnimState;
  billboard: BillboardImperativeHandle | null;
  invalidate: () => void;
}

interface BillboardScrollSceneProps {
  frontImage?: string;
  backImage?: string;
}

const BillboardScrollScene = forwardRef<
  BillboardSceneHandle,
  BillboardScrollSceneProps
>(function BillboardScrollScene({ frontImage, backImage }, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const billboardRef = useRef<BillboardImperativeHandle>(null);
  const invalidateRef = useRef<() => void>(() => undefined);

  // Mutable animation state object — GSAP tweens fields on this directly
  const animState = useRef<BillboardAnimState>({ ...ANIM_START }).current;

  const handleInvalidate = useCallback((fn: () => void) => {
    invalidateRef.current = fn;
  }, []);

  useImperativeHandle(ref, () => ({
    get wrapperEl() { return wrapperRef.current; },
    anim: animState,
    get billboard() { return billboardRef.current; },
    invalidate: () => invalidateRef.current(),
  }));

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        opacity: 0,
      }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{
          position: [ANIM_START.cameraX, ANIM_START.cameraY, ANIM_START.cameraZ],
          fov: 38,
        }}
        style={{ background: "transparent" }}
      >
        <InnerScene
          animState={animState}
          billboardRef={billboardRef}
          onInvalidate={handleInvalidate}
          frontImage={frontImage}
          backImage={backImage}
        />
      </Canvas>
    </div>
  );
});

export default BillboardScrollScene;
