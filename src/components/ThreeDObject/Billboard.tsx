"use client";

/**
 * Billboard.tsx — PERFORMANCE-OPTIMIZED
 * ---------------------------------------------------------------------------
 * Same procedural 3D billboard, same public API (BillboardMesh, Billboard,
 * BillboardImperativeHandle, BillboardMeshProps, BillboardProps) — only the
 * internals changed. See the "OPTIMIZATION NOTES" comments throughout for
 * what changed and why.
 *
 * High-level summary of what was slow and what changed:
 *
 *  LOAD TIME
 *   1. Every texture call created its own `new THREE.TextureLoader()` with
 *      no shared cache → duplicate work and no de-dupe across mounts.
 *      Fixed: one shared loader + THREE.Cache enabled.
 *   2. Frame & pole each loaded 5 PBR maps (basecolor/roughness/normal/
 *      height/metalness) = 10 texture fetches just for metal bars + pole.
 *      `height.jpg` (bumpMap) is redundant once a normalMap is present and
 *      was cut — saves 2 full texture downloads + a shader pass.
 *   3. `Environment` was pulling a 4K HDR file. 4K HDRs are typically
 *      several MB+ and are massive overkill for a blurry IBL reflection on
 *      a metal frame. This is the single biggest "load fast" win available
 *      — see the note above the `<Environment>` call for what to do with
 *      the actual asset (can't resize a binary file from here).
 *   4. Leva panel is still gated behind `showControls`, but now the float
 *      panel component itself isn't mounted at all when controls are off
 *      (previously it rendered hidden, which still costs DOM/JS).
 *
 *  RUNTIME (FPS)
 *   1. `shadows={{ type: PCFShadowMap }}` was enabled on the Canvas and
 *      ~15 meshes had `castShadow`/`receiveShadow` — but every directional
 *      light that would actually cast a shadow was commented out. Result:
 *      the renderer was paying for shadow-map render targets and per-mesh
 *      shadow draw calls that produced zero visible shadows. Removed all
 *      of that dead weight; instructions left for re-enabling it cleanly
 *      if/when a real shadow-casting light comes back.
 *   2. Several primitive geometries (pole cylinder, base plate, base
 *      bolts, support truss pieces) were declared inline as JSX
 *      (`<cylinderGeometry args={...} />`) which allocates a brand new
 *      BufferGeometry on every re-render (e.g. every Leva tweak). These are
 *      now memoized and disposed like the rest of the file already does.
 *   3. `RoundedBox` smoothness was 3–4; dropped to 2, which is visually
 *      indistinguishable at this size but roughly halves the extra
 *      bevel geometry for 5 meshes.
 *   4. Anisotropy was 8 on every texture; dropped to 4 (visually fine for
 *      a billboard panel viewed mostly head-on, cheaper per-pixel cost).
 *   5. Canvas `dpr` ceiling lowered from 1.5 → 1.25 (AdaptiveDpr still
 *      handles scaling it down further under load).
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
  Grid,
  AdaptiveDpr,
  AdaptiveEvents,
  Bvh,
} from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useControls, folder, Leva, button } from "leva";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/*  Shared loader + cache                                                     */
/* -------------------------------------------------------------------------- */
// OPTIMIZATION: one TextureLoader for the whole module instead of a fresh
// `new THREE.TextureLoader()` per hook call, plus THREE's built-in cache so
// re-mounting (e.g. fast refresh, route changes) doesn't re-fetch textures
// that are already in memory.
THREE.Cache.enabled = true;
const sharedLoader = new THREE.TextureLoader();

/* -------------------------------------------------------------------------- */
/*  Texture loading with graceful fallbacks                                   */
/* -------------------------------------------------------------------------- */

type FallbackKind = "color" | "gray" | "normal";

const fallbackTextureCache = new Map<string, THREE.Texture>();

/** Builds (and caches) a tiny in-memory texture so the component never
 *  breaks if a real texture/image file hasn't been added to /public yet. */
function makeFallbackTexture(
  kind: FallbackKind,
  hex = "#6b7a63",
): THREE.Texture {
  const cacheKey = `${kind}:${hex}`;
  const cached = fallbackTextureCache.get(cacheKey);
  if (cached) return cached;

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
  // OPTIMIZATION: fallback textures are tiny, static, and shared across every
  // material that needs that fallback kind — never disposed, just reused.
  fallbackTextureCache.set(cacheKey, tex);
  return tex;
}

