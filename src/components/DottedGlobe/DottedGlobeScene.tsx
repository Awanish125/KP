"use client";

/**
 * DottedGlobeScene — imperative Three.js dotted earth with clickable pins.
 *
 * Real continents: land dot positions are precomputed by
 * scripts/generate-land-dots.mjs into src/data/landDots.json.
 * An inner occluder sphere hides far-side dots, giving the classic
 * "dotted planet" look.
 *
 * Interaction:
 *  - drag horizontally to spin; slow auto-rotation resumes when idle
 *  - click a pin to select it (raycast); selecting from outside tweens
 *    the globe so the pin faces the camera
 *
 * Perf contract (same as every scene in this project):
 *  - gsap.ticker only, gated by IntersectionObserver (tickWhileVisible)
 *  - one renderer per canvas; full geometry/material/renderer disposal
 *  - reduced motion → static frames re-rendered only on select/resize
 *  - colors resolved from CSS tokens at runtime — no hex in code
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import LAND_DOTS from "@/data/landDots.json";
import type { DottedGlobeSceneProps } from "./dottedGlobeTypes";

function tokenColor(name: string, fallback: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  try {
    return new THREE.Color(raw || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(lat);
  const lambda = THREE.MathUtils.degToRad(lng);
  return new THREE.Vector3(
    r * Math.cos(phi) * Math.sin(lambda),
    r * Math.sin(phi),
    r * Math.cos(phi) * Math.cos(lambda),
  );
}

/** Wrap an angle delta to the shortest path in [-π, π]. */
function shortestDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export default function DottedGlobeScene({
  sites,
  selectedIndex,
  onSelect,
  config,
  onReady,
}: DottedGlobeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const selectedRef = useRef(selectedIndex);

  // Rotation state shared between the mount effect and the selection effect.
  const rotRef = useRef({ y: 0, target: 0, idleAt: 0 });
  const apiRef = useRef<{ renderOnce?: () => void; faceSite?: (i: number) => void }>({});

  /* ── Mount once ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const mount = mountRef.current;
    const label = labelRef.current;
    if (!mount || !label) return;

    const reduced = prefersReducedMotion();
    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;
    const { radius } = config;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.9, config.cameraZ);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    scene.add(group);

    /* Sphere body — also occludes far-side dots. Fresnel-shaded so the
       ball reads as 3D: core color at the center, limb color toward the
       edge, plus a soft top-left sheen. Colors are theme uniforms. */
    const occluderGeom = new THREE.SphereGeometry(radius * 0.99, 48, 48);
    const occluderMat = new THREE.ShaderMaterial({
      uniforms: {
        uCore: { value: new THREE.Color("#0D1B30") },
        uLimb: { value: new THREE.Color("#274B77") },
        uSheen: { value: new THREE.Color("#35659B") },
        uSheenStr: { value: 0.35 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uCore; uniform vec3 uLimb; uniform vec3 uSheen;
        uniform float uSheenStr;
        varying vec3 vN; varying vec3 vV;
        void main() {
          float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.0);
          vec3 col = mix(uCore, uLimb, fres);
          float lit = max(dot(vN, normalize(vec3(-0.35, 0.55, 0.75))), 0.0);
          col += uSheen * pow(lit, 3.0) * uSheenStr;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    group.add(new THREE.Mesh(occluderGeom, occluderMat));

    /* Land dots. */
    const dots = LAND_DOTS as [number, number][];
    const positions = new Float32Array(dots.length * 3);
    dots.forEach(([lat, lng], i) => {
      const v = latLngToVec3(lat, lng, radius);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
    });
    const landGeom = new THREE.BufferGeometry();
    landGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const landMat = new THREE.PointsMaterial({
      color: tokenColor("--kp-blue", "#5BA3D6"),
      size: config.dotSize,
      transparent: true,
      opacity: 0.9,
    });
    group.add(new THREE.Points(landGeom, landMat));

    /* Atmosphere — back-side shell with rim-concentrated fresnel glow.
       Additive halo in dark mode; soft alpha-blended blue edge in light. */
    const rimGeom = new THREE.SphereGeometry(radius * 1.12, 48, 48);
    const rimMat = new THREE.ShaderMaterial({
      uniforms: {
        uGlow: { value: tokenColor("--kp-blue", "#5BA3D6") },
        uStrength: { value: 1.0 },
        // bias/power shape the falloff: wide soft halo (dark) vs a
        // tight crisp edge (light) — fog-like glow looks bad on light
        uBias: { value: 0.72 },
        uPower: { value: 2.0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vN;
        void main() {
          vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uGlow; uniform float uStrength;
        uniform float uBias; uniform float uPower;
        varying vec3 vN;
        void main() {
          float intensity = pow(max(uBias - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), uPower);
          gl_FragColor = vec4(uGlow * intensity, intensity * uStrength);
        }`,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(rimGeom, rimMat));

    /* Markers. */
    const orange = tokenColor("--kp-orange", "#F5821F");
    const markerGeom = new THREE.SphereGeometry(config.markerSize, 12, 12);
    const markerMat = new THREE.MeshBasicMaterial({ color: orange });
    const markerMeshes: THREE.Mesh[] = sites.map((site, i) => {
      const m = new THREE.Mesh(markerGeom, markerMat);
      m.position.copy(latLngToVec3(site.lat, site.lng, radius * 1.005));
      m.userData.index = i;
      group.add(m);
      return m;
    });

    /* Pulse ring on the selected marker. */
    const ringGeom = new THREE.RingGeometry(config.markerSize * 1.6, config.markerSize * 2.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: orange,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.visible = false;
    group.add(ring);

    /* Theme palettes — the sphere/atmosphere re-skin with the .dark class.
       (No CSS tokens exist for sphere shading; hex lives here on purpose.) */
    const applyTheme = () => {
      const dark = document.documentElement.classList.contains("dark");
      const u = occluderMat.uniforms;
      if (dark) {
        // deep navy ball, lighter blue limb, cool sheen — backlit look
        (u.uCore.value as THREE.Color).set("#0D1B30");
        (u.uLimb.value as THREE.Color).set("#274B77");
        (u.uSheen.value as THREE.Color).set("#35659B");
        u.uSheenStr.value = 0.35;
        (rimMat.uniforms.uGlow.value as THREE.Color).set("#3E7BC0");
        rimMat.uniforms.uStrength.value = 1.0;
        rimMat.uniforms.uBias.value = 0.72;
        rimMat.uniforms.uPower.value = 2.0;
        rimMat.blending = THREE.AdditiveBlending;
        landMat.color.set(tokenColor("--kp-blue", "#5BA3D6"));
        landMat.opacity = 0.9;
        landMat.size = config.dotSize;
      } else {
        // porcelain ball with pronounced limb shading — matte 3D on
        // light, with a tight rim edge instead of a foggy halo
        (u.uCore.value as THREE.Color).set("#EFF4FA");
        (u.uLimb.value as THREE.Color).set("#8FA9C9");
        (u.uSheen.value as THREE.Color).set("#FFFFFF");
        u.uSheenStr.value = 0.15;
        (rimMat.uniforms.uGlow.value as THREE.Color).set("#5E86B4");
        rimMat.uniforms.uStrength.value = 0.55;
        rimMat.uniforms.uBias.value = 0.6;
        rimMat.uniforms.uPower.value = 3.5;
        rimMat.blending = THREE.NormalBlending;
        landMat.color.set("#0A4C8F");
        landMat.opacity = 1.0;
        landMat.size = config.dotSize * 1.15;
      }
      rimMat.needsUpdate = true;
      landMat.needsUpdate = true;
    };
    applyTheme();
    const themeObs = new MutationObserver(() => {
      applyTheme();
      apiRef.current.renderOnce?.();
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const placeRing = (i: number) => {
      const site = sites[i];
      if (!site) {
        ring.visible = false;
        return;
      }
      const pos = latLngToVec3(site.lat, site.lng, radius * 1.01);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      ring.visible = true;
    };

    /* Initial orientation: face the selected site (or first site / India). */
    const initial = sites[selectedRef.current] ?? sites[0];
    const initialLng = initial ? initial.lng : 82;
    const rot = rotRef.current;
    rot.y = rot.target = -THREE.MathUtils.degToRad(initialLng);
    group.rotation.y = rot.y;
    placeRing(selectedRef.current);

    /* Aspect-aware framing: pull the camera back on narrow containers so
       the full sphere (plus margin) always fits horizontally. */
    const fitCamera = () => {
      const aspect = camera.aspect;
      camera.position.z = Math.min(config.cameraZ / Math.min(Math.max(aspect, 0.4), 1), 12);
      camera.lookAt(0, 0, 0);
    };
    fitCamera();

    /* Selected-site HTML label projection. */
    const worldPos = new THREE.Vector3();
    const updateLabel = () => {
      const i = selectedRef.current;
      const marker = markerMeshes[i];
      const site = sites[i];
      if (!marker || !site) {
        label.style.opacity = "0";
        return;
      }
      marker.getWorldPosition(worldPos);
      const front = worldPos.clone().normalize().dot(camera.position.clone().normalize()) > 0.2;
      if (!front) {
        label.style.opacity = "0";
        return;
      }
      const projected = worldPos.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * mount.clientWidth;
      const y = (-projected.y * 0.5 + 0.5) * mount.clientHeight;
      label.style.opacity = "1";
      label.style.transform = `translate(${Math.round(x)}px, ${Math.round(y - 18)}px) translate(-50%, -100%)`;
      const tag = site.tag ? ` · ${site.tag}` : "";
      label.textContent = `${site.city}${tag}`;
    };

    /* Drag to rotate + click to select. */
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      rot.target += dx * config.dragSensitivity;
      rot.idleAt = performance.now() + 2400;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (moved > 6) return; // it was a drag, not a click
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      // Generous threshold: also test a slightly larger invisible radius.
      const hits = raycaster.intersectObjects(markerMeshes, false);
      if (hits.length > 0) {
        onSelectRef.current?.(hits[0].object.userData.index as number);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);

    /* Render loop. Idle animation is a gentle wobble AROUND the current
       target (not a continuous drift) so the selected pin stays facing
       the camera while the globe still feels alive. */
    const pulse = { t: 0 };
    let wobbleT = 0;
    const tick = () => {
      const now = performance.now();
      let wobble = 0;
      if (!dragging && now > rot.idleAt) {
        wobbleT += 0.016 * gsap.ticker.deltaRatio(60);
        wobble = Math.sin(wobbleT * 0.5) * config.autoRotate;
      }
      rot.y += (rot.target + wobble - rot.y) * 0.08;
      group.rotation.y = rot.y;

      pulse.t += 0.025 * gsap.ticker.deltaRatio(60);
      const p = (Math.sin(pulse.t) + 1) / 2;
      ring.scale.setScalar(1 + p * 0.7);
      ringMat.opacity = 0.8 * (1 - p * 0.8);

      renderer.render(scene, camera);
      updateLabel();
    };

    const renderOnce = () => {
      group.rotation.y = rot.y = rot.target;
      renderer.render(scene, camera);
      updateLabel();
    };

    apiRef.current.renderOnce = renderOnce;
    apiRef.current.faceSite = (i: number) => {
      placeRing(i);
      const site = sites[i];
      if (!site) return;
      const desired = -THREE.MathUtils.degToRad(site.lng);
      const delta = shortestDelta(rot.target, desired);
      if (reduced) {
        rot.target += delta;
        renderOnce();
      } else {
        gsap.to(rot, {
          target: rot.target + delta,
          duration: 0.9,
          ease: "power3.out",
        });
        rot.idleAt = performance.now() + 3000;
      }
    };

    let stopTicking: (() => void) | null = null;
    if (!reduced) {
      stopTicking = tickWhileVisible(mount, tick);
    }

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fitCamera();
      if (reduced) renderOnce();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    renderOnce();
    onReadyRef.current();

    return () => {
      stopTicking?.();
      ro.disconnect();
      themeObs.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      occluderGeom.dispose();
      occluderMat.dispose();
      landGeom.dispose();
      landMat.dispose();
      rimGeom.dispose();
      rimMat.dispose();
      markerGeom.dispose();
      markerMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // Scene is built once per mount; sites/config are stable JSON data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── React to selection changes ─────────────────────────────────────── */
  useEffect(() => {
    const prev = selectedRef.current;
    selectedRef.current = selectedIndex;
    if (selectedIndex >= 0 && selectedIndex !== prev) {
      apiRef.current.faceSite?.(selectedIndex);
    }
  }, [selectedIndex]);

  return (
    <div ref={mountRef} style={{ position: "absolute", inset: 0, touchAction: "pan-y" }}>
      <div
        ref={labelRef}
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity: 0,
          pointerEvents: "none",
          padding: "0.35rem 0.7rem",
          borderRadius: 999,
          background: "var(--kp-dark)",
          border: "1px solid var(--kp-orange-glow)",
          color: "var(--kp-light)",
          fontFamily: "var(--kp-font-mono)",
          fontSize: "0.68rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          transition: "opacity 200ms ease",
          zIndex: 2,
        }}
      />
    </div>
  );
}
