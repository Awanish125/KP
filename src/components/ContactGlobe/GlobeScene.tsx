"use client";

/**
 * GlobeScene — imperative Three.js points globe with a pulsing marker on
 * Maharashtra. Loaded lazily (dynamic import) by ContactGlobe.
 *
 * Perf contract:
 *  - gsap.ticker is the ONLY loop (no parallel requestAnimationFrame);
 *    rendering runs solely while the canvas is on screen (tickWhileVisible).
 *  - Exactly one renderer per canvas; geometries/materials/renderer all
 *    disposed on unmount.
 *  - Mouse parallax: pointer listener stores a target; the camera lerps
 *    toward it per tick. Listener detached while off-screen.
 *  - Reduced motion → single static frame (re-rendered on resize only).
 *  - Colors resolved from CSS tokens at runtime — no hex in code.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import type { GlobeSceneProps } from "./contactGlobeTypes";

function tokenColor(name: string, fallback: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
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

export default function GlobeScene({ config, onReady }: GlobeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = prefersReducedMotion();
    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    /* ── Renderer / scene / camera ─────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 6);

    const group = new THREE.Group();
    scene.add(group);

    /* ── Points sphere (Fibonacci distribution) ────────────────────── */
    const { pointCount, radius } = config;
    const positions = new Float32Array(pointCount * 3);
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < pointCount; i++) {
      const y = 1 - (i / (pointCount - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = GOLDEN * i;
      positions[i * 3] = Math.cos(theta) * r * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * r * radius;
    }
    const pointsGeom = new THREE.BufferGeometry();
    pointsGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({
      color: tokenColor("--kp-blue", "#5BA3D6"),
      size: 0.028,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    group.add(new THREE.Points(pointsGeom, pointsMat));

    /* ── Marker on Maharashtra + pulse ring ────────────────────────── */
    const orange = tokenColor("--kp-orange", "#F5821F");
    const markerPos = latLngToVec3(config.marker.lat, config.marker.lng, radius * 1.01);

    const markerGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: orange });
    const marker = new THREE.Mesh(markerGeom, markerMat);
    marker.position.copy(markerPos);
    group.add(marker);

    const ringGeom = new THREE.RingGeometry(0.09, 0.11, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: orange,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(markerPos);
    ring.lookAt(markerPos.clone().multiplyScalar(2)); // face outward
    group.add(ring);

    // Face the marker's longitude toward the camera (+z).
    const baseRotY = -THREE.MathUtils.degToRad(config.marker.lng);
    group.rotation.y = baseRotY;

    /* ── Mouse parallax target ─────────────────────────────────────── */
    const target = { x: 0, y: 0.4 };
    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.x = nx * config.parallax;
      target.y = 0.4 - ny * config.parallax * 0.6;
    };

    /* ── Render loop (gsap.ticker, gated by IntersectionObserver) ──── */
    const tick = (time: number) => {
      group.rotation.y = baseRotY + Math.sin(time * 0.25) * config.wobble;
      const pulse = (Math.sin(time * 2.4) + 1) / 2; // 0…1
      ring.scale.setScalar(1 + pulse * 0.9);
      ringMat.opacity = 0.8 * (1 - pulse);
      camera.position.x += (target.x - camera.position.x) * config.lerp;
      camera.position.y += (target.y - camera.position.y) * config.lerp;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    let stopTicking: (() => void) | null = null;
    if (!reduced) {
      stopTicking = tickWhileVisible(mount, tick as () => void, {
        onEnter: () => window.addEventListener("pointermove", onPointerMove),
        onLeave: () => window.removeEventListener("pointermove", onPointerMove),
      });
    }

    /* ── Resize ────────────────────────────────────────────────────── */
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (reduced) renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // First frame + ready signal (AssetLoader unmounts instantly, no outro).
    renderer.render(scene, camera);
    onReadyRef.current();

    /* ── Cleanup ───────────────────────────────────────────────────── */
    return () => {
      stopTicking?.();
      window.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();
      pointsGeom.dispose();
      pointsMat.dispose();
      markerGeom.dispose();
      markerMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // config is a stable module-level object — mount-once effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />;
}
