"use client";

import { memo, type CSSProperties } from "react";
import Tilt from "react-parallax-tilt";
import { motion } from "motion/react";
import { Eye, Heart, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import type { Campaign, GalleryCardSize } from "./types/gallery";
import { cn, formatCount } from "./utils/cn";

const SIZE_CLASSES: Record<GalleryCardSize, string> = {
  sm: "aspect-[4/5]",
  md: "aspect-square",
  lg: "aspect-[4/5.5]",
  wide: "aspect-[16/10]",
  tall: "aspect-[3/4.5]",
};

const NOISE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E";

// expo-out — a punchier entrance than a plain ease curve
const ENTRANCE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ENTRANCE_DURATION = 1.1;

interface GalleryCardProps {
  campaign: Campaign;
  index: number;
  glowColor?: string;
  cardRadius?: string;
  enableGlass?: boolean;
  enableGlow?: boolean;
  enableGradientBorder?: boolean;
  enableMouseTilt?: boolean;
  enableFloating?: boolean;
  enableNoise?: boolean;
  enableScrollReveal?: boolean;
  tiltStrength?: number;
  hoverScale?: number;
  staggerDelay?: number;
  onClick?: (campaign: Campaign) => void;
}

/**
 * Scroll-performance contract (see memory: feedback-scroll-performance):
 *   - NO per-card scroll-linked motion values (useScroll/useTransform ran
 *     main-thread JS on every Lenis frame × every card — the primary cause
 *     of scroll lag).
 *   - NO filter/blur in the entrance animation (filter animates on the
 *     paint path, not the compositor).
 *   - Floating is a pure CSS keyframe (compositor-only, zero JS/frame),
 *     not a motion repeat:Infinity loop per card.
 *   - Exactly one animation system per element: motion owns the entrance
 *     wrapper, CSS owns the float wrapper, Tilt owns its own wrapper.
 */
function GalleryCardInner({
  campaign,
  index,
  glowColor = "rgba(0,100,177,0.55)",
  cardRadius = "1.5rem",
  enableGlass = true,
  enableGlow = true,
  enableGradientBorder = true,
  enableMouseTilt = true,
  enableFloating = true,
  enableNoise = true,
  enableScrollReveal = true,
  tiltStrength = 8,
  hoverScale = 1.015,
  staggerDelay = 0.08,
  onClick,
}: GalleryCardProps) {
  const rotateDirection = (index % 3) - 1; // -1, 0, 1 — alternates the entrance per card
  const entranceDelay = index * staggerDelay;

  const floatStyle: CSSProperties | undefined = enableFloating
    ? {
        animationName: "kp-card-float",
        animationDuration: `${6 + ((index * 37) % 40) / 10}s`,
        animationDelay: `${entranceDelay + ENTRANCE_DURATION + 0.5 + ((index * 13) % 20) / 10}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        "--kp-float-distance": `-${6 + (index % 5)}px`,
      } as CSSProperties
    : undefined;

  const size = campaign.size ?? "md";

  return (
    <div style={floatStyle}>
      <motion.div
        initial={
          enableScrollReveal
            ? { opacity: 0, y: 90, scale: 0.82, rotateX: 14, rotateY: rotateDirection * 12 }
            : undefined
        }
        whileInView={enableScrollReveal ? { opacity: 1, y: 0, scale: 1, rotateX: 0, rotateY: 0 } : undefined}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: ENTRANCE_DURATION, delay: entranceDelay, ease: ENTRANCE_EASE }}
      >
        <Tilt
          tiltEnable={enableMouseTilt}
          tiltMaxAngleX={tiltStrength}
          tiltMaxAngleY={tiltStrength}
          perspective={1200}
          scale={hoverScale}
          transitionSpeed={1000}
        >
          <div
            role="button"
            tabIndex={0}
            aria-label={`View campaign: ${campaign.title}`}
            onClick={() => onClick?.(campaign)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.(campaign)}
            className={cn(
              "group relative isolate w-full cursor-pointer overflow-hidden outline-none",
              "border border-black/5 bg-white shadow-[0_2px_16px_rgba(20,24,29,0.08)]",
              "dark:border-white/10 dark:bg-white/[0.03]",
              "transition-shadow duration-500 ease-out",
              "hover:shadow-[0_20px_50px_rgba(20,24,29,0.28)]",
              "focus-visible:ring-2 focus-visible:ring-accent",
              SIZE_CLASSES[size],
            )}
            style={{ borderRadius: cardRadius }}
          >
            {/* Ambient glow — static layer, intensifies on hover */}
            {enableGlow && (
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[inherit] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-80"
                style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
              />
            )}

            {/* Animated gradient border — paused until hover so N invisible
                cards don't each run an infinite compositor animation */}
            {enableGradientBorder && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              >
                <div
                  className="h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 [animation-play-state:paused] group-hover:[animation-play-state:running]"
                  style={{
                    background: "conic-gradient(transparent 0%, rgba(255,255,255,0.7) 15%, transparent 30%)",
                    animationName: "kp-border-rotate",
                    animationDuration: "2.2s",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                  }}
                />
              </div>
            )}

            {/* Image */}
            <div className="absolute inset-0">
              <img
                src={campaign.image}
                alt={campaign.title}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full select-none object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              />
            </div>

            {/* Gradient overlay for legibility */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/0 transition-opacity duration-500 group-hover:opacity-90"
            />

            {/* Noise overlay */}
            {enableNoise && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: `url("${NOISE_URL}")` }}
              />
            )}

            {/* Featured badge */}
            {campaign.featured && (
              <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-md">
                <Sparkles size={11} className="text-accent" />
                Featured
              </div>
            )}

            {/* Category badge */}
            <div className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-md transition-transform duration-500 group-hover:-translate-y-0.5">
              {campaign.category}
            </div>

            {/* Glass info panel — pinned to the frame's bottom edge */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-5",
                enableGlass && "border-t border-white/10 bg-black/30 backdrop-blur-md",
                "transition-transform duration-500 ease-out group-hover:-translate-y-1",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-white">{campaign.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/60">
                    <MapPin size={12} />
                    {campaign.location} &middot; {campaign.duration}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label={`Open ${campaign.title}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-accent group-hover:text-white"
                >
                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </button>
              </div>

              {campaign.description && (
                <p className="line-clamp-2 max-h-0 overflow-hidden text-xs leading-relaxed text-white/70 opacity-0 transition-all duration-500 group-hover:max-h-12 group-hover:opacity-100">
                  {campaign.description}
                </p>
              )}

              {(campaign.views !== undefined || campaign.likes !== undefined) && (
                <div className="mt-1 flex items-center gap-4 text-[11px] text-white/55">
                  {campaign.views !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {formatCount(campaign.views)}
                    </span>
                  )}
                  {campaign.likes !== undefined && (
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {formatCount(campaign.likes)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Tilt>
      </motion.div>
    </div>
  );
}

export const GalleryCard = memo(GalleryCardInner);
