"use client";

import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

type GLTFResult = {
  nodes: {
    Cube001_Material001_0: THREE.Mesh;
    Cube001_Material001_0001: THREE.Mesh;
  };
};

interface ModelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

export default function Model(props: ModelProps) {
  const { nodes } = useGLTF(
    "/models/twoface.glb"
  ) as unknown as GLTFResult;

  return (
    <group {...props} dispose={null}>
      <group scale={0.01} position={[0, 999.827, 0]}>
        {/* Mesh 1 */}
        <mesh geometry={nodes.Cube001_Material001_0.geometry}>
          <meshStandardMaterial color="red" />
        </mesh>

        {/* Mesh 2 */}
        <mesh geometry={nodes.Cube001_Material001_0001.geometry}>
          <meshStandardMaterial color="green" />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload("/models/twoface.glb");