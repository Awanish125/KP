"use client";

import { useRef, memo } from "react";
import Tilt from "react-parallax-tilt";
import { motion, useScroll, useTransform } from "motion/react";
import { Eye, Heart, MapPin, Calendar, Camera } from "lucide-react";
import type { GalleryImage, GalleryCardVariant } from "./types/gallery";
import { useReveal } from "./hooks/useReveal";
import { useFloating } from "./hooks/useFloating";
import { cn, formatCount } from "../gallery/utils/cn";

const NOISE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E";

const VARIANT_PANEL: Record<GalleryCardVariant, string> = {
  default: "bg-black/25 backdrop-blur-xl border-t border-white/10",
  glass: "bg-white/10 backdrop-blur-2xl border border-white/20 m-3 rounded-2xl",
  minimal: "bg-transparent backdrop-blur-none",
  floating: "bg-black/20 backdrop-blur-lg border-t border-white/10",
  premium: "bg-gradient-to-t from-black/70 via-black/30 to-transparent backdrop-blur-md",
  stack: "bg-black/30 backdrop-blur-xl border-t border-white/10",
  wide: "bg-black/25 backdrop-blur-xl border-t border-white/10",
  editorial: "bg-transparent",
};

interface GalleryCardProps {
  image: GalleryImage;
  index: number;
  variant?: GalleryCardVariant;
  aspect?: string;
  borderRadius?: string;
  accentColor?: string;
  enableGlass?: boolean;
  enableGlow?: boolean;
  enableNoise?: boolean;
  enableParallax?: boolean;
  enableTilt?: boolean;
  enableFloating?: boolean;
  enableBorderAnimation?: boolean;
  enableImageZoom?: boolean;
  enableLightSweep?: boolean;
  enableTitle?: boolean;
  enableDescription?: boolean;
  enableCategoryBadge?: boolean;
  enableLocation?: boolean;
  enableDate?: boolean;
  enableViews?: boolean;
  enableLikes?: boolean;
  hoverScale?: number;
  revealDuration?: number;
  staggerDelay?: number;
  onOpen: (index: number) => void;
}

