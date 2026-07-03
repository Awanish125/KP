"use client";

import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import NextImage from "next/image";
import { gsap } from "gsap";
import { Renderer, Program, Mesh, Triangle, Texture } from "ogl";
import { useControls, folder } from "leva";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeroProps {
  images: string[];
  debug?: boolean;
  children?: React.ReactNode;
}

interface ShaderUniforms {
  uTime: { value: number };
  uProgress: { value: number };
  uTextureCurrent: { value: Texture | null };
  uTextureNext: { value: Texture | null };
  uResolution: { value: [number, number] };
  uImageResolutionCurrent: { value: [number, number] };
  uImageResolutionNext: { value: [number, number] };
  uMouse: { value: [number, number] };
  uGrain: { value: number };
  uKenBurns: { value: [number, number, number] };
  uKenBurnsNext: { value: [number, number, number] };

  // Image controls
  uCover: { value: number };
  uContain: { value: number };
  uZoom: { value: number };
  uScaleX: { value: number };
  uScaleY: { value: number };
  uOffsetX: { value: number };
  uOffsetY: { value: number };
  uRotation: { value: number };
  uAspectCompensation: { value: number };

  // Hardcoded value replacements
  uDisplacementStrength: { value: number };
  uTearIntensity: { value: number };
  uBarrelStrength: { value: number };
  uChromAmtMultiplier: { value: number };
  uChromAmtBase: { value: number };
  uDissolveNoiseScale: { value: number };
  uDissolveNoiseSpeed: { value: number };
  uPulseStrength: { value: number };
  uVignetteRadius: { value: number };
  uVignettePower: { value: number };
  uScanlineFrequency: { value: number };
  uScanlineSpeed: { value: number };
  uScanlineStrength: { value: number };
  uLeakThreshold: { value: number };
  uLeakScale: { value: number };
  uLeakSpeed: { value: number };
  uLeakStrength: { value: number };
  uLeakColor: { value: [number, number, number] };
  uGradColor: { value: [number, number, number] };
  uGradExponent: { value: number };
  uGradStrength: { value: number };
  uMouseParallax: { value: number };
  uKbMoveScale: { value: number };
  uKbZoomScale: { value: number };
}

// Helper to convert hex colors to normalized RGB floats
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [r, g, b];
}

