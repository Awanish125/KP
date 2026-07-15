"use client";

/**
 * DollyZoomChapter — Atlas Brut-style cinematic chapter reveal.
 *
 * Effect: .ch-mask starts at scale(0.32), .ch-img counter-scales at scale(3.125).
 * As the user scrolls through the section, the crop opens until the image
 * fills the viewport — the "camera pulling its frame wide" dolly zoom.
 *
 * Architecture:
 *  - No ScrollTrigger (project rule: Lenis + GSAP ticker only).
 *  - Parent section is tall (100svh + scrollDistance) so the sticky stage
 *    pins naturally via CSS position:sticky while scroll progress is computed
 *    from getBoundingClientRect().top vs section.offsetHeight.
 *  - IntersectionObserver gates all per-frame work.
 *  - will-change set dynamically on enter, removed on cleanup.
 *
 * Usage:
 *   <DollyZoomChapter
 *     image="/img/andheri-hoarding.jpg"
 *     sectionLabel="CHAPTER 01 / 03"
 *     coordinate="19.0760°N / 72.8777°E"
 *     title="Andheri Overpass"
 *     meta="MUMBAI · 2024"
 *     description="The approach from the Western Express Highway frames the
 *     structure against the skyline for twelve uninterrupted seconds."
 *   />
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { scrambleDecode } from "@/lib/scramble";

const DOLLY_START = 0.32; // ch-mask initial scale — matches Atlas Brut

export interface DollyZoomChapterProps {
  /** Image source (required) */
  image: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** Top-left label, e.g. "CHAPTER 01 / 03" */
  sectionLabel?: string;
  /** Top-right coordinate — scramble-decodes on enter, e.g. "19.0760°N / 72.8777°E" */
  coordinate?: string;
  /** Large display title */
  title: string;
  /** Mono subtitle below title, e.g. "MUMBAI · 2024" */
  meta?: string;
  /** Body copy below meta */
  description?: string;
  /**
   * Extra scroll height beyond the 100svh stage.
   * More = slower dolly. Atlas Brut uses 220svh.
   * @default "220svh"
   */
  scrollDistance?: string;
  className?: string;
}

