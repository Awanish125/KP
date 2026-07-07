import type { CSSProperties } from "react";

export interface AssetLoaderConfig {
  /** Wordmark text shown above the bar. */
  wordmark: string;
  /** Bar width in px. */
  barWidth: number;
}

export interface AssetLoaderProps extends Partial<AssetLoaderConfig> {
  /** 0–100. Omit for an indeterminate sweep. */
  progress?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}