// ─── Shaders ──────────────────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec2 uImageResolutionCurrent;
  uniform vec2 uImageResolutionNext;
  uniform float uTime;
  uniform float uProgress;
  uniform sampler2D uTextureCurrent;
  uniform sampler2D uTextureNext;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uGrain;
  uniform vec3 uKenBurns;
  uniform vec3 uKenBurnsNext;

  // Configurable Uniforms
  uniform float uCover;
  uniform float uContain;
  uniform float uZoom;
  uniform float uScaleX;
  uniform float uScaleY;
  uniform float uOffsetX;
  uniform float uOffsetY;
  uniform float uRotation;
  uniform float uAspectCompensation;

  uniform float uDisplacementStrength;
  uniform float uTearIntensity;
  uniform float uBarrelStrength;
  uniform float uChromAmtMultiplier;
  uniform float uChromAmtBase;
  uniform float uDissolveNoiseScale;
  uniform float uDissolveNoiseSpeed;
  uniform float uPulseStrength;
  uniform float uVignetteRadius;
  uniform float uVignettePower;
  uniform float uScanlineFrequency;
  uniform float uScanlineSpeed;
  uniform float uScanlineStrength;
  uniform float uLeakThreshold;
  uniform float uLeakScale;
  uniform float uLeakSpeed;
  uniform float uLeakStrength;
  uniform vec3 uLeakColor;
  uniform vec3 uGradColor;
  uniform float uGradExponent;
  uniform float uGradStrength;
  uniform float uMouseParallax;
  uniform float uKbMoveScale;
  uniform float uKbZoomScale;

  varying vec2 vUv;

  // ── Noise ──────────────────────────────────────────────────────────────────
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  // ── Cover UV ───────────────────────────────────────────────────────────────
  vec2 getAspectCorrectedUV(
    vec2 uv,
    vec2 screenRes,
    vec2 imgRes,
    float coverAmt,
    float containAmt,
    float zoomVal,
    vec2 uvScale,
    vec2 uvOffset,
    float rotationVal,
    float aspectComp
  ) {
    vec2 st = uv - 0.5;
    float screenAspect = screenRes.x / screenRes.y;
    float imgAspect = imgRes.x / imgRes.y;

    // Default: use original screen-aspect multiplier to avoid distortion
    if (aspectComp <= 0.0) {
      vec2 originalScale = vec2(screenAspect, 1.0) / (zoomVal * uvScale);
      if (rotationVal != 0.0) {
        float s = sin(rotationVal);
        float c = cos(rotationVal);
        st = vec2(st.x * c - st.y * s, st.x * s + st.y * c);
      }
      return st * originalScale + 0.5 + uvOffset;
    }

    vec2 coverRatio = vec2(
      min(screenAspect / imgAspect, 1.0),
      min(imgAspect / screenAspect, 1.0)
    );

    vec2 containRatio = vec2(
      max(screenAspect / imgAspect, 1.0),
      max(imgAspect / screenAspect, 1.0)
    );

    vec2 targetRatio = mix(coverRatio, containRatio, containAmt);
    targetRatio = mix(vec2(1.0), targetRatio, coverAmt);

    vec2 ratio = mix(vec2(1.0), targetRatio, aspectComp);
    st *= ratio;
    st /= (zoomVal * uvScale);

    if (rotationVal != 0.0) {
      float s = sin(rotationVal);
      float c = cos(rotationVal);
      st = vec2(st.x * c - st.y * s, st.x * s + st.y * c);
    }

    return st + 0.5 + uvOffset;
  }

  // ── RGB Split ──────────────────────────────────────────────────────────────
  vec4 rgbSplit(sampler2D tex, vec2 uv, float amt) {
    float r = texture2D(tex, uv + vec2(amt, 0.0)).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - vec2(amt, 0.0)).b;
    float a = texture2D(tex, uv).a;
    return vec4(r, g, b, a);
  }

  // ── Digital Tear ───────────────────────────────────────────────────────────
  vec2 digitalTear(vec2 uv, float t, float intensity) {
    float bands = 24.0;
    float band = floor(uv.y * bands) / bands;
    float bandNoise = hash(vec2(band, floor(t * 30.0)));
    float tearAmount = step(0.7, bandNoise) * intensity * sin(t * 40.0 + band * 6.28);
    return vec2(uv.x + tearAmount, uv.y);
  }

  // ── Barrel Distortion ──────────────────────────────────────────────────────
  vec2 barrel(vec2 uv, float strength) {
    vec2 c = uv - 0.5;
    float r2 = dot(c, c);
    return uv + c * r2 * strength;
  }

  void main() {
    float p = uProgress;
    float t = uTime;

    // ── Transition window: effect ramps in/out ─────────────────────────────
    float transitionEdge = smoothstep(0.0, 0.15, p) * (1.0 - smoothstep(0.85, 1.0, p));
    float transitionPeak = smoothstep(0.3, 0.5, p) * (1.0 - smoothstep(0.5, 0.7, p));

    // ── Mouse parallax offset ──────────────────────────────────────────────
    vec2 mouseOffset = (uMouse - 0.5) * uMouseParallax;

    // ── Ken Burns: current ─────────────────────────────────────────────────
    vec2 kbOffset = uKenBurns.xy * uKbMoveScale + mouseOffset;
    float kbScale  = 1.0 + uKenBurns.z * uKbZoomScale;
    vec2 uvCurrent = getAspectCorrectedUV(
      vUv,
      uResolution,
      uImageResolutionCurrent,
      uCover,
      uContain,
      uZoom,
      vec2(uScaleX, uScaleY),
      vec2(uOffsetX, uOffsetY) + kbOffset,
      uRotation,
      uAspectCompensation
    );

    // ── Ken Burns: next ────────────────────────────────────────────────────
    vec2 kbOffsetN = uKenBurnsNext.xy * uKbMoveScale - mouseOffset;
    float kbScaleN = 1.0 + uKenBurnsNext.z * uKbZoomScale;
    vec2 uvNext = getAspectCorrectedUV(
      vUv,
      uResolution,
      uImageResolutionNext,
      uCover,
      uContain,
      uZoom,
      vec2(uScaleX, uScaleY),
      vec2(uOffsetX, uOffsetY) + kbOffsetN,
      uRotation,
      uAspectCompensation
    );

    // ── Displacement via fbm ───────────────────────────────────────────────
    float dispStrength = transitionEdge * uDisplacementStrength;
    vec2 dispOffset = vec2(
      fbm(vUv * 3.5 + t * 0.4) - 0.5,
      fbm(vUv * 3.5 + vec2(1.7, 9.2) + t * 0.4) - 0.5
    ) * dispStrength;

    // ── Digital tearing ────────────────────────────────────────────────────
    float tearIntensity = transitionPeak * uTearIntensity;
    vec2 uvTorn = digitalTear(vUv, t, tearIntensity);

    // ── Barrel distortion at peak ──────────────────────────────────────────
    float barrelStr = sin(p * 3.14159) * uBarrelStrength;
    vec2 uvBarrel = barrel(uvTorn, barrelStr);

    // ── Final sample UVs ───────────────────────────────────────────────────
    vec2 finalUvA = uvCurrent + dispOffset + (uvBarrel - vUv);
    vec2 finalUvB = uvNext    + dispOffset + (uvBarrel - vUv);

    // ── Chromatic aberration ───────────────────────────────────────────────
    float chromAmt = transitionEdge * uChromAmtMultiplier + uChromAmtBase;
    vec4 colorA = rgbSplit(uTextureCurrent, finalUvA, chromAmt);
    vec4 colorB = rgbSplit(uTextureNext,    finalUvB, chromAmt);

    // ── Pixel dissolve blend ───────────────────────────────────────────────
    float dissolveNoise = fbm(vUv * uDissolveNoiseScale + t * uDissolveNoiseSpeed);
    float dissolveEdge  = smoothstep(p - 0.35, p + 0.35, dissolveNoise);
    vec4 blended = mix(colorA, colorB, clamp(dissolveEdge, 0.0, 1.0));

    // ── Brightness pulse ───────────────────────────────────────────────────
    float pulse = 1.0 + transitionPeak * uPulseStrength * sin(t * 60.0);
    blended.rgb *= pulse;

    // ── Vignette ───────────────────────────────────────────────────────────
    vec2 vigUv = vUv * (1.0 - vUv.yx);
    float vig = pow(vigUv.x * vigUv.y * uVignetteRadius, uVignettePower);
    vig = clamp(vig, 0.0, 1.0);
    blended.rgb *= mix(0.0, 1.0, vig);

    // ── Film grain ─────────────────────────────────────────────────────────
    float grain = (hash(vUv + fract(t * 0.07)) - 0.5) * uGrain * 0.1;//this is for noise
    blended.rgb += grain;

    // ── Scanline flash at transition peak ──────────────────────────────────
    float scanline = sin(vUv.y * uResolution.y * uScanlineFrequency + t * uScanlineSpeed);
    blended.rgb += scanline * transitionPeak * uScanlineStrength;

    // ── Light leak ─────────────────────────────────────────────────────────
    float leak = smoothstep(uLeakThreshold, 1.0, fbm(vUv * uLeakScale + t * uLeakSpeed)) * transitionEdge * uLeakStrength;
    blended.rgb += uLeakColor * leak;

    // ── Atmospheric gradient overlay ───────────────────────────────────────
    float gradMix = pow(1.0 - vUv.y, uGradExponent) * uGradStrength;
    blended.rgb = mix(blended.rgb, uGradColor, gradMix);

    gl_FragColor = blended;
  }
