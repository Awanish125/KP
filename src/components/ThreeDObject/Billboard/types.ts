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

/* ═══════════════════════════════════════════════════════════════════════════
   BillboardBlock — in-div 3D billboard (new component)
   ═══════════════════════════════════════════════════════════════════════════ */

/** One image swap during a rotation. `atDegrees` is measured from the START
 *  of the current rotation call (not from absolute 0°). */
export interface RotationImage {
  atDegrees: number;
  front?: string;
  back?: string;
}

export interface RotateOptions {
  duration?: number;
  ease?: string;
  /** Swap posters at these degree marks during this rotation. */
  images?: RotationImage[];
}

/** Camera preset or a custom [x, y, z] world-space position.
 *  The camera always looks at [0, 0, 0] (model origin). */
export type CameraAngle = "front" | "quarter" | [number, number, number];

/** Ref handle returned by BillboardBlock for imperative control. */
export interface BillboardBlockHandle {
  /** Rotate to an absolute angle (degrees). GSAP eases the movement. */
  rotateTo: (degrees: number, options?: RotateOptions) => void;
  /** Animate back to 0°. */
  resetRotation: (options?: { duration?: number; ease?: string }) => void;
  /** Swap a poster image with a crossfade. */
  changePoster: (face: "front" | "back", imageUrl: string, duration?: number) => void;
  /** Returns current rotation in degrees. */
  getRotation: () => number;
}

export interface BillboardBlockProps {
  // ── Sizing ──────────────────────────────────────────────────────────────
  /** CSS className — size the component like any div. */
  className?: string;
  /** Inline style — size the component like any div. */
  style?: React.CSSProperties;

  // ── Poster images ────────────────────────────────────────────────────────
  image?: string;
  backImage?: string;

  // ── Camera ──────────────────────────────────────────────────────────────
  /** 'front' (default) | 'quarter' (3/4 angle) | [x,y,z] custom world pos */
  cameraAngle?: CameraAngle;
  /** Starting rotation in degrees. Default 0 (front-facing). */
  defaultRotation?: number;

  // ── Enter-viewport rotation ──────────────────────────────────────────────
  /** Total degrees to rotate when the component scrolls into view. */
  rotateOnEnter?: number;
  /** Duration of rotateOnEnter animation. Default 1.5s. */
  rotateDuration?: number;
  /** GSAP ease for rotateOnEnter. Default 'power2.inOut'. */
  rotateEase?: string;
  /** Poster swaps that happen at degree milestones during rotateOnEnter. */
  rotateImages?: RotationImage[];

  // ── Scroll-driven rotation (pinned section) ──────────────────────────────
  /** Total degrees to rotate across the full scroll of scrollTrigger. */
  scrollRotate?: number;
  /** CSS selector (or Element) of the tall wrapper div that drives scroll. */
  scrollTrigger?: string | Element;
  /** Poster swaps that happen at degree milestones during scroll rotation. */
  scrollImages?: RotationImage[];

  // ── Mobile layout ─────────────────────────────────────────────────────────
  /**
   * 'stack'   (default) — component is a normal inline div, stacks on mobile.
   * 'behind'  — when the div scrolls off the bottom of the viewport on mobile,
   *             the canvas switches to a fixed strip at the bottom so the model
   *             stays visible behind the HTML content above it.
   */
  mobileLayout?: "stack" | "behind";

  // ── Events ──────────────────────────────────────────────────────────────
  onEnter?: () => void;
  onLeave?: () => void;

  // ── Dev ─────────────────────────────────────────────────────────────────
  showControls?: boolean;
}

export interface BillboardProps {
  // Height of the fixed background canvas. Defaults to "100vh".
  height?: string;
  // Show the Leva debug panel. Never enabled in production builds.
  showControls?: boolean;
  className?: string;
  children?: React.ReactNode;
  onReady?: (billboard: BillboardImperativeHandle) => void;

  /**
   * INLINE MODE — canvas fills its parent div.
   * The parent must have position: relative (or absolute / fixed / sticky).
   *
   *   <div style={{ position: "relative", width: 600, height: 400 }}>
   *     <Billboard inline />
   *   </div>
   */
  inline?: boolean;

  /**
   * CONTAINER REF MODE — canvas floats (position: fixed) over the target div
   * and tracks its screen position as the page scrolls or resizes.
   *
   *   const boxRef = useRef<HTMLDivElement>(null);
   *   <div ref={boxRef} style={{ width: 600, height: 400 }}>...</div>
   *   <Billboard containerRef={boxRef} />
   *
   * The div itself is not modified — you can put any content inside it as
   * long as you want the 3D scene to appear on top of it.
   */
  containerRef?: React.RefObject<HTMLElement | null>;
}
