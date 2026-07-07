"use client";

/**
 * BillboardMesh.tsx — The procedural 3D billboard structure.
 *
 * Contains three private helper components:
 *   BoltField        — instanced rivets along the frame perimeter
 *   PosterPanel      — a single flat display surface (front or back)
 *   BoundingBoxHelper — debug wireframe box around the model
 *
 * The exported BillboardMesh is the public component. It uses forwardRef so
 * the page can hold a ref to the imperative handle and let GSAP animate the
 * camera, poster materials, and billboard group directly.
 *
 * The billboard itself NEVER moves — it stays at the center of the world.
 * GSAP animates the camera around it, not the billboard itself.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { usePbrMaps, useMediaTexture, sharedLoader } from "./usePbrMaps";
import { usePosterMaterial } from "./usePosterMaterial";
import type { BillboardImperativeHandle, BillboardMeshProps, RepeatSettings } from "./types";

/* -------------------------------------------------------------------------- */
/*  BoltField — instanced rivets along the frame perimeter                    */
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
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 0.04, 6), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const positions = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const halfW = width / 2;
    const halfH = height / 2;
    const inset = frameWidth / 2;
    const countX = Math.max(2, Math.floor(width / spacing));
    const countY = Math.max(2, Math.floor(height / spacing));

    // Top and bottom rows
    for (let i = 0; i <= countX; i++) {
      const x = -halfW + (i / countX) * width;
      pts.push(new THREE.Vector3(x,  halfH - inset, depth / 2));
      pts.push(new THREE.Vector3(x, -halfH + inset, depth / 2));
    }
    // Left and right columns
    for (let j = 0; j <= countY; j++) {
      const y = -halfH + (j / countY) * height;
      pts.push(new THREE.Vector3(-halfW + inset, y, depth / 2));
      pts.push(new THREE.Vector3( halfW - inset, y, depth / 2));
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
/*  PosterPanel — one flat display surface (front or back)                    */
/* -------------------------------------------------------------------------- */

interface PosterPanelProps {
  width: number;
  height: number;
  z: number;
  rotationY: number;
  material: THREE.ShaderMaterial;
}

function PosterPanel({ width, height, z, rotationY, material }: PosterPanelProps) {
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
/*  BoundingBoxHelper — debug wireframe box around the billboard model        */
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

  useFrame(() => { helperRef.current?.update(); });

  return null;
}

/* -------------------------------------------------------------------------- */
/*  BillboardMesh — the complete procedural billboard structure               */
/* -------------------------------------------------------------------------- */

const BillboardMesh = forwardRef<BillboardImperativeHandle, BillboardMeshProps>(
  function BillboardMesh(props, ref) {
    const {
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      visible = true,
      wireframe: wireframeProp = false,
      cameraRef,
      ambientLightRef,
    } = props;

    /* ── Billboard dimensions ─────────────────────────────────────── */
    const dims = {
      width:        4,
      height:       2.4,
      thickness:    0.18,
      frameWidth:   0.16,
      frameDepth:   0.14,
      cornerRadius: 0.04,
      posterDepth:  0.02,
      posterGap:    0.01,
    };

    /* ── Pole ──────────────────────────────────────────────────────── */
    const poleCtl = {
      radius:        0.09,
      height:        3.4,
      segments:      16,
      position:      [0, 0, 0] as [number, number, number],
      rotation:      [0, 0, 0] as [number, number, number],
      scale:         1,
      textureRepeat: 2.5,
    };

    /* ── Rear supports and braces ─────────────────────────────────── */
    const supportCtl = {
      enableSupports:   true,
      enableRearBraces: true,
      thickness: 0.045,
      width:     0.06,
      depth:     0.06,
    };

    /* ── Poster images and visual adjustments ──────────────────────── */
    const posterCtl = {
      frontImage:     props.frontImage ?? "/homepage/herosection/1.png",
      backImage:      props.backImage  ?? "/homepage/herosection/kp.png",
      frontBrightness: 1.4,
      backBrightness:  1.4,
      frontOpacity:   1,
      backOpacity:    1,
      contrast:       1,
      saturation:     1,
      swapImages:     false,
      printScale:    180,
      printStrength: 0.35,
    };

    /* ── PBR material controls ─────────────────────────────────────── */
    const frameMatCtl = {
      metalness:        0.75,
      roughness:        0.65,
      clearcoat:        0.04,
      clearcoatRoughness: 0.5,
      normalScale:      1.2,
      envMapIntensity:  0.7,
      colorTint: "#8a9e84",
      poleMetalness:  0.3,
      poleRoughness:  0.85,
      poleColorTint: "#7a7a7a",
    };

    /* ── UV tiling ─────────────────────────────────────────────────── */
    const tilingCtl = {
      frameRepeatX: 2,
      frameRepeatY: 1,
      poleRepeatX: 1,
      poleRepeatY: 4,
      Rotation: 0,
      OffsetX:  0,
      OffsetY:  0,
    };

    const wireframeCtl = {
      wireframe:   wireframeProp,
      boundingBox: false,
      axes:        false,
    };

    /* ── Derived repeat settings ─────────────────────────────────────────── */
    const frameRepeat: RepeatSettings = useMemo(() => ({
      repeatX: tilingCtl.frameRepeatX,
      repeatY: tilingCtl.frameRepeatY,
      rotation: tilingCtl.Rotation,
      offsetX:  tilingCtl.OffsetX,
      offsetY:  tilingCtl.OffsetY,
    }), [tilingCtl.frameRepeatX, tilingCtl.frameRepeatY, tilingCtl.Rotation, tilingCtl.OffsetX, tilingCtl.OffsetY]);

    const poleRepeat: RepeatSettings = useMemo(() => ({
      repeatX: tilingCtl.poleRepeatX,
      repeatY: tilingCtl.poleRepeatY * poleCtl.textureRepeat,
      rotation: tilingCtl.Rotation,
      offsetX:  tilingCtl.OffsetX,
      offsetY:  tilingCtl.OffsetY,
    }), [tilingCtl.poleRepeatX, tilingCtl.poleRepeatY, poleCtl.textureRepeat, tilingCtl.Rotation, tilingCtl.OffsetX, tilingCtl.OffsetY]);

    /* ── Textures ─────────────────────────────────────────────────────────── */
    const frameMaps = usePbrMaps("/textures/frame", frameRepeat, "#5e6e52");
    const poleMaps  = usePbrMaps("/textures/pole",  poleRepeat,  "#6b6f66");

    const swapped       = posterCtl.swapImages;
    const frontImagePath = swapped ? posterCtl.backImage  : posterCtl.frontImage;
    const backImagePath  = swapped ? posterCtl.frontImage : posterCtl.backImage;

    const frontTexture = useMediaTexture(frontImagePath, "#070a13");
    const backTexture  = useMediaTexture(backImagePath,  "#070a13");

    const { material: frontMaterial, uniforms: frontUniforms } = usePosterMaterial(frontTexture);
    const { material: backMaterial,  uniforms: backUniforms  } = usePosterMaterial(backTexture);

    // Sync Leva controls → poster shader uniforms
    useEffect(() => {
      frontUniforms.brightness.value    = posterCtl.frontBrightness;
      frontUniforms.contrast.value      = posterCtl.contrast;
      frontUniforms.saturation.value    = posterCtl.saturation;
      frontUniforms.opacity.value       = posterCtl.frontOpacity;
      frontUniforms.printScale.value    = posterCtl.printScale;
      frontUniforms.printStrength.value = posterCtl.printStrength;
    }, [frontUniforms, posterCtl.frontBrightness, posterCtl.contrast, posterCtl.saturation, posterCtl.frontOpacity, posterCtl.printScale, posterCtl.printStrength]);

    useEffect(() => {
      backUniforms.brightness.value    = posterCtl.backBrightness;
      backUniforms.contrast.value      = posterCtl.contrast;
      backUniforms.saturation.value    = posterCtl.saturation;
      backUniforms.opacity.value       = posterCtl.backOpacity;
      backUniforms.printScale.value    = posterCtl.printScale;
      backUniforms.printStrength.value = posterCtl.printStrength;
    }, [backUniforms, posterCtl.backBrightness, posterCtl.contrast, posterCtl.saturation, posterCtl.backOpacity, posterCtl.printScale, posterCtl.printStrength]);

    /* ── Frame material (PBR physical) ───────────────────────────────────── */
    const frameMaterial = useMemo(() => {
      const mat = new THREE.MeshPhysicalMaterial({
        map:              frameMaps.map,
        roughnessMap:     frameMaps.roughnessMap,
        normalMap:        frameMaps.normalMap,
        metalness:        frameMatCtl.metalness,
        roughness:        frameMatCtl.roughness,
        clearcoat:        frameMatCtl.clearcoat,
        clearcoatRoughness: frameMatCtl.clearcoatRoughness,
        envMapIntensity:  frameMatCtl.envMapIntensity,
        color:            new THREE.Color(frameMatCtl.colorTint),
        wireframe:        wireframeCtl.wireframe,
      });
      mat.normalScale.set(frameMatCtl.normalScale, frameMatCtl.normalScale);
      return mat;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [frameMaps, frameMatCtl.metalness, frameMatCtl.roughness, frameMatCtl.clearcoat, frameMatCtl.clearcoatRoughness, frameMatCtl.normalScale, frameMatCtl.envMapIntensity, frameMatCtl.colorTint, wireframeCtl.wireframe]);
    useEffect(() => () => frameMaterial.dispose(), [frameMaterial]);

    /* ── Pole material (standard) ────────────────────────────────────────── */
    const poleMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      map:          poleMaps.map,
      roughnessMap: poleMaps.roughnessMap,
      normalMap:    poleMaps.normalMap,
      metalnessMap: poleMaps.metalnessMap,
      metalness:    frameMatCtl.poleMetalness,
      roughness:    frameMatCtl.poleRoughness,
      color:        new THREE.Color(frameMatCtl.poleColorTint),
      wireframe:    wireframeCtl.wireframe,
    }), [poleMaps, frameMatCtl.poleMetalness, frameMatCtl.poleRoughness, frameMatCtl.poleColorTint, wireframeCtl.wireframe]);
    useEffect(() => () => poleMaterial.dispose(), [poleMaterial]);

    /* ── Support / bracket material (shares frame colour) ───────────────── */
    const supportMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color:     new THREE.Color(frameMatCtl.colorTint).multiplyScalar(0.85),
      metalness: 0.8,
      roughness: 0.55,
      wireframe: wireframeCtl.wireframe,
    }), [frameMatCtl.colorTint, wireframeCtl.wireframe]);
    useEffect(() => () => supportMaterial.dispose(), [supportMaterial]);

    const boltMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: "#3b3b3b", metalness: 0.9, roughness: 0.35,
    }), []);
    useEffect(() => () => boltMaterial.dispose(), [boltMaterial]);

    /* ── Destructure dimensions for use in geometry calculations ─────────── */
    const { width, height, thickness, frameWidth, frameDepth, cornerRadius, posterDepth, posterGap } = dims;

    /* ── Frame bar layout (four RoundedBox bars around the panel) ────────── */
    const frameBars = useMemo(() => {
      const halfW = width / 2;
      const halfH = height / 2;
      return [
        { size: [width + frameWidth, frameWidth, frameDepth] as [number, number, number], position: [0,  halfH, 0] as [number, number, number] }, // top
        { size: [width + frameWidth, frameWidth, frameDepth] as [number, number, number], position: [0, -halfH, 0] as [number, number, number] }, // bottom
        { size: [frameWidth, height + frameWidth, frameDepth] as [number, number, number], position: [-halfW, 0, 0] as [number, number, number] }, // left
        { size: [frameWidth, height + frameWidth, frameDepth] as [number, number, number], position: [ halfW, 0, 0] as [number, number, number] }, // right
      ];
    }, [width, height, frameWidth, frameDepth]);

    const innerLipSize: [number, number, number] = useMemo(
      () => [width - frameWidth * 0.4, height - frameWidth * 0.4, frameDepth * 0.4],
      [width, height, frameWidth, frameDepth],
    );

    /* ── Rear support geometry ───────────────────────────────────────────── */
    const braceLength = useMemo(
      () => Math.sqrt((width / 2) ** 2 + (height / 2) ** 2),
      [width, height],
    );

    // Support group Z must sit between the front and back posters so it's hidden
    // behind them from any viewing angle. A real safety margin (not a hairline
    // offset) is used to stay above depth buffer precision limits.
    const backPosterZ = -(thickness / 2 + posterDepth / 2 + posterGap);
    const supportSafetyMargin = 0.05;
    const supportZ = useMemo(
      () => backPosterZ + supportSafetyMargin + supportCtl.depth / 2,
      [backPosterZ, supportCtl.depth],
    );

    /* ── Memoized geometries (avoid re-allocation on every Leva tweak) ───── */
    const poleGeometry = useMemo(
      () => new THREE.CylinderGeometry(poleCtl.radius, poleCtl.radius * 1.05, poleCtl.height, poleCtl.segments),
      [poleCtl.radius, poleCtl.height, poleCtl.segments],
    );
    useEffect(() => () => poleGeometry.dispose(), [poleGeometry]);

    const basePlateGeometry = useMemo(
      () => new THREE.CylinderGeometry(poleCtl.radius * 3.2, poleCtl.radius * 3.4, 0.04, 24),
      [poleCtl.radius],
    );
    useEffect(() => () => basePlateGeometry.dispose(), [basePlateGeometry]);

    const baseBoltGeometry = useMemo(() => new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), []);
    useEffect(() => () => baseBoltGeometry.dispose(), [baseBoltGeometry]);

    const baseBoltPositions = useMemo(() => {
      const r = poleCtl.radius * 2.7;
      return Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number];
      });
    }, [poleCtl.radius]);

    const trussBarGeometry = useMemo(
      () => new THREE.BoxGeometry(width * 0.9, supportCtl.thickness, supportCtl.depth),
      [width, supportCtl.thickness, supportCtl.depth],
    );
    useEffect(() => () => trussBarGeometry.dispose(), [trussBarGeometry]);

    const bracketGeometry = useMemo(
      () => new THREE.BoxGeometry(supportCtl.width * 2.4, supportCtl.width * 2.4, supportCtl.depth * 1.6),
      [supportCtl.width, supportCtl.depth],
    );
    useEffect(() => () => bracketGeometry.dispose(), [bracketGeometry]);

    const braceGeometry = useMemo(
      () => new THREE.CylinderGeometry(supportCtl.thickness / 2, supportCtl.thickness / 2, braceLength, 8),
      [supportCtl.thickness, braceLength],
    );
    useEffect(() => () => braceGeometry.dispose(), [braceGeometry]);

    // Smoothness 2 is visually indistinguishable from 3–4 at this scale but
    // roughly halves the bevel triangle count across 5 RoundedBox meshes.
    const ROUNDED_SMOOTHNESS = 2;

    /* ── Vertical centering ──────────────────────────────────────────────── */
    // Shifts all geometry so that the model's geometric centre is at origin.
    // This means position [0,0,0] = the visual centre of the whole model,
    // which makes GSAP camera targeting much simpler.
    const poleEmbed    = frameWidth * 0.5;
    const frameMountY  = useMemo(() => poleCtl.height - poleEmbed + height / 2,                           [poleCtl.height, poleEmbed, height]);
    const totalModelHeight = useMemo(() => poleCtl.height - poleEmbed + height + frameWidth / 2,          [poleCtl.height, poleEmbed, height, frameWidth]);
    const centerOffsetY = -totalModelHeight / 2;

    /* ── changePoster — GSAP-driven poster crossfade ─────────────────────── */
    // Fades the current poster opacity to zero, swaps the texture, then fades
    // back in. This gives a smooth dissolve between campaign artworks without
    // ever flickering or showing a blank frame.
    //
    // Usage from page.tsx:
    //   billboardRef.current.changePoster("front", "/posters/campaign-2.jpg");
    //   billboardRef.current.changePoster("back",  "/posters/digital-led.jpg", 1.2);
    const changePoster = useCallback(
      (face: "front" | "back", imageUrl: string, duration = 0.8) => {
        const uniforms = face === "front" ? frontUniforms : backUniforms;

        // Phase 1: fade out the current artwork
        gsap.to(uniforms.opacity, {
          value: 0,
          duration: duration / 2,
          ease: "power2.in",
          onComplete: () => {
            // Phase 2: load the new image, then fade back in
            sharedLoader.load(
              imageUrl,
              (tex) => {
                tex.anisotropy = 4;
                uniforms.map.value = tex;
                gsap.to(uniforms.opacity, {
                  value: 1,
                  duration: duration / 2,
                  ease: "power2.out",
                });
              },
              undefined,
              () => {
                // If the image fails to load, fade back in with the existing texture
                // so the panel is never left invisible.
                console.warn(`[Billboard] Failed to load poster: ${imageUrl}`);
                gsap.to(uniforms.opacity, { value: 1, duration: duration / 2 });
              },
            );
          },
        });
      },
      [frontUniforms, backUniforms],
    );

    /* ── Group ref + imperative handle ───────────────────────────────────── */
    const groupRef = useRef<THREE.Group>(null);

    // No manual scale-hiding here. The billboard starts at scale 1.
    // In the hero section the camera looks away (target at +Z, billboard at origin
    // is behind the camera), so the billboard is naturally invisible without tricks.
    // GSAP in page.tsx uses gsap.fromTo on group.scale for the About-section entrance.

    // Expose camera, cameraTarget, controls, lighting, materials, and changePoster to the page.
    // The page (and GSAP) access these to drive all animation.
    useImperativeHandle(ref, () => ({
      group:         groupRef.current,
      camera:        cameraRef?.current        ?? null,
      // cameraTarget is now managed internally by Scene.tsx's useFrame loop
      cameraTarget:  null,
      ambientLight:  ambientLightRef?.current  ?? null,
      frontMaterial,
      backMaterial,
      frontUniforms,
      backUniforms,
      changePoster,
    }), [frontMaterial, backMaterial, frontUniforms, backUniforms, changePoster]);

    /* ── JSX ─────────────────────────────────────────────────────────────── */
    return (
      <group ref={groupRef} position={position} rotation={rotation} scale={scale} visible={visible}>

        {/* Centering wrapper — all geometry inside here is shifted so the
            model's geometric centre aligns to the group's origin. */}
        <group position={[0, centerOffsetY, 0]}>

          {/* ── Frame ── */}
          <group position={[0, frameMountY, 0]}>

            {/* Four border bars forming the rectangular frame */}
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

            {/* Inner lip that sits just behind the poster panels */}
            <RoundedBox
              args={innerLipSize}
              radius={Math.min(cornerRadius * 0.6, 0.03)}
              smoothness={ROUNDED_SMOOTHNESS}
              position={[0, 0, -frameDepth * 0.2]}
              material={frameMaterial}
            />

            {/* Rivets around the perimeter */}
            <BoltField
              width={width}
              height={height}
              frameWidth={frameWidth}
              depth={frameDepth}
              material={boltMaterial}
            />

            {/* Front and back poster display surfaces */}
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

            {/* Rear horizontal truss bar + mounting bracket */}
            {supportCtl.enableSupports && (
              <group position={[0, 0, supportZ]}>
                <mesh geometry={trussBarGeometry} material={supportMaterial} />
                <mesh position={[0, -0.1, 0]} geometry={bracketGeometry} material={supportMaterial} />
              </group>
            )}

            {/* Rear diagonal braces (X pattern) */}
            {supportCtl.enableRearBraces && (
              <group position={[0, 0, supportZ]}>
                <mesh rotation={[0, 0,  Math.atan2(height, width)]} geometry={braceGeometry} material={supportMaterial} />
                <mesh rotation={[0, 0, -Math.atan2(height, width)]} geometry={braceGeometry} material={supportMaterial} />
              </group>
            )}
          </group>

          {/* ── Pole ── */}
          <group position={poleCtl.position} rotation={poleCtl.rotation} scale={poleCtl.scale}>
            <mesh position={[0, poleCtl.height / 2, 0]} geometry={poleGeometry} material={poleMaterial} />
            <mesh position={[0, 0.02, 0]} geometry={basePlateGeometry} material={supportMaterial} />
            <group position={[0, 0.045, 0]}>
              {baseBoltPositions.map((p, i) => (
                <mesh key={i} position={p} geometry={baseBoltGeometry} material={boltMaterial} />
              ))}
            </group>
          </group>

        </group>{/* end centering wrapper */}

        {/* ── Debug helpers ── */}
        {wireframeCtl.axes && <axesHelper args={[Math.max(width, height, poleCtl.height)]} />}
        {wireframeCtl.boundingBox && <BoundingBoxHelper targetRef={groupRef} />}

      </group>
    );
  },
);

BillboardMesh.displayName = "BillboardMesh";

export { BillboardMesh };
