"use client";

import { useEffect } from "react";
import { AnimatePresence } from "motion/react";
import type { CarouselEffectName } from "../carousel";
import { GalleryHero } from "./GalleryHero";
import { GalleryToolbar } from "./GalleryToolbar";
import { GalleryGrid } from "./GalleryGrid";
import { GalleryViewer } from "./GalleryViewer";
import { useGallery } from "./hooks/useGallery";
import { useFullscreen } from "./hooks/useFullscreen";
import type { GalleryPageProps } from "./types/gallery";

export function GalleryPage({
  images,
  title = "The Gallery",
  subtitle = "Visual Archive",
  description = "A curated collection of campaigns, locations, and moments captured across every format we work in.",
  columns = 4,
  gap = "1.1rem",
  cardVariant = "default",
  carouselEffect = "coverflow",
  initialCategory = "All",
  enableSearch = true,
  enableCategoryFilter = true,
  enableLoadMore = false,
  pageSize = 16,
  enableGlass = true,
  enableGlow = true,
  enableNoise = true,
  enableTilt = true,
  enableFloating = true,
  enableBorderAnimation = true,
  enableImageZoom = true,
  enableTitle = true,
  enableDescription = true,
  enableCategoryBadge = true,
  enableLocation = true,
  enableDate = true,
  enableViews = true,
  enableLikes = true,
  enableKeyboard = true,
  enableSwipe = true,
  enableMouseWheel = true,
  enableCounter = true,
  accentColor,
  borderRadius = "1.25rem",
  hoverScale = 1.02,
  revealDuration = 0.6,
}: GalleryPageProps) {
  const { categories, category, setCategory, search, setSearch, filtered, visible, hasMore, loadMore } = useGallery({
    images,
    pageSize,
    initialCategory,
    enableLoadMore,
  });

  const { activeIndex, isOpen, open, close } = useFullscreen({ enableKeyboard });

  // "Load more" (or a filter change) can jump the document height by
  // thousands of pixels in one frame. Lenis recalculates its scrollable
  // bounds via a *debounced* ResizeObserver, which can lag behind a jump
  // that large — wheel scrolling then feels clamped to the old max height
  // until something else (e.g. dragging the native scrollbar) forces Lenis
  // to resync. Dispatching a resize event nudges Lenis's own resize
  // listener to recompute immediately; a second pass after images finish
  // loading catches any further layout shift.
  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event("resize"));
    const immediate = requestAnimationFrame(nudge);
    const afterImages = setTimeout(nudge, 600);
    return () => {
      cancelAnimationFrame(immediate);
      clearTimeout(afterImages);
    };
  }, [visible.length]);

  return (
    <section className="relative w-full px-4 py-20 lg:px-8">
      <GalleryHero title={title} subtitle={subtitle} description={description} count={images.length} />

      <GalleryToolbar
        enableSearch={enableSearch}
        enableCategoryFilter={enableCategoryFilter}
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        search={search}
        onSearchChange={setSearch}
      />

      <GalleryGrid
        images={visible}
        columns={columns}
        gap={gap}
        variant={cardVariant}
        onOpen={open}
        cardProps={{
          borderRadius,
          accentColor,
          enableGlass,
          enableGlow,
          enableNoise,
          enableTilt,
          enableFloating,
          enableBorderAnimation,
          enableImageZoom,
          enableTitle,
          enableDescription,
          enableCategoryBadge,
          enableLocation,
          enableDate,
          enableViews,
          enableLikes,
          hoverScale,
          revealDuration,
        }}
      />

      {enableLoadMore && hasMore && (
        <div className="mt-14 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full border border-black/10 bg-white/60 px-7 py-3 text-sm font-medium text-text backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          >
            Load more
          </button>
        </div>
      )}

      <AnimatePresence>
        {isOpen && activeIndex !== null && (
          <GalleryViewer
            images={filtered}
            initialIndex={activeIndex}
            effect={carouselEffect as CarouselEffectName}
            enableCounter={enableCounter}
            enableKeyboard={enableKeyboard}
            enableSwipe={enableSwipe}
            enableMouseWheel={enableMouseWheel}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
