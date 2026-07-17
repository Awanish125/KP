"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Campaign, CampaignGalleryProps } from "./types/gallery";
import { GalleryCard } from "./GalleryCard";
import { GallerySkeleton } from "./GallerySkeleton";
import { GalleryEmpty } from "./GalleryEmpty";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

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
  enableMouseTilt = true,
  enableFloating = true,
  enableNoise = true,
  enableScrollReveal = true,
  staggerDelay = 0.08,
  tiltStrength = 8,
  onCardClick,
}: CampaignGalleryProps) {
  const activeColumns = useResponsiveColumns(columns);
  const stacked = activeColumns === 1;

  // Mobile "card deck" depth veil — mirrors the BillboardStory stacking
  // effect: each sticky card gains a dark veil as the next card scrolls
  // over it, so the deck reads as physically layered rather than a plain list.
  useEffect(() => {
    if (!stacked || prefersReducedMotion() || campaigns.length === 0) return;

    const cards = gsap.utils.toArray<Element>(".gallery-stack-card");
    const STEP_VEIL = 0.25;
    const triggers: ScrollTrigger[] = [];

    cards.forEach((card, i) => {
      const veil = card.querySelector(".sc-veil");
      if (!veil) return;

      for (let j = i + 1; j < cards.length; j++) {
        const before = j - 1 - i;
        const st = ScrollTrigger.create({
          trigger: cards[j],
          start: "top 95%",
          end: "top 45%",
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const currentOpacity = STEP_VEIL * before + STEP_VEIL * progress;
            gsap.set(veil, { opacity: Math.min(currentOpacity, 0.65) });
          },
        });
        triggers.push(st);
      }
    });

    return () => {
      triggers.forEach((st) => st.kill());
    };
  }, [stacked, campaigns.length]);

  const columnBuckets = useMemo(() => {
    const buckets: { campaign: Campaign; index: number }[][] = Array.from({ length: activeColumns }, () => []);
    campaigns.forEach((campaign, index) => {
      buckets[index % activeColumns].push({ campaign, index });
    });
    return buckets;
  }, [campaigns, activeColumns]);

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
      ) : campaigns.length === 0 ? (
        <GalleryEmpty />
      ) : stacked ? (
        <div className="relative flex flex-col gap-8 pb-32">
          {campaigns.map((campaign, i) => (
            <div
              key={campaign.id}
              className="gallery-stack-card relative overflow-hidden"
              style={{
                position: "sticky",
                top: `calc(88px + ${i * 14}px)`,
                zIndex: i,
                transform: `scale(${1 - (campaigns.length - 1 - i) * 0.015})`,
                transformOrigin: "center top",
                borderRadius: cardRadius,
              }}
            >
              <GalleryCard
                campaign={campaign}
                index={i}
                glowColor={campaign.glowColor ?? glowColor}
                cardRadius={cardRadius}
                enableGlass={enableGlass}
                enableGlow={enableGlow}
                enableGradientBorder={enableGradientBorder}
                enableMouseTilt={enableMouseTilt}
                enableFloating={enableFloating}
                enableNoise={enableNoise}
                enableScrollReveal={enableScrollReveal}
                tiltStrength={tiltStrength}
                staggerDelay={staggerDelay}
                stacked
                onClick={onCardClick}
              />
              {/* Depth veil — dimmed by the next card scrolling over it */}
              <span className="sc-veil" aria-hidden="true" />
            </div>
          ))}
        </div>
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
                  enableMouseTilt={enableMouseTilt}
                  enableFloating={enableFloating}
                  enableNoise={enableNoise}
                  enableScrollReveal={enableScrollReveal}
                  tiltStrength={tiltStrength}
                  staggerDelay={staggerDelay}
                  stacked={false}
                  onClick={onCardClick}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export type { Campaign };
