export interface FirstVisitLoaderConfig {
  /** sessionStorage key that marks the loader as already seen. */
  storageKey: string;
  /** Safety net (ms): mark visited even if the reveal never completes. */
  fallbackMs: number;
}

export type FirstVisitLoaderProps = Partial<FirstVisitLoaderConfig>;
