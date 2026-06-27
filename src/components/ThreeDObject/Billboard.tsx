"use client";

import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, RefObject } from "react";
import {
  Canvas,
  useLoader,
  useThree,
} from "@react-three/fiber";
import {
  AccumulativeShadows,
  ContactShadows,
  Environment,
  PerspectiveCamera,
  RoundedBox,
  useHelper,
} from "@react-three/drei";
import { Leva, button, folder, useControls } from "leva";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

const DEFAULT_FRONT_POSTER = "/posters/front.jpg";
const DEFAULT_BACK_POSTER = "/posters/back.jpg";
const DEFAULT_FRAME_COLOR = "/textures/metals/green_metal_rust_diff_2k.jpg";
const DEFAULT_FRAME_NORMAL = "/textures/metals/green_metal_rust_nor_gl_2k.exr";
const DEFAULT_FRAME_ROUGHNESS = "/textures/metals/green_metal_rust_rough_2k.jpg";
const DEFAULT_FRAME_HEIGHT = "/textures/metals/green_metal_rust_disp_2k.png";
const DEFAULT_POLE_COLOR = "/textures/poles/polystyrene_diff_2k.jpg";
const DEFAULT_POLE_NORMAL = "/textures/poles/polystyrene_nor_gl_2k.exr";
const DEFAULT_POLE_ROUGHNESS = "/textures/poles/polystyrene_rough_2k.exr";
const DEFAULT_POLE_HEIGHT = "/textures/poles/polystyrene_disp_2k.png";

type Vector3 = [number, number, number];

export interface BillboardHandles {
  root: THREE.Group | null;
  frameMaterial: THREE.MeshPhysicalMaterial | null;
  poleMaterial: THREE.MeshPhysicalMaterial | null;
  posterFrontMaterial: THREE.MeshBasicMaterial | null;
  posterBackMaterial: THREE.MeshBasicMaterial | null;
}

export interface BillboardProps {
  className?: string;
  style?: CSSProperties;
  debug?: boolean;
  environmentPath?: string;
  frontImage?: string;
  backImage?: string;
  onReady?: (handles: BillboardHandles) => void;
}

type BillboardControlSchema = {
  Billboard: {
    billboardWidth: number;
    billboardHeight: number;
    billboardFrameWidth: number;
    billboardFrameThickness: number;
    billboardCornerRadius: number;
    billboardPosterDepth: number;
    billboardPosterGap: number;
  };
  Pole: {
    poleHeight: number;
    poleRadius: number;
    poleSegments: number;
    polePosition: Vector3;
    poleRotation: Vector3;
    poleScale: Vector3;
  };
  Supports: {
    supportsEnableSupports: boolean;
    supportsEnableRearBraces: boolean;
    thickness: number;
    width: number;
    depth: number;
  };
  Posters: {
    posterFrontImage: string;
    posterBackImage: string;
    posterFrontOpacity: number;
    posterBackOpacity: number;
    posterBrightness: number;
    posterContrast: number;
    posterSaturation: number;
    posterSwapImages: boolean;
  };
  Materials: {
    materialMetalness: number;
    materialRoughness: number;
    materialClearcoat: number;
    materialClearcoatRoughness: number;
    materialNormalScale: number;
    materialBumpScale: number;
    materialEnvironmentIntensity: number;
    materialFrameTint: string;
    materialPoleTint: string;
  };
  "Texture Tiling": {
    frameRepeatX: number;
    frameRepeatY: number;
    poleRepeatX: number;
    poleRepeatY: number;
  };
  Lighting: {
    lightingAmbient: number;
    lightingDirectional: number;
    lightingRim: number;
    lightingFill: number;
    lightingExposure: number;
    lightingHdrIntensity: number;
    lightingShadowBias: number;
    lightingUseAccumulativeShadows: boolean;
  };
  Camera: {
    cameraPosition: Vector3;
    cameraRotation: Vector3;
    cameraFov: number;
    cameraTarget: Vector3;
  };
  Transform: {
    transformPosition: Vector3;
    transformRotation: Vector3;
    transformScale: Vector3;
  };
  Debug: {
    debugWireframe: boolean;
    debugHelpers: boolean;
    debugAxes: boolean;
    debugBoundingBox: boolean;
  };
};

function configureTexture(texture: THREE.Texture, repeatX: number, repeatY: number) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function useRepeatedTexture(
  texture: THREE.Texture,
  repeatX: number,
  repeatY: number,
  colorSpace?: boolean,
) {
  const repeated = useMemo(() => {
    const next = configureTexture(texture.clone(), repeatX, repeatY);
    if (colorSpace) {
      next.colorSpace = THREE.SRGBColorSpace;
    }
    return next;
  }, [colorSpace, repeatX, repeatY, texture]);

  useEffect(() => {
    return () => {
      repeated.dispose();
    };
  }, [repeated]);

  return repeated;
}