export function DollyZoomChapter({
  image,
  imageAlt = "",
  sectionLabel,
  coordinate,
  title,
  meta,
  description,
  scrollDistance = "220svh",
  className,
}: DollyZoomChapterProps) {
  const sectionRef     = useRef<HTMLElement>(null);
  const maskRef        = useRef<HTMLDivElement>(null);
  const imgRef         = useRef<HTMLImageElement>(null);
  const scrimRef       = useRef<HTMLDivElement>(null);
  const headRef        = useRef<HTMLDivElement>(null);
  const coordElRef     = useRef<HTMLSpanElement>(null);
  const metaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const mask    = maskRef.current;
    const img     = imgRef.current;
    const scrim   = scrimRef.current;
    const head    = headRef.current;
    const coordEl = coordElRef.current;
    const metaCnt = metaContainerRef.current;

    if (!section || !mask || !img || !scrim) return;

    const S = DOLLY_START;

    if (prefersReducedMotion()) {
      gsap.set([mask, img], { clearProps: "transform" });
      gsap.set(scrim, { opacity: 1 });
      if (head) gsap.set(head, { autoAlpha: 1 });
      return;
    }

    // Initial states
    gsap.set(mask, { scale: S });
    gsap.set(img,  { scale: 1 / S }); // 3.125 — counter-scale keeps apparent size constant
    gsap.set(scrim, { opacity: 0 });
    if (head) gsap.set(head, { autoAlpha: 0 });

    const allLines = metaCnt
      ? Array.from(metaCnt.querySelectorAll<HTMLElement>(".kp-dzc-ln"))
      : [];
    if (allLines.length) gsap.set(allLines, { yPercent: 115 });

    // Flags for discrete triggers (fire on forward, reset on backward)
    let headFired    = false;
    let captionFired = false;
    let bloomed      = false;

    const bloom = (on: boolean) => {
      if (on === bloomed) return;
      bloomed = on;
      gsap.to(img, {
        filter: on
          ? "grayscale(0) contrast(1.05)"
          : "grayscale(1) contrast(1.05)",
        duration: on ? 0.9 : 0.5,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    };

    let visible = false;

    const tick = () => {
      if (!visible) return;

      const rect  = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return;

      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));

      // ── Scale (always scrubbed) ────────────────────────────────────────
      // Phase A: crop opens 0 → 0.6
      const pA = Math.min(p / 0.6, 1);
      const maskScale = S + (1 - S) * pA; // 0.32 → 1

      let imgScale: number;
      if (p <= 0.65) {
        // A: counter-scale collapses from 3.125 → 1.06
        imgScale = 1 / S + (1.06 - 1 / S) * pA;
      } else {
        // C: slow settle 1.06 → 1 (0.65 → 1.0)
        const pC = (p - 0.65) / 0.35;
        imgScale = 1.06 - 0.06 * pC;
      }

      mask.style.transform = `scale(${maskScale})`;
      img.style.transform  = `scale(${imgScale})`;

      // ── Scrim (0.4 → 0.65) ────────────────────────────────────────────
      const scrimP = Math.max(0, Math.min((p - 0.4) / 0.25, 1));
      scrim.style.opacity = String(scrimP);

      // ── Head (discrete: fires at 0.04, resets below 0.04) ─────────────
      if (p > 0.04 && !headFired) {
        headFired = true;
        if (head) gsap.to(head, { autoAlpha: 1, duration: 0.4, ease: "power2.out" });
        if (coordEl && coordinate) scrambleDecode(coordEl, coordinate, 1.0);
      }
      if (p <= 0.04 && headFired) {
        headFired = false;
        if (head) gsap.set(head, { autoAlpha: 0 });
      }

      // ── Caption lines rise (discrete: fires at 0.58) ──────────────────
      if (p > 0.58 && !captionFired) {
        captionFired = true;
        if (allLines.length) {
          gsap.to(allLines, { yPercent: 0, duration: 0.6, ease: "power2.out", stagger: 0.06 });
        }
      }
      if (p <= 0.58 && captionFired) {
        captionFired = false;
        if (allLines.length) gsap.set(allLines, { yPercent: 115 });
      }

      // ── Color bloom (at 0.62) ──────────────────────────────────────────
      bloom(p > 0.62);
    };

    gsap.ticker.add(tick);
    mask.style.willChange = "transform";
    img.style.willChange  = "transform";

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, { threshold: 0 });
    io.observe(section);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      mask.style.willChange = "";
      img.style.willChange  = "";
    };
  }, [image, coordinate]);

  return (
    <section ref={sectionRef} className={`kp-dzc ${className ?? ""}`}>
      {/* Stage — sticks to viewport while parent section scrolls */}
      <div className="kp-dzc-stage">

        {/* ── Mask + counter-scaled image ── */}
        <div ref={maskRef} className="kp-dzc-mask">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={image}
            alt={imageAlt}
            className="kp-dzc-img"
            loading="lazy"
            decoding="async"
          />
          <div ref={scrimRef} className="kp-dzc-scrim" />
        </div>

        {/* ── Head: section label + coordinate ── */}
        {(sectionLabel || coordinate) && (
          <div ref={headRef} className="kp-dzc-head">
            {sectionLabel && (
              <span className="kp-dzc-no">{sectionLabel}</span>
            )}
            {coordinate && (
              <span ref={coordElRef} className="kp-dzc-coord">{coordinate}</span>
            )}
          </div>
        )}

        {/* ── Meta: title, facts, description ── */}
        <div ref={metaContainerRef} className="kp-dzc-meta">
          <h2 className="kp-dzc-title">
            <span className="kp-dzc-lm">
              <span className="kp-dzc-ln">{title}</span>
            </span>
          </h2>
          {meta && (
            <p className="kp-dzc-facts">
              <span className="kp-dzc-lm">
                <span className="kp-dzc-ln">{meta}</span>
              </span>
            </p>
          )}
          {description && (
            <p className="kp-dzc-desc">
              <span className="kp-dzc-lm">
                <span className="kp-dzc-ln">{description}</span>
              </span>
            </p>
          )}
        </div>

      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        /* Outer section — provides scroll distance for the sticky stage */
        .kp-dzc {
          position: relative;
          height: calc(100svh + ${scrollDistance});
        }

        /* Stage — sticky for the duration of the parent's scroll */
        .kp-dzc-stage {
          position: sticky;
          top: 0;
          height: 100svh;
          overflow: hidden;
          // background: #0D0D14;
        }

        /* Mask — starts at 32%, grows to 100% of viewport */
        .kp-dzc-mask {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #101114;
        }

        /* Image — counter-scaled so it appears the same size as mask grows */
        .kp-dzc-img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(1) contrast(1.05);
        }

        /* Scrim — dark gradient for text legibility */
        .kp-dzc-scrim {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            rgba(12, 13, 15, 0.55) 0%,
            transparent 32%,
            rgba(12, 13, 15, 0.85) 100%
          );
        }

        /* Head row — label left, coordinate right */
        .kp-dzc-head {
          position: absolute;
          top: 5.4rem;
          left: clamp(1.25rem, 4vw, 3.5rem);
          right: clamp(1.25rem, 4vw, 3.5rem);
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-transform: uppercase;
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          color: rgba(245, 247, 250, 0.5);
        }
        .kp-dzc-coord { color: var(--kp-orange, #F5821F); }

        /* Meta block — sits at the bottom */
        .kp-dzc-meta {
          position: absolute;
          left: clamp(1.25rem, 4vw, 3.5rem);
          right: clamp(1.25rem, 4vw, 3.5rem);
          bottom: clamp(2rem, 6vh, 4rem);
          z-index: 2;
        }

        /* Title */
        .kp-dzc-title {
          font-family: var(--kp-font-display, sans-serif);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          font-size: clamp(2.6rem, 8vw, 7rem);
          line-height: 0.9;
          color: #F5F7FA;
          margin: 0;
        }

        /* Facts / meta line */
        .kp-dzc-facts {
          margin: 0.9rem 0 0;
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(245, 247, 250, 0.5);
        }

        /* Description */
        .kp-dzc-desc {
          margin: 1.1rem 0 0;
          max-width: 36rem;
          font-size: 0.95rem;
          line-height: 1.55;
          color: rgba(245, 247, 250, 0.8);
        }

        /* Line-mask — clips content until yPercent animation reveals it */
        .kp-dzc-lm {
          display: block;
          overflow: hidden;
        }
        .kp-dzc-ln {
          display: inline-block;
        }

        /* Reduced-motion: instant full state, no transforms */
        @media (prefers-reduced-motion: reduce) {
          .kp-dzc-mask { transform: none !important; }
          .kp-dzc-img  { transform: none !important; }
          .kp-dzc-scrim { opacity: 1 !important; }
          .kp-dzc-head  { opacity: 1 !important; visibility: visible !important; }
          .kp-dzc-ln   { transform: none !important; }
        }
      `}</style>
    </section>
  );
}
