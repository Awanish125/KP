"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import HeroStats from "./stats/HeroStats";
import { heroUniformBridge } from "./heroUniformBridge";
import { HERO_CONFIG } from "./heroConfig";
import type { HeroStat } from "./stats/types";
import type { ReactNode } from "react";

const DESKTOP_OFFSET_START = -0.25;

// Phase 1  (0 → HERO_PUSH_END):  headline fades, zoom pushes in
const ZOOM_START = 0.9;
const ZOOM_PEAK  = 1.14;

// Phase 2  (HERO_PUSH_END → PHASE2_END):  zoom returns to normal, billboard centers
const PHASE2_WINDOW = 0.14;   // progress units wide — adjust to taste

function clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }
function lerp(a: number, b: number, t: number)     { return a + (b - a) * t; }
function easeOut3(t: number)                        { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(edge1 - edge0, 0.0001), 0, 1);
  return t * t * (3 - 2 * t);
}

interface PinnedHeroProps {
  stats: HeroStat[];
  /** Scroll height multiplier relative to viewport. Default: 2.5 */
  travelFactor?: number;
  children: ReactNode;
}

export function PinnedHero({ stats, travelFactor = 2.5, children }: PinnedHeroProps) {
  const outerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const isMobile = () => window.innerWidth < 768;
    let offsetStart = isMobile() ? 0 : DESKTOP_OFFSET_START;

    const onResize = () => { offsetStart = isMobile() ? 0 : DESKTOP_OFFSET_START; };
    window.addEventListener("resize", onResize, { passive: true });

    const { HERO_PUSH_END } = HERO_CONFIG;
    const phase2End = HERO_PUSH_END + PHASE2_WINDOW;

    const update = () => {
      const rect     = outer.getBoundingClientRect();
      const scrolled = -rect.top;
      const total    = rect.height - window.innerHeight;
      const p        = clamp(scrolled / Math.max(total, 1), 0, 1);

      outer.style.setProperty("--hero-story-progress", String(p));

      // ── Phase 1: zoom in while headline fades (0 → HERO_PUSH_END) ────────
      const zoomInT = easeOut3(smoothstep(0, HERO_PUSH_END, p));

      // ── Phase 2: zoom back + center billboard (HERO_PUSH_END → phase2End) ─
      const zoomOutT  = easeOut3(smoothstep(HERO_PUSH_END, phase2End, p));
      const centerT   = easeOut3(smoothstep(HERO_PUSH_END, phase2End, p));

      // Zoom: rises to ZOOM_PEAK in phase 1, falls back to ZOOM_START in phase 2
      const zoom = lerp(lerp(ZOOM_START, ZOOM_PEAK, zoomInT), ZOOM_START, zoomOutT);
      heroUniformBridge.setZoom?.(zoom);

      // OffsetX: only animates on desktop; moves to center during phase 2
      if (offsetStart !== 0) {
        heroUniformBridge.setOffsetX?.(lerp(offsetStart, 0, centerT));
      }
    };

    gsap.ticker.add(update);
    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      style={{ height: `${travelFactor * 100}vh`, position: "relative" }}
    >
      <div style={{ position: "sticky", top: 0, height: "100vh" }}>
        {children}
        <HeroStats heroStats={stats} />
      </div>
    </div>
  );
}
