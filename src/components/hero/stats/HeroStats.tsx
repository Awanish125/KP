"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { countUpValue, formatHeroStatValue } from "./countUp";
import { HERO_STATS_CONFIG } from "./heroStatsData";
import type { HeroStatsProps } from "./types";

export function HeroStats({
  heroStats,
  progress,
  className,
  config,
}: HeroStatsProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const merged = useMemo(
    () => ({ ...HERO_STATS_CONFIG, ...(config ?? {}) }),
    [config],
  );

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const getProgress = () => {
      const cssProgress = Number.parseFloat(
        window
          .getComputedStyle(wrap)
          .getPropertyValue("--hero-story-progress"),
      );
      const rawProgress =
        typeof progress === "number" && Number.isFinite(progress)
          ? progress
          : cssProgress;
      return Number.isFinite(rawProgress) ? Math.min(Math.max(rawProgress, 0), 1) : 0;
    };

    const update = () => {
      const current = reduced ? 1 : getProgress();
      const reveal = Math.min(
        Math.max((current - merged.revealStart) / Math.max(merged.revealEnd - merged.revealStart, 0.0001), 0),
        1,
      );
      const fade = Math.min(
        Math.max((current - merged.fadeStart) / Math.max(merged.fadeEnd - merged.fadeStart, 0.0001), 0),
        1,
      );

      wrap.style.opacity = `${reveal * (1 - fade)}`;
      wrap.style.transform = `translate3d(0, ${(1 - reveal) * 12}px, 0)`;
      wrap.style.visibility = reveal > 0 ? "visible" : "hidden";

      heroStats.forEach((stat, index) => {
        const el = valueRefs.current[index];
        if (!el) return;
        el.textContent = formatHeroStatValue(
          countUpValue(stat.value, current, merged.revealStart, merged.revealEnd),
          stat.suffix,
        );
      });
    };

    update();
    if (reduced) return;
    gsap.ticker.add(update);

    return () => {
      gsap.ticker.remove(update);
    };
  }, [heroStats, merged.fadeEnd, merged.fadeStart, merged.revealEnd, merged.revealStart, progress]);

  return (
    <div
      ref={wrapRef}
      className={[
        "pointer-events-none absolute inset-x-0 bottom-10 z-50 mx-auto flex max-w-[min(1280px,96vw)] items-end justify-center overflow-hidden px-6 md:bottom-14 md:px-10 lg:px-16",
        className ?? "",
      ].join(" ")}
      style={{
        opacity: 0,
        transform: "translate3d(0, 12px, 0)",
        willChange: "transform, opacity",
        visibility: "hidden",
      }}
    >
      <div className="flex w-full items-end justify-between gap-3 overflow-hidden whitespace-nowrap">
        {heroStats.map((stat, index) => (
          <div
            key={stat.label}
            className="flex min-w-0 shrink-0 flex-col items-start gap-1"
            style={{
              gap: "0.15rem",
            }}
          >
            <div
              className="font-heading font-bold text-white tabular-nums"
              style={{
                fontSize: `clamp(${merged.mobileSize}, 1.7vw, ${merged.desktopSize})`,
                lineHeight: 1,
              }}
            >
              <span
                ref={(el) => {
                  valueRefs.current[index] = el;
                }}
              >
                0
              </span>
            </div>
            <div
              className="uppercase tracking-[0.2em] text-white/60"
              style={{
                fontSize: `clamp(${merged.labelSize}, 1vw, 0.75rem)`,
                lineHeight: 1.15,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroStats;