interface UseSafeTextureOptions {
  fallbackKind: FallbackKind;
  fallbackColor?: string;
  colorSpace?: boolean; // true => sRGB (for base color / poster maps)
  anisotropy?: number;
}

/** Loads a texture by URL using the shared loader/cache. Falls back to a
 *  flat procedural texture instead of throwing/suspending if the file is
 *  missing — keeps the billboard rendering even before real art/textures
 *  are dropped into /public. */
function useSafeTexture(
  url: string | undefined,
  options: UseSafeTextureOptions,
): THREE.Texture {
  const { fallbackKind, fallbackColor, colorSpace, anisotropy = 4 } = options;
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
    let loaded: THREE.Texture | null = null;
    sharedLoader.load(
      url,
      (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        if (colorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = anisotropy;
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
  }, [url, fallback, colorSpace, anisotropy]);

  // Fallback textures are now shared/cached — do not dispose them here.

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
      video.preload = "auto";
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

    let loaded: THREE.Texture | null = null;
    sharedLoader.load(
      url,
      (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        // Deliberately NOT tagged sRGB. The poster shader writes directly to
        // gl_FragColor with no linear→sRGB step, so tagging would cause the
        // GPU to linearize on sample and then ACES+sRGB output would double-
        // darken the image. Leave untagged to display colours as authored.
        tex.anisotropy = 4; // OPTIMIZATION: was 8, halved — poster is viewed
        // nearly head-on so the extra anisotropic samples bought little.
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
  tex.anisotropy = 4; // OPTIMIZATION: was 8
  tex.needsUpdate = true;
}

/* -------------------------------------------------------------------------- */
/*  Poster panel shader material (independent front/back uniforms)           */
/* -------------------------------------------------------------------------- */

const posterVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

// Canvas/vinyl weave grain that simulates ink-on-substrate printing.
// printScale controls fiber density; printStrength controls how visible
// the substrate texture is through the printed image.
const posterFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float brightness;
  uniform float contrast;
  uniform float saturation;
  uniform float opacity;
  uniform float printScale;
  uniform float printStrength;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Woven canvas/vinyl substrate pattern
  float canvasWeave(vec2 uv, float scale) {
    vec2 s = uv * scale;
    float hFiber = abs(fract(s.y) - 0.5) * 2.0;
    float vFiber = abs(fract(s.x) - 0.5) * 2.0;
    float weave = max(
      smoothstep(0.55, 0.75, hFiber),
      smoothstep(0.55, 0.75, vFiber)
    );
    // Micro grain noise per cell to break up uniformity
    float noise = hash(floor(s) * 0.5) * 0.45 + hash(floor(s)) * 0.55;
    return mix(noise * 0.4, weave, 0.65);
  }

  void main() {
    vec4 tex = texture2D(map, vUv);
    vec3 color = tex.rgb * brightness;
    color = (color - 0.5) * contrast + 0.5;
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, saturation);

    // Canvas substrate: very light modulation so the grain reads without
    // pulling down the overall image brightness
    float grain = canvasWeave(vUv, printScale);
    color *= (1.0 - printStrength * 0.08 + grain * printStrength * 0.12);

    // Fresnel-based gloss sheen (printed vinyl has slight specular at grazing angles)
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.5);
    color += fresnel * 0.04;

    // Barely-there vignette — just enough to frame the print edges
    vec2 uvc = vUv * 2.0 - 1.0;
    float vignette = 1.0 - dot(uvc, uvc) * 0.05;
    color *= vignette;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a * opacity);
  }
