import type { FirstVisitLoaderConfig } from "./firstVisitLoaderTypes";

export const FIRST_VISIT_LOADER_DEFAULTS: FirstVisitLoaderConfig = {
  storageKey: "kp-visited",
  fallbackMs: 12000,
};
