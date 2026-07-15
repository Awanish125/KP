"use client";

/**
 * HorizontalScrollGallery — pinned section where the gallery track glides
 * sideways as the page scrolls down.
 *
 * Perf contract (project scroll rules):
 *  - NO ScrollTrigger: a sticky inner viewport + gsap.ticker reading one
 *    getBoundingClientRect per frame, gated by IntersectionObserver.
 *  - Track x via quickSetter with lerp; will-change on enter/leave only.
 *  - Reduced motion → a plain horizontally-scrollable row.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import { HORIZONTAL_SCROLL_GALLERY_DEFAULTS } from "./horizontalScrollGalleryConfig";
import type {
  HorizontalGalleryItem,
  HorizontalScrollGalleryProps,
} from "./horizontalScrollGalleryTypes";

function GalleryCard({ item, index }: { item: HorizontalGalleryItem; index: number }) {
  const inner = (
    <figure
      className="group relative m-0 h-[52vh] w-[68vw] shrink-0 overflow-hidden rounded-2xl sm:w-[44vw] lg:w-[30vw]"
      style={{ background: "var(--kp-dark-2)" }}
    >
      <Image
        src={item.image}
        alt={item.title}
        fill
        sizes="(max-width: 640px) 68vw, (max-width: 1024px) 44vw, 30vw"
        style={{ objectFit: "cover" }}
        priority={index < 3}
        className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, transparent 50%, rgba(13,13,20,0.85) 100%)",
        }}
      />
      <figcaption className="absolute inset-x-0 bottom-0 p-6">
        <div
          style={{
            fontFamily: "var(--kp-font-mono)",
            fontSize: "0.62rem",
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: "var(--kp-orange)",
          }}
        >
          {item.meta}
        </div>
        <div
          className="mt-2"
          style={{
            fontFamily: "var(--kp-font-display)",
            fontSize: "1.3rem",
            lineHeight: 1.12,
            textTransform: "uppercase",
            color: "var(--kp-light)",
          }}
        >
          {item.title}
        </div>
      </figcaption>
    </figure>
  );

  return item.href ? (
    <Link href={item.href} className="no-underline">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function HorizontalScrollGallery({
  items,
  className,
  label = HORIZONTAL_SCROLL_GALLERY_DEFAULTS.label,
  heading = HORIZONTAL_SCROLL_GALLERY_DEFAULTS.heading,
  vhPerItem = HORIZONTAL_SCROLL_GALLERY_DEFAULTS.vhPerItem,
  lerp = HORIZONTAL_SCROLL_GALLERY_DEFAULTS.lerp,
  staticMode = false,
}: HorizontalScrollGalleryProps) {
  const outerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    const progressEl = progressRef.current;
    if (!outer || !track || prefersReducedMotion()) return;

    const setX = gsap.quickSetter(track, "x", "px");
    let x = 0;
    let maxShift = 0;
    let scrollRange = 1;
    let outerTop = 0;
    let lastProgress = -1;

    // All layout reads happen HERE, never per frame. ResizeObserver on
    // <body> re-measures when content above shifts (images/fonts loading).
    const measure = () => {
      outerTop = outer.getBoundingClientRect().top + window.scrollY;
      maxShift = Math.max(track.scrollWidth - window.innerWidth, 0);
      scrollRange = Math.max(outer.offsetHeight - window.innerHeight, 1);
      lastProgress = -1; // force a repaint on next tick
    };
    measure();

    let measureTimeout: any = null;
    const debouncedMeasure = () => {
      if (measureTimeout) clearTimeout(measureTimeout);
      measureTimeout = setTimeout(measure, 60);
    };

    window.addEventListener("resize", debouncedMeasure);
    const ro = new ResizeObserver(debouncedMeasure);
    ro.observe(document.body);

    const tick = () => {
      // Pure math from cached offsets — zero layout cost per frame.
      const progress = Math.min(Math.max((window.scrollY - outerTop) / scrollRange, 0), 1);
      const target = -progress * maxShift;
      const delta = target - x;
      // Skip settled frames entirely.
      if (progress === lastProgress && Math.abs(delta) < 0.05) return;
      x = Math.abs(delta) < 0.05 ? target : x + delta * lerp;
      setX(x);
      if (progress !== lastProgress && progressEl) {
        progressEl.style.transform = `scaleX(${progress})`;
      }
      lastProgress = progress;
    };

    const cleanup = tickWhileVisible(outer, tick, {
      onEnter: () => {
        track.style.willChange = "transform";
      },
      onLeave: () => {
        track.style.willChange = "auto";
      },
    });

    return () => {
      cleanup();
      window.removeEventListener("resize", debouncedMeasure);
      if (measureTimeout) clearTimeout(measureTimeout);
      ro.disconnect();
      track.style.willChange = "auto";
    };
  }, [lerp, items.length]);

  const header = (
    <div className="mx-auto w-full max-w-6xl px-6">
      <p
        style={{
          fontFamily: "var(--kp-font-mono)",
          fontSize: "var(--text-label)",
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "var(--kp-orange)",
        }}
      >
        {label}
      </p>
      <h2
        className="mt-4"
        style={{
          fontFamily: "var(--kp-font-display)",
          fontSize: "var(--text-section)",
          lineHeight: 1.02,
          textTransform: "uppercase",
          color: "var(--text)",
          maxWidth: "18ch",
        }}
      >
        {heading}
      </h2>
    </div>
  );

  if (reduced || staticMode) {
    // Static / reduced-motion: a plain horizontally-scrollable snap row.
    return (
      <section className={className} style={{ background: "var(--section-bg)", borderTop: "1px solid var(--border-soft)" }}>
        <div className="py-24">
          {header}
          <div
            className="mt-10 flex gap-5 px-6 pb-4"
            style={{ overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {items.map((item, i) => (
              <div key={item.title} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
                <GalleryCard item={item} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={outerRef}
      className={className}
      style={{
        background: "var(--section-bg)",
        // Total scroll length: one viewport + N × vhPerItem.
        height: `${100 + items.length * vhPerItem * 100}vh`,
        borderTop: "1px solid var(--border-soft)",
      }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {header}
        <div ref={trackRef} className="mt-10 flex w-max gap-5 pl-6">
          {items.map((item, i) => (
            <GalleryCard key={item.title} item={item} index={i} />
          ))}
          {/* Breathing room at the end of the run */}
          <div className="w-[10vw] shrink-0" aria-hidden />
        </div>
        {/* Progress hairline */}
        <div className="mx-auto mt-10 w-full max-w-6xl px-6">
          <div
            style={{
              height: 2,
              background: "var(--border-soft)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              ref={progressRef}
              style={{
                height: "100%",
                background: "var(--kp-orange)",
                transform: "scaleX(0)",
                transformOrigin: "left center",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
