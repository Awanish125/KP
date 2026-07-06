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

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

/* ── Theme detection ─────────────────────────────────────────────────── */

function useIsDark() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ── Invisible face lights — no visible geometry, pure illumination ──── */

function BillboardLights() {
  const frontTarget = useMemo(() => new THREE.Object3D(), []);
  const backTarget = useMemo(() => new THREE.Object3D(), []);
  return (
    <>
      <spotLight
        position={[0, BOARD_H / 2 + 1.0, 1.2]}
        target={frontTarget}
        angle={0.8}
        penumbra={0.55}
        intensity={10}
        distance={7}
        decay={1.1}
        color="#fff3df"
      />
      <primitive object={frontTarget} position={[0, -0.2, 0.09]} />
      <spotLight
        position={[0, BOARD_H / 2 + 1.0, -1.2]}
        target={backTarget}
        angle={0.8}
        penumbra={0.55}
        intensity={10}
        distance={7}
        decay={1.1}
        color="#fff3df"
      />
      <primitive object={backTarget} position={[0, -0.2, -0.09]} />
    </>
  );
}

/* ── Camera: point at the billboard assembly centre (y ≈ 1.6 world).
   Without an explicit lookAt the default camera looks along –Z, so the
   view ray passes through y = camera.y, leaving the billboard off-centre
   and its top clipped. useLayoutEffect runs before the first WebGL frame
   so frameloop="demand" never renders the wrong angle. ──────────────── */

function CameraSetup() {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    camera.lookAt(0, 1.0, 0);
    camera.updateMatrixWorld();
    invalidate();
  }, [camera, invalidate]);
  return null;
}

/* ── The unipole billboard (inside the Canvas) ───────────────────────── */