`;

interface PosterUniforms {
  map: { value: THREE.Texture };
  brightness: { value: number };
  contrast: { value: number };
  saturation: { value: number };
  opacity: { value: number };
  printScale: { value: number };
  printStrength: { value: number };
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
      printScale: { value: 180 },
      printStrength: { value: 0.35 },
    }),
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
// OPTIMIZATION: dropped `height.jpg` (bumpMap). A normalMap already carries
// the fine surface detail a bumpMap would add here, so loading + sampling a
// second greyscale "height" texture per material (2 full HTTP requests +
// an extra texture unit + extra shader math) was paying twice for a very
// similar visual result. If you specifically need bumpMap-driven silhouette
// displacement later, it's easy to add back — see `usePbrMaps` below.

interface PbrMaps {
  map: THREE.Texture;
  roughnessMap: THREE.Texture;
  normalMap: THREE.Texture;
  metalnessMap: THREE.Texture;
}

function usePbrMaps(
  basePath: string,
  repeat: RepeatSettings,
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
  const metalnessMap = useSafeTexture(`${basePath}/metalness.jpg`, {
    fallbackKind: "gray",
  });

  useEffect(() => {
    applyRepeat(map, repeat);
    applyRepeat(roughnessMap, repeat);
    applyRepeat(normalMap, repeat);
    applyRepeat(metalnessMap, repeat);
  }, [map, roughnessMap, normalMap, repeat, metalnessMap]);

  return { map, roughnessMap, normalMap, metalnessMap };
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
  // OPTIMIZATION: 6-sided cylinder is already cheap; left as-is, but
  // memoized + disposed (previously had no cleanup at all).
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.025, 0.025, 0.04, 6),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

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

  camera: THREE.PerspectiveCamera | null;

  orbit: OrbitControlsImpl | null;

  frontMaterial: THREE.ShaderMaterial | null;
  backMaterial: THREE.ShaderMaterial | null;

  frontUniforms: PosterUniforms | null;
  backUniforms: PosterUniforms | null;
}

export interface BillboardMeshProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  visible?: boolean;
  frontImage?: string;
  backImage?: string;
  /** Force wireframe on all materials — driven by SceneContents debug toggle */
  wireframe?: boolean;
  cameraRef?: React.RefObject<THREE.PerspectiveCamera>;
}

const BillboardMesh = forwardRef<BillboardImperativeHandle, BillboardMeshProps>(
  function BillboardMesh(props, ref) {
    const {
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      visible = true,
      wireframe: wireframeProp = false,
      cameraRef,
      orbitRef,
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
      segments: { value: 16, min: 6, max: 48, step: 1 }, // OPTIMIZATION: was 20
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

    /* ---- Leva: Posters ---- */
    const posterCtl = useControls("Posters", {
      frontImage: {
        value: props.frontImage ?? "/homepage/herosection/1.png",
        label: "Front Image/Video",
      },
      backImage: {
        // Default back to kp.png (logo/brand); or same as front if neither provided
        value: props.backImage ?? "/homepage/herosection/kp.png",
        label: "Back Image/Video",
      },
      frontBrightness: { value: 1.4, min: 0, max: 3, step: 0.01 },
      backBrightness: { value: 1.4, min: 0, max: 3, step: 0.01 },
      frontOpacity: { value: 1, min: 0, max: 1, step: 0.01 },
      backOpacity: { value: 1, min: 0, max: 1, step: 0.01 },
      contrast: { value: 1, min: 0, max: 2, step: 0.01 },
      saturation: { value: 1, min: 0, max: 2, step: 0.01 },
      swapImages: false,
      printScale: {
        value: 180,
        min: 40,
        max: 600,
        step: 10,
        label: "Canvas Grain Scale",
      },
      printStrength: {
        value: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
        label: "Print Texture Strength",
      },
    });

    /* ---- Leva: Materials ---- */
    const frameMatCtl = useControls("Materials", {
      Frame: folder({
        metalness: { value: 0.75, min: 0, max: 1, step: 0.01 },
        roughness: { value: 0.65, min: 0, max: 1, step: 0.01 },
        // Low clearcoat = natural weathered steel, not plastic/chrome
        clearcoat: { value: 0.04, min: 0, max: 1, step: 0.01 },
        clearcoatRoughness: { value: 0.5, min: 0, max: 1, step: 0.01 },
        normalScale: { value: 1.2, min: 0, max: 3, step: 0.05 },
        envMapIntensity: { value: 0.7, min: 0, max: 5, step: 0.05 },
        colorTint: "#8a9e84",
      }),
      Pole: folder({
        poleMetalness: { value: 0.3, min: 0, max: 1, step: 0.01 },
        poleRoughness: { value: 0.85, min: 0, max: 1, step: 0.01 },
        poleColorTint: "#7a7a7a",
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
      // wireframe is also driven by the prop from SceneContents' debug toggle
      wireframe: wireframeProp,
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
    const frameMaps = usePbrMaps("/textures/frame", frameRepeat, "#5e6e52");
    const poleMaps = usePbrMaps("/textures/pole", poleRepeat, "#6b6f66");

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
      frontUniforms.printScale.value = posterCtl.printScale;
      frontUniforms.printStrength.value = posterCtl.printStrength;
    }, [
      frontUniforms,
      posterCtl.frontBrightness,
      posterCtl.contrast,
      posterCtl.saturation,
      posterCtl.frontOpacity,
      posterCtl.printScale,
      posterCtl.printStrength,
    ]);

    useEffect(() => {
      backUniforms.brightness.value = posterCtl.backBrightness;
      backUniforms.contrast.value = posterCtl.contrast;
      backUniforms.saturation.value = posterCtl.saturation;
      backUniforms.opacity.value = posterCtl.backOpacity;
      backUniforms.printScale.value = posterCtl.printScale;
      backUniforms.printStrength.value = posterCtl.printStrength;
    }, [
      backUniforms,
      posterCtl.backBrightness,
      posterCtl.contrast,
      posterCtl.saturation,
      posterCtl.backOpacity,
      posterCtl.printScale,
      posterCtl.printStrength,
    ]);

    /* ---- frame material (memoized, disposed on change) ---- */
    const frameMaterial = useMemo(() => {
      const mat = new THREE.MeshPhysicalMaterial({
        map: frameMaps.map,
        roughnessMap: frameMaps.roughnessMap,
        normalMap: frameMaps.normalMap,
        metalness: frameMatCtl.metalness,
        roughness: frameMatCtl.roughness,
        clearcoat: frameMatCtl.clearcoat,
        clearcoatRoughness: frameMatCtl.clearcoatRoughness,
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
        metalnessMap: poleMaps.metalnessMap,
        metalness: frameMatCtl.poleMetalness,
        roughness: frameMatCtl.poleRoughness,
        color: new THREE.Color(frameMatCtl.poleColorTint),
        wireframe: wireframeCtl.wireframe,
      });

      return mat;
    }, [
      poleMaps,
      frameMatCtl.poleMetalness,
      frameMatCtl.poleRoughness,
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
     * at is always the closest surface and hides the truss behind it. A
     * real safety margin is used rather than a hairline offset, since a
     * tiny gap is below the depth buffer's practical precision at this
     * scale. */
    const backPosterZ = -(thickness / 2 + posterDepth / 2 + posterGap);
    const supportSafetyMargin = 0.05;
    const supportZ = useMemo(
      () => backPosterZ + supportSafetyMargin + supportCtl.depth / 2,
      [backPosterZ, supportSafetyMargin, supportCtl.depth],
    );

    /* ---- imperative handle for future GSAP integration ---- */
    const groupRef = useRef<THREE.Group>(null);
    useLayoutEffect(() => {
      if (!groupRef.current) return;

      groupRef.current.scale.set(0, 0, 0);
    });
    useImperativeHandle(
      ref,
      () => ({
        group: groupRef.current,

        camera: cameraRef?.current ?? null,

        orbit: orbitRef?.current ?? null,

        frontMaterial,
        backMaterial,

        frontUniforms,
        backUniforms,
      }),
      [frontMaterial, backMaterial, frontUniforms, backUniforms],
    );

    /* ---- frame mount height & vertical centering ----
     * Pole base sits at y=0. Frame top = poleHeight - poleEmbed + height + frameWidth/2.
     * centerOffsetY shifts everything down so the model's geometric center
     * lands exactly at the group's origin — position [0,0,0] = model center. */
    const poleEmbed = frameWidth * 0.5;
    const frameMountY = useMemo(
      () => poleCtl.height - poleEmbed + height / 2,
      [poleCtl.height, poleEmbed, height],
    );
    // Total model height: from pole base (y=0) to top of frame border
    const totalModelHeight = useMemo(
      () => poleCtl.height - poleEmbed + height + frameWidth / 2,
      [poleCtl.height, poleEmbed, height, frameWidth],
    );
    const centerOffsetY = -totalModelHeight / 2;

    /* ---- OPTIMIZATION: previously-inline primitive geometries are now
     * memoized + disposed, so a Leva tweak / re-render doesn't allocate a
     * brand-new BufferGeometry for the pole, base plate, base bolts, and
     * support truss pieces every single time. ---- */
    const poleGeometry = useMemo(
      () =>
        new THREE.CylinderGeometry(
          poleCtl.radius,
          poleCtl.radius * 1.05,
          poleCtl.height,
          poleCtl.segments,
        ),
      [poleCtl.radius, poleCtl.height, poleCtl.segments],
    );
    useEffect(() => () => poleGeometry.dispose(), [poleGeometry]);

    const basePlateGeometry = useMemo(
      () =>
        new THREE.CylinderGeometry(
          poleCtl.radius * 3.2,
          poleCtl.radius * 3.4,
          0.04,
          24,
        ),
      [poleCtl.radius],
    );
    useEffect(() => () => basePlateGeometry.dispose(), [basePlateGeometry]);

    const baseBoltGeometry = useMemo(
      () => new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8),
      [],
    );
    useEffect(() => () => baseBoltGeometry.dispose(), [baseBoltGeometry]);

    const baseBoltPositions = useMemo(() => {
      const r = poleCtl.radius * 2.7;
      return Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [
          number,
          number,
          number,
        ];
      });
    }, [poleCtl.radius]);

    const trussBarGeometry = useMemo(
      () =>
        new THREE.BoxGeometry(
          width * 0.9,
          supportCtl.thickness,
          supportCtl.depth,
        ),
      [width, supportCtl.thickness, supportCtl.depth],
    );
    useEffect(() => () => trussBarGeometry.dispose(), [trussBarGeometry]);

    const bracketGeometry = useMemo(
      () =>
        new THREE.BoxGeometry(
          supportCtl.width * 2.4,
          supportCtl.width * 2.4,
          supportCtl.depth * 1.6,
        ),
      [supportCtl.width, supportCtl.depth],
    );
    useEffect(() => () => bracketGeometry.dispose(), [bracketGeometry]);

    const braceGeometry = useMemo(
      () =>
        new THREE.CylinderGeometry(
          supportCtl.thickness / 2,
          supportCtl.thickness / 2,
          braceLength,
          8,
        ),
      [supportCtl.thickness, braceLength],
    );
    useEffect(() => () => braceGeometry.dispose(), [braceGeometry]);

    // OPTIMIZATION: RoundedBox smoothness lowered 3/4 → 2. At this scale the
    // extra bevel segments were not visually distinguishable but doubled the
    // triangle count contributed by rounded corners across 5 meshes.
    const ROUNDED_SMOOTHNESS = 2;

    return (
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scale}
        visible={visible}
      >
        {/* Centering wrapper: shifts all geometry so model center = origin */}
        <group position={[0, centerOffsetY, 0]}>
          {/* ---------- Frame ---------- */}
          <group position={[0, frameMountY, 0]}>
            {frameBars.map((bar, i) => (
              <RoundedBox
                key={i}
                args={bar.size}
                radius={Math.min(cornerRadius, Math.min(...bar.size) * 0.3)}
                smoothness={ROUNDED_SMOOTHNESS}
                position={bar.position}
                material={frameMaterial}
              />
            ))}

            {/* inner frame lip, sits just behind the posters */}
            <RoundedBox
              args={innerLipSize}
              radius={Math.min(cornerRadius * 0.6, 0.03)}
              smoothness={ROUNDED_SMOOTHNESS}
              position={[0, 0, -frameDepth * 0.2]}
              material={frameMaterial}
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
                <mesh geometry={trussBarGeometry} material={supportMaterial} />
                {/* mounting bracket connecting truss to pole — shares the
                  truss group's already-safe depth, no extra z push */}
                <mesh
                  position={[0, -0.1, 0]}
                  geometry={bracketGeometry}
                  material={supportMaterial}
                />
              </group>
            )}

            {supportCtl.enableRearBraces && (
              <group position={[0, 0, supportZ]}>
                {/* two diagonal braces forming an X */}
                <mesh
                  rotation={[0, 0, Math.atan2(height, width)]}
                  geometry={braceGeometry}
                  material={supportMaterial}
                />
                <mesh
                  rotation={[0, 0, -Math.atan2(height, width)]}
                  geometry={braceGeometry}
                  material={supportMaterial}
                />
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
              geometry={poleGeometry}
              material={poleMaterial}
            />

            {/* base connection plate */}
            <mesh
              position={[0, 0.02, 0]}
              geometry={basePlateGeometry}
              material={supportMaterial}
            />

            {/* base plate bolts */}
            <group position={[0, 0.045, 0]}>
              {baseBoltPositions.map((p, i) => (
                <mesh
                  key={i}
                  position={p}
                  geometry={baseBoltGeometry}
                  material={boltMaterial}
                />
              ))}
            </group>
          </group>
        </group>{" "}
        {/* end centering wrapper */}
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
  const { camera } = useThree();
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const lightingCtl = useControls("Lighting", {
    ambientIntensity: { value: 0.18, min: 0, max: 2, step: 0.01 },
    hdrIntensity: { value: 0.6, min: 0, max: 3, step: 0.05 },
    exposure: { value: 1.2, min: 0.1, max: 3, step: 0.05 },
  });

  // With centering, model center = y:0, frame board center ≈ y:1.6,
  // pole base ≈ y:-2.9. Camera targets the board face, not the pole base.
  const cameraCtl = useControls("Camera", {
    position: { value: [5.5, 1.2, 9.5] as [number, number, number] },
    rotation: { value: [0, 0, 0] as [number, number, number] },
    target: { value: [0, 0.8, 0] as [number, number, number] },
    fov: { value: 38, min: 10, max: 100, step: 1 },
    zoom: { value: 1, min: 0.2, max: 3, step: 0.05 },
    Interaction: folder({
      controlsEnabled: { value: true, label: "Enable Drag" },
      enableZoom: { value: true, label: "Zoom" },
      enableRotate: { value: true, label: "Rotate" },
      enablePan: { value: true, label: "Pan" },
    }),
    // Copy current live camera position + target to clipboard
    "📋 Copy Current State": button(() => {
      const pos = camera.position;
      const tgt = orbitRef.current?.target ?? new THREE.Vector3();
      const state = {
        cameraPosition: [
          +pos.x.toFixed(3),
          +pos.y.toFixed(3),
          +pos.z.toFixed(3),
        ],
        cameraTarget: [+tgt.x.toFixed(3), +tgt.y.toFixed(3), +tgt.z.toFixed(3)],
        fov: (camera as THREE.PerspectiveCamera).fov,
      };
      navigator.clipboard
        .writeText(JSON.stringify(state, null, 2))
        .then(() => console.info("📋 Camera state copied:", state))
        .catch(() => console.info("📋 Camera state:", state));
    }),
  });

  const debugCtl = useControls("Debug", {
    wireframe: false,
    grid: false,
  });

  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = lightingCtl.exposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, lightingCtl.exposure]);

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

      {/* Ambient — low night-sky base */}
      <ambientLight intensity={lightingCtl.ambientIntensity} color="#c8d8ff" />

      {/*
        OPTIMIZATION / NOTE: every directional light that used to live here
        was commented out, so `shadows` on the <Canvas> and every
        castShadow/receiveShadow flag in this file was pure overhead — the
        renderer was building shadow-map render targets for zero lights
        that actually cast shadows. That dead weight has been removed from
        the Canvas + meshes.

        If/when you bring back a real shadow-casting light (e.g. the key
        light below), re-enable shadows in three places:
          1. <Canvas shadows={{ type: THREE.PCFShadowMap }}>
          2. castShadow on the light itself + shadow-mapSize-* / shadow-camera-* props
          3. castShadow/receiveShadow on the meshes that should participate

        <directionalLight
          position={[2, 6, 5]}
          intensity={lightingCtl.keyLight}
          color="#fff5e0"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
      */}

      {/*
        OPTIMIZATION: this is the single biggest "load fast" lever you can
        pull, and it lives outside this file — in the actual .hdr asset.

        `resolution={64}` below only controls how finely three.js resamples
        the HDR into a PMREM cube map for reflections (cheap either way for
        a blurry metal-frame reflection). The real cost is the network
        download of the source file itself. A "4k" equirectangular HDR is
        typically several MB — for image-based lighting that's only ever
        seen as a soft blurred reflection on a billboard frame, that's a lot
        of bytes paid for detail nobody will see.

        Recommended fix (pick one):
          - Swap the file for a 1k or 2k version of the same HDRI (most HDRI
            sites offer multiple resolutions of the same scene for free).
          - Convert it to a compressed format (e.g. KTX2/Basis via a build
            step) instead of a raw .hdr.
          - Or drop the custom file entirely and use one of drei's built-in
            lightweight presets, e.g. <Environment preset="city" />, which
            ships pre-baked and is dramatically smaller.
      */}
      <Environment
        resolution={64}
        environmentIntensity={lightingCtl.hdrIntensity}
        files="environment/photo_studio_01_4k.hdr"
      />

      {debugCtl.grid && <Grid args={[20, 20]} position={[0, -3, 0]} />}

      <BillboardMesh
        ref={billboardRef}
        cameraRef={cameraRef}
        orbitRef={orbitRef}
        wireframe={debugCtl.wireframe}
      />
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
  /** Show the Leva control panel. Defaults to false; the panel component
   *  isn't mounted at all unless this is true (see OPTIMIZATION below). */
  showControls?: boolean;
  className?: string;
  /** Scrollable page content rendered *over* the fixed canvas. Can be taller
   *  than the canvas — the canvas stays put as this scrolls past it. */
  children?: React.ReactNode;
  onReady?: (billboard: BillboardImperativeHandle) => void;
}

export default function Billboard({
  height = "100vh",
  showControls = false,
  className,
  children,
  onReady,
}: BillboardProps) {
  const internalRef = useRef<BillboardImperativeHandle>(null);

  useEffect(() => {
    if (internalRef.current && onReady) {
      onReady(internalRef.current);
    }
  }, [onReady]);

  // Fade in once the scene has rendered its first frame — avoids the flash
  // of fallback colours while textures and geometry compile on the GPU.
  const [visible, setVisible] = useState(false);

  return (
    <div className={className} style={{ position: "relative" }}>
      {/* OPTIMIZATION: previously always mounted `<Leva hidden={!showControls} />`,
          so the panel's DOM/JS existed even when nobody could see it. Now it
          isn't mounted at all unless explicitly requested. */}
      {showControls && <Leva collapsed />}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height,
          zIndex: 0,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        <Canvas
          dpr={[1, 1.25]} // OPTIMIZATION: was [1, 1.5]
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ position: [5.5, 1.2, 9.5], fov: 38 }}
          style={{ background: "transparent" }}
          // Reveal the canvas once the first frame is drawn
          onCreated={() => {
            // Wait two rAF ticks so textures have started uploading to GPU
            requestAnimationFrame(() =>
              requestAnimationFrame(() => setVisible(true)),
            );
          }}
        >
          <Bvh>
            <AdaptiveDpr pixelated={false} />
            <AdaptiveEvents />
            <SceneContents billboardRef={internalRef} />
          </Bvh>
        </Canvas>
      </div>

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
//
//
//         in production).
//
// To wire this up later:
//   1. Replace the Leva-driven camera/lighting values in `SceneContents` with
//      props/context once GSAP needs to own them.
//   2. Keep `BillboardMesh`'s forwardRef contract stable — GSAP only needs
//      `group`, `frontUniforms`, and `backUniforms`.
//   3. Mount this component inside the future fullscreen background canvas by
//      reusing `BillboardMesh` + `SceneContents` directly rather than the
//      default-exported `<Billboard />` wrapper (which owns its own Canvas).
//
// ADDITIONAL LOAD-TIME LEVER (not done here, needs the host page):
//   This component pulls in three.js + @react-three/fiber + drei + leva,
//   which is a meaningfully sized JS bundle. If Billboard isn't needed on
//   first paint, code-split it at the import site:
//
//     const Billboard = dynamic(() => import('@/components/Billboard'), {
//       ssr: false,
//     });
//
//   That defers downloading/parsing all of the above until this component
//   is actually rendered, instead of bundling it into the initial page load.
