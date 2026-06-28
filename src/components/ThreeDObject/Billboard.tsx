"use client";

/**
 * Billboard.tsx
 * ---------------------------------------------------------------------------
 * Standalone, procedural 3D billboard built with React Three Fiber.
 *
 * This file is fully self-contained and independent from any existing Hero
 * section / canvas / camera / lighting in the host project. It renders its
 * own <Canvas> and can be dropped in anywhere below the Hero:
 *
 *   import Billboard from '@/components/Billboard'
 *   ...
 *   <Hero />
 *   <Billboard />
 *
 * Nothing here touches global state, the page's existing R3F context, or any
 * other component. No GLB/FBX/OBJ assets are used — every shape (frame,
 * panels, pole, braces, brackets, bolts, base plate) is built from primitive
 * geometry composed at runtime.
 *
 * GSAP roadmap hook points (see bottom of file for details):
 *   - `BillboardMesh` is a forwardRef component. The ref exposes the group
 *     object3D plus refs to the front/back poster materials, so a future
 *     GSAP timeline can tween position/rotation/scale directly on the
 *     group, and uniforms (opacity/brightness/texture swap) directly on the
 *     poster materials, without touching this file's internals.
 *   - `BillboardMesh` also accepts plain props (position/rotation/scale/
 *     visible/frontImage/backImage) so it can be driven by either GSAP refs
 *     or declarative scroll-state, whichever the future integration prefers.
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
  Grid,
  AdaptiveDpr,
  AdaptiveEvents,
  Bvh,
} from "@react-three/drei";
import { useControls, folder, Leva, button } from "leva";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/*  Texture loading with graceful fallbacks                                   */
/* -------------------------------------------------------------------------- */

type FallbackKind = "color" | "gray" | "normal";

/** Builds a small in-memory texture so the component never breaks if a real
 *  texture/image file hasn't been added to /public yet. */
function makeFallbackTexture(
  kind: FallbackKind,
  hex = "#6b7a63",
): THREE.Texture {
  const size = 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    if (kind === "normal") {
      ctx.fillStyle = "rgb(128,128,255)";
    } else if (kind === "gray") {
      ctx.fillStyle = "rgb(140,140,140)";
    } else {
      ctx.fillStyle = hex;
    }
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

interface UseSafeTextureOptions {
  fallbackKind: FallbackKind;
  fallbackColor?: string;
  colorSpace?: boolean; // true => sRGB (for base color / poster maps)
}

/** Loads a texture by URL. Falls back to a flat procedural texture instead of
 *  throwing/suspending if the file is missing — keeps the billboard rendering
 *  even before real art/textures are dropped into /public. */
function useSafeTexture(
  url: string | undefined,
  options: UseSafeTextureOptions,
): THREE.Texture {
  const { fallbackKind, fallbackColor, colorSpace } = options;
  const fallback = useMemo(
    () => makeFallbackTexture(fallbackKind, fallbackColor),
    [fallbackKind, fallbackColor],
  );
  const [texture, setTexture] = useState<THREE.Texture>(fallback);

  useEffect(() => {
    if (!url) {
      setTexture(fallback);
      return;
    }
    let disposed = false;
    const loader = new THREE.TextureLoader();
    let loaded: THREE.Texture | null = null;
    loader.load(
      url,
      (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        if (colorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        loaded = tex;
        setTexture(tex);
      },
      undefined,
      () => {
        if (!disposed) setTexture(fallback);
      },
    );
    return () => {
      disposed = true;
      if (loaded) loaded.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, fallback, colorSpace]);

  useEffect(() => () => fallback.dispose(), [fallback]);

  return texture;
}

/* -------------------------------------------------------------------------- */
/*  Poster source: image OR looping video                                    */
/* -------------------------------------------------------------------------- */

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v"];

function isVideoUrl(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

/** Loads a poster source that can be either a still image or a video file.
 *  Videos autoplay muted and loop continuously; images behave exactly like
 *  before. Falls back to a flat color texture if the file is missing or
 *  fails to load, so a panel never breaks rendering. */
function useMediaTexture(
  url: string | undefined,
  fallbackColor: string,
): THREE.Texture {
  const fallback = useMemo(
    () => makeFallbackTexture("color", fallbackColor),
    [fallbackColor],
  );
  const [texture, setTexture] = useState<THREE.Texture>(fallback);

  useEffect(() => {
    if (!url) {
      setTexture(fallback);
      return;
    }

    let disposed = false;

    if (isVideoUrl(url)) {
      const video = document.createElement("video");
      video.src = url;
      video.loop = true;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("playsinline", ""); // older Safari/iOS
      video.crossOrigin = "anonymous";

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.generateMipmaps = false;

      const handleReady = () => {
        if (disposed) return;
        // Autoplay can be blocked until a user gesture on some browsers;
        // the texture still picks up frames as soon as playback starts.
        video.play().catch(() => undefined);
        setTexture(videoTexture);
      };
      const handleError = () => {
        if (!disposed) setTexture(fallback);
      };

      video.addEventListener("loadeddata", handleReady);
      video.addEventListener("error", handleError);

      return () => {
        disposed = true;
        video.removeEventListener("loadeddata", handleReady);
        video.removeEventListener("error", handleError);
        video.pause();
        video.removeAttribute("src");
        video.load();
        videoTexture.dispose();
      };
    }

    const loader = new THREE.TextureLoader();
    let loaded: THREE.Texture | null = null;
    loader.load(
      url,
      (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        loaded = tex;
        setTexture(tex);
      },
      undefined,
      () => {
        if (!disposed) setTexture(fallback);
      },
    );
    return () => {
      disposed = true;
      if (loaded) loaded.dispose();
    };
  }, [url, fallback]);

  useEffect(() => () => fallback.dispose(), [fallback]);

  return texture;
}

interface RepeatSettings {
  repeatX: number;
  repeatY: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
}

function applyRepeat(tex: THREE.Texture, settings: RepeatSettings) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(settings.repeatX, settings.repeatY);
  tex.rotation = settings.rotation ?? 0;
  tex.offset.set(settings.offsetX ?? 0, settings.offsetY ?? 0);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
}

/* -------------------------------------------------------------------------- */
/*  Poster panel shader material (independent front/back uniforms)           */
/* -------------------------------------------------------------------------- */

const posterVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const posterFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float brightness;
  uniform float contrast;
  uniform float saturation;
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(map, vUv);
    vec3 color = tex.rgb * brightness;
    color = (color - 0.5) * contrast + 0.5;
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, saturation);
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a * opacity);
  }
