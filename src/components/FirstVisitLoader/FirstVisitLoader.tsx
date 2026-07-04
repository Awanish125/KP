"use client";

/**
 * FirstVisitLoader — session gate around the cinematic <Loading /> reveal.
 *
 * Rules (per loading-screen spec):
 *  - Shows only when sessionStorage 'kp-visited' is null.
 *  - Sets 'kp-visited' = '1' on completion so it never repeats this session.
 *  - Completion is detected via the 'page-revealed' class the loader adds
 *    to <html> when its timeline ends (PremiumLoader, was Loading.tsx).
 *  - Repeat visitors render nothing: the page is immediately interactive.
 */

import { useEffect, useState } from "react";
import { PremiumLoader } from "@/components/PremiumLoader";
import { FIRST_VISIT_LOADER_DEFAULTS } from "./firstVisitLoaderConfig";
import type { FirstVisitLoaderProps } from "./firstVisitLoaderTypes";

export function FirstVisitLoader({
  storageKey = FIRST_VISIT_LOADER_DEFAULTS.storageKey,
  fallbackMs = FIRST_VISIT_LOADER_DEFAULTS.fallbackMs,
}: FirstVisitLoaderProps) {
  // null = undecided (SSR + first client frame renders nothing, so repeat
  // visitors never see a flash of loader).
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    let visited: string | null = null;
    try {
      visited = sessionStorage.getItem(storageKey);
    } catch {
      // Storage blocked → treat as visited, skip the cinematic.
      visited = "1";
    }

    if (visited !== null) {
      // Skipping the loader — emit the completion signals Loading.tsx would
      // have produced, so components gated on them (HeroSectionContent's
      // entrance, anything on .page-revealed) still play immediately.
      // Class first: late-mounting components check it before listening.
      document.documentElement.classList.add("page-revealed");
      window.dispatchEvent(new Event("kp:loaded"));
      setShow(false);
      return;
    }
    setShow(true);
  }, [storageKey]);

  useEffect(() => {
    if (show !== true) return;

    const markVisited = () => {
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch {
        /* storage blocked — nothing to persist */
      }
    };

    // Loading.tsx adds 'page-revealed' to <html> when its outro finishes.
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
  }, [show, storageKey, fallbackMs]);

  if (show !== true) return null;
  return <PremiumLoader />;
}
