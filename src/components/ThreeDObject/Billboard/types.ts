/**
 * types.ts — Shared TypeScript interfaces for the Billboard component tree.
 *
 * Keeping types in their own file means any file in this folder can import
 * just what it needs without pulling in React, Three.js, or hooks.
 */

import type * as THREE from "three";

// Which kind of 1-pixel fallback texture to generate when a real file is missing.
export type FallbackKind = "color" | "gray" | "normal";

// UV tiling/offset settings applied to PBR texture maps.
export interface RepeatSettings {
  repeatX: number;
  repeatY: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
}

// The four PBR maps loaded by usePbrMaps.
export interface PbrMaps {
  map: THREE.Texture;
  roughnessMap: THREE.Texture;
  normalMap: THREE.Texture;
  metalnessMap: THREE.Texture;
}

// Uniforms exposed by the poster shader material.
// These are animated directly by GSAP (brightness fade, opacity crossfade, etc.)
// without needing to recreate the material.
export interface PosterUniforms {
  map: { value: THREE.Texture };
  brightness: { value: number };
  contrast: { value: number };
  saturation: { value: number };
  opacity: { value: number };
  printScale: { value: number };
  printStrength: { value: number };
}

// The ref handle the page uses to drive the billboard scene from outside.
// GSAP animates the camera, controls, lighting, and poster materials through these refs.
export interface BillboardImperativeHandle {
  group: THREE.Group | null;
  camera: THREE.PerspectiveCamera | null;
  // Camera look-at target. Managed internally by Scene.tsx's useFrame loop.
  // Always null from the imperative handle; kept in the interface for forward compatibility.
  cameraTarget: THREE.Vector3 | null;
  ambientLight: THREE.AmbientLight | null;
  frontMaterial: THREE.ShaderMaterial | null;
  backMaterial: THREE.ShaderMaterial | null;
  frontUniforms: PosterUniforms | null;
  backUniforms: PosterUniforms | null;

  // Swaps the poster image on the front or back face with a GSAP crossfade.
  // duration controls the total fade-out + fade-in time in seconds.
  // Call this from a ScrollTrigger onEnter to change art at each scroll step.
  changePoster: (face: "front" | "back", imageUrl: string, duration?: number) => void;
}

export interface BillboardMeshProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  visible?: boolean;
  frontImage?: string;
  backImage?: string;
  // Driven by the Scene-level debug toggle — forces wireframe on all materials.
  wireframe?: boolean;
  // Passed from Scene so the imperative handle can expose the camera to the page.
  // React 19: useRef<T>(null) returns RefObject<T | null>.
  cameraRef?: React.RefObject<THREE.PerspectiveCamera | null>;
  // The scene's ambient light ref — passed so the handle can expose it to the page.
  ambientLightRef?: React.RefObject<THREE.AmbientLight | null>;
}

export interface BillboardProps {
  // Height of the fixed background canvas. Defaults to "100vh".
  height?: string;
  // Show the Leva debug panel. Never enabled in production builds.
  showControls?: boolean;
  className?: string;
  children?: React.ReactNode;
  onReady?: (billboard: BillboardImperativeHandle) => void;
}