`;

// ─── Inner Debug Component ────────────────────────────────────────────────────

interface HeroDebugProps {
  uniformsRef: React.MutableRefObject<ShaderUniforms | null>;
  timingsRef: React.MutableRefObject<{
    holdDuration: number;
    transitionDuration: number;
    ease: string;
  }>;
}

function HeroDebug({ uniformsRef, timingsRef }: HeroDebugProps) {
  useControls(
    () => ({
      Image: folder({
        cover: {
          value: 1.0,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uCover.value = v;
          },
        },
        contain: {
          value: 0.0,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uContain.value = v;
          },
        },
        zoom: {
          value: 1.0,
          min: 0.1,
          max: 5.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uZoom.value = v;
          },
        },
        scaleX: {
          value: 1.0,
          min: 0.1,
          max: 5.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uScaleX.value = v;
          },
        },
        scaleY: {
          value: 1.0,
          min: 0.1,
          max: 5.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uScaleY.value = v;
          },
        },
        offsetX: {
          value: -0.25,
          min: -2.0,
          max: 2.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uOffsetX.value = v;
          },
        },
        offsetY: {
          value: 0.0,
          min: -2.0,
          max: 2.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uOffsetY.value = v;
          },
        },
        rotation: {
          value: 0.0,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uRotation.value = v;
          },
        },
        aspectCompensation: {
          value: 0.0,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uAspectCompensation.value = v;
          },
        },
      }),
      Transition: folder({
        holdDuration: {
          value: 5.0,
          min: 1.0,
          max: 20.0,
          step: 0.1,
          onChange: (v) => {
            timingsRef.current.holdDuration = v;
          },
        },
        transitionDuration: {
          value: 1.6,
          min: 0.1,
          max: 10.0,
          step: 0.1,
          onChange: (v) => {
            timingsRef.current.transitionDuration = v;
          },
        },
        ease: {
          value: "power2.inOut",
          options: [
            "power2.inOut",
            "power2.in",
            "power2.out",
            "power1.inOut",
            "power3.inOut",
            "none",
          ],
          onChange: (v) => {
            timingsRef.current.ease = v;
          },
        },
      }),
      Mouse: folder({
        mouseParallax: {
          value: 0.008,
          min: 0.0,
          max: 0.1,
          step: 0.001,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uMouseParallax.value = v;
          },
        },
      }),
      "Ken Burns": folder({
        kbMoveScale: {
          value: 0.04,
          min: 0.0,
          max: 0.2,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uKbMoveScale.value = v;
          },
        },
        kbZoomScale: {
          value: 0.06,
          min: 0.0,
          max: 0.3,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uKbZoomScale.value = v;
          },
        },
      }),
      Effects: folder({
        displacementStrength: {
          value: 0.025,
          min: 0.0,
          max: 0.2,
          step: 0.001,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uDisplacementStrength.value = v;
          },
        },
        tearIntensity: {
          value: 0.018,
          min: 0.0,
          max: 0.1,
          step: 0.001,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uTearIntensity.value = v;
          },
        },
        barrelStrength: {
          value: 0.06,
          min: -0.5,
          max: 0.5,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uBarrelStrength.value = v;
          },
        },
        chromAmtMultiplier: {
          value: 0.006,
          min: 0.0,
          max: 0.05,
          step: 0.001,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uChromAmtMultiplier.value = v;
          },
        },
        chromAmtBase: {
          value: 0.0015,
          min: 0.0,
          max: 0.02,
          step: 0.0005,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uChromAmtBase.value = v;
          },
        },
        dissolveNoiseScale: {
          value: 6.0,
          min: 1.0,
          max: 20.0,
          step: 0.1,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uDissolveNoiseScale.value = v;
          },
        },
        dissolveNoiseSpeed: {
          value: 0.2,
          min: 0.0,
          max: 2.0,
          step: 0.05,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uDissolveNoiseSpeed.value = v;
          },
        },
        pulseStrength: {
          value: 0.12,
          min: 0.0,
          max: 0.5,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uPulseStrength.value = v;
          },
        },
        vignetteRadius: {
          value: 18.0,
          min: 1.0,
          max: 50.0,
          step: 0.5,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uVignetteRadius.value = v;
          },
        },
        vignettePower: {
          value: 0.4,
          min: 0.1,
          max: 2.0,
          step: 0.05,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uVignettePower.value = v;
          },
        },
        scanlineFrequency: {
          value: 0.5,
          min: 0.1,
          max: 5.0,
          step: 0.05,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uScanlineFrequency.value = v;
          },
        },
        scanlineSpeed: {
          value: 120.0,
          min: -300.0,
          max: 300.0,
          step: 5.0,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uScanlineSpeed.value = v;
          },
        },
        scanlineStrength: {
          value: 0.025,
          min: 0.0,
          max: 0.2,
          step: 0.005,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uScanlineStrength.value = v;
          },
        },
        leakThreshold: {
          value: 0.6,
          min: 0.0,
          max: 1.0,
          step: 0.05,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uLeakThreshold.value = v;
          },
        },
        leakScale: {
          value: 2.0,
          min: 0.1,
          max: 10.0,
          step: 0.1,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uLeakScale.value = v;
          },
        },
        leakSpeed: {
          value: 0.1,
          min: 0.0,
          max: 2.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current) uniformsRef.current.uLeakSpeed.value = v;
          },
        },
        leakStrength: {
          value: 0.12,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uLeakStrength.value = v;
          },
        },
        leakColor: {
          value: "#99734d",
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uLeakColor.value = hexToRgb(v);
          },
        },
        gradColor: {
          value: "#00000d",
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uGradColor.value = hexToRgb(v);
          },
        },
        gradExponent: {
          value: 2.2,
          min: 0.5,
          max: 5.0,
          step: 0.1,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uGradExponent.value = v;
          },
        },
        gradStrength: {
          value: 0.6,
          min: 0.0,
          max: 1.0,
          step: 0.05,
          onChange: (v) => {
            if (uniformsRef.current)
              uniformsRef.current.uGradStrength.value = v;
          },
        },
      }),
    }),
    [uniformsRef, timingsRef],
  );

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Hero({ images, debug = false, children }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const indexRef = useRef(0);
  const rafRef = useRef<number>(0);
  const gsapCtxRef = useRef<gsap.Context | null>(null);
  const disposedRef = useRef(false);
  const delayedCallRef = useRef<gsap.core.Tween | null>(null);
  const uniformsRef = useRef<ShaderUniforms | null>(null);
  const mouseRef = useRef<[number, number]>([0.5, 0.5]);
  const reducedMotion = useRef(false);

  const timingsRef = useRef({
    holdDuration: 6.0,
    transitionDuration: 1.1,
    ease: "power2.inOut",
  });

  const normalizedImages = useMemo(
    () => images.map((src) => (src.startsWith("/") ? src : `/${src}`)),
    [images],
  );

  // ── Image loading ─────────────────────────────────────────────────────────

  const loadTexture = useCallback(
    (renderer: Renderer, src: string): Promise<Texture> =>
      new Promise((resolve) => {
        const tex = new Texture(renderer.gl, { generateMipmaps: false });
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          tex.image = img;
          resolve(tex);
        };
        img.src = src;
      }),
    [],
  );

  // ── Ken Burns seed ────────────────────────────────────────────────────────

  const kbSeed = useCallback((index = 0): [number, number, number] => {
    const directions: [number, number][] = [
      [0.004, 0.002],
      [-0.003, 0.003],
      [0.002, -0.004],
      [-0.002, -0.002],
      [0.003, 0.001],
    ];

    const [x, y] = directions[index % directions.length];

    return [
      x,
      y,
      0.01, // ~1% zoom
    ];
  }, []);

  // ── Transition sequence ───────────────────────────────────────────────────

  const runTransition = useCallback(
    function runTransition() {
      const u = uniformsRef.current;
      if (!u) return;

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            indexRef.current = (indexRef.current + 1) % normalizedImages.length;
            // Swap: next becomes current, load new next
            const nextIdx = (indexRef.current + 1) % normalizedImages.length;
            u.uTextureCurrent.value = u.uTextureNext.value;
            u.uImageResolutionCurrent.value = [...u.uImageResolutionNext.value];
            u.uKenBurns.value = [...u.uKenBurnsNext.value] as [
              number,
              number,
              number,
            ];

            // Animate Ken Burns for incoming
            const seed = kbSeed(nextIdx);

            gsap.fromTo(
              u.uKenBurnsNext,
              { value: seed },
              {
                value: kbSeed(nextIdx + 1),
                duration: 20,
                ease: "sine.inOut",
              },
            );

            // Preload next texture
            if (rendererRef.current) {
              loadTexture(rendererRef.current, normalizedImages[nextIdx]).then(
                (tex) => {
                  if (disposedRef.current) return;
                  u.uTextureNext.value = tex;
                  u.uImageResolutionNext.value = [
                    (tex.image as HTMLImageElement).width,
                    (tex.image as HTMLImageElement).height,
                  ];
                },
              );
            }

            // Schedule next transition using configurable hold duration
            delayedCallRef.current = gsap.delayedCall(
              timingsRef.current.holdDuration,
              runTransition,
            );
          },
        });

        tl.to(u.uProgress, {
          value: 1,
          duration: reducedMotion.current
            ? 0.3
            : timingsRef.current.transitionDuration,
          ease: timingsRef.current.ease,
          onComplete: () => {
            u.uProgress.value = 0;
          },
        });
      });

      gsapCtxRef.current = ctx;
    },
    [kbSeed, loadTexture, normalizedImages],
  );

  // ── Render loop ───────────────────────────────────────────────────────────

  const tick = useCallback(function tick(now: number) {
    const u = uniformsRef.current;
    const renderer = rendererRef.current;
    const mesh = meshRef.current;
    if (disposedRef.current) return;
    if (!u || !renderer || !mesh) return;

    u.uTime.value = now * 0.001;

    // Smooth mouse
    const [mx, my] = mouseRef.current;
    u.uMouse.value[0] += (mx - u.uMouse.value[0]) * 0.05;
    u.uMouse.value[1] += (my - u.uMouse.value[1]) * 0.05;

    if (!renderer.gl.isContextLost()) {
      renderer.render({ scene: mesh });
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Mouse handler ─────────────────────────────────────────────────────────

  const onMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = [
      e.clientX / window.innerWidth,
      1 - e.clientY / window.innerHeight,
    ];
  }, []);

  // ── Resize ────────────────────────────────────────────────────────────────

  // On small screens the overlay content is centered (not left-aligned), so
  // the image is centered too (offsetX 0); on wider screens it shifts left
  // to sit beside the content column.
  const responsiveOffsetX = useCallback(
    () => (window.innerWidth < 768 ? 0.0 : -0.25),
    [],
  );

  const onResize = useCallback(() => {
    const renderer = rendererRef.current;
    const u = uniformsRef.current;
    if (!renderer || !u) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    u.uResolution.value = [window.innerWidth, window.innerHeight];
    u.uOffsetX.value = responsiveOffsetX();
  }, [responsiveOffsetX]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    disposedRef.current = false;
    if (!canvasRef.current || normalizedImages.length === 0) return;

    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const renderer = new Renderer({
      canvas: canvasRef.current,
      alpha: false,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const blankTex = () => new Texture(gl, { generateMipmaps: false });

    // Initialize uniforms with default settings from original code
    const uniforms: ShaderUniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uTextureCurrent: { value: blankTex() },
      uTextureNext: { value: blankTex() },
      uResolution: { value: [window.innerWidth, window.innerHeight] },
      uMouse: { value: [0.5, 0.5] },
      uGrain: { value: reducedMotion.current ? 0 : 1 },
      uKenBurns: { value: [0, 0, 0] },
      uKenBurnsNext: { value: [0, 0, 0] },
      uImageResolutionCurrent: { value: [1, 1] },
      uImageResolutionNext: { value: [1, 1] },

      uCover: { value: 0.8 },
      uContain: { value: 0.2 },
      uZoom: { value: 0.9 },
      uScaleX: { value: 1.0 },
      uScaleY: { value: 1.0 },
      uOffsetX: { value: responsiveOffsetX() },
      uOffsetY: { value: 0.0 },
      uRotation: { value: 0.0 },
      uAspectCompensation: { value: 1 },

      uDisplacementStrength: { value: 0.006 },
      uTearIntensity: { value: 0.002 },
      uBarrelStrength: { value: 0.005 },
      uChromAmtMultiplier: { value: 0.0015 },
      uChromAmtBase: { value: 0.0002 },
      uDissolveNoiseScale: { value: 6.0 },
      uDissolveNoiseSpeed: { value: 0.2 },
      uPulseStrength: { value: 0.12 },
      uVignetteRadius: { value: 12.0 },
      uVignettePower: { value: 0.2 },
      uScanlineFrequency: { value: 0.5 },
      uScanlineSpeed: { value: 120.0 },
      uScanlineStrength: { value: 0.005 },
      uLeakThreshold: { value: 0.6 },
      uLeakScale: { value: 2.0 },
      uLeakSpeed: { value: 0.1 },
      uLeakStrength: { value: 0.03 },
      uLeakColor: { value: hexToRgb("#99734d") },
      uGradColor: { value: hexToRgb("#00000d") },
      uGradExponent: { value: 2.2 },
      uGradStrength: { value: 0.18 },
      uMouseParallax: { value: 0.01 },
      uKbMoveScale: { value: 0.003 },
      uKbZoomScale: { value: 0.008 },
    };
    uniformsRef.current = uniforms;

    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms,
    });

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    Promise.all([
      loadTexture(renderer, normalizedImages[0]),
      loadTexture(
        renderer,
        normalizedImages[Math.min(1, normalizedImages.length - 1)],
      ),
    ]).then(([texA, texB]) => {
      if (disposedRef.current) return;
      uniforms.uImageResolutionCurrent.value = [
        (texA.image as HTMLImageElement).width,
        (texA.image as HTMLImageElement).height,
      ];

      uniforms.uImageResolutionNext.value = [
        (texB.image as HTMLImageElement).width,
        (texB.image as HTMLImageElement).height,
      ];
      uniforms.uTextureCurrent.value = texA;
      uniforms.uTextureNext.value = texB;

      const seedA = kbSeed(0);
      const seedB = kbSeed(1);
      uniforms.uKenBurns.value = seedA;
      uniforms.uKenBurnsNext.value = seedB;

      gsap.to(uniforms.uKenBurns, {
        value: kbSeed(2),
        duration: 20,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      gsap.to(uniforms.uKenBurnsNext, {
        value: kbSeed(3),
        duration: 20,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      rafRef.current = requestAnimationFrame(tick);
      delayedCallRef.current = gsap.delayedCall(
        timingsRef.current.holdDuration,
        runTransition,
      );
    });

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      disposedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
      gsap.killTweensOf(uniforms.uKenBurns);
      gsap.killTweensOf(uniforms.uKenBurnsNext);
      gsap.killTweensOf(uniforms.uProgress);
      delayedCallRef.current?.kill();
      // gsap.globalTimeline.getChildren(true, false, true).forEach((t) => {
      //   if ((t as gsap.core.Tween).vars?.onComplete === runTransition) t.kill();
      // });
      // renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
    };
  }, [
    normalizedImages,
    kbSeed,
    loadTexture,
    onMouseMove,
    onResize,
    tick,
    runTransition,
    responsiveOffsetX,
  ]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      aria-label="Hero"
    >
      {/* WebGL canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Dust particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full opacity-0"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              background: "rgba(255,255,255,0.5)",
              left: `${(i * 5.7 + 3) % 100}%`,
              top: `${(i * 7.3 + 10) % 100}%`,
              animation: `dust ${6 + (i % 4) * 2}s ${(i * 0.7) % 5}s ease-in-out infinite alternate`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* Dust Keyframes */}
      <style>{`
        @keyframes dust {
          0%   { opacity: 0;    transform: translateY(0px)  scale(1); }
          50%  { opacity: 0.35; transform: translateY(-18px) scale(1.4); }
          100% { opacity: 0;    transform: translateY(-32px) scale(0.8); }
        }
      `}</style>

      {/* Gradient UI chrome */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.0) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Top gradient */}
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Overlay Content */}
      {children && (
        <div className="relative w-full h-full z-20 pointer-events-none">
          <div className="w-full h-full pointer-events-auto">{children}</div>
        </div>
      )}

      {/* Preload images */}
      <div className="sr-only" aria-hidden="true">
        {normalizedImages.map((src, i) => (
          <NextImage
            key={i}
            src={src}
            alt=""
            width={1}
            height={1}
            className="object-cover"
          />
        ))}
      </div>

      {/* Leva UI Debug Panel */}
      {debug && (
        <div className="relative z-50">
          <HeroDebug uniformsRef={uniformsRef} timingsRef={timingsRef} />
        </div>
      )}
    </section>
  );
}