function Board({ steps, stepIndex, flipDuration, onReady }: BillboardSceneProps) {
  const { invalidate, gl, scene, camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const backMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const texturesRef = useRef<StepTexture[]>([]);
  const rotRef = useRef({ y: 0 });
  const dragOffsetRef = useRef(0);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  const isDark = useIsDark();
  /* Redraw whenever theme switches; also set scene background for light mode.
     scene is a stable R3F reference — safe to omit from deps. */
  useEffect(() => {
    scene.background = isDark ? null : new THREE.Color("#dce8ff");
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, invalidate]);

  /* Theme colour tokens — light: project blue, dark: charcoal/steel. */
  const C = isDark
    ? { pole: "#ffffff", frame: "#ffffff", collar: "#33363f", catwalk: "#2c2f37", rail: "#3a3d46" }
    : { pole: "#1555C2", frame: "#1555C2", collar: "#0d3a8c", catwalk: "#0d3a8c", rail: "#1555C2" };

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

    /* ── GPU warm-up ─────────────────────────────────────────────────
       The scene mounts on browser idle, usually while it is still far
       below the fold. Compile every shader program and upload textures
       NOW — profiling showed the first visible render otherwise paying
       ~200ms inside the R3F loop mid-scroll. */
    gl.compileAsync?.(scene, camera)?.catch?.(() => {});

    /* Video steps: spin the decoder once (play → pause at frame 0) so the
       first flip onto a video face doesn't stall on decoder init. */
    textures.forEach((t) => {
      if (!t.video) return;
      const v = t.video;
      const warm = () => {
        v.play()
          .then(() => {
            requestAnimationFrame(() => {
              v.pause();
              try { v.currentTime = 0; } catch { /* not seekable yet */ }
              invalidate();
            });
          })
          .catch(() => {});
      };
      if (v.readyState >= 2) warm();
      else v.addEventListener("loadeddata", warm, { once: true });
    });

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
        group.rotation.y = rotRef.current.y;
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
    const body = bodyRef.current;
    if (!body) return;
    const host = gl.domElement;

    const toX = gsap.quickTo(body.rotation, "x", {
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
        body.rotation.y = dragOffsetRef.current;
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
          body.rotation.y = dragProxy.offset;
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
      {/* ── All-body group: pole + collar + base + billboard.
           Rotating this group on drag moves the whole structure. ───── */}
      <group ref={bodyRef}>
        {/* Monopole — tapered column, top flush with collar, bottom at ground */}
        <mesh position={[0, -1.95, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.36, 3.2, 24]} />
          <meshStandardMaterial {...poleMaps} color={C.pole} metalness={0.65} roughness={0.5} envMapIntensity={0.9} />
        </mesh>
        {/* Mounting collar at the billboard junction */}
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.42, 0.48, 0.42, 20]} />
          <meshStandardMaterial color={C.collar} metalness={0.75} roughness={0.4} envMapIntensity={0.9} />
        </mesh>
        {/* Ground base plate — circular flange sitting at ground level */}
        <mesh position={[0, -3.5, 0]} castShadow>
          <cylinderGeometry args={[1.0, 1.15, 0.16, 32]} />
          <meshStandardMaterial color={C.collar} metalness={0.72} roughness={0.38} envMapIntensity={0.85} />
        </mesh>
        {/* Anchor bolts — sit on top of the base plate, evenly spaced */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const r = (deg * Math.PI) / 180;
          return (
            <mesh key={`b${deg}`} position={[0.82 * Math.cos(r), -3.355, 0.82 * Math.sin(r)]}>
              <cylinderGeometry args={[0.048, 0.048, 0.13, 8]} />
              <meshStandardMaterial color="#9a9da8" metalness={0.9} roughness={0.2} />
            </mesh>
          );
        })}

        {/* ── Rotating assembly (axis = the pole) — only this group flips ── */}
        <group ref={groupRef} position={[0, 1.05, 0]}>
          {/* Steel frame */}
          <mesh castShadow>
            <boxGeometry args={[BOARD_W + 0.26, BOARD_H + 0.26, 0.18]} />
            <meshStandardMaterial {...frameMaps} color={C.frame} metalness={0.6} roughness={0.45} envMapIntensity={1.1} />
          </mesh>

          {/* Poster faces — emissive-lifted like a lit hoarding */}
          <mesh position={[0, 0, 0.095]}>
            <planeGeometry args={[BOARD_W, BOARD_H]} />
            <meshStandardMaterial
              ref={frontMatRef}
              roughness={0.35}
              metalness={0}
              emissive="#ffffff"
              emissiveIntensity={0.38}
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
              emissiveIntensity={0.38}
              envMapIntensity={0.35}
            />
          </mesh>

          {/* Catwalk + railings — scale cue */}
          <mesh position={[0, -BOARD_H / 2 - 0.22, 0]}>
            <boxGeometry args={[BOARD_W + 0.7, 0.05, 0.66]} />
            <meshStandardMaterial color={C.catwalk} metalness={0.7} roughness={0.5} envMapIntensity={0.8} />
          </mesh>
          {[1, -1].map((side) => (
            <mesh key={side} position={[0, -BOARD_H / 2 + 0.02, side * 0.3]}>
              <boxGeometry args={[BOARD_W + 0.7, 0.025, 0.025]} />
              <meshStandardMaterial color={C.rail} metalness={0.7} roughness={0.45} />
            </mesh>
          ))}
          {[-2.2, -1.1, 0, 1.1, 2.2].flatMap((x) =>
            [1, -1].map((side) => (
              <mesh key={`${x}-${side}`} position={[x, -BOARD_H / 2 - 0.09, side * 0.3]}>
                <cylinderGeometry args={[0.012, 0.012, 0.24, 6]} />
                <meshStandardMaterial color={C.rail} metalness={0.7} roughness={0.45} />
              </mesh>
            )),
          )}

          {/* Face illumination — invisible spotlights, no fixture geometry */}
          <BillboardLights />
        </group>
      </group>

      {/* ── Lights + shadow — outside the body group, don't rotate on drag ── */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 7, 6]} intensity={0.9} />
      <directionalLight position={[-6, 3, -5]} intensity={0.35} color="#bcd0ff" />
      <ContactShadows frames={1} position={[0, -3.62, 0]} opacity={0.55} blur={2.6} scale={16} far={7} />

      {/* Procedural studio — gives every metal something to reflect. */}
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
      camera={{ position: [0.3, 0.3, 13], fov: 32 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <CameraSetup />
      <Board {...props} />
    </Canvas>
  );
}
