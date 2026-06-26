"use client";

import { useEffect, useRef, useCallback } from "react";
import NextImage from "next/image";
import { gsap } from "gsap";
import { Renderer, Program, Mesh, Triangle, Texture } from "ogl";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeroProps {
  images: string[];
}

interface ShaderUniforms {
  uTime: { value: number };
  uProgress: { value: number };
  uTextureCurrent: { value: Texture };
  uTextureNext: { value: Texture };
  uResolution: { value: [number, number] };
  uMouse: { value: [number, number] };
  uGrain: { value: number };
  uKenBurns: { value: [number, number, number] };
  uKenBurnsNext: { value: [number, number, number] };
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

  uniform float uTime;
  uniform float uProgress;
  uniform sampler2D uTextureCurrent;
  uniform sampler2D uTextureNext;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uGrain;
  uniform vec3 uKenBurns;
  uniform vec3 uKenBurnsNext;

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
  vec2 coverUv(vec2 uv, vec2 res, float scale, vec2 offset) {
    float aspect = res.x / res.y;
    vec2 s = vec2(aspect, 1.0) * scale;
    vec2 c = (uv - 0.5) * s + 0.5 + offset;
    return c;
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
    vec2 mouseOffset = (uMouse - 0.5) * 0.008;

    // ── Ken Burns: current ─────────────────────────────────────────────────
    vec2 kbOffset = uKenBurns.xy * 0.04 + mouseOffset;
    float kbScale  = 1.0 + uKenBurns.z * 0.06;
    vec2 uvCurrent = coverUv(vUv, uResolution, kbScale, kbOffset);

    // ── Ken Burns: next ────────────────────────────────────────────────────
    vec2 kbOffsetN = uKenBurnsNext.xy * 0.04 - mouseOffset;
    float kbScaleN = 1.0 + uKenBurnsNext.z * 0.06;
    vec2 uvNext = coverUv(vUv, uResolution, kbScaleN, kbOffsetN);

    // ── Displacement via fbm ───────────────────────────────────────────────
    float dispStrength = transitionEdge * 0.025;
    vec2 dispOffset = vec2(
      fbm(vUv * 3.5 + t * 0.4) - 0.5,
      fbm(vUv * 3.5 + vec2(1.7, 9.2) + t * 0.4) - 0.5
    ) * dispStrength;

    // ── Digital tearing ────────────────────────────────────────────────────
    float tearIntensity = transitionPeak * 0.018;
    vec2 uvTorn = digitalTear(vUv, t, tearIntensity);

    // ── Barrel distortion at peak ──────────────────────────────────────────
    float barrelStr = sin(p * 3.14159) * 0.06;
    vec2 uvBarrel = barrel(uvTorn, barrelStr);

    // ── Final sample UVs ───────────────────────────────────────────────────
    vec2 finalUvA = uvCurrent + dispOffset;
    vec2 finalUvB = uvNext    + dispOffset;

    // ── Chromatic aberration ───────────────────────────────────────────────
    float chromAmt = transitionEdge * 0.006 + 0.0015;
    vec4 colorA = rgbSplit(uTextureCurrent, finalUvA, chromAmt);
    vec4 colorB = rgbSplit(uTextureNext,    finalUvB, chromAmt);

    // ── Pixel dissolve blend ───────────────────────────────────────────────
    float dissolveNoise = fbm(vUv * 6.0 + t * 0.2);
    float dissolveEdge  = smoothstep(p - 0.35, p + 0.35, dissolveNoise);
    vec4 blended = mix(colorA, colorB, clamp(dissolveEdge, 0.0, 1.0));

    // ── Brightness pulse ───────────────────────────────────────────────────
    float pulse = 1.0 + transitionPeak * 0.12 * sin(t * 60.0);
    blended.rgb *= pulse;

    // ── Vignette ───────────────────────────────────────────────────────────
    vec2 vigUv = vUv * (1.0 - vUv.yx);
    float vig = pow(vigUv.x * vigUv.y * 18.0, 0.4);
    vig = clamp(vig, 0.0, 1.0);
    blended.rgb *= mix(0.0, 1.0, vig);

    // ── Film grain ─────────────────────────────────────────────────────────
    float grain = (hash(vUv + fract(t * 0.07)) - 0.5) * uGrain * 0.18;
    blended.rgb += grain;

    // ── Scanline flash at transition peak ──────────────────────────────────
    float scanline = sin(vUv.y * uResolution.y * 0.5 + t * 120.0);
    blended.rgb += scanline * transitionPeak * 0.025;

    // ── Light leak ─────────────────────────────────────────────────────────
    float leak = smoothstep(0.6, 1.0, fbm(vUv * 2.0 + t * 0.1)) * transitionEdge * 0.12;
    blended.rgb += vec3(0.6, 0.45, 0.3) * leak;

    // ── Atmospheric gradient overlay ───────────────────────────────────────
    vec3 gradBot = vec3(0.0, 0.0, 0.05);
    float gradMix = pow(1.0 - vUv.y, 2.2) * 0.6;
    blended.rgb = mix(blended.rgb, gradBot, gradMix);

    gl_FragColor = blended;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Hero({ images }: HeroProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const rendererRef    = useRef<Renderer | null>(null);
  const programRef     = useRef<Program | null>(null);
  const meshRef        = useRef<Mesh | null>(null);
  const texturesRef    = useRef<Texture[]>([]);
  const indexRef       = useRef(0);
  const rafRef         = useRef<number>(0);
  const gsapCtxRef     = useRef<gsap.Context | null>(null);
  const uniformsRef    = useRef<ShaderUniforms | null>(null);
  const mouseRef       = useRef<[number, number]>([0.5, 0.5]);
  const reducedMotion  = useRef(false);

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
    []
  );

  // ── Ken Burns seed ────────────────────────────────────────────────────────

  const kbSeed = useCallback((): [number, number, number] => {
    const angle = Math.random() * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle), Math.random()];
  }, []);

  // ── Transition sequence ───────────────────────────────────────────────────

  const runTransition = useCallback(() => {
    const u = uniformsRef.current;
    if (!u) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          indexRef.current = (indexRef.current + 1) % images.length;
          // Swap: next becomes current, load new next
          const nextIdx = (indexRef.current + 1) % images.length;
          u.uTextureCurrent.value = u.uTextureNext.value;
          u.uKenBurns.value = [...u.uKenBurnsNext.value] as [number, number, number];

          // Animate Ken Burns for incoming
          const seed = kbSeed();
          gsap.fromTo(
            u.uKenBurnsNext,
            { value: seed },
            { value: kbSeed(), duration: 7, ease: "none" }
          );

          // Preload next texture
          if (rendererRef.current) {
            loadTexture(rendererRef.current, images[nextIdx]).then((tex) => {
              u.uTextureNext.value = tex;
            });
          }

          // Schedule next transition
          gsap.delayedCall(5, runTransition);
        },
      });

      tl.to(u.uProgress, {
        value: 1,
        duration: reducedMotion.current ? 0.3 : 1.6,
        ease: "power2.inOut",
        onComplete: () => {
          u.uProgress.value = 0;
        },
      });
    });

    gsapCtxRef.current = ctx;
  }, [images, kbSeed, loadTexture]);

  // ── Render loop ───────────────────────────────────────────────────────────

  const tick = useCallback((now: number) => {
    const u = uniformsRef.current;
    const renderer = rendererRef.current;
    const mesh = meshRef.current;
    if (!u || !renderer || !mesh) return;

    u.uTime.value = now * 0.001;

    // Smooth mouse
    const [mx, my] = mouseRef.current;
    u.uMouse.value[0] += (mx - u.uMouse.value[0]) * 0.05;
    u.uMouse.value[1] += (my - u.uMouse.value[1]) * 0.05;

    renderer.render({ scene: mesh });
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

  const onResize = useCallback(() => {
    const renderer = rendererRef.current;
    const u = uniformsRef.current;
    if (!renderer || !u) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    u.uResolution.value = [window.innerWidth, window.innerHeight];
  }, []);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasRef.current || images.length === 0) return;

    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
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

    // Build two placeholder textures
    const blankTex = () => new Texture(gl, { generateMipmaps: false });

    const uniforms: ShaderUniforms = {
      uTime:            { value: 0 },
      uProgress:        { value: 0 },
      uTextureCurrent:  { value: blankTex() },
      uTextureNext:     { value: blankTex() },
      uResolution:      { value: [window.innerWidth, window.innerHeight] },
      uMouse:           { value: [0.5, 0.5] },
      uGrain:           { value: reducedMotion.current ? 0 : 1 },
      uKenBurns:        { value: [0, 0, 0] },
      uKenBurnsNext:    { value: [0, 0, 0] },
    };
    uniformsRef.current = uniforms;

    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms,
    });
    programRef.current = program;

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    // Preload first two images, then start
    Promise.all([
      loadTexture(renderer, images[0]),
      loadTexture(renderer, images[Math.min(1, images.length - 1)]),
    ]).then(([texA, texB]) => {
      uniforms.uTextureCurrent.value = texA;
      uniforms.uTextureNext.value    = texB;

      // Kick off Ken Burns
      const seedA = kbSeed();
      const seedB = kbSeed();
      uniforms.uKenBurns.value     = seedA;
      uniforms.uKenBurnsNext.value = seedB;

      gsap.to(uniforms.uKenBurns,     { value: kbSeed(), duration: 7, ease: "none", repeat: -1 });
      gsap.to(uniforms.uKenBurnsNext, { value: kbSeed(), duration: 7, ease: "none", repeat: -1 });

      rafRef.current = requestAnimationFrame(tick);
      gsap.delayedCall(5, runTransition);
    });

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      gsapCtxRef.current?.kill();
      gsap.killTweensOf(uniforms.uKenBurns);
      gsap.killTweensOf(uniforms.uKenBurnsNext);
      gsap.killTweensOf(uniforms.uProgress);
      gsap.globalTimeline.getChildren(true, false, true).forEach((t) => {
        if ((t as gsap.core.Tween).vars?.onComplete === runTransition) t.kill();
      });
      texturesRef.current.forEach((t) => t.image && ((t as unknown as { destroy?: () => void }).destroy?.()));
      renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

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

      {/* Dust particles: pure CSS, GPU composited */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full opacity-0"
            style={{
              width:  `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              background: "rgba(255,255,255,0.5)",
              left:  `${(i * 5.7 + 3) % 100}%`,
              top:   `${(i * 7.3 + 10) % 100}%`,
              animation: `dust ${6 + (i % 4) * 2}s ${(i * 0.7) % 5}s ease-in-out infinite alternate`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

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

      {/* Preload images (hidden, next/image handles optimisation) */}
      <div className="sr-only" aria-hidden="true">
        {images.map((src,i) => (
          <NextImage key={i} src={src} alt="" width={1} height={1} />
        ))}
      </div>

      {/* Keyframes injected as a style tag */}
      <style>{`
        @keyframes dust {
          0%   { opacity: 0;    transform: translateY(0px)  scale(1); }
          50%  { opacity: 0.35; transform: translateY(-18px) scale(1.4); }
          100% { opacity: 0;    transform: translateY(-32px) scale(0.8); }
        }
      `}</style>
    </section>
  );
}