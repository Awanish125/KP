"use client";

/**
 * FirstVisitLoader — thin wrapper around <PremiumLoader />.
 *
 * The loader is rendered unconditionally (SSR included) so it covers the
 * very first paint. The inline head script in layout.tsx adds `kp-first-visit`
 * to <html> on every hard load; PremiumLoader plays the full cinematic each
 * time and removes the class when the reveal completes.
 *
 * No sessionStorage gating — the full animation runs on every reload.
 */

import { PremiumLoader } from "@/components/PremiumLoader";
import type { FirstVisitLoaderProps } from "./firstVisitLoaderTypes";

export function FirstVisitLoader(_props: FirstVisitLoaderProps) {
  return <PremiumLoader />;
}
