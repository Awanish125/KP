"use client";

import { Fragment, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, MapPin, Calendar, Camera, Eye, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselVision, type CarouselEffectName, type CarouselHandle, type CarouselVisionHandle } from "../carousel";
import { GalleryOverlay } from "./GalleryOverlay";
import { GalleryCounter } from "./GalleryCounter";
import type { GalleryImage } from "./types/gallery";
import { formatCount } from "../gallery/utils/cn";

// `coverflow` now uses Swiper's own EffectCoverflow module directly (a
// proven, battle-tested config) — only the remaining named presets fall
// back to the custom GSAP stage (CarouselVision).
const DEPTH_EFFECTS: CarouselEffectName[] = ["vision", "premium", "cinematic", "gallery", "wheel"];

interface GalleryViewerProps {
  images: GalleryImage[];
  initialIndex: number;
  effect?: CarouselEffectName;
  enableCounter?: boolean;
  enableKeyboard?: boolean;
  enableSwipe?: boolean;
  enableMouseWheel?: boolean;
  onClose: () => void;
}

export function GalleryViewer({
  images,
  initialIndex,
  effect = "coverflow",
  enableCounter = true,
  enableKeyboard = true,
  enableSwipe = true,
  enableMouseWheel = true,
  onClose,
}: GalleryViewerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const isDepth = DEPTH_EFFECTS.includes(effect);
  const visionRef = useRef<CarouselVisionHandle>(null);
  const swiperRef = useRef<CarouselHandle>(null);

  const active = images[activeIndex];
  const hasInfo =
    active &&
    (active.title || active.description || active.location || active.date || active.photographer || active.views !== undefined || active.likes !== undefined);

  const goPrev = () => (isDepth ? visionRef.current?.prev() : swiperRef.current?.prev());
  const goNext = () => (isDepth ? visionRef.current?.next() : swiperRef.current?.next());

  const renderSlide = (index: number) => {
    const img = images[index];
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
        <img src={img.src} alt={img.title ?? ""} className="h-full w-full object-contain" draggable={false} />
      </div>
    );
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[100] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GalleryOverlay onClick={onClose} />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="absolute right-5 top-5 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
      >
        <X size={18} />
      </button>

      {enableCounter && (
        <div className="absolute left-1/2 top-5 z-[70] -translate-x-1/2">
          <GalleryCounter index={activeIndex} total={images.length} />
        </div>
      )}

      {/* Prev/next — pinned to the viewport edges, independent of card size
          or aspect ratio, so they never shift around as slides change. */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous image"
        className="absolute left-4 top-1/2 z-[70] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:left-8"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next image"
        className="absolute right-4 top-1/2 z-[70] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:right-8"
      >
        <ChevronRight size={20} />
      </button>

      {/* Carousel */}
      <motion.div
        className="relative z-[5] flex flex-1 items-center justify-center px-4"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(16px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {isDepth ? (
          <CarouselVision
            ref={visionRef}
            count={images.length}
            initialIndex={initialIndex}
            onIndexChange={setActiveIndex}
            enableKeyboard={enableKeyboard}
            enableSwipe={enableSwipe}
            enableMouseWheel={enableMouseWheel}
            className="h-[62vh] w-full max-w-6xl md:h-[70vh]"
            renderSlide={renderSlide}
          />
        ) : (
          <Carousel
            ref={swiperRef}
            effect={effect}
            initialIndex={initialIndex}
            onIndexChange={setActiveIndex}
            enableKeyboard={enableKeyboard}
            enableMouseWheel={enableMouseWheel}
            className="h-[62vh] w-full max-w-6xl md:h-[70vh]"
            slideClassName="!h-full !w-[90vw] !max-w-[760px] sm:!w-[75vw] md:!w-[60vw] lg:!w-[50vw]"
          >
            {images.map((img, i) => (
              <Fragment key={img.id}>{renderSlide(i)}</Fragment>
            ))}
          </Carousel>
        )}
      </motion.div>

      {/* Info panel */}
      <AnimatePresence mode="wait">
        {hasInfo && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 mx-auto mb-8 w-full max-w-xl px-6 text-center"
          >
            {active.title && <h2 className="text-xl font-semibold text-white">{active.title}</h2>}
            {(active.location || active.date || active.photographer) && (
              <p className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-white/60">
                {active.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {active.location}
                  </span>
                )}
                {active.date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {active.date}
                  </span>
                )}
                {active.photographer && (
                  <span className="flex items-center gap-1">
                    <Camera size={12} /> {active.photographer}
                  </span>
                )}
              </p>
            )}
            {active.description && <p className="mt-3 text-sm leading-relaxed text-white/70">{active.description}</p>}
            {(active.views !== undefined || active.likes !== undefined) && (
              <div className="mt-3 flex items-center justify-center gap-5 text-xs text-white/55">
                {active.views !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {formatCount(active.views)}
                  </span>
                )}
                {active.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <Heart size={12} /> {formatCount(active.likes)}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
