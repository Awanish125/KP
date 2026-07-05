"use client";

/**
 * FirstVisitLoader — session bookkeeping around <PremiumLoader />.
 *
 * The loader itself is rendered unconditionally (SSR included) so it
 * covers the very first paint; whether it actually SHOWS is decided
 * before paint by the inline head script in layout.tsx, which adds
 * `kp-first-visit` to <html> for new sessions (CSS gate in globals.css).
 * PremiumLoader reads that class and either plays or silently emits the
 * reveal signals and unmounts.
 *
 * This wrapper's only job: set sessionStorage 'kp-visited' = '1' when the
 * reveal completes ('page-revealed' appears on <html>), so the cinematic
 * never repeats within a session.
 */

import { useEffect } from "react";
import { PremiumLoader } from "@/components/PremiumLoader";
import { FIRST_VISIT_LOADER_DEFAULTS } from "./firstVisitLoaderConfig";
import type { FirstVisitLoaderProps } from "./firstVisitLoaderTypes";

export function FirstVisitLoader({
  storageKey = FIRST_VISIT_LOADER_DEFAULTS.storageKey,
  fallbackMs = FIRST_VISIT_LOADER_DEFAULTS.fallbackMs,
}: FirstVisitLoaderProps) {
  useEffect(() => {
    const markVisited = () => {
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch {
        /* storage blocked — nothing to persist */
      }
    };

    if (document.documentElement.classList.contains("page-revealed")) {
      markVisited();
      return;
    }
    const obs = new MutationObserver(() => {
      if (document.documentElement.classList.contains("page-revealed")) {
        markVisited();
        obs.disconnect();
      }
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Safety net: never let a stalled timeline re-trap the user next visit.
    const timer = window.setTimeout(() => {
      markVisited();
      obs.disconnect();
    }, fallbackMs);

    return () => {
      obs.disconnect();
      window.clearTimeout(timer);
    };
  }, [storageKey, fallbackMs]);

  return <PremiumLoader />;
}
