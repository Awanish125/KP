"use client";

import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import Model from "./Model";

export default function Scene() {
  return (
    <Canvas
      camera={{ fov: 45 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={2} />

      <Bounds fit clip observe margin={1.2}>
        <Model  />
      </Bounds>

      <OrbitControls makeDefault />
    </Canvas>
  );
}