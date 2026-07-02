"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import type { Campaign, CampaignGalleryProps } from "./types/gallery";
import { GalleryCard } from "./GalleryCard";
import { GallerySkeleton } from "./GallerySkeleton";
import { GalleryEmpty } from "./GalleryEmpty";

/**
 * Tracks how many columns should render at the current breakpoint. CSS
 * `columns-*` (multi-column layout) was tried first, but Chromium
 * periodically rebalances column heights whenever any card's internal
 * content changes size (e.g. the hover-revealed description growing via
 * `max-height`), which can shift a card into its neighbor mid-transition.
 * A JS-distributed flexbox masonry below sidesteps that entirely — columns
 * are plain block stacks, so no browser-driven rebalancing can occur.
 */
function useResponsiveColumns(maxColumns: number) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const mdQuery = window.matchMedia("(min-width: 768px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      if (lgQuery.matches && maxColumns >= 3) setColumns(3);
      else if (mdQuery.matches && maxColumns >= 2) setColumns(Math.min(2, maxColumns));
      else setColumns(1);
    };

    update();
    mdQuery.addEventListener("change", update);
    lgQuery.addEventListener("change", update);
    return () => {
      mdQuery.removeEventListener("change", update);
      lgQuery.removeEventListener("change", update);
    };
  }, [maxColumns]);

  return columns;
}

export function CampaignGallery({
  campaigns,
  loading = false,
  columns = 3,
  gap = "1.25rem",
  cardRadius = "1.5rem",
  primaryColor,
  accentColor,
  glowColor = "rgba(0,100,177,0.5)",
  enableGlass = true,
  enableGlow = true,
  enableGradientBorder = true,
  enableParallax = true,
  enableMouseTilt = true,
  enableFloating = true,
  enableNoise = true,
  enableLightSweep = true,
  enableScrollReveal = true,
  enableLoadMore = true,
  pageSize = 6,
  staggerDelay = 0.08,
  tiltStrength = 8,
  onCardClick,
}: CampaignGalleryProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const activeColumns = useResponsiveColumns(columns);

  const visible = useMemo(() => campaigns.slice(0, visibleCount), [campaigns, visibleCount]);

  const columnBuckets = useMemo(() => {
    const buckets: { campaign: Campaign; index: number }[][] = Array.from({ length: activeColumns }, () => []);
    visible.forEach((campaign, index) => {
      buckets[index % activeColumns].push({ campaign, index });
    });
    return buckets;
  }, [visible, activeColumns]);

  return (
    <section
      className="relative w-full px-4 py-24 lg:px-8"
      style={
        {
          "--kp-gallery-primary": primaryColor,
          "--kp-gallery-accent": accentColor,
        } as CSSProperties
      }
    >
      {loading ? (
        <GallerySkeleton />
      ) : visible.length === 0 ? (
        <GalleryEmpty />
      ) : (
        <div className="flex items-start" style={{ gap }}>
          {columnBuckets.map((bucket, colIndex) => (
            <div key={colIndex} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
              {bucket.map(({ campaign, index }) => (
                <GalleryCard
                  key={campaign.id}
                  campaign={campaign}
                  index={index}
                  glowColor={campaign.glowColor ?? glowColor}
                  cardRadius={cardRadius}
                  enableGlass={enableGlass}
                  enableGlow={enableGlow}
                  enableGradientBorder={enableGradientBorder}
                  enableParallax={enableParallax}
                  enableMouseTilt={enableMouseTilt}
                  enableFloating={enableFloating}
                  enableNoise={enableNoise}
                  enableLightSweep={enableLightSweep}
                  enableScrollReveal={enableScrollReveal}
                  tiltStrength={tiltStrength}
                  staggerDelay={staggerDelay}
                  onClick={onCardClick}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
        {enableLoadMore && !loading && visibleCount < campaigns.length && (
          <button
            type="button"
            onClick={() => setVisibleCount((v) => v + pageSize)}
            className="group flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-7 py-3 text-sm font-medium text-text backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          >
            Load more
            <ChevronDown size={15} className="transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
        )}

        <Link
          href="/gallery"
          className="group flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,100,177,0.35)] transition-all duration-300 hover:bg-primary-dark"
        >
          View Full Gallery
          <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </section>
  );
}

export type { Campaign };
