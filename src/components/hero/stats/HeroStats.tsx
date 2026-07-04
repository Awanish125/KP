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
  const wrapRef    = useRef<HTMLDivElement>(null);
  const valueRefs  = useRef<(HTMLSpanElement | null)[]>([]);

  const merged = useMemo(
    () => ({ ...HERO_STATS_CONFIG, ...(config ?? {}) }),
    [config],
  );

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    wrap.style.willChange = "transform, opacity";

    const getProgress = () => {
      const cssProgress = Number.parseFloat(
        window
          .getComputedStyle(wrap)
          .getPropertyValue("--hero-story-progress"),
      );
      const raw =
        typeof progress === "number" && Number.isFinite(progress)
          ? progress
          : cssProgress;
      return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 1) : 0;
    };

    const easeOut3 = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

    const update = () => {
      const p = reduced ? 1 : getProgress();

      const revealRaw = (p - merged.revealStart) / Math.max(merged.revealEnd - merged.revealStart, 0.0001);
      const reveal    = easeOut3(Math.min(Math.max(revealRaw, 0), 1));

      wrap.style.opacity    = `${reveal}`;
      wrap.style.transform  = `translate3d(0, ${(1 - reveal) * 28}px, 0)`;
      wrap.style.visibility = reveal > 0 ? "visible" : "hidden";

      heroStats.forEach((stat, index) => {
        const el = valueRefs.current[index];
        if (!el) return;
        el.textContent = formatHeroStatValue(
          countUpValue(stat.value, p, merged.revealStart, merged.revealEnd),
          stat.suffix,
        );
      });
    };

    update();
    if (reduced) return;
    gsap.ticker.add(update);

    return () => {
      gsap.ticker.remove(update);
      wrap.style.willChange = "auto";
    };
  }, [heroStats, merged.fadeEnd, merged.fadeStart, merged.revealEnd, merged.revealStart, progress]);

  return (
    <div
      ref={wrapRef}
      className={["pointer-events-none absolute inset-x-0 bottom-50 z-50", className ?? ""].join(" ")}
      style={{
        opacity:    0,
        transform:  "translate3d(0, 28px, 0)",
        visibility: "hidden",
      }}
    >
      {/* Glassmorphic panel — covers the lower ~48% of the hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:     "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.62) 52%, transparent 100%)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          paddingTop:     "clamp(48px, 6vw, 80px)",
          paddingBottom:  "clamp(28px, 3.5vw, 44px)",
        }}
      >
        {/* Top accent line */}
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-px"
          style={{
            background: "linear-gradient(to right, transparent 0%, rgba(245,130,32,0.55) 30%, rgba(255,255,255,0.18) 50%, rgba(245,130,32,0.55) 70%, transparent 100%)",
          }}
        />

        <div className="mx-auto max-w-[min(1280px,96vw)] px-6 md:px-10 lg:px-16">

          {/* Tagline row */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mb-8">
            <div>
              <p
                className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.42em]"
                style={{ color: "rgba(245,130,32,0.85)" }}
              >
                India's Premier OOH Network
              </p>
              <h2
                className="font-heading text-lg font-bold leading-tight text-white sm:text-xl md:text-2xl lg:text-[1.75rem]"
              >
                Delivering Impact at Scale
              </h2>
            </div>

            {/* Pill CTA */}
            <span
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border sm:self-auto"
              style={{
                borderColor:    "rgba(255,255,255,0.14)",
                background:     "rgba(255,255,255,0.06)",
                padding:        "6px 16px",
                fontSize:       "0.7rem",
                color:          "rgba(255,255,255,0.65)",
                letterSpacing:  "0.06em",
                backdropFilter: "blur(8px)",
              }}
            >
              Across Maharashtra
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          {/* Separator */}
          <div
            aria-hidden
            className="mb-6 h-px w-full md:mb-8"
            style={{ background: "rgba(255,255,255,0.09)" }}
          />

          {/* Stats grid */}
          <div className="flex w-full items-end justify-between gap-2 overflow-hidden">
            {heroStats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex min-w-0 shrink-0 flex-col items-start"
                style={{ gap: "0.25rem" }}
              >
                <div
                  className="font-heading font-bold text-white tabular-nums"
                  style={{
                    fontSize:   `clamp(${merged.mobileSize}, 3.8vw, ${merged.desktopSize})`,
                    lineHeight: 1,
                  }}
                >
                  <span
                    ref={(el) => { valueRefs.current[index] = el; }}
                  >
                    0
                  </span>
                </div>
                <div
                  className="uppercase tracking-[0.2em]"
                  style={{
                    fontSize:   `clamp(${merged.labelSize}, 0.85vw, 0.75rem)`,
                    lineHeight: 1.2,
                    color:      "rgba(255,255,255,0.5)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default HeroStats;
