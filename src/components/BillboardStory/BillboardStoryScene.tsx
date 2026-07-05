"use client";

/**
 * BillboardStoryScene — photoreal R3F unipole billboard that flips 180°
 * per step.
 *
 * Realism decisions (from user feedback):
 *  - MONOPOLE: one heavy tapered column, exactly on the rotation axis —
 *    the board can never visually detach from its support mid-flip.
 *  - Procedural <Environment> built from Lightformers (zero downloads):
 *    metals need something to reflect or they render near-black.
 *  - Floodlight fixtures live INSIDE the rotating assembly with real
 *    targeted SpotLights, so whatever face shows is properly lit and the
 *    lamps always point at the poster.
 *  - Posters are emissive-lifted (lit-hoarding look) with a catwalk +
 *    railing for scale cues.
 *
 * Face choreography: step media alternates faces — even steps on the
 * front plane, odd steps on the back. Before each flip the AWAY-facing
 * plane is retextured (invisible to the camera), then the board rotates
 * 180°. Works in both scroll directions; videos play via VideoTexture
 * only while their step is on stage.
 *
 * Perf contract:
 *  - frameloop="demand": the GPU renders only during flips, parallax, or
 *    live video frames (ticker-gated, IntersectionObserver).
 *  - ContactShadows frames={1} (baked once), Environment frames={1},
 *    dpr capped at 1.6. Everything disposed on unmount.
 *  - frameloop="demand" gotcha: every async texture onLoad must call
 *    invalidate() or faces render black.
 */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import gsap from "gsap";
import { prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import { isVideoMedia, type BillboardSceneProps, type StoryStep } from "./billboardStoryTypes";

const BOARD_W = 4.5;
const BOARD_H = 2.7;

/* ── Texture helpers ─────────────────────────────────────────────────── */

interface StepTexture {
  texture: THREE.Texture;
  video?: HTMLVideoElement;
}

function loadStepTexture(
  step: StoryStep,
  loader: THREE.TextureLoader,
  onLoad: () => void,
): StepTexture {
  if (isVideoMedia(step.media)) {
    const video = document.createElement("video");
    video.src = step.media;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    // "auto" pre-buffers enough frames for smooth playback when the step
    // becomes active — "none" caused visible buffering lag in Chrome.
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.addEventListener("loadeddata", onLoad, { once: true });
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { texture, video };
  }
  const texture = loader.load(step.media, onLoad);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture };
}

function usePbrMaps(base: string, onLoad: () => void, repeat: [number, number] = [1, 1]) {
  const mapsRef = useRef<Record<string, THREE.Texture> | null>(null);
  if (!mapsRef.current) {
    const loader = new THREE.TextureLoader();
    const load = (name: string, srgb = false) => {
      const t = loader.load(`${base}/${name}.jpg`, onLoad);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
      return t;
    };
    mapsRef.current = {
      map: load("basecolor", true),
      normalMap: load("normal"),
      roughnessMap: load("roughness"),
      metalnessMap: load("metalness"),
    };
  }
  return mapsRef.current;
}

/* Assign a step's texture to a poster material (map + emissive lift). */
function setPoster(mat: THREE.MeshStandardMaterial | null, entry?: StepTexture) {
  if (!mat || !entry) return;
  mat.map = entry.texture;
  mat.emissiveMap = entry.texture; // lit-hoarding glow uses the artwork itself
  mat.needsUpdate = true;
}

/* ── Floodlight fixture: arm + lamp head + real targeted spotlight ───── */

function Floodlight({ x, side }: { x: number; side: 1 | -1 }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  const armY = BOARD_H / 2 + 0.42;
  const armZ = side * 0.62;
  return (
    <group>
      {/* Arm sweeping up and out from the frame top */}
      <mesh position={[x, BOARD_H / 2 + 0.22, armZ * 0.45]} rotation={[side * -0.55, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.62, 8]} />
        <meshStandardMaterial color="#3a3d46" metalness={0.7} roughness={0.45} />
      </mesh>
      {/* Lamp head aimed at the poster */}
      <group position={[x, armY, armZ]} rotation={[side * 0.95, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.085, 0.12, 0.16, 14]} />
          <meshStandardMaterial color="#23252c" metalness={0.75} roughness={0.4} />
        </mesh>
        {/* Glowing lens */}
        <mesh position={[0, -0.085, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.075, 14]} />
          <meshStandardMaterial
            color="#fff6e6"
            emissive="#ffe9c4"
            emissiveIntensity={2.4}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* The actual light — target sits on the poster face */}
      <spotLight
        position={[x, armY, armZ]}
        target={target}
        angle={0.75}
        penumbra={0.65}
        intensity={9}
        distance={7}
        decay={1.1}
        color="#fff3df"
      />
      <primitive object={target} position={[x * 0.55, -0.2, side * 0.09]} />
    </group>
  );
}