`;

interface PosterUniforms {
  map: { value: THREE.Texture };
  brightness: { value: number };
  contrast: { value: number };
  saturation: { value: number };
  opacity: { value: number };
}

function usePosterMaterial(texture: THREE.Texture): {
  material: THREE.ShaderMaterial;
  uniforms: PosterUniforms;
} {
  const uniforms = useMemo<PosterUniforms>(
    () => ({
      map: { value: texture },
      brightness: { value: 1 },
      contrast: { value: 1 },
      saturation: { value: 1 },
      opacity: { value: 1 },
    }),
    // texture identity changes when a new image loads in; rebuild uniforms then
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: posterVertexShader,
      fragmentShader: posterFragmentShader,
      uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
      transparent: true,
      side: THREE.FrontSide,
    });
    return mat;
  }, [uniforms]);

  useEffect(() => {
    uniforms.map.value = texture;
  }, [texture, uniforms]);

  useEffect(() => () => material.dispose(), [material]);

  return { material, uniforms };
}

/* -------------------------------------------------------------------------- */
/*  PBR frame / pole materials                                                */
/* -------------------------------------------------------------------------- */

interface PbrMaps {
  map: THREE.Texture;
  roughnessMap: THREE.Texture;
  normalMap: THREE.Texture;
  bumpMap: THREE.Texture;
  metalnessMap: THREE.Texture;
}

function usePbrMaps(
  basePath: string,
  repeat: RepeatSettings,
  normalFallback: string,
  colorFallback: string,
): PbrMaps {
  const map = useSafeTexture(`${basePath}/basecolor.jpg`, {
    fallbackKind: "color",
    fallbackColor: colorFallback,
    colorSpace: true,
  });
  const roughnessMap = useSafeTexture(`${basePath}/roughness.jpg`, {
    fallbackKind: "gray",
  });
  const normalMap = useSafeTexture(`${basePath}/normal.jpg`, {
    fallbackKind: "normal",
  });
  const bumpMap = useSafeTexture(`${basePath}/height.jpg`, {
    fallbackKind: "gray",
  });
  const metalnessMap = useSafeTexture(`${basePath}/metalness.jpg`, {
    fallbackKind: "gray",
  });

  useEffect(() => {
    applyRepeat(map, repeat);
    applyRepeat(roughnessMap, repeat);
    applyRepeat(normalMap, repeat);
    applyRepeat(bumpMap, repeat);
    applyRepeat(metalnessMap, repeat);
  }, [map, roughnessMap, normalMap, bumpMap, repeat, metalnessMap]);

  void normalFallback;
  return { map, roughnessMap, normalMap, bumpMap, metalnessMap };
}

/* -------------------------------------------------------------------------- */
/*  Bolts / rivets (instanced)                                                */
/* -------------------------------------------------------------------------- */

interface BoltFieldProps {
  width: number;
  height: number;
  frameWidth: number;
  depth: number;
  material: THREE.Material;
  spacing?: number;
}

function BoltField({
  width,
  height,
  frameWidth,
  depth,
  material,
  spacing = 0.45,
}: BoltFieldProps) {
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8),
    [],
  );

  const positions = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const halfW = width / 2;
    const halfH = height / 2;
    const inset = frameWidth / 2;

    const countX = Math.max(2, Math.floor(width / spacing));
    const countY = Math.max(2, Math.floor(height / spacing));

    // top & bottom rows
    for (let i = 0; i <= countX; i++) {
      const x = -halfW + (i / countX) * width;
      pts.push(new THREE.Vector3(x, halfH - inset, depth / 2));
      pts.push(new THREE.Vector3(x, -halfH + inset, depth / 2));
    }
    // left & right columns
    for (let j = 0; j <= countY; j++) {
      const y = -halfH + (j / countY) * height;
      pts.push(new THREE.Vector3(-halfW + inset, y, depth / 2));
      pts.push(new THREE.Vector3(halfW - inset, y, depth / 2));
    }
    return pts;
  }, [width, height, frameWidth, depth, spacing]);

  const instancedRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = instancedRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.rotation.x = Math.PI / 2;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh
      ref={instancedRef}
      args={[geometry, material, positions.length]}
      castShadow
      receiveShadow
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Poster panel                                                              */
/* -------------------------------------------------------------------------- */

interface PosterPanelProps {
  width: number;
  height: number;
  z: number;
  rotationY: number;
  material: THREE.ShaderMaterial;
}

function PosterPanel({
  width,
  height,
  z,
  rotationY,
  material,
}: PosterPanelProps) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(width, height, 1, 1),
    [width, height],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, 0, z]}
      rotation={[0, rotationY, 0]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  BillboardMesh — the procedural structure                                  */
/* -------------------------------------------------------------------------- */

export interface BillboardImperativeHandle {
  group: THREE.Group | null;
  frontMaterial: THREE.ShaderMaterial | null;
  backMaterial: THREE.ShaderMaterial | null;
  frontUniforms: PosterUniforms | null;
  backUniforms: PosterUniforms | null;
}

export interface BillboardMeshProps {
  /** Declarative transform overrides — future scroll/GSAP-driven layouts can
   *  pass these in directly instead of (or in addition to) using the ref. */
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  visible?: boolean;
  frontImage?: string;
  backImage?: string;
}

const BillboardMesh = forwardRef<BillboardImperativeHandle, BillboardMeshProps>(
  function BillboardMesh(props, ref) {
    const {
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      visible = true,
    } = props;

    /* ---- Leva: Billboard dimensions ---- */
    const dims = useControls("Billboard", {
      width: { value: 4, min: 1, max: 10, step: 0.1 },
      height: { value: 2.4, min: 1, max: 8, step: 0.1 },
      thickness: { value: 0.18, min: 0.05, max: 0.6, step: 0.01 },
      frameWidth: { value: 0.16, min: 0.04, max: 0.5, step: 0.01 },
      frameDepth: { value: 0.14, min: 0.04, max: 0.5, step: 0.01 },
      cornerRadius: { value: 0.04, min: 0, max: 0.2, step: 0.005 },
      posterDepth: { value: 0.02, min: 0.005, max: 0.1, step: 0.005 },
      posterGap: { value: 0.01, min: 0, max: 0.08, step: 0.005 },
    });

    /* ---- Leva: Pole ---- */
    const poleCtl = useControls("Pole", {
      radius: { value: 0.09, min: 0.02, max: 0.3, step: 0.005 },
      height: { value: 3.4, min: 0.5, max: 8, step: 0.1 },
      segments: { value: 20, min: 6, max: 48, step: 1 },
      position: { value: [0, 0, 0] as [number, number, number] },
      rotation: { value: [0, 0, 0] as [number, number, number] },
      scale: { value: 1, min: 0.2, max: 3, step: 0.05 },
      textureRepeat: { value: 2.5, min: 0.5, max: 16, step: 0.5 },
    });

    /* ---- Leva: Supports ---- */
    const supportCtl = useControls("Supports", {
      enableSupports: true,
      enableRearBraces: true,
      thickness: { value: 0.045, min: 0.01, max: 0.15, step: 0.005 },
      width: { value: 0.06, min: 0.01, max: 0.2, step: 0.005 },
      depth: { value: 0.06, min: 0.01, max: 0.2, step: 0.005 },
    });

    /* ---- Leva: Posters ----
     * frontImage/backImage accept either a still image path or a video
     * path (.mp4/.webm/.mov/etc). Videos autoplay muted and loop. */
    const posterCtl = useControls("Posters", {
      frontImage: {
        value: props.frontImage ?? "/posters/front.jpg",
        label: "Front Image/Video",
      },
      backImage: {
        value: props.backImage ?? "/posters/back.jpg",
        label: "Back Image/Video",
      },
      frontBrightness: { value: 1, min: 0, max: 2, step: 0.01 },
      backBrightness: { value: 1, min: 0, max: 2, step: 0.01 },
      frontOpacity: { value: 1, min: 0, max: 1, step: 0.01 },
      backOpacity: { value: 1, min: 0, max: 1, step: 0.01 },
      contrast: { value: 1, min: 0, max: 2, step: 0.01 },
      saturation: { value: 1, min: 0, max: 2, step: 0.01 },
      swapImages: false,
    });

    /* ---- Leva: Materials ---- */
    const frameMatCtl = useControls("Materials", {
      Frame: folder({
        metalness: { value: 0.85, min: 0, max: 1, step: 0.01 },
        roughness: { value: 0.4, min: 0, max: 1, step: 0.01 },
        clearcoat: { value: 0.15, min: 0, max: 1, step: 0.01 },
        clearcoatRoughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
        normalScale: { value: 1, min: 0, max: 3, step: 0.05 },
        bumpScale: { value: 0.02, min: 0, max: 0.2, step: 0.005 },
        envMapIntensity: { value: 1, min: 0, max: 5, step: 0.05 },
        colorTint: "#9fb39a",
      }),
      Pole: folder({
        poleMetalness: { value: 0.18, min: 0, max: 1, step: 0.01 },
        poleRoughness: { value: 1, min: 0, max: 1, step: 0.01 },
        poleBumpScale: { value: 0.10, min: 0, max: 0.1, step: 0.002 },
        poleColorTint: "#939393",
      }),
    });

    /* ---- Leva: Texture tiling ---- */
    const tilingCtl = useControls("Texture Tiling", {
      Frame: folder({
        frameRepeatX: { value: 2, min: 0.25, max: 8, step: 0.25 },
        frameRepeatY: { value: 1, min: 0.25, max: 8, step: 0.25 },
      }),
      Pole: folder({
        poleRepeatX: { value: 1, min: 0.25, max: 8, step: 0.25 },
        poleRepeatY: { value: 4, min: 0.25, max: 16, step: 0.25 },
      }),
      Rotation: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      OffsetX: { value: 0, min: -1, max: 1, step: 0.01 },
      OffsetY: { value: 0, min: -1, max: 1, step: 0.01 },
    });

    const wireframeCtl = useControls("Debug", {
      wireframe: false,
      boundingBox: false,
      axes: false,
    });

    /* ---- derived repeat settings ---- */
    const frameRepeat: RepeatSettings = useMemo(
      () => ({
        repeatX: tilingCtl.frameRepeatX,
        repeatY: tilingCtl.frameRepeatY,
        rotation: tilingCtl.Rotation,
        offsetX: tilingCtl.OffsetX,
        offsetY: tilingCtl.OffsetY,
      }),
      [
        tilingCtl.frameRepeatX,
        tilingCtl.frameRepeatY,
        tilingCtl.Rotation,
        tilingCtl.OffsetX,
        tilingCtl.OffsetY,
      ],
    );

    const poleRepeat: RepeatSettings = useMemo(
      () => ({
        repeatX: tilingCtl.poleRepeatX,
        repeatY: tilingCtl.poleRepeatY * poleCtl.textureRepeat,
        rotation: tilingCtl.Rotation,
        offsetX: tilingCtl.OffsetX,
        offsetY: tilingCtl.OffsetY,
      }),
      [
        tilingCtl.poleRepeatX,
        tilingCtl.poleRepeatY,
        poleCtl.textureRepeat,
        tilingCtl.Rotation,
        tilingCtl.OffsetX,
        tilingCtl.OffsetY,
      ],
    );

    /* ---- textures: rusted green metal frame, pole, posters ---- */
    const frameMaps = usePbrMaps(
      "/textures/frame",
      frameRepeat,
      "#8090ff",
      "#5e6e52",
    );
    const poleMaps = usePbrMaps(
      "/textures/pole",
      poleRepeat,
      "#8090ff",
      "#6b6f66",
    );

    const swapped = posterCtl.swapImages;
    const frontImagePath = swapped ? posterCtl.backImage : posterCtl.frontImage;
    const backImagePath = swapped ? posterCtl.frontImage : posterCtl.backImage;

    // Note: these are deliberately NOT tagged as sRGB color-managed. The
    // poster shader is a flat, unlit "display the image as authored" pass —
    // tagging them sRGB makes the GPU linearize on sample (correct for lit/
    // PBR materials), but since this shader writes straight to gl_FragColor
    // with no linear->sRGB step back out, that made the artwork look washed
    // out and dark. Leaving them untagged keeps the source image faithful.
    //
    // Each path can point to either a still image or a video file (.mp4,
    // .webm, .mov, etc.) — useMediaTexture detects which and handles it
    // accordingly. Videos autoplay muted and loop continuously.
    const frontTexture = useMediaTexture(frontImagePath, "#c94f4f");
    const backTexture = useMediaTexture(backImagePath, "#4f7fc9");

    const { material: frontMaterial, uniforms: frontUniforms } =
      usePosterMaterial(frontTexture);
    const { material: backMaterial, uniforms: backUniforms } =
      usePosterMaterial(backTexture);

    useEffect(() => {
      frontUniforms.brightness.value = posterCtl.frontBrightness;
      frontUniforms.contrast.value = posterCtl.contrast;
      frontUniforms.saturation.value = posterCtl.saturation;
      frontUniforms.opacity.value = posterCtl.frontOpacity;
    }, [
      frontUniforms,
      posterCtl.frontBrightness,
      posterCtl.contrast,
      posterCtl.saturation,
      posterCtl.frontOpacity,
    ]);

    useEffect(() => {
      backUniforms.brightness.value = posterCtl.backBrightness;
      backUniforms.contrast.value = posterCtl.contrast;
      backUniforms.saturation.value = posterCtl.saturation;
      backUniforms.opacity.value = posterCtl.backOpacity;
    }, [
      backUniforms,
      posterCtl.backBrightness,
      posterCtl.contrast,
      posterCtl.saturation,
      posterCtl.backOpacity,
    ]);

    /* ---- frame material (memoized, disposed on change) ---- */
    const frameMaterial = useMemo(() => {
      const mat = new THREE.MeshPhysicalMaterial({
        map: frameMaps.map,
        roughnessMap: frameMaps.roughnessMap,
        normalMap: frameMaps.normalMap,
        bumpMap: frameMaps.bumpMap,
        metalness: frameMatCtl.metalness,
        roughness: frameMatCtl.roughness,
        clearcoat: frameMatCtl.clearcoat,
        clearcoatRoughness: frameMatCtl.clearcoatRoughness,
        bumpScale: frameMatCtl.bumpScale,
        envMapIntensity: frameMatCtl.envMapIntensity,
        color: new THREE.Color(frameMatCtl.colorTint),
        wireframe: wireframeCtl.wireframe,
      });
      mat.normalScale.set(frameMatCtl.normalScale, frameMatCtl.normalScale);
      return mat;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      frameMaps,
      frameMatCtl.metalness,
      frameMatCtl.roughness,
      frameMatCtl.clearcoat,
      frameMatCtl.clearcoatRoughness,
      frameMatCtl.bumpScale,
      frameMatCtl.normalScale,
      frameMatCtl.envMapIntensity,
      frameMatCtl.colorTint,
      wireframeCtl.wireframe,
    ]);
    useEffect(() => () => frameMaterial.dispose(), [frameMaterial]);

    /* ---- pole material ---- */
    const poleMaterial = useMemo(() => {
      const mat = new THREE.MeshStandardMaterial({
        map: poleMaps.map,
        roughnessMap: poleMaps.roughnessMap,
        normalMap: poleMaps.normalMap,
        bumpMap: poleMaps.bumpMap,
        metalnessMap: poleMaps.metalnessMap,

        metalness: frameMatCtl.poleMetalness,
        roughness: frameMatCtl.poleRoughness,

        bumpScale: frameMatCtl.poleBumpScale,

        color: new THREE.Color(frameMatCtl.poleColorTint),

        wireframe: wireframeCtl.wireframe,
      });

      return mat;
    }, [
      poleMaps,
      frameMatCtl.poleMetalness,
      frameMatCtl.poleRoughness,
      frameMatCtl.poleBumpScale,
      frameMatCtl.poleColorTint,
      wireframeCtl.wireframe,
    ]);
    useEffect(() => () => poleMaterial.dispose(), [poleMaterial]);

    /* ---- bracket / support material (shares frame look, flat) ---- */
    const supportMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(frameMatCtl.colorTint).multiplyScalar(0.85),
          metalness: 0.8,
          roughness: 0.55,
          wireframe: wireframeCtl.wireframe,
        }),
      [frameMatCtl.colorTint, wireframeCtl.wireframe],
    );
    useEffect(() => () => supportMaterial.dispose(), [supportMaterial]);

    const boltMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: "#3b3b3b",
          metalness: 0.9,
          roughness: 0.35,
        }),
      [],
    );
    useEffect(() => () => boltMaterial.dispose(), [boltMaterial]);

    /* ---- geometry: four frame bars forming a rectangular border ---- */
    const {
      width,
      height,
      thickness,
      frameWidth,
      frameDepth,
      cornerRadius,
      posterDepth,
      posterGap,
    } = dims;

    const frameBars = useMemo(() => {
      const halfW = width / 2;
      const halfH = height / 2;
      const bars: {
        size: [number, number, number];
        position: [number, number, number];
      }[] = [
        // top
        {
          size: [width + frameWidth, frameWidth, frameDepth],
          position: [0, halfH, 0],
        },
        // bottom
        {
          size: [width + frameWidth, frameWidth, frameDepth],
          position: [0, -halfH, 0],
        },
        // left
        {
          size: [frameWidth, height + frameWidth, frameDepth],
          position: [-halfW, 0, 0],
        },
        // right
        {
          size: [frameWidth, height + frameWidth, frameDepth],
          position: [halfW, 0, 0],
        },
      ];
      return bars;
    }, [width, height, frameWidth, frameDepth]);

    const innerLipSize: [number, number, number] = useMemo(
      () => [
        width - frameWidth * 0.4,
        height - frameWidth * 0.4,
        frameDepth * 0.4,
      ],
      [width, height, frameWidth, frameDepth],
    );

    /* ---- rear support truss & brackets ---- */
    const braceLength = useMemo(
      () => Math.sqrt((width / 2) ** 2 + (height / 2) ** 2),
      [width, height],
    );

    /* Rear bracing must sit comfortably *toward the center* — between the
     * front and back posters — so that whichever poster a viewer is looking
     * at is always the closest surface and hides the truss behind it. (An
     * earlier pass here pushed the truss further outward past the back
     * poster instead, which actually put it closer to a viewer standing
     * behind the board than the poster itself — backwards.) A tiny gap is
     * also below the depth buffer's practical precision at this scale, so a
     * real safety margin is used rather than a hairline offset. */
    const backPosterZ = -(thickness / 2 + posterDepth / 2 + posterGap);
    const supportSafetyMargin = 0.05;
    const supportZ = useMemo(
      () => backPosterZ + supportSafetyMargin + supportCtl.depth / 2,
      [backPosterZ, supportSafetyMargin, supportCtl.depth],
    );

    /* ---- imperative handle for future GSAP integration ---- */
    const groupRef = useRef<THREE.Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        group: groupRef.current,
        frontMaterial,
        backMaterial,
        frontUniforms,
        backUniforms,
      }),
      [frontMaterial, backMaterial, frontUniforms, backUniforms],
    );

    /* ---- frame mount height ----
     * The pole's round shaft always terminates at (and tucks slightly into)
     * the bottom-back of the frame — it never reaches anywhere near the top.
     * This isn't a clamp or a fraction that can break with different slider
     * values; it's true by construction, the same way a real billboard pole
     * only carries the sign from below while a separate rear lattice/truss
     * (already modeled below) bridges up the back for rigidity. */
    const poleEmbed = frameWidth * 0.5; // how far the pole tucks into the bottom bar
    const frameMountY = useMemo(
      () => poleCtl.height - poleEmbed + height / 2,
      [poleCtl.height, poleEmbed, height],
    );

    return (
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scale}
        visible={visible}
      >
        {/* ---------- Frame ---------- */}
        <group position={[0, frameMountY, 0]}>
          {frameBars.map((bar, i) => (
            <RoundedBox
              key={i}
              args={bar.size}
              radius={Math.min(cornerRadius, Math.min(...bar.size) * 0.3)}
              smoothness={4}
              position={bar.position}
              material={frameMaterial}
              castShadow
              receiveShadow
            />
          ))}

          {/* inner frame lip, sits just behind the posters */}
          <RoundedBox
            args={innerLipSize}
            radius={Math.min(cornerRadius * 0.6, 0.03)}
            smoothness={4}
            position={[0, 0, -frameDepth * 0.2]}
            material={frameMaterial}
            castShadow
            receiveShadow
          />

          {/* bolts around the frame perimeter */}
          <BoltField
            width={width}
            height={height}
            frameWidth={frameWidth}
            depth={frameDepth}
            material={boltMaterial}
          />

          {/* ---------- Poster panels (independent front/back) ---------- */}
          <PosterPanel
            width={width - frameWidth}
            height={height - frameWidth}
            z={thickness / 2 + posterDepth / 2 + posterGap}
            rotationY={0}
            material={frontMaterial}
          />
          <PosterPanel
            width={width - frameWidth}
            height={height - frameWidth}
            z={-(thickness / 2 + posterDepth / 2 + posterGap)}
            rotationY={Math.PI}
            material={backMaterial}
          />

          {/* ---------- Rear support truss ---------- */}
          {supportCtl.enableSupports && (
            <group position={[0, 0, supportZ]}>
              {/* horizontal brace */}
              <mesh material={supportMaterial} castShadow receiveShadow>
                <boxGeometry
                  args={[width * 0.9, supportCtl.thickness, supportCtl.depth]}
                />
              </mesh>
              {/* mounting bracket connecting truss to pole — shares the
                  truss group's already-safe depth, no extra z push */}
              <mesh
                position={[0, -0.1, 0]}
                material={supportMaterial}
                castShadow
                receiveShadow
              >
                <boxGeometry
                  args={[
                    supportCtl.width * 2.4,
                    supportCtl.width * 2.4,
                    supportCtl.depth * 1.6,
                  ]}
                />
              </mesh>
            </group>
          )}

          {supportCtl.enableRearBraces && (
            <group position={[0, 0, supportZ]}>
              {/* two diagonal braces forming an X */}
              <mesh
                rotation={[0, 0, Math.atan2(height, width)]}
                material={supportMaterial}
                castShadow
                receiveShadow
              >
                <cylinderGeometry
                  args={[
                    supportCtl.thickness / 2,
                    supportCtl.thickness / 2,
                    braceLength,
                    8,
                  ]}
                />
              </mesh>
              <mesh
                rotation={[0, 0, -Math.atan2(height, width)]}
                material={supportMaterial}
                castShadow
                receiveShadow
              >
                <cylinderGeometry
                  args={[
                    supportCtl.thickness / 2,
                    supportCtl.thickness / 2,
                    braceLength,
                    8,
                  ]}
                />
              </mesh>
            </group>
          )}
        </group>

        {/* ---------- Pole ---------- */}
        <group
          position={poleCtl.position}
          rotation={poleCtl.rotation}
          scale={poleCtl.scale}
        >
          <mesh
            position={[0, poleCtl.height / 2, 0]}
            material={poleMaterial}
            castShadow
            receiveShadow
          >
            <cylinderGeometry
              args={[
                poleCtl.radius,
                poleCtl.radius * 1.05,
                poleCtl.height,
                poleCtl.segments,
              ]}
            />
          </mesh>

          {/* base connection plate */}
          <mesh
            position={[0, 0.02, 0]}
            material={supportMaterial}
            castShadow
            receiveShadow
          >
            <cylinderGeometry
              args={[poleCtl.radius * 3.2, poleCtl.radius * 3.4, 0.04, 24]}
            />
          </mesh>

          {/* base plate bolts */}
          <group position={[0, 0.045, 0]}>
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const r = poleCtl.radius * 2.7;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}
                  material={boltMaterial}
                  castShadow
                >
                  <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
                </mesh>
              );
            })}
          </group>
        </group>

        {/* ---------- Debug helpers ---------- */}
        {wireframeCtl.axes && (
          <axesHelper args={[Math.max(width, height, poleCtl.height)]} />
        )}
        {wireframeCtl.boundingBox && <BoundingBoxHelper targetRef={groupRef} />}
      </group>
    );
  },
);

export { BillboardMesh };

/* -------------------------------------------------------------------------- */
/*  Bounding box debug helper                                                 */
/* -------------------------------------------------------------------------- */

function BoundingBoxHelper({
  targetRef,
}: {
  targetRef: React.RefObject<THREE.Object3D | null>;
}) {
  const helperRef = useRef<THREE.BoxHelper | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (!targetRef.current) return;
    const helper = new THREE.BoxHelper(targetRef.current, 0xffaa00);
    helperRef.current = helper;
    scene.add(helper);
    return () => {
      scene.remove(helper);
      helper.dispose();
    };
  }, [targetRef, scene]);

  useFrame(() => {
    helperRef.current?.update();
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Scene contents — lighting, environment, camera, grid                     */
/* -------------------------------------------------------------------------- */

function SceneContents({
  billboardRef,
}: {
  billboardRef: React.RefObject<BillboardImperativeHandle | null>;
}) {
  const lightingCtl = useControls("Lighting", {
    ambientIntensity: { value: 0.35, min: 0, max: 2, step: 0.01 },
    directionalIntensity: { value: 1.4, min: 0, max: 5, step: 0.05 },
    fillLight: { value: 0.4, min: 0, max: 3, step: 0.05 },
    rimLight: { value: 0.6, min: 0, max: 3, step: 0.05 },
    hdrIntensity: { value: 1, min: 0, max: 3, step: 0.05 },
    exposure: { value: 1.1, min: 0.1, max: 3, step: 0.05 },
    shadowBias: { value: -0.0005, min: -0.01, max: 0.01, step: 0.0001 },
  });

  const cameraCtl = useControls("Camera", {
    position: { value: [4.5, 2.2, 6] as [number, number, number] },
    rotation: { value: [0, 0, 0] as [number, number, number] },
    target: { value: [0, 1.6, 0] as [number, number, number] },
    fov: { value: 42, min: 10, max: 100, step: 1 },
    zoom: { value: 1, min: 0.2, max: 3, step: 0.05 },
    Interaction: folder({
      controlsEnabled: { value: true, label: "Enable Controls" },
      enableZoom: { value: true, label: "Zoom" },
      enableRotate: { value: true, label: "Rotate" },
      enablePan: { value: true, label: "Pan" },
    }),
  });

  const debugCtl = useControls("Debug", {
    helpers: false,
    grid: false,
  });

  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = lightingCtl.exposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, lightingCtl.exposure]);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={cameraCtl.position}
        rotation={cameraCtl.rotation}
        fov={cameraCtl.fov}
        zoom={cameraCtl.zoom}
      />
      <OrbitControls
        target={cameraCtl.target}
        enabled={cameraCtl.controlsEnabled}
        enableZoom={cameraCtl.enableZoom}
        enableRotate={cameraCtl.enableRotate}
        enablePan={cameraCtl.enablePan}
        enableDamping
      />

      <ambientLight intensity={lightingCtl.ambientIntensity} />
      <directionalLight
        ref={dirLightRef}
        position={[5, 6, 4]}
        intensity={lightingCtl.directionalIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={lightingCtl.shadowBias}
      />
      {/* fill light, softens shadow side */}
      <directionalLight
        position={[-4, 2, -3]}
        intensity={lightingCtl.fillLight}
      />
      {/* rim light, separates silhouette from background */}
      <directionalLight
        position={[0, 3, -6]}
        intensity={lightingCtl.rimLight}
      />

      {/* Procedural environment map — built entirely from in-scene light
          panels, so there is no network fetch (no remote .hdr file) and the
          billboard still gets soft, realistic reflections/lighting. */}
      <Environment
        resolution={256}
        environmentIntensity={lightingCtl.hdrIntensity}
      >
        <Lightformer
          intensity={2.5}
          color="#ffffff"
          position={[0, 6, -6]}
          scale={[12, 6, 1]}
        />
        <Lightformer
          intensity={1.2}
          color="#bcd4ff"
          position={[-6, 3, 4]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[6, 6, 1]}
        />
        <Lightformer
          intensity={1.2}
          color="#ffdfb0"
          position={[6, 3, 4]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[6, 6, 1]}
        />
        <Lightformer
          intensity={0.6}
          color="#ffffff"
          position={[0, -5, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
      </Environment>

      {debugCtl.grid && <Grid args={[20, 20]} position={[0, 0.001, 0]} />}
      {debugCtl.helpers && dirLightRef.current && (
        <primitive
          object={new THREE.DirectionalLightHelper(dirLightRef.current, 1)}
        />
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial opacity={0.25} />
      </mesh>

      <BillboardMesh ref={billboardRef} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top-level Billboard — owns its own Canvas, fully independent              */
/* -------------------------------------------------------------------------- */

export interface BillboardProps {
  /** Height of the fixed background canvas. Stays pinned to the viewport at
   *  this size regardless of how tall `children` is. Defaults to '100vh'. */
  height?: string;
  /** Show the Leva control panel. Defaults to true; set false in production. */
  showControls?: boolean;
  className?: string;
  /** Scrollable page content rendered *over* the fixed canvas. Can be taller
   *  than the canvas — the canvas stays put as this scrolls past it. */
  children?: React.ReactNode;
}

export default function Billboard({
  height = "100vh",
  showControls = true,
  className,
  children,
}: BillboardProps) {
  const billboardRef = useRef<BillboardImperativeHandle>(null);

  return (
    <div className={className} style={{ position: "relative" }}>
      <Leva hidden={!showControls} collapsed />

      {/* Pinned background canvas — fixed to the viewport, always `height`
          tall, stays in place while the content below scrolls over it. */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height,
          zIndex: 0,
        }}
      >
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ position: [4.5, 2.2, 6], fov: 42 }}
          style={{ background: "transparent" }}
        >
          <Bvh>
            <AdaptiveDpr pixelated={false} />
            <AdaptiveEvents />
            <SceneContents billboardRef={billboardRef} />
          </Bvh>
        </Canvas>
      </div>

      {/* Scrollable content — can be any height, sits above the canvas. */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Future roadmap notes (architecture only — not implemented here)          */
/* -------------------------------------------------------------------------- */
//
// Scroll-driven cinematic sequencing (GSAP) will eventually:
//   - move/rotate/scale the billboard      -> tween billboardRef.current.group
//   - swap front/back artwork               -> update frontUniforms/backUniforms.map.value
//                                               (load a new THREE.Texture and assign it)
//   - fade panels in/out                    -> tween *Uniforms.opacity.value
//   - move the camera / change environment  -> lift camera + Environment intensity
//                                               state up to a parent that both this
//                                               component and a ScrollTrigger timeline
//                                               can read from (e.g. via a shared store
//                                               or by passing camera/env props down
//                                               instead of using internal Leva state
//                                               in production).
//
// To wire this up later:
//   1. Replace the Leva-driven camera/lighting values in `SceneContents` with
//      props/context once GSAP needs to own them.
//   2. Keep `BillboardMesh`'s forwardRef contract stable — GSAP only needs
//      `group`, `frontUniforms`, and `backUniforms`.
//   3. Mount this component inside the future fullscreen background canvas by
//      reusing `BillboardMesh` + `SceneContents` directly rather than the
//      default-exported `<Billboard />` wrapper (which owns its own Canvas).
