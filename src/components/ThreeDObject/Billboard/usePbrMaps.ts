"use client";

/**
 * usePbrMaps.ts — Texture loading utilities and the usePbrMaps hook.
 *
 * All texture work lives here:
 *  - A shared TextureLoader + THREE.Cache so re-mounts don't re-fetch.
 *  - makeFallbackTexture: tiny in-memory texture so the scene renders even
 *    before real art files exist in /public.
 *  - useSafeTexture: loads a URL, falls back gracefully on error.
 *  - useMediaTexture: same as above but also handles video files (.mp4, etc.).
 *  - applyRepeat: applies tiling/offset settings to a loaded texture.
 *  - usePbrMaps: loads all four PBR maps (basecolor, roughness, normal, metalness)
 *    from a single base path.
 */

import { useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { FallbackKind, RepeatSettings, PbrMaps } from "./types";

/* -------------------------------------------------------------------------- */
/*  Shared loader + cache                                                      */
/* -------------------------------------------------------------------------- */

// One shared loader for the whole module so re-mounting doesn't re-fetch
// textures that are already in memory.
THREE.Cache.enabled = true;
export const sharedLoader = new THREE.TextureLoader();

/* -------------------------------------------------------------------------- */
/*  Fallback textures                                                          */
/* -------------------------------------------------------------------------- */

const fallbackTextureCache = new Map<string, THREE.Texture>();

// Builds (and caches) a tiny procedural texture so the billboard never
// breaks if a real file hasn't been added to /public yet.
function makeFallbackTexture(kind: FallbackKind, hex = "#6b7a63"): THREE.Texture {
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
      ctx.fillStyle = "rgb(128,128,255)"; // flat normal pointing +Z
    } else if (kind === "gray") {
      ctx.fillStyle = "rgb(140,140,140)";
    } else {
      ctx.fillStyle = hex;
    }
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  // Fallback textures are tiny, static, and shared — never disposed.
  fallbackTextureCache.set(cacheKey, tex);
  return tex;
}

/* -------------------------------------------------------------------------- */
/*  useSafeTexture                                                             */
/* -------------------------------------------------------------------------- */

interface UseSafeTextureOptions {
  fallbackKind: FallbackKind;
  fallbackColor?: string;
  // true = tag as sRGB (use for base color / poster maps, not for PBR data maps)
  colorSpace?: boolean;
  anisotropy?: number;
}

// Loads a texture by URL using the shared loader/cache.
// Falls back to a flat procedural texture on error — keeps the scene rendering
// even before real texture files are in /public.
export function useSafeTexture(
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
        if (disposed) { tex.dispose(); return; }
        if (colorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = anisotropy;
        loaded = tex;
        setTexture(tex);
      },
      undefined,
      () => { if (!disposed) setTexture(fallback); },
    );

    return () => {
      disposed = true;
      if (loaded) loaded.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, fallback, colorSpace, anisotropy]);

  return texture;
}

/* -------------------------------------------------------------------------- */
/*  useMediaTexture — image or video                                           */
/* -------------------------------------------------------------------------- */

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v"];

function isVideoUrl(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

// Loads a poster source that is either a still image or a looping video.
// Videos autoplay muted and loop; images behave like useSafeTexture.
// Falls back to a flat color texture if the file fails to load.
export function useMediaTexture(
  url: string | undefined,
  fallbackColor: string,
): THREE.Texture {
  const fallback = useMemo(
    () => makeFallbackTexture("color", fallbackColor),
    [fallbackColor],
  );

  const [texture, setTexture] = useState<THREE.Texture>(fallback);

  useEffect(() => {
    if (!url) { setTexture(fallback); return; }

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
        // Autoplay can be blocked until a user gesture; the texture still picks
        // up frames as soon as playback starts.
        video.play().catch(() => undefined);
        setTexture(videoTexture);
      };
      const handleError = () => { if (!disposed) setTexture(fallback); };

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

    // Still image path
    let loaded: THREE.Texture | null = null;
    sharedLoader.load(
      url,
      (tex) => {
        if (disposed) { tex.dispose(); return; }
        // Deliberately NOT tagged sRGB. The poster shader writes straight to
        // gl_FragColor with no linear→sRGB conversion, so tagging would cause
        // the GPU to linearise on sample and then double-darken the image.
        tex.anisotropy = 4;
        loaded = tex;
        setTexture(tex);
      },
      undefined,
      () => { if (!disposed) setTexture(fallback); },
    );

    return () => {
      disposed = true;
      if (loaded) loaded.dispose();
    };
  }, [url, fallback]);

  return texture;
}

/* -------------------------------------------------------------------------- */
/*  applyRepeat                                                                */
/* -------------------------------------------------------------------------- */

// Applies UV tiling/offset settings to an already-loaded texture.
export function applyRepeat(tex: THREE.Texture, settings: RepeatSettings): void {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(settings.repeatX, settings.repeatY);
  tex.rotation = settings.rotation ?? 0;
  tex.offset.set(settings.offsetX ?? 0, settings.offsetY ?? 0);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
}

/* -------------------------------------------------------------------------- */
/*  usePbrMaps                                                                 */
/* -------------------------------------------------------------------------- */

// Loads the four PBR maps for a material from a common base path:
//   basePath/basecolor.jpg
//   basePath/roughness.jpg
//   basePath/normal.jpg
//   basePath/metalness.jpg
//
// Note: bumpMap (height.jpg) is intentionally excluded. The normalMap already
// carries fine surface detail — loading a separate height map was paying twice
// for a very similar result (2 extra HTTP requests + shader cost).
export function usePbrMaps(
  basePath: string,
  repeat: RepeatSettings,
  colorFallback: string,
): PbrMaps {
  const map = useSafeTexture(`${basePath}/basecolor.jpg`, {
    fallbackKind: "color",
    fallbackColor: colorFallback,
    colorSpace: true,
  });
  const roughnessMap = useSafeTexture(`${basePath}/roughness.jpg`, { fallbackKind: "gray" });
  const normalMap    = useSafeTexture(`${basePath}/normal.jpg`,    { fallbackKind: "normal" });
  const metalnessMap = useSafeTexture(`${basePath}/metalness.jpg`, { fallbackKind: "gray" });

  useEffect(() => {
    applyRepeat(map,          repeat);
    applyRepeat(roughnessMap, repeat);
    applyRepeat(normalMap,    repeat);
    applyRepeat(metalnessMap, repeat);
  }, [map, roughnessMap, normalMap, metalnessMap, repeat]);

  return { map, roughnessMap, normalMap, metalnessMap };
}
