/**
 * index.ts — Re-exports so existing imports continue to work unchanged.
 *
 * Any file that imports from "@/components/ThreeDObject/Billboard" will
 * resolve here, picking up the same exports as before the refactor.
 */

export { default } from "./Billboard";
export type {
  BillboardImperativeHandle,
  BillboardProps,
  BillboardMeshProps,
  PosterUniforms,
} from "./types";
export { BillboardMesh } from "./BillboardMesh";
