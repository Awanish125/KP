"use client";

/**
 * VideoShowcase — full-bleed muted showreel loop with a lightbox player.
 *
 * Perf contract:
 *  - The loop video plays ONLY while on screen (IntersectionObserver
 *    play/pause — video decode is expensive, same rule as WebGL scenes).
 *  - Lightbox is a portal; it pauses the background loop, locks Lenis via
 *    the kp:scroll-lock events, closes on Escape/backdrop.
 *  - Reduced motion → no autoplay; the loop shows its poster frame and
 *    the lightbox still works on demand.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { MagneticButton } from "@/components/MagneticButton";
import { VIDEO_SHOWCASE_DEFAULTS } from "./videoShowcaseConfig";
import type { VideoShowcaseProps } from "./videoShowcaseTypes";

export function VideoShowcase({
  className,
  label = VIDEO_SHOWCASE_DEFAULTS.label,
  heading = VIDEO_SHOWCASE_DEFAULTS.heading,
  cta = VIDEO_SHOWCASE_DEFAULTS.cta,
  src = VIDEO_SHOWCASE_DEFAULTS.src,
}: VideoShowcaseProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* Loop plays only while visible. */
  useEffect(() => {
    const frame = frameRef.current;
    const video = loopRef.current;
    if (!frame || !video || prefersReducedMotion()) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !open) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(frame);
    return () => obs.disconnect();
  }, [open]);

  /* Lightbox lifecycle: scroll lock + escape + entrance. */
  useEffect(() => {
    if (!open) return;
    loopRef.current?.pause();
    window.dispatchEvent(new Event("kp:scroll-lock"));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const box = lightboxRef.current;
    if (box && !prefersReducedMotion()) {
      gsap.fromTo(
        box,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: "power2.out" },
      );
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.dispatchEvent(new Event("kp:scroll-unlock"));
    };
  }, [open]);

  return (
    <section className={className} style={{ background: "var(--kp-dark)" }}>
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <SectionReveal as="div" className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
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
            <TextReveal
              as="h2"
              text={heading}
              className="mt-4"
              style={{
                fontFamily: "var(--kp-font-display)",
                fontSize: "var(--text-section)",
                lineHeight: 1.02,
                textTransform: "uppercase",
                color: "var(--kp-light)",
                maxWidth: "16ch",
              }}
            />
          </div>
        </SectionReveal>

        {/* Loop frame */}
        <SectionReveal as="div" staggerChildren={false}>
          <div
            ref={frameRef}
            className="group relative cursor-pointer overflow-hidden rounded-3xl"
            style={{ aspectRatio: "16 / 8", background: "var(--kp-dark-2)" }}
            onClick={() => setOpen(true)}
            role="button"
            aria-label="Open showreel"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setOpen(true);
            }}
          >
            {/* preload="none": don't fetch a single byte until the section
                nears the viewport (IO calls play(), which starts the load).
                No hover transform on the <video> — scaling a playing video
                re-rasterizes its layer continuously. */}
            <video
              ref={loopRef}
              src={src}
              muted
              loop
              playsInline
              preload="none"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-60"
              style={{
                background:
                  "linear-gradient(180deg, transparent 55%, rgba(13,13,20,0.75) 100%)",
              }}
            />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <MagneticButton>
                <span
                  className="flex h-20 w-20 items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 md:h-24 md:w-24"
                  style={{
                    background: "var(--kp-orange)",
                    color: "var(--kp-dark)",
                    boxShadow: "0 12px 48px var(--kp-orange-glow)",
                  }}
                >
                  <Play size={30} style={{ marginLeft: 4 }} />
                </span>
              </MagneticButton>
            </div>
            <span
              className="absolute bottom-6 left-6"
              style={{
                fontFamily: "var(--kp-font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--kp-light)",
                opacity: 0.7,
              }}
            >
              {cta}
            </span>
          </div>
        </SectionReveal>
      </div>

      {/* Lightbox */}
      {mounted && open
        ? createPortal(
            <div
              ref={lightboxRef}
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Showreel player"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(13, 13, 20, 0.94)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close player"
                className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: "var(--kp-dark-2)",
                  color: "var(--kp-light)",
                  border: "1px solid var(--border-strong)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
              <video
                src={src}
                controls
                autoPlay
                playsInline
                onClick={(e) => e.stopPropagation()}
                className="max-h-full w-full max-w-5xl rounded-2xl"
                style={{ boxShadow: "0 40px 120px rgba(0,0,0,0.6)" }}
              />
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
