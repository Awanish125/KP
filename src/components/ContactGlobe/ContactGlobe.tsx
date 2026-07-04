"use client";

/**
 * ContactGlobe — lazy-loading shell around GlobeScene.
 *
 *  - Three.js chunk is dynamically imported only when the container
 *    approaches the viewport (IntersectionObserver, 300px margin).
 *  - <AssetLoader /> shows inline until the first WebGL frame renders,
 *    then unmounts instantly (no outro), per loading-screen rules.
 */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AssetLoader } from "@/components/AssetLoader";
import { observeOnce } from "@/lib/motion";
import { CONTACT_GLOBE_DEFAULTS } from "./contactGlobeConfig";
import type { ContactGlobeProps } from "./contactGlobeTypes";

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false });

export function ContactGlobe({ className, height = "100%" }: ContactGlobeProps) {
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
      aria-label="Interactive globe highlighting Maharashtra, India"
    >
      {shouldLoad && (
        <GlobeScene
          config={CONTACT_GLOBE_DEFAULTS}
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
