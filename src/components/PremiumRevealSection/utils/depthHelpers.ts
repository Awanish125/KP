import { DEPTH_CONFIG } from '../constants';
import type { DepthTier } from '../types';

/** Infer a depth tier from zIndex when no explicit depth is supplied. */
export function getDepthTier(zIndex: number, explicit?: DepthTier): DepthTier {
  if (explicit) return explicit;
  if (zIndex >= 5) return 'foreground';
  if (zIndex >= 3) return 'middle';
  return 'background';
}

export function getDepthConfig(tier: DepthTier) {
  return DEPTH_CONFIG[tier];
}
