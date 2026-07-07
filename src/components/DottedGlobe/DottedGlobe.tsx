"use client";

/**
 * DottedGlobe — lazy-loading shell around DottedGlobeScene.
 *
 *  - The Three.js chunk loads only when the container nears the viewport.
 *  - <AssetLoader /> shows inline until the first WebGL frame, then
 *    unmounts instantly (no outro), per loading-screen rules.
 *  - Pins come from JSON data (src/data/locations.json) — add or edit
 *    entries there and the globe updates, no code changes.
 */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AssetLoader } from "@/components/AssetLoader";
import { observeOnce } from "@/lib/motion";
import { DOTTED_GLOBE_DEFAULTS } from "./dottedGlobeConfig";
import type { DottedGlobeProps } from "./dottedGlobeTypes";

const DottedGlobeScene = dynamic(() => import("./DottedGlobeScene"), { ssr: false });

export function DottedGlobe({
  sites,
  selectedIndex = -1,
  onSelect,
  className,
  height = "100%",
  config,
}: DottedGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    return observeOnce(el, () => setShouldLoad(true), "300px 0px 300px 0px");
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", height, minHeight: "24rem" }}
      aria-label="Interactive 3D globe of Kiran Publicity's network"
    >
      {shouldLoad && (
        <DottedGlobeScene
          sites={sites}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          config={{ ...DOTTED_GLOBE_DEFAULTS, ...config }}
          onReady={() => setReady(true)}
        />
      )}
      {!ready && (
        <div style={{ position: "absolute", inset: 0 }}>
          <AssetLoader label="Loading globe" />
        </div>
      )}
    </div>
  );
}
