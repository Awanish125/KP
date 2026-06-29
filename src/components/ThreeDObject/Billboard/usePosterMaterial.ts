"use client";

/**
 * usePosterMaterial.ts — Hook that creates the poster panel ShaderMaterial.
 *
 * The poster shader renders an image or video texture with canvas-print effects
 * (grain, Fresnel sheen, vignette). The uniforms object is returned separately
 * from the material so the caller can animate values (brightness, opacity, map)
 * directly via GSAP without recreating the material.
 */

import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { posterVertexShader, posterFragmentShader } from "./shaders";
import type { PosterUniforms } from "./types";

export function usePosterMaterial(texture: THREE.Texture): {
  material: THREE.ShaderMaterial;
  uniforms: PosterUniforms;
} {
  // Uniforms are created once and mutated in place — this is what allows GSAP
  // to animate brightness/opacity/map without triggering React re-renders.
  const uniforms = useMemo<PosterUniforms>(
    () => ({
      map:           { value: texture },
      brightness:    { value: 1 },
      contrast:      { value: 1 },
      saturation:    { value: 1 },
      opacity:       { value: 1 },
      printScale:    { value: 180 },
      printStrength: { value: 0.35 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // intentionally empty: uniforms object is stable; texture sync is below
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader:   posterVertexShader,
      fragmentShader: posterFragmentShader,
      uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
      transparent: true,
      side: THREE.FrontSide,
    });
  }, [uniforms]);

  // Keep the texture uniform in sync when the texture reference changes
  // (e.g. after a poster swap).
  useEffect(() => {
    uniforms.map.value = texture;
  }, [texture, uniforms]);

  useEffect(() => () => material.dispose(), [material]);

  return { material, uniforms };
}
