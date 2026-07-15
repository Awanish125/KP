"use client";

/**
 * ParticleEntity — full-page fixed particle backdrop that morphs through
 * brand shapes (billboard → skyline → globe → beacon → ring) as the page
 * scrolls. Sits at z-0 behind all content (sections are transparent — the
 * body gradient + this canvas ARE the page background).
 *
 * Perf contract (memory: feedback-scroll-performance):
 *  - NO ScrollTrigger, NO window scroll listener — one gsap.ticker callback
 *    reads window.scrollY (fires after Lenis applies its position).
 *  - frameloop="demand": the ticker advances uniforms then invalidate()s.
 *  - Document height cached once + ResizeObserver — never measured in tick.
 *  - Ticker skips all work while the tab is hidden.
 *  - Colors match the brand icon palette and swap with the .dark theme
 *    class (observed via MutationObserver — same source as ThemeProvider).
 *  - prefers-reduced-motion → component renders nothing.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { buildShapes, type BuiltShapes } from "./particleShapes";
import {
  ENTITY_CONFIG,
  PALETTES,
  PARTICLE_COUNT,
  SHAPE_COUNT,
} from "./particleEntityConfig";

/* ── GLSL ─────────────────────────────────────────────────────────────── */

// ashima 3D simplex noise (standard public-domain implementation)
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

const VERT = /* glsl */ `
attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute vec3 aP4;
attribute float aSeed;
attribute float aScale;
attribute float aAccent; // bitmask: bit N = warm/orange particle in shape N
uniform float uShape;    // 0..4 continuous scroll scrub
uniform float uTime;
uniform float uIdle;
uniform float uStorm;
uniform float uFlowFreq;
uniform float uSize;
uniform float uPixel;
uniform float uFadeMin;  // opacity floor at screen center (content safe zone)
uniform vec3  uMouse;    // world-space pointer on the z=0 plane
uniform float uMouseR;
uniform float uMouseF;
uniform float uBlast;       // 0 at rest → 1 on click → decays back to 0
uniform vec3  uBlastOrigin; // world-space click point
varying float vSeed;
varying float vFade;
varying float vAccent;
${SNOISE}

vec3 shapeAt(float s){
  vec3 p = position;               // shape 0 lives in the position attribute
  p = mix(p, aP1, clamp(s,       0.0, 1.0));
  p = mix(p, aP2, clamp(s - 1.0, 0.0, 1.0));
  p = mix(p, aP3, clamp(s - 2.0, 0.0, 1.0));
  p = mix(p, aP4, clamp(s - 3.0, 0.0, 1.0));
  return p;
}

void main(){
  float base = floor(uShape);
  float f = uShape - base;
  /* staggered departure, smoothed twice for a liquid feel */
  float t = smoothstep(0.0, 1.0, clamp((f - aSeed * 0.3) / 0.7, 0.0, 1.0));
  t = t * t * (3.0 - 2.0 * t);
  vec3 pos = shapeAt(base + t);

  /* flow field: peaks mid-morph, breathes at rest */
  float storm = sin(f * 3.14159265) * uStorm;
  vec3 np = pos * uFlowFreq + vec3(uTime * 0.16) + aSeed * 6.28;
  vec3 disp = vec3(snoise(np), snoise(np + 31.7), snoise(np + 74.3));
  pos += disp * (uIdle * (0.6 + aSeed * 0.8) + storm * (0.8 + aSeed));

  /* cursor repulsion — lighter particles give way more easily */
  float md = distance(pos.xy, uMouse.xy);
  vec2 push = (pos.xy - uMouse.xy) / max(md, 0.001);
  pos.xy += push * smoothstep(uMouseR, 0.0, md) * uMouseF * (0.5 + aSeed);

  /* click-blast: scatter radially from click origin, return as uBlast decays */
  if (uBlast > 0.001) {
    vec3 bd = pos - uBlastOrigin;
    pos += normalize(bd + vec3(0.0, 0.0001, 0.0)) * uBlast * 10.0 * (0.3 + aSeed * 2.2);
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  /* hard cap: near-camera dust must never balloon into blurry blobs */
  gl_PointSize = clamp(aScale * uSize * uPixel * (95.0 / -mv.z), 1.0, 4.0 * uPixel);
  vSeed = aSeed;

  /* content safe zone: dim particles near screen center so overlaid
     copy stays readable; full strength toward the edges */
  vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
  float centerFade = mix(uFadeMin, 1.0, smoothstep(0.16, 0.62, length(ndc * vec2(1.0, 1.25))));
  /* the scatter cloud mid-morph also dims — it dematerializes instead of
     smearing over the content */
  float stormDim = 1.0 - sin(f * 3.14159265) * 0.55;
  vFade = centerFade * stormDim;

  /* accent tint applies only while its own shape is on screen — one bit
     per shape, so each SVG keeps its own orange/blue split */
  float b0 = step(0.5, mod(aAccent, 2.0));
  float b1 = step(0.5, mod(floor(aAccent /  2.0), 2.0));
  float b2 = step(0.5, mod(floor(aAccent /  4.0), 2.0));
  float b3 = step(0.5, mod(floor(aAccent /  8.0), 2.0));
  float b4 = step(0.5, mod(floor(aAccent / 16.0), 2.0));
  vAccent = b0 * max(0.0, 1.0 - abs(uShape - 0.0))
          + b1 * max(0.0, 1.0 - abs(uShape - 1.0))
          + b2 * max(0.0, 1.0 - abs(uShape - 2.0))
          + b3 * max(0.0, 1.0 - abs(uShape - 3.0))
          + b4 * max(0.0, 1.0 - abs(uShape - 4.0));
}`;

const FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uAccentColor;
uniform float uOpacity;
varying float vSeed;
varying float vFade;
varying float vAccent;
void main(){
  float d = length(gl_PointCoord - 0.5);
  /* near-solid disc with a thin AA rim — dots read as crisp points */
  float a = smoothstep(0.5, 0.4, d) * uOpacity * vFade;
  if (a < 0.012) discard;
  vec3 col = mix(uColorA, uColorB, smoothstep(0.3, 0.95, vSeed));
  col = mix(col, uAccentColor, vAccent);
  gl_FragColor = vec4(col, a);
}`;

/* ── Scene contents (inside Canvas) ───────────────────────────────────── */

function EntityPoints({ isMobile }: { isMobile: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera);
  const pointsRef = useRef<THREE.Points>(null);

  const count = isMobile ? PARTICLE_COUNT.mobile : PARTICLE_COUNT.desktop;

  /* shapes are sampled from SVG files — async, so buffers build on arrival */
  const [built, setBuilt] = useState<BuiltShapes | null>(null);
  useEffect(() => {
    let live = true;
    buildShapes(count).then((b) => {
      if (live) setBuilt(b);
    });
    return () => {
      live = false;
    };
  }, [count]);

  const { geometry, material } = useMemo(() => {
    // stale-size guard: count changed but the new shapes haven't arrived yet
    if (!built || built.shapes[0].length !== count * 3) {
      return { geometry: null, material: null };
    }
    const { shapes, accentBits } = built;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(shapes[0], 3));
    geo.setAttribute("aP1", new THREE.BufferAttribute(shapes[1], 3));
    geo.setAttribute("aP2", new THREE.BufferAttribute(shapes[2], 3));
    geo.setAttribute("aP3", new THREE.BufferAttribute(shapes[3], 3));
    geo.setAttribute("aP4", new THREE.BufferAttribute(shapes[4], 3));
    geo.setAttribute("aAccent", new THREE.BufferAttribute(accentBits, 1));

    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      // near-uniform size — mixed sizes at low alpha is what reads as blur
      scales[i] = Math.random() < 0.02 ? 1.5 : 0.75 + Math.random() * 0.45;
    }
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    // shapes span ~±13 world units; skip per-frame culling checks
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uShape: { value: 0 },
        uTime: { value: 0 },
        uIdle: { value: ENTITY_CONFIG.idleAmp },
        uStorm: { value: ENTITY_CONFIG.stormAmp },
        uFlowFreq: { value: ENTITY_CONFIG.flowFreq },
        uSize: { value: 1 },
        uPixel: { value: Math.min(window.devicePixelRatio, 1.75) },
        uMouse: { value: new THREE.Vector3(999, 999, 0) },
        uMouseR: { value: ENTITY_CONFIG.mouse.radius },
        uMouseF: { value: isMobile ? 0 : ENTITY_CONFIG.mouse.force },
        uBlast: { value: 0 },
        uBlastOrigin: { value: new THREE.Vector3(0, 0, 0) },
        uFadeMin: { value: PALETTES.dark.fadeMin },
        uColorA: { value: new THREE.Color(PALETTES.dark.shapes[0]) },
        uColorB: { value: new THREE.Color(PALETTES.dark.shapes[0]) },
        uAccentColor: { value: new THREE.Color(PALETTES.dark.accent) },
        uOpacity: { value: PALETTES.dark.opacity },
      },
    });
    return { geometry: geo, material: mat };
  }, [built, count, isMobile]);

  useEffect(() => () => {
    geometry?.dispose();
    material?.dispose();
  }, [geometry, material]);

  useEffect(() => {
    if (!material) return;
    const u = material.uniforms;
    const cfg = ENTITY_CONFIG;

    /* palette state — theme swaps are applied inside the ticker */
    let palette: (typeof PALETTES)["dark" | "light"] =
      document.documentElement.classList.contains("dark")
        ? PALETTES.dark
        : PALETTES.light;
    let paletteDirty = true;

    const themeObs = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      const next = dark ? PALETTES.dark : PALETTES.light;
      if (next !== palette) {
        palette = next;
        material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        material.needsUpdate = true;
        paletteDirty = true;
        invalidate();
      }
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    /* cached geometry — never measured inside the tick */
    let docH = 1;
    let vh = 1;
    const measure = () => {
      docH = document.body.scrollHeight;
      vh = window.innerHeight;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    /* pointer → world space on the z=0 plane */
    const mouseNdc = { x: 999, y: 999 };
    const onPointerMove = (e: PointerEvent) => {
      mouseNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    if (!isMobile) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    /* click-to-blast: converts click coords to world space, spikes uBlast,
       then gsap decays it back to 0 — the morph target pulls particles home */
    const onClickBlast = (e: MouseEvent) => {
      const camZ = (camera as THREE.PerspectiveCamera).position.z;
      const fov = (camera as THREE.PerspectiveCamera).fov;
      const halfH = Math.tan((fov * Math.PI) / 360) * camZ;
      const halfW = halfH * (window.innerWidth / window.innerHeight);
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
      (u.uBlastOrigin.value as THREE.Vector3).set(ndcX * halfW, ndcY * halfH, 0);
      gsap.killTweensOf(u.uBlast);
      u.uBlast.value = 1.0;
      gsap.to(u.uBlast, { value: 0, duration: 1.8, ease: "expo.out" });
    };
    window.addEventListener("click", onClickBlast, { passive: true });

    const colorA = u.uColorA.value as THREE.Color;
    const colorB = u.uColorB.value as THREE.Color;
    const accentColor = u.uAccentColor.value as THREE.Color;
    const mouseWorld = u.uMouse.value as THREE.Vector3;
    const cA = new THREE.Color();
    const cB = new THREE.Color();
    const WHITE = new THREE.Color("#ffffff");

    let shapeCur = -1; // -1 = snap on first tick
    let time = 0;
    let lastColorKey = -1;

    const tick = () => {
      if (document.hidden) return;
      const dt = gsap.ticker.deltaRatio(60) / 60;
      time += dt;

      /* scroll → target shape float */
      const p = window.scrollY / Math.max(docH - vh, 1);
      const j =
        Math.min(
          Math.max((p - cfg.scrollStart) / (cfg.scrollEnd - cfg.scrollStart), 0),
          1,
        ) * (SHAPE_COUNT - 1);
      let next = shapeCur < 0 ? j : shapeCur + (j - shapeCur) * cfg.morphLerp;
      if (Math.abs(next - j) < 0.0004) next = j;
      shapeCur = next;

      /* per-shape color crossfade (+ theme swap when dirty) */
      const idx = Math.min(Math.floor(shapeCur), SHAPE_COUNT - 2);
      const frac = shapeCur - idx;
      const colorKey = idx + frac;
      if (paletteDirty || Math.abs(colorKey - lastColorKey) > 0.001) {
        cA.set(palette.shapes[idx]);
        cB.set(palette.shapes[idx + 1]);
        colorA.lerpColors(cA, cB, frac);
        // per-particle variation: a lighter tint of the same hue (no mud)
        colorB.copy(colorA).lerp(WHITE, 0.3);
        accentColor.set(palette.accent);
        u.uOpacity.value = palette.opacity;
        u.uSize.value = palette.sizeMul;
        u.uFadeMin.value = palette.fadeMin;
        lastColorKey = colorKey;
        paletteDirty = false;
      }

      /* pointer world position (perspective-correct at z=0) */
      if (!isMobile) {
        const camZ = (camera as THREE.PerspectiveCamera).position.z;
        const fov = (camera as THREE.PerspectiveCamera).fov;
        const halfH = Math.tan((fov * Math.PI) / 360) * camZ;
        const halfW = halfH * (window.innerWidth / window.innerHeight);
        mouseWorld.x += (mouseNdc.x * halfW - mouseWorld.x) * cfg.mouse.lerp;
        mouseWorld.y += (mouseNdc.y * halfH - mouseWorld.y) * cfg.mouse.lerp;
      }

      /* slow ambient yaw */
      if (pointsRef.current) {
        pointsRef.current.rotation.y =
          Math.sin(time * cfg.wobble.speed * Math.PI * 2) * cfg.wobble.amp;
      }

      u.uShape.value = shapeCur;
      u.uTime.value = time;
      invalidate();
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      themeObs.disconnect();
      ro.disconnect();
      if (!isMobile) window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClickBlast);
      gsap.killTweensOf(u.uBlast);
    };
  }, [material, camera, invalidate, isMobile]);

  if (!geometry || !material) return null;
  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/* ── Public component ─────────────────────────────────────────────────── */

export function ParticleEntity() {
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setIsMobile(matchMedia("(max-width: 768px)").matches);
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, ENTITY_CONFIG.cameraZ], fov: 50 }}
      >
        <EntityPoints isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