/* ── The unipole billboard (inside the Canvas) ───────────────────────── */

function Board({ steps, stepIndex, flipDuration, onReady }: BillboardSceneProps) {
  const { invalidate, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const backMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const texturesRef = useRef<StepTexture[]>([]);
  const rotRef = useRef({ y: 0 });
  const dragOffsetRef = useRef(0); // user horizontal drag offset (radians)
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  const refresh = () => invalidate();
  const frameMaps = usePbrMaps("/textures/frame", refresh, [3, 1]);
  const poleMaps = usePbrMaps("/textures/pole", refresh, [1, 2]);

  /* Load every step's media once. */
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const onTexLoad = () => {
      if (frontMatRef.current) frontMatRef.current.needsUpdate = true;
      if (backMatRef.current) backMatRef.current.needsUpdate = true;
      invalidate();
    };
    const textures = steps.map((s) => loadStepTexture(s, loader, onTexLoad));
    texturesRef.current = textures;

    // Initial faces: front = step 0, back = step 1 (pre-staged for flip 1).
    setPoster(frontMatRef.current, textures[0]);
    setPoster(backMatRef.current, textures[1]);
    invalidate();
    readyRef.current();

    // Environment/shadow bakes land async — nudge a few repaints.
    const nudges = [0.3, 0.8, 1.6].map((t) => gsap.delayedCall(t, invalidate));

    return () => {
      nudges.forEach((n) => n.kill());
      textures.forEach((t) => {
        t.texture.dispose();
        if (t.video) {
          t.video.pause();
          t.video.src = "";
        }
      });
    };
    // Steps are stable JSON data — load once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Flip to the current step; retexture the hidden face first. */
  useEffect(() => {
    const group = groupRef.current;
    const textures = texturesRef.current;
    if (!group || textures.length === 0) return;

    const targetMat = stepIndex % 2 === 0 ? frontMatRef.current : backMatRef.current;
    const entry = textures[stepIndex];
    if (targetMat && entry && targetMat.map !== entry.texture) {
      setPoster(targetMat, entry);
    }

    textures.forEach((t, i) => {
      if (!t.video) return;
      if (i === stepIndex) t.video.play().catch(() => {});
      else t.video.pause();
    });

    const targetY = stepIndex * Math.PI;
    if (prefersReducedMotion()) {
      rotRef.current.y = targetY;
      group.rotation.y = targetY;
      invalidate();
      return;
    }
    const tween = gsap.to(rotRef.current, {
      y: targetY,
      duration: flipDuration,
      ease: "power3.inOut",
      onUpdate: () => {
        group.rotation.y = rotRef.current.y + dragOffsetRef.current;
        invalidate();
      },
    });
    return () => {
      tween.kill();
    };
  }, [stepIndex, flipDuration, invalidate]);

  /* Live frames while the current step is a video (ticker, IO-gated). */
  useEffect(() => {
    const entry = texturesRef.current[stepIndex];
    if (!entry?.video) return;
    return tickWhileVisible(gl.domElement, () => invalidate());
  }, [stepIndex, gl, invalidate]);

  /* Pointer interaction — horizontal drag (Y rotation) + vertical parallax tilt (X).
     Both are merged into one handler set to avoid conflicting listeners.
     The drag offset springs back to 0 on pointer-up so the board returns to
     its current step angle, keeping the flip choreography intact. */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const group = groupRef.current;
    if (!group) return;
    const host = gl.domElement;

    const toX = gsap.quickTo(group.rotation, "x", {
      duration: 0.8,
      ease: "power2.out",
      onUpdate: invalidate,
    });

    let dragging = false;
    let startX = 0;
    let dragStart = 0;
    const dragProxy = { offset: 0 };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      dragStart = dragOffsetRef.current;
      host.setPointerCapture(e.pointerId);
      gsap.killTweensOf(dragProxy);
      host.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (dragging) {
        const dx = e.clientX - startX;
        dragOffsetRef.current = dragStart + dx * 0.009;
        dragProxy.offset = dragOffsetRef.current;
        group.rotation.y = rotRef.current.y + dragOffsetRef.current;
        invalidate();
      } else {
        // Vertical tilt only when not dragging
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        toX(ny * -0.035);
      }
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      host.style.cursor = "grab";
      // Spring drag offset back to 0
      gsap.to(dragProxy, {
        offset: 0,
        duration: 0.85,
        ease: "power2.out",
        onUpdate: () => {
          dragOffsetRef.current = dragProxy.offset;
          group.rotation.y = rotRef.current.y + dragOffsetRef.current;
          invalidate();
        },
        onComplete: () => {
          dragOffsetRef.current = 0;
        },
      });
    };

    const onPointerLeave = () => {
      if (!dragging) toX(0);
    };

    host.style.cursor = "grab";
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      host.style.cursor = "";
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerup", onPointerUp);
      gsap.killTweensOf(dragProxy);
    };
  }, [gl, invalidate]);

  return (
    <group position={[0, 0.55, 0]}>
      {/* ── Monopole: heavy tapered column ON the rotation axis ─────── */}
      <mesh position={[0, -2.15, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 3.6, 24]} />
        <meshStandardMaterial {...poleMaps} metalness={0.6} roughness={0.55} envMapIntensity={0.9} />
      </mesh>
      {/* Mounting collar at the junction */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.34, 20]} />
        <meshStandardMaterial color="#33363f" metalness={0.75} roughness={0.4} envMapIntensity={0.9} />
      </mesh>

      {/* ── Rotating assembly (axis = the pole) ─────────────────────── */}
      <group ref={groupRef} position={[0, 1.05, 0]}>
        {/* Steel frame */}
        <mesh castShadow>
          <boxGeometry args={[BOARD_W + 0.26, BOARD_H + 0.26, 0.18]} />
          <meshStandardMaterial {...frameMaps} metalness={0.55} roughness={0.5} envMapIntensity={1.1} />
        </mesh>

        {/* Poster faces — emissive-lifted like a lit hoarding */}
        <mesh position={[0, 0, 0.095]}>
          <planeGeometry args={[BOARD_W, BOARD_H]} />
          <meshStandardMaterial
            ref={frontMatRef}
            roughness={0.35}
            metalness={0}
            emissive="#ffffff"
            emissiveIntensity={0.32}
            envMapIntensity={0.35}
          />
        </mesh>
        <mesh position={[0, 0, -0.095]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[BOARD_W, BOARD_H]} />
          <meshStandardMaterial
            ref={backMatRef}
            roughness={0.35}
            metalness={0}
            emissive="#ffffff"
            emissiveIntensity={0.32}
            envMapIntensity={0.35}
          />
        </mesh>

        {/* Catwalk + railings — the scale cue that sells "real hoarding" */}
        <mesh position={[0, -BOARD_H / 2 - 0.22, 0]}>
          <boxGeometry args={[BOARD_W + 0.7, 0.05, 0.66]} />
          <meshStandardMaterial color="#2c2f37" metalness={0.7} roughness={0.5} envMapIntensity={0.8} />
        </mesh>
        {[1, -1].map((side) => (
          <mesh key={side} position={[0, -BOARD_H / 2 + 0.02, side * 0.3]}>
            <boxGeometry args={[BOARD_W + 0.7, 0.025, 0.025]} />
            <meshStandardMaterial color="#3a3d46" metalness={0.7} roughness={0.45} />
          </mesh>
        ))}
        {[-2.2, -1.1, 0, 1.1, 2.2].flatMap((x) =>
          [1, -1].map((side) => (
            <mesh key={`${x}-${side}`} position={[x, -BOARD_H / 2 - 0.09, side * 0.3]}>
              <cylinderGeometry args={[0.012, 0.012, 0.24, 6]} />
              <meshStandardMaterial color="#3a3d46" metalness={0.7} roughness={0.45} />
            </mesh>
          )),
        )}

        {/* Two floodlights (one per face, centered) — enough for the lit-hoarding
            look at lower GPU cost; 6 SpotLights were too heavy for Chrome. */}
        <Floodlight x={0} side={1} />
        <Floodlight x={0} side={-1} />
      </group>

      {/* ── Base light rig + baked ground shadow ────────────────────── */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 7, 6]} intensity={0.9} />
      <directionalLight position={[-6, 3, -5]} intensity={0.35} color="#bcd0ff" />
      <ContactShadows frames={1} position={[0, -3.98, 0]} opacity={0.5} blur={2.4} scale={12} far={4.5} />

      {/* Procedural studio — gives every metal something to reflect.
          Built from Lightformers: zero network requests. */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={1.1} rotation-x={Math.PI / 2} position={[0, 5, 0]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.55} rotation-y={Math.PI / 2} position={[-6, 1.5, 0]} scale={[7, 3, 1]} color="#cfd8ff" />
        <Lightformer intensity={0.5} rotation-y={-Math.PI / 2} position={[6, 1.5, 0]} scale={[7, 3, 1]} color="#ffd9b0" />
        <Lightformer intensity={0.4} position={[0, 1, 6]} scale={[9, 3, 1]} />
        <Lightformer intensity={0.35} position={[0, 1, -6]} rotation-y={Math.PI} scale={[9, 3, 1]} />
      </Environment>
    </group>
  );
}

/* ── Canvas shell (default export for dynamic import) ────────────────── */

export default function BillboardStoryScene(props: BillboardSceneProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0.3, 0.55, 7.9], fov: 33 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Board {...props} />
    </Canvas>
  );
}