function usePosterTexture(
  source: THREE.Texture,
  brightness: number,
  contrast: number,
  saturation: number,
) {
  const texture = useMemo(() => {
    const image = source.image as CanvasImageSource & {
      width: number;
      height: number;
    };

    if (!image || !image.width || !image.height) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
    context.drawImage(image, 0, 0);
    context.filter = "none";

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.anisotropy = 8;
    nextTexture.needsUpdate = true;

    return nextTexture;
  }, [brightness, contrast, saturation, source]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}

function buildLinkGeometry(start: Vector3, end: Vector3, radius: number) {
  const startVector = new THREE.Vector3(...start);
  const endVector = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVector, startVector);
  const length = direction.length();
  const midpoint = new THREE.Vector3()
    .addVectors(startVector, endVector)
    .multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );

  return {
    length,
    midpoint,
    quaternion,
    radius,
  };
}

function CameraRig({
  cameraPosition: position,
  cameraRotation: rotation,
  cameraTarget: target,
  cameraFov: fov,
}: BillboardControlSchema["Camera"]) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) {
      return;
    }

    camera.position.set(...position);
    camera.rotation.set(...rotation);
    camera.lookAt(...target);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [fov, position, rotation, target]);

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={position}
      rotation={rotation}
      fov={fov}
      near={0.1}
      far={100}
    />
  );
}

type BillboardAssetProps = {
  width: number;
  height: number;
  frameWidth: number;
  frameThickness: number;
  cornerRadius: number;
  posterDepth: number;
  posterGap: number;
  poleHeight: number;
  poleRadius: number;
  poleSegments: number;
  polePosition: Vector3;
  poleRotation: Vector3;
  poleScale: Vector3;
  enableSupports: boolean;
  enableRearBraces: boolean;
  supportThickness: number;
  supportWidth: number;
  supportDepth: number;
  frameTint: string;
  poleTint: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  normalScale: number;
  bumpScale: number;
  environmentIntensity: number;
  wireframe: boolean;
  helpers: boolean;
  axes: boolean;
  boundingBox: boolean;
  frameColorMap: THREE.Texture;
  frameNormalMap: THREE.Texture;
  frameRoughnessMap: THREE.Texture;
  frameHeightMap: THREE.Texture;
  poleColorMap: THREE.Texture;
  poleNormalMap: THREE.Texture;
  poleRoughnessMap: THREE.Texture;
  poleHeightMap: THREE.Texture;
  frontPosterTexture: THREE.Texture;
  backPosterTexture: THREE.Texture;
  frontPosterOpacity: number;
  backPosterOpacity: number;
  transform: BillboardControlSchema["Transform"];
};