function GalleryCardInner({
  image,
  index,
  variant = "default",
  aspect = "aspect-[4/5]",
  borderRadius = "1.25rem",
  accentColor = "rgba(0,100,177,0.5)",
  enableGlass = true,
  enableGlow = true,
  enableNoise = true,
  enableParallax = true,
  enableTilt = true,
  enableFloating = true,
  enableBorderAnimation = true,
  enableImageZoom = true,
  enableLightSweep = true,
  enableTitle = true,
  enableDescription = true,
  enableCategoryBadge = true,
  enableLocation = true,
  enableDate = true,
  enableViews = true,
  enableLikes = true,
  hoverScale = 1.02,
  revealDuration = 0.6,
  staggerDelay = 0.04,
  onOpen,
}: GalleryCardProps) {
  const floatRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useReveal(frameRef, imageRef, {
    enabled: true,
    delay: (index % 12) * staggerDelay,
    duration: revealDuration,
    borderRadius,
  });
  useFloating(floatRef, { enabled: enableFloating, seed: index + 1, startDelay: revealDuration + 0.4 });

  // Layered scroll parallax — each layer reads the same scroll progress but
  // maps it to a different range, so image/overlay/title/badge all drift at
  // different speeds as the card crosses the viewport.
  const { scrollYProgress } = useScroll({ target: scrollTargetRef, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], enableParallax ? [-22, 22] : [0, 0]);
  const overlayY = useTransform(scrollYProgress, [0, 1], enableParallax ? [-8, 8] : [0, 0]);
  const titleY = useTransform(scrollYProgress, [0, 1], enableParallax ? [10, -10] : [0, 0]);
  const badgeY = useTransform(scrollYProgress, [0, 1], enableParallax ? [4, -4] : [0, 0]);

  const panelClass = VARIANT_PANEL[variant];
  const isMinimal = variant === "minimal" || variant === "editorial";

  return (
    <div ref={floatRef}>
      <div ref={scrollTargetRef}>
        <Tilt
          tiltEnable={enableTilt}
          tiltMaxAngleX={7}
          tiltMaxAngleY={7}
          perspective={1400}
          scale={hoverScale}
          transitionSpeed={900}
          glareEnable={enableLightSweep}
          glareMaxOpacity={0.18}
          glareColor="#ffffff"
          glarePosition="all"
          glareBorderRadius={borderRadius}
        >
          <div
            role="button"
            tabIndex={0}
            aria-label={image.title ? `Open ${image.title}` : "Open image"}
            onClick={() => onOpen(index)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(index)}
            className={cn(
              "group relative isolate w-full cursor-pointer overflow-hidden outline-none",
              "border border-black/5 bg-white shadow-[0_2px_16px_rgba(20,24,29,0.08)]",
              "dark:border-white/10 dark:bg-white/[0.03]",
              "transition-shadow duration-500 hover:shadow-[0_20px_50px_rgba(20,24,29,0.3)]",
              "focus-visible:ring-2 focus-visible:ring-accent",
              aspect,
            )}
            style={{ borderRadius }}
          >
            {enableGlow && (
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[inherit] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-70"
                style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
              />
            )}

            {enableBorderAnimation && (
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
                  className="h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 [animation-duration:6s] group-hover:[animation-duration:2.2s]"
                  style={{
                    background: "conic-gradient(transparent 0%, rgba(255,255,255,0.7) 15%, transparent 30%)",
                    animationName: "kp-border-rotate",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                  }}
                />
              </div>
            )}

            {/* Reveal frame — clip-path target */}
            <div ref={frameRef} className="absolute inset-0">
              <motion.div className="absolute inset-0 -m-4" style={{ y: imageY }}>
                <img
                  ref={imageRef}
                  src={image.src}
                  alt={image.title ?? ""}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className={cn(
                    "h-[calc(100%+2rem)] w-[calc(100%+2rem)] select-none object-cover",
                    enableImageZoom && "transition-transform duration-700 ease-out group-hover:scale-[1.08]",
                  )}
                />
              </motion.div>
            </div>

            {!isMinimal && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/0 transition-opacity duration-500 group-hover:opacity-90"
                style={{ y: overlayY }}
              />
            )}

            {enableLightSweep && (
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute -inset-y-full -left-1/2 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent [animation-duration:9s] group-hover:[animation-duration:1.6s]"
                  style={{
                    animationName: "kp-light-sweep",
                    animationTimingFunction: "ease-in-out",
                    animationDelay: `${index * 0.5}s`,
                    animationIterationCount: "infinite",
                  }}
                />
              </div>
            )}

            {enableNoise && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.05]"
                style={{ backgroundImage: `url("${NOISE_URL}")` }}
              />
            )}

            {enableCategoryBadge && image.category && (
              <motion.div
                className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white backdrop-blur-md"
                style={{ y: badgeY }}
              >
                {image.category}
              </motion.div>
            )}

            {(enableTitle || enableDescription || enableLocation || enableDate || enableViews || enableLikes) &&
              (image.title || image.description || image.location || image.date || image.views !== undefined || image.likes !== undefined) && (
                <motion.div
                  className={cn("absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 p-4", enableGlass && panelClass)}
                  style={{ y: titleY }}
                >
                  {enableTitle && image.title && (
                    <h3 className="truncate text-base font-semibold text-white">{image.title}</h3>
                  )}
                  {(enableLocation && image.location) || (enableDate && image.date) ? (
                    <p className="flex items-center gap-3 text-xs text-white/65">
                      {enableLocation && image.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {image.location}
                        </span>
                      )}
                      {enableDate && image.date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {image.date}
                        </span>
                      )}
                    </p>
                  ) : null}
                  {enableDescription && image.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/60">{image.description}</p>
                  )}
                  {image.photographer && (
                    <p className="flex items-center gap-1 text-[11px] text-white/50">
                      <Camera size={11} /> {image.photographer}
                    </p>
                  )}
                  {((enableViews && image.views !== undefined) || (enableLikes && image.likes !== undefined)) && (
                    <div className="mt-0.5 flex items-center gap-4 text-[11px] text-white/55">
                      {enableViews && image.views !== undefined && (
                        <span className="flex items-center gap-1">
                          <Eye size={11} /> {formatCount(image.views)}
                        </span>
                      )}
                      {enableLikes && image.likes !== undefined && (
                        <span className="flex items-center gap-1">
                          <Heart size={11} /> {formatCount(image.likes)}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
          </div>
        </Tilt>
      </div>
    </div>
  );
}

export const GalleryCard = memo(GalleryCardInner);
