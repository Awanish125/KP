/**
 * index.ts — Re-exports so existing imports continue to work unchanged.
 *
 * Any file that imports from "@/components/ThreeDObject/Billboard" will
 * resolve here, picking up the same exports as before the refactor.
 */

export { default } from "./Billboard";
export { default as BillboardBlock } from "./BillboardBlock";
export type {
  BillboardImperativeHandle,
  BillboardProps,
  BillboardMeshProps,
  PosterUniforms,
  BillboardBlockHandle,
  BillboardBlockProps,
  RotationImage,
  RotateOptions,
  CameraAngle,
} from "./types";
export { BillboardMesh } from "./BillboardMesh";