const BillboardAsset = forwardRef<BillboardHandles, BillboardAssetProps>(
  function BillboardAsset(
    {
      width,
      height,
      frameWidth,
      frameThickness,
      cornerRadius,
      posterDepth,
      posterGap,
      poleHeight,
      poleRadius,
      poleSegments,
      polePosition,
      poleRotation,
      poleScale,
      enableSupports,
      enableRearBraces,
      supportThickness,
      supportWidth,
      supportDepth,
      frameTint,
      poleTint,
      metalness,
      roughness,
      clearcoat,
      clearcoatRoughness,
      normalScale,
      bumpScale,
      environmentIntensity,
      wireframe,
      helpers,
      axes,
      boundingBox,
      frameColorMap,
      frameNormalMap,
      frameRoughnessMap,
      frameHeightMap,
      poleColorMap,
      poleNormalMap,
      poleRoughnessMap,
      poleHeightMap,
      frontPosterTexture,
      backPosterTexture,
      frontPosterOpacity,
      backPosterOpacity,
      transform,
    },
    ref,
  ) {
    const rootRef = useRef<THREE.Group>(null);
    const frameMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const poleMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const posterFrontMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const posterBackMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    useHelper(
      boundingBox ? (rootRef as RefObject<THREE.Object3D>) : null,
      THREE.BoxHelper,
      0xfbbf24,
    );

    const normalScaleVector = useMemo(
      () => new THREE.Vector2(normalScale, normalScale),
      [normalScale],
    );

    const posterWidth = width - frameWidth * 2 - posterGap * 2;
    const posterHeight = height - frameWidth * 2 - posterGap * 2;
    const outerDepth = frameThickness;
    const innerDepth = frameThickness * 0.72;
    const posterInset = frameThickness * 0.1;

    useImperativeHandle(
      ref,
      () => ({
        root: rootRef.current,
        frameMaterial: frameMaterialRef.current,
        poleMaterial: poleMaterialRef.current,
        posterFrontMaterial: posterFrontMaterialRef.current,
        posterBackMaterial: posterBackMaterialRef.current,
      }),
      [],
    );

    return (
      <group
        ref={rootRef}
        position={transform.transformPosition}
        rotation={transform.transformRotation}
        scale={transform.transformScale}
      >
        {helpers ? <gridHelper args={[40, 40, "#20322b", "#111a16"]} /> : null}
        {axes ? <axesHelper args={[6]} /> : null}

        <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <RoundedBox
            args={[width, height, outerDepth]}
            radius={cornerRadius}
            smoothness={6}
            bevelSegments={4}
            castShadow
            receiveShadow
            position={[0, 0, 0]}
          >
              <meshPhysicalMaterial
                ref={frameMaterialRef}
                color={frameTint}
                map={frameColorMap}
                normalMap={frameNormalMap}
                roughnessMap={frameRoughnessMap}
                bumpMap={frameHeightMap}
                metalness={metalness}
                roughness={roughness}
                clearcoat={clearcoat}
              clearcoatRoughness={clearcoatRoughness}
              envMapIntensity={environmentIntensity}
              normalScale={normalScaleVector}
              bumpScale={bumpScale}
              wireframe={wireframe}
            />
          </RoundedBox>

          <RoundedBox
            args={[width - frameWidth * 1.35, height - frameWidth * 1.35, innerDepth]}
            radius={Math.max(cornerRadius * 0.75, 0.01)}
            smoothness={6}
            bevelSegments={4}
            castShadow
            receiveShadow
            position={[0, 0, -posterInset]}
          >
            <meshPhysicalMaterial
              color={new THREE.Color(frameTint).multiplyScalar(0.72)}
              metalness={metalness * 0.8}
              roughness={roughness + 0.08}
              clearcoat={clearcoat * 0.45}
              clearcoatRoughness={clearcoatRoughness + 0.05}
              envMapIntensity={environmentIntensity * 0.75}
              normalScale={normalScaleVector}
              bumpScale={bumpScale * 0.5}
              wireframe={wireframe}
            />
          </RoundedBox>

          <RoundedBox
            args={[posterWidth, posterHeight, posterDepth]}
            radius={Math.max(cornerRadius * 0.55, 0.008)}
            smoothness={6}
            bevelSegments={4}
            castShadow
            receiveShadow
            position={[0, 0, posterInset]}
          >
            <meshPhysicalMaterial
              color={new THREE.Color(frameTint).multiplyScalar(0.35)}
              metalness={0.25}
              roughness={0.82}
              clearcoat={0.08}
              clearcoatRoughness={0.75}
              envMapIntensity={environmentIntensity * 0.45}
              normalScale={normalScaleVector}
              bumpScale={bumpScale * 0.25}
            />
          </RoundedBox>

          <mesh
            castShadow
            receiveShadow
            position={[0, 0, posterDepth * 0.5 + posterGap]}
            rotation={[0, 0, 0]}
          >
            <planeGeometry args={[posterWidth, posterHeight]} />
            <meshBasicMaterial
              ref={posterFrontMaterialRef}
              map={frontPosterTexture}
              color={new THREE.Color("#ffffff")}
              transparent
              opacity={frontPosterOpacity}
              toneMapped={false}
            />
          </mesh>

          <mesh
            castShadow
            receiveShadow
            position={[0, 0, -(posterDepth * 0.5 + posterGap)]}
            rotation={[0, Math.PI, 0]}
          >
            <planeGeometry args={[posterWidth, posterHeight]} />
            <meshBasicMaterial
              ref={posterBackMaterialRef}
              map={backPosterTexture}
              color={new THREE.Color("#ffffff")}
              transparent
              opacity={backPosterOpacity}
              toneMapped={false}
            />
          </mesh>

          <RoundedBox
            args={[posterWidth + frameWidth * 0.15, posterHeight + frameWidth * 0.15, 0.12]}
            radius={Math.max(cornerRadius * 0.45, 0.005)}
            smoothness={5}
            bevelSegments={3}
            position={[0, 0, posterDepth * 0.72]}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial
              color={new THREE.Color("#0d140f")}
              metalness={0.15}
              roughness={0.9}
              clearcoat={0.02}
              clearcoatRoughness={0.8}
              envMapIntensity={environmentIntensity * 0.3}
              wireframe={wireframe}
            />
          </RoundedBox>

          <group position={[0, -height * 0.5 - 0.2, 0]}>
            <group position={polePosition} rotation={poleRotation} scale={poleScale}>
              <mesh
                castShadow
                receiveShadow
                position={[0, -poleHeight * 0.5, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry
                  args={[poleRadius, poleRadius, poleHeight, Math.max(12, poleSegments), 1]}
                />
                <meshPhysicalMaterial
                  ref={poleMaterialRef}
                  color={poleTint}
                  map={poleColorMap}
                  normalMap={poleNormalMap}
                  roughnessMap={poleRoughnessMap}
                  bumpMap={poleHeightMap}
                  metalness={metalness}
                  roughness={roughness}
                  clearcoat={clearcoat * 0.7}
                  clearcoatRoughness={clearcoatRoughness}
                  envMapIntensity={environmentIntensity}
                  normalScale={normalScaleVector}
                  bumpScale={bumpScale}
                  wireframe={wireframe}
                />
              </mesh>

              <RoundedBox
                args={[supportWidth, supportThickness * 2.4, supportDepth]}
                radius={Math.max(supportThickness * 0.5, 0.01)}
                smoothness={4}
                bevelSegments={3}
                position={[0, 0.65, 0.08]}
                rotation={[0, 0, 0]}
                castShadow
                receiveShadow
              >
                <meshPhysicalMaterial
                  color={poleTint}
                  metalness={metalness}
                  roughness={roughness + 0.08}
                  clearcoat={clearcoat * 0.6}
                  clearcoatRoughness={clearcoatRoughness}
                  envMapIntensity={environmentIntensity}
                  normalScale={normalScaleVector}
                  bumpScale={bumpScale * 0.5}
                  wireframe={wireframe}
                />
              </RoundedBox>

              {enableSupports ? (
                <group position={[0, 0.6, 0.15]}>
                  <RoundedBox
                    args={[supportWidth * 0.78, supportThickness * 1.1, supportDepth * 1.1]}
                    radius={Math.max(supportThickness * 0.35, 0.008)}
                    smoothness={4}
                    bevelSegments={3}
                    position={[0, height * 0.3, 0]}
                    rotation={[0, 0, Math.PI / 10]}
                    castShadow
                    receiveShadow
                  >
                    <meshPhysicalMaterial
                      color={poleTint}
                      metalness={metalness}
                      roughness={roughness + 0.05}
                      clearcoat={clearcoat * 0.45}
                      clearcoatRoughness={clearcoatRoughness}
                      envMapIntensity={environmentIntensity}
                      normalScale={normalScaleVector}
                      bumpScale={bumpScale * 0.45}
                      wireframe={wireframe}
                    />
                  </RoundedBox>
                  <RoundedBox
                    args={[supportWidth * 0.72, supportThickness * 1.1, supportDepth * 1.1]}
                    radius={Math.max(supportThickness * 0.35, 0.008)}
                    smoothness={4}
                    bevelSegments={3}
                    position={[0, height * 0.18, -0.18]}
                    rotation={[0, 0, -Math.PI / 10]}
                    castShadow
                    receiveShadow
                  >
                    <meshPhysicalMaterial
                      color={poleTint}
                      metalness={metalness}
                      roughness={roughness + 0.05}
                      clearcoat={clearcoat * 0.45}
                      clearcoatRoughness={clearcoatRoughness}
                      envMapIntensity={environmentIntensity}
                      normalScale={normalScaleVector}
                      bumpScale={bumpScale * 0.45}
                      wireframe={wireframe}
                    />
                  </RoundedBox>
                </group>
              ) : null}

              {enableRearBraces ? (
                <group position={[0, 0.15, -0.1]}>
                  {[
                    [
                      [-width * 0.28, height * 0.03, 0.04],
                      [0, -0.05, -0.15],
                    ],
                    [
                      [width * 0.28, height * 0.03, 0.04],
                      [0, -0.05, -0.15],
                    ],
                  ].map(([start, end], index) => {
                    const link = buildLinkGeometry(
                      start as Vector3,
                      end as Vector3,
                      supportThickness * 0.42,
                    );

                    return (
                      <group key={index}>
                        <mesh
                          position={link.midpoint.toArray() as Vector3}
                          quaternion={link.quaternion}
                          castShadow
                          receiveShadow
                        >
                          <cylinderGeometry
                            args={[
                              link.radius,
                              link.radius,
                              link.length,
                              14,
                              1,
                            ]}
                          />
                          <meshPhysicalMaterial
                            color={poleTint}
                            metalness={metalness}
                            roughness={roughness + 0.1}
                            clearcoat={clearcoat * 0.5}
                            clearcoatRoughness={clearcoatRoughness}
                            envMapIntensity={environmentIntensity}
                            normalScale={normalScaleVector}
                            bumpScale={bumpScale * 0.4}
                            wireframe={wireframe}
                          />
                        </mesh>
                        <mesh
                          position={start as Vector3}
                          castShadow
                          receiveShadow
                        >
                          <sphereGeometry args={[supportThickness * 0.55, 12, 12]} />
                          <meshPhysicalMaterial
                            color={poleTint}
                            metalness={metalness}
                            roughness={roughness + 0.12}
                            clearcoat={clearcoat * 0.45}
                            clearcoatRoughness={clearcoatRoughness}
                            envMapIntensity={environmentIntensity}
                            normalScale={normalScaleVector}
                            bumpScale={bumpScale * 0.35}
                            wireframe={wireframe}
                          />
                        </mesh>
                      </group>
                    );
                  })}
                </group>
              ) : null}
            </group>
          </group>

          <group position={[0, 0, outerDepth * 0.55]}>
            {[
              [-width * 0.5, height * 0.5, 1],
              [width * 0.5, height * 0.5, -1],
              [-width * 0.5, -height * 0.5, -1],
              [width * 0.5, -height * 0.5, 1],
              [0, height * 0.5, 1],
              [0, -height * 0.5, -1],
              [-width * 0.5, 0, 1],
              [width * 0.5, 0, -1],
            ].map(([x, y, z], index) => (
              <mesh
                key={index}
                position={[
                  x * 0.98,
                  y * 0.98,
                  z * (outerDepth * 0.5 + 0.02),
                ]}
                castShadow
                receiveShadow
              >
                <cylinderGeometry args={[0.055, 0.055, 0.16, 10]} />
                <meshPhysicalMaterial
                  color="#8d7d59"
                  metalness={0.9}
                  roughness={0.25}
                  clearcoat={0.1}
                  clearcoatRoughness={0.35}
                  envMapIntensity={environmentIntensity * 0.8}
                  wireframe={wireframe}
                />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    );
  },
);

const BillboardScene = forwardRef<
  BillboardHandles,
  {
    width: number;
    height: number;
    frameWidth: number;
    frameThickness: number;
    cornerRadius: number;
    posterDepth: number;
    posterGap: number;
    poleHeight: number;
    poleRadius: number;
    poleSegments: number;
    polePosition: Vector3;
    poleRotation: Vector3;
    poleScale: Vector3;
    enableSupports: boolean;
    enableRearBraces: boolean;
    supportThickness: number;
    supportWidth: number;
    supportDepth: number;
    frameTint: string;
    poleTint: string;
    metalness: number;
    roughness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    normalScale: number;
    bumpScale: number;
    environmentIntensity: number;
    frameRepeatX: number;
    frameRepeatY: number;
    poleRepeatX: number;
    poleRepeatY: number;
    frontPosterTextureSource: string;
    backPosterTextureSource: string;
    frontPosterOpacity: number;
    backPosterOpacity: number;
    wireframe: boolean;
    helpers: boolean;
    axes: boolean;
    boundingBox: boolean;
    environmentPath?: string;
    camera: BillboardControlSchema["Camera"];
    lighting: BillboardControlSchema["Lighting"];
    transform: BillboardControlSchema["Transform"];
  }
>(function BillboardScene(
  {
    width,
    height,
    frameWidth,
    frameThickness,
    cornerRadius,
    posterDepth,
    posterGap,
    poleHeight,
    poleRadius,
    poleSegments,
    polePosition,
    poleRotation,
    poleScale,
    enableSupports,
    enableRearBraces,
    supportThickness,
    supportWidth,
    supportDepth,
    frameTint,
    poleTint,
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness,
    normalScale,
    bumpScale,
    environmentIntensity,
    frameRepeatX,
    frameRepeatY,
    poleRepeatX,
    poleRepeatY,
    frontPosterTextureSource,
    backPosterTextureSource,
    frontPosterOpacity,
    backPosterOpacity,
    wireframe,
    helpers,
    axes,
    boundingBox,
    environmentPath,
    camera,
    lighting,
    transform,
  },
  ref,
) {
  const frameColorSource = useLoader(THREE.TextureLoader, DEFAULT_FRAME_COLOR) as THREE.Texture;
  const frameNormalSource = useLoader(EXRLoader, DEFAULT_FRAME_NORMAL) as THREE.Texture;
  const frameRoughnessSource = useLoader(THREE.TextureLoader, DEFAULT_FRAME_ROUGHNESS) as THREE.Texture;
  const frameHeightSource = useLoader(THREE.TextureLoader, DEFAULT_FRAME_HEIGHT) as THREE.Texture;

  const poleColorSource = useLoader(THREE.TextureLoader, DEFAULT_POLE_COLOR) as THREE.Texture;
  const poleNormalSource = useLoader(EXRLoader, DEFAULT_POLE_NORMAL) as THREE.Texture;
  const poleRoughnessSource = useLoader(EXRLoader, DEFAULT_POLE_ROUGHNESS) as THREE.Texture;
  const poleHeightSource = useLoader(THREE.TextureLoader, DEFAULT_POLE_HEIGHT) as THREE.Texture;

  const [frontPosterSourceTexture, backPosterSourceTexture] = useLoader(
    THREE.TextureLoader,
    [frontPosterTextureSource, backPosterTextureSource],
  ) as THREE.Texture[];

  const frameColorMap = useRepeatedTexture(frameColorSource, frameRepeatX, frameRepeatY, true);
  const frameNormalMap = useRepeatedTexture(frameNormalSource, frameRepeatX, frameRepeatY);
  const frameRoughnessMap = useRepeatedTexture(frameRoughnessSource, frameRepeatX, frameRepeatY);
  const frameHeightMap = useRepeatedTexture(frameHeightSource, frameRepeatX, frameRepeatY);

  const poleColorMap = useRepeatedTexture(poleColorSource, poleRepeatX, poleRepeatY, true);
  const poleNormalMap = useRepeatedTexture(poleNormalSource, poleRepeatX, poleRepeatY);
  const poleRoughnessMap = useRepeatedTexture(poleRoughnessSource, poleRepeatX, poleRepeatY);
  const poleHeightMap = useRepeatedTexture(poleHeightSource, poleRepeatX, poleRepeatY);

  const frontPosterTexture = usePosterTexture(
    frontPosterSourceTexture,
    lighting.lightingAmbient + 0.2,
    1 + lighting.lightingFill * 0.15,
    1 + lighting.lightingRim * 0.1,
  );
  const backPosterTexture = usePosterTexture(
    backPosterSourceTexture,
    lighting.lightingAmbient + 0.2,
    1 + lighting.lightingFill * 0.15,
    1 + lighting.lightingRim * 0.1,
  );

  const billboardRef = useRef<BillboardHandles>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const { gl } = useThree();

  useEffect(() => {
    if (!directionalLightRef.current) {
      return;
    }

    directionalLightRef.current.shadow.bias = lighting.lightingShadowBias;
  }, [lighting.lightingShadowBias]);

  useEffect(() => {
    // Sync the renderer exposure with the Leva control.
    // eslint-disable-next-line react-hooks/immutability
    gl.toneMappingExposure = lighting.lightingExposure;
  }, [gl, lighting.lightingExposure]);

  useImperativeHandle(
    ref,
    () => ({
      root: billboardRef.current?.root ?? null,
      frameMaterial: billboardRef.current?.frameMaterial ?? null,
      poleMaterial: billboardRef.current?.poleMaterial ?? null,
      posterFrontMaterial: billboardRef.current?.posterFrontMaterial ?? null,
      posterBackMaterial: billboardRef.current?.posterBackMaterial ?? null,
    }),
    [],
  );

  return (
    <>
      <color attach="background" args={["#050805"]} />
      <fog attach="fog" args={["#050805", 24, 60]} />

      <ambientLight intensity={lighting.lightingAmbient} />
      <directionalLight
        ref={directionalLightRef}
        position={[8, 12, 10]}
        intensity={lighting.lightingDirectional}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 6, -8]} intensity={lighting.lightingFill} />
      <directionalLight position={[0, 18, -6]} intensity={lighting.lightingRim} />

      <Environment
        {...(environmentPath
          ? { files: environmentPath }
          : { preset: "city" as const })}
        background={false}
        blur={0.4}
        environmentIntensity={lighting.lightingHdrIntensity}
        environmentRotation={[0, 0.45, 0]}
      />

      <CameraRig {...camera} />

      <BillboardAsset
        ref={billboardRef}
        width={width}
        height={height}
        frameWidth={frameWidth}
        frameThickness={frameThickness}
        cornerRadius={cornerRadius}
        posterDepth={posterDepth}
        posterGap={posterGap}
        poleHeight={poleHeight}
        poleRadius={poleRadius}
        poleSegments={poleSegments}
        polePosition={polePosition}
        poleRotation={poleRotation}
        poleScale={poleScale}
        enableSupports={enableSupports}
        enableRearBraces={enableRearBraces}
        supportThickness={supportThickness}
        supportWidth={supportWidth}
        supportDepth={supportDepth}
        frameTint={frameTint}
        poleTint={poleTint}
        metalness={metalness}
        roughness={roughness}
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        normalScale={normalScale}
        bumpScale={bumpScale}
        environmentIntensity={environmentIntensity}
        wireframe={wireframe}
        helpers={helpers}
        axes={axes}
        boundingBox={boundingBox}
        frameColorMap={frameColorMap}
        frameNormalMap={frameNormalMap}
        frameRoughnessMap={frameRoughnessMap}
        frameHeightMap={frameHeightMap}
        poleColorMap={poleColorMap}
        poleNormalMap={poleNormalMap}
        poleRoughnessMap={poleRoughnessMap}
        poleHeightMap={poleHeightMap}
        frontPosterTexture={frontPosterTexture ?? frontPosterSourceTexture}
        backPosterTexture={backPosterTexture ?? backPosterSourceTexture}
        frontPosterOpacity={frontPosterOpacity}
        backPosterOpacity={backPosterOpacity}
        transform={transform}
      />

      {lighting.lightingUseAccumulativeShadows ? (
        <AccumulativeShadows
          temporal
          frames={60}
          color="#10150f"
          alphaTest={0.85}
          opacity={0.75}
          scale={20}
          position={[0, -7.6, 0]}
        >
          <ambientLight intensity={0.15} />
        </AccumulativeShadows>
      ) : (
        <ContactShadows
          opacity={0.42}
          scale={20}
          blur={2.5}
          far={8}
          resolution={1024}
          color="#08110a"
          position={[0, -7.6, 0]}
        />
      )}
    </>
  );
});

export default forwardRef<BillboardHandles, BillboardProps>(function Billboard(
  {
    className,
    style,
    debug = false,
    environmentPath,
    frontImage = DEFAULT_FRONT_POSTER,
    backImage = DEFAULT_BACK_POSTER,
    onReady,
  },
  ref,
) {
  const [swap, setSwap] = useState(false);

  const toggleSwap = useCallback(() => {
    setSwap((current) => !current);
  }, []);

  const controls = useControls({
    Billboard: folder({
      billboardWidth: { label: "Width", value: 10, min: 5, max: 20, step: 0.1 },
      billboardHeight: { label: "Height", value: 5.5, min: 3, max: 14, step: 0.1 },
      billboardFrameWidth: { label: "Frame Width", value: 0.62, min: 0.2, max: 1.5, step: 0.01 },
      billboardFrameThickness: { label: "Frame Thickness", value: 0.44, min: 0.16, max: 1.2, step: 0.01 },
      billboardCornerRadius: { label: "Corner Radius", value: 0.4, min: 0.08, max: 1.2, step: 0.01 },
      billboardPosterDepth: { label: "Poster Depth", value: 0.14, min: 0.04, max: 0.5, step: 0.01 },
      billboardPosterGap: { label: "Poster Gap", value: 0.08, min: 0.01, max: 0.4, step: 0.01 },
    }),
    Pole: folder({
      poleHeight: { label: "Height", value: 8, min: 4, max: 20, step: 0.1 },
      poleRadius: { label: "Radius", value: 0.34, min: 0.12, max: 1.2, step: 0.01 },
      poleSegments: { label: "Segments", value: 24, min: 8, max: 48, step: 1 },
      polePosition: { label: "Position", value: [0, -0.2, -0.1] as Vector3, step: 0.01 },
      poleRotation: {
        label: "Rotation",
        value: [0, 0, 0] as Vector3,
        step: 0.01,
      },
      poleScale: { label: "Scale", value: [1, 1, 1] as Vector3, step: 0.01 },
    }),
    Supports: folder({
      supportsEnableSupports: { label: "Enable Supports", value: true },
      supportsEnableRearBraces: { label: "Enable Rear Braces", value: true },
      thickness: { label: "Thickness", value: 0.18, min: 0.05, max: 0.6, step: 0.01 },
      width: { label: "Width", value: 1.8, min: 0.8, max: 4, step: 0.01 },
      depth: { label: "Depth", value: 0.28, min: 0.08, max: 1.2, step: 0.01 },
    }),
    Posters: folder({
      posterFrontImage: { label: "Front Image", value: frontImage },
      posterBackImage: { label: "Back Image", value: backImage },
      posterFrontOpacity: { label: "Front Opacity", value: 1, min: 0, max: 1, step: 0.01 },
      posterBackOpacity: { label: "Back Opacity", value: 1, min: 0, max: 1, step: 0.01 },
      posterBrightness: { label: "Brightness", value: 1, min: 0.2, max: 2.2, step: 0.01 },
      posterContrast: { label: "Contrast", value: 1, min: 0.2, max: 2.2, step: 0.01 },
      posterSaturation: { label: "Saturation", value: 1, min: 0, max: 2.5, step: 0.01 },
      posterSwapImages: button(toggleSwap),
    }),
    Materials: folder({
      materialMetalness: { label: "Metalness", value: 0.78, min: 0, max: 1, step: 0.01 },
      materialRoughness: { label: "Roughness", value: 0.58, min: 0, max: 1, step: 0.01 },
      materialClearcoat: { label: "Clearcoat", value: 0.16, min: 0, max: 1, step: 0.01 },
      materialClearcoatRoughness: { label: "Clearcoat Roughness", value: 0.34, min: 0, max: 1, step: 0.01 },
      materialNormalScale: { label: "Normal Scale", value: 0.85, min: 0, max: 3, step: 0.01 },
      materialBumpScale: { label: "Bump Scale", value: 0.12, min: 0, max: 1, step: 0.01 },
      materialEnvironmentIntensity: { label: "Environment Intensity", value: 1.15, min: 0, max: 3, step: 0.01 },
      materialFrameTint: { label: "Frame Tint", value: "#6a805c" },
      materialPoleTint: { label: "Pole Tint", value: "#8f8a75" },
    }),
    "Texture Tiling": folder({
      frameRepeatX: { value: 1.6, min: 0.1, max: 12, step: 0.01 },
      frameRepeatY: { value: 1.2, min: 0.1, max: 12, step: 0.01 },
      poleRepeatX: { value: 1, min: 0.1, max: 12, step: 0.01 },
      poleRepeatY: { value: 2.5, min: 0.1, max: 12, step: 0.01 },
    }),
    Lighting: folder({
      lightingAmbient: { label: "Ambient", value: 1.25, min: 0, max: 4, step: 0.01 },
      lightingDirectional: { label: "Directional", value: 2.6, min: 0, max: 6, step: 0.01 },
      lightingRim: { label: "Rim", value: 0.95, min: 0, max: 4, step: 0.01 },
      lightingFill: { label: "Fill", value: 0.7, min: 0, max: 4, step: 0.01 },
      lightingExposure: { label: "Exposure", value: 1.05, min: 0.25, max: 2.25, step: 0.01 },
      lightingHdrIntensity: { label: "HDR Intensity", value: 1.3, min: 0, max: 3, step: 0.01 },
      lightingShadowBias: { label: "Shadow Bias", value: -0.001, min: -0.02, max: 0.02, step: 0.0001 },
      lightingUseAccumulativeShadows: { label: "Accumulative Shadows", value: false },
    }),
    Camera: folder({
      cameraPosition: { label: "Position", value: [0, 0.9, 15] as Vector3, step: 0.01 },
      cameraRotation: { label: "Rotation", value: [0, 0, 0] as Vector3, step: 0.01 },
      cameraFov: { label: "FOV", value: 30, min: 15, max: 70, step: 1 },
      cameraTarget: { label: "Target", value: [0, 0.15, 0] as Vector3, step: 0.01 },
    }),
    Transform: folder({
      transformPosition: { label: "Position", value: [0, 0, 0] as Vector3, step: 0.01 },
      transformRotation: { label: "Rotation", value: [0, -0.18, 0] as Vector3, step: 0.01 },
      transformScale: { label: "Scale", value: [1, 1, 1] as Vector3, step: 0.01 },
    }),
    Debug: folder({
      debugWireframe: { label: "Wireframe", value: false },
      debugHelpers: { label: "Helpers", value: false },
      debugAxes: { label: "Axes", value: false },
      debugBoundingBox: { label: "Bounding Box", value: false },
    }),
  }) as unknown as BillboardControlSchema;

  const canvasSceneRef = useRef<BillboardHandles>(null);

  useImperativeHandle(
    ref,
    () => ({
      root: canvasSceneRef.current?.root ?? null,
      frameMaterial: canvasSceneRef.current?.frameMaterial ?? null,
      poleMaterial: canvasSceneRef.current?.poleMaterial ?? null,
      posterFrontMaterial: canvasSceneRef.current?.posterFrontMaterial ?? null,
      posterBackMaterial: canvasSceneRef.current?.posterBackMaterial ?? null,
    }),
    [],
  );

  useEffect(() => {
    if (onReady) {
      onReady({
        root: canvasSceneRef.current?.root ?? null,
        frameMaterial: canvasSceneRef.current?.frameMaterial ?? null,
        poleMaterial: canvasSceneRef.current?.poleMaterial ?? null,
        posterFrontMaterial: canvasSceneRef.current?.posterFrontMaterial ?? null,
        posterBackMaterial: canvasSceneRef.current?.posterBackMaterial ?? null,
      });
    }
  }, [onReady]);

  const posterSources = swap
    ? ([backImage, frontImage] as const)
    : ([frontImage, backImage] as const);

  const billboardControls = controls.Billboard;
  const poleControls = controls.Pole;
  const supportsControls = controls.Supports;
  const posterControls = controls.Posters;
  const materialControls = controls.Materials;
  const tilingControls = controls["Texture Tiling"];
  const lightingControls = controls.Lighting;
  const cameraControls = controls.Camera;
  const transformControls = controls.Transform;
  const debugControls = controls.Debug;

  const controlsReady =
    !!billboardControls &&
    !!poleControls &&
    !!supportsControls &&
    !!posterControls &&
    !!materialControls &&
    !!tilingControls &&
    !!lightingControls &&
    !!cameraControls &&
    !!transformControls &&
    !!debugControls;

  if (!controlsReady) {
    return (
      <section
        className={`relative isolate w-full overflow-hidden bg-[#050805] ${className ?? ""}`}
        style={style}
        aria-label="Procedural billboard"
      >
        <div className="relative z-10 h-[100vh] w-full" />
      </section>
    );
  }

  return (
    <section
      className={`relative isolate w-full overflow-hidden bg-[#050805] ${className ?? ""}`}
      style={style}
      aria-label="Procedural billboard"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at top, rgba(74, 222, 128, 0.12), transparent 34%), radial-gradient(circle at 70% 20%, rgba(132, 204, 22, 0.08), transparent 28%)",
        }}
      />

      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{
          position: cameraControls.cameraPosition,
          fov: cameraControls.cameraFov,
          near: 0.1,
          far: 100,
        }}
        className="relative z-10 h-[100vh] w-full"
      >
        <Suspense fallback={null}>
          <BillboardScene
            ref={canvasSceneRef}
            width={billboardControls.billboardWidth}
            height={billboardControls.billboardHeight}
            frameWidth={billboardControls.billboardFrameWidth}
            frameThickness={billboardControls.billboardFrameThickness}
            cornerRadius={billboardControls.billboardCornerRadius}
            posterDepth={billboardControls.billboardPosterDepth}
            posterGap={billboardControls.billboardPosterGap}
            poleHeight={poleControls.poleHeight}
            poleRadius={poleControls.poleRadius}
            poleSegments={poleControls.poleSegments}
            polePosition={poleControls.polePosition}
            poleRotation={poleControls.poleRotation}
            poleScale={poleControls.poleScale}
            enableSupports={supportsControls.supportsEnableSupports}
            enableRearBraces={supportsControls.supportsEnableRearBraces}
            supportThickness={supportsControls.thickness}
            supportWidth={supportsControls.width}
            supportDepth={supportsControls.depth}
            frameTint={materialControls.materialFrameTint}
            poleTint={materialControls.materialPoleTint}
            metalness={materialControls.materialMetalness}
            roughness={materialControls.materialRoughness}
            clearcoat={materialControls.materialClearcoat}
            clearcoatRoughness={materialControls.materialClearcoatRoughness}
            normalScale={materialControls.materialNormalScale}
            bumpScale={materialControls.materialBumpScale}
            environmentIntensity={materialControls.materialEnvironmentIntensity}
            frameRepeatX={tilingControls.frameRepeatX}
            frameRepeatY={tilingControls.frameRepeatY}
            poleRepeatX={tilingControls.poleRepeatX}
            poleRepeatY={tilingControls.poleRepeatY}
            frontPosterTextureSource={posterSources[0]}
            backPosterTextureSource={posterSources[1]}
            frontPosterOpacity={posterControls.posterFrontOpacity}
            backPosterOpacity={posterControls.posterBackOpacity}
            wireframe={debugControls.debugWireframe}
            helpers={debugControls.debugHelpers}
            axes={debugControls.debugAxes}
            boundingBox={debugControls.debugBoundingBox}
            environmentPath={environmentPath}
            camera={cameraControls}
            lighting={lightingControls}
            transform={transformControls}
          />
        </Suspense>
      </Canvas>

      {!controlsReady ? null : debug ? <Leva collapsed titleBar={false} /> : null}
    </section>
  );
});
