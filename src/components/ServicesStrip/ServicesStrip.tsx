"use client";

/**
 * ServicesStrip — Atlas Brut "Ledger" pattern with dark/light theme support.
 *
 * Dark mode  → cinematic near-black bg, white rows, orange accents.
 * Light mode → white bg, dark rows, orange accents.
 *
 * Default (no hover): all rows at full opacity (white on dark / dark on light).
 * On hover            : hovered title slides right + turns orange;
 *                       siblings dim to 0.25 opacity.
 * Image plate         : clip-path wipe (inset bottom→0) + grayscale→colour bloom.
 * Coord text          : scramble-decodes to new description on row change.
 */

import { useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { SERVICES_STRIP_DEFAULTS } from "./servicesStripConfig";
import type { ServicesStripProps } from "./servicesStripTypes";

import { scrambleDecode } from "@/lib/scramble";

export function ServicesStrip({
  items,
  className,
  label           = SERVICES_STRIP_DEFAULTS.label,
  heading         = SERVICES_STRIP_DEFAULTS.heading,
  headingEmphasis = SERVICES_STRIP_DEFAULTS.headingEmphasis,
  href            = SERVICES_STRIP_DEFAULTS.href,
  linkLabel       = SERVICES_STRIP_DEFAULTS.linkLabel,
}: ServicesStripProps) {
  const imgARef  = useRef<HTMLImageElement>(null);
  const imgBRef  = useRef<HTMLImageElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const front    = useRef<HTMLImageElement | null>(null);
  const back     = useRef<HTMLImageElement | null>(null);
  const curSrc   = useRef<string>("");
  const wiping   = useRef<gsap.core.Tween | null>(null);

  /* Seed front buffer + initial coord text */
  useEffect(() => {
    front.current = imgARef.current;
    back.current  = imgBRef.current;
    if (items[0]?.image && imgARef.current) {
      imgARef.current.src = items[0].image;
      curSrc.current      = items[0].image;
    }
    if (coordRef.current && items[0]?.description) {
      coordRef.current.textContent = items[0].description;
    }
  }, [items]);

  /* Row stagger entrance — IntersectionObserver, no ScrollTrigger */
  const rowsRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const ul = rowsRef.current;
    if (!ul || prefersReducedMotion()) return;
    const rows = Array.from(ul.querySelectorAll<HTMLElement>(".kp-l-row"));
    gsap.set(rows, { opacity: 0, y: 18 });

    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(rows, {
        opacity: 1, y: 0,
        duration: 0.85, ease: "expo.out", stagger: 0.07,
        clearProps: "transform",
      });
    }, { rootMargin: "0px 0px -5% 0px" });

    io.observe(ul);
    return () => io.disconnect();
  }, []);

  /* Hover: swap plate image */
  const onEnter = useCallback((item: { image?: string; description: string }) => {
    if (!item.image || item.image === curSrc.current) return;
    curSrc.current = item.image;
    const f = front.current;
    const b = back.current;
    if (!f || !b) return;

    if (prefersReducedMotion()) {
      f.src = item.image;
      if (coordRef.current) coordRef.current.textContent = item.description;
      return;
    }

    wiping.current?.kill();
    b.src = item.image;
    gsap.set(b, { clipPath: "inset(0 0 100% 0)", zIndex: 2, filter: "grayscale(1)" });
    gsap.set(f, { zIndex: 1 });
    wiping.current = gsap.to(b, {
      clipPath: "inset(0 0 0% 0)", filter: "grayscale(0)",
      duration: 0.7, ease: "expo.out",
      onComplete: () => {
        [front.current, back.current] = [back.current, front.current];
        wiping.current = null;
      },
    });

    if (coordRef.current) scrambleDecode(coordRef.current, item.description, 0.55);
  }, []);

  /* List leave: rest plate to grayscale */
  const onListLeave = useCallback(() => {
    if (prefersReducedMotion()) return;
    const a = imgARef.current, b = imgBRef.current;
    if (a && b) gsap.to([a, b], { filter: "grayscale(1)", duration: 0.6, ease: "power2.out" });
  }, []);

  return (
    <section
      className={`kp-services-strip ${className ?? ""}`}
      style={{ borderTop: "1px solid var(--stage-border)" }}
    >
      <div className="kp-strip-inner">

        {/* ── Heading ── */}
        <div className="kp-strip-head">
          <p className="kp-strip-label">{label}</p>
          <h2 className="kp-strip-title">
            {heading}{" "}
            <span className="kp-accent">{headingEmphasis}</span>
            {","}
            <span className="kp-strip-sub">BUILT FOR INDIA.</span>
          </h2>
        </div>

        {/* ── Ledger grid ── */}
        <div className="kp-ledger-grid">

          {/* LEFT: numbered rows */}
          <ul
            ref={rowsRef}
            className="kp-ledger-rows"
            onMouseLeave={onListLeave}
          >
            {items.map((item, i) => (
              <li key={item.title}>
                <Link
                  href={href}
                  onMouseEnter={() => onEnter(item)}
                  className="kp-l-row"
                >
                  {/* Number */}
                  <span className="kp-l-no">
                    {String(i).padStart(2, "0")}
                  </span>

                  {/* Content (Title + Meta/Desc) */}
                  <div className="kp-l-content">
                    <span className="kp-l-name">{item.title}</span>
                    <span className="kp-l-meta">{item.description}</span>
                  </div>

                  {/* Small thumbnail image for mobile/tablet at the end */}
                  {item.image && (
                    <div className="kp-l-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* RIGHT: sticky dossier plate (desktop only) */}
          <div className="kp-plate-wrap" aria-hidden="true">
            <div className="kp-plate-sticky">
              {/* Image frame */}
              <div className="kp-plate">
                {/* Front buffer */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgARef} alt="" src={items[0]?.image ?? ""}
                  className="kp-plate-img" style={{ zIndex: 1 }} />
                {/* Back buffer */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgBRef} alt="" src={undefined}
                  className="kp-plate-img kp-plate-back" style={{ zIndex: 2 }} />
                {/* Corner brackets */}
                <span className="kp-corner kp-tl" />
                <span className="kp-corner kp-tr" />
                <span className="kp-corner kp-bl" />
                <span className="kp-corner kp-br" />
              </div>
              {/* Coord readout */}
              <p className="kp-plate-read">
                <span ref={coordRef} />
              </p>
            </div>
          </div>

        </div>

        {/* CTA */}
        <div className="kp-strip-cta">
          <Link href={href} className="kp-cta-link">
            {linkLabel}
            <span className="kp-cta-line" aria-hidden />
          </Link>
        </div>

      </div>

      {/* ── Styles (scoped via unique class prefix) ── */}
      <style>{`

        /* ── Section shell ── */
        .kp-services-strip {
          background: var(--stage-bg);
          color: var(--stage-text);
        }
        .kp-strip-inner {
          padding: clamp(6rem,14vh,10rem) clamp(1.25rem,4vw,3.5rem);
        }

        /* ── Heading ── */
        .kp-strip-head { margin-bottom: clamp(3rem,7vh,5rem); }
        .kp-strip-label {
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--stage-text-soft);
          margin-bottom: 2.2rem;
        }
        .kp-strip-title {
          font-family: var(--kp-font-display, sans-serif);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          font-size: clamp(2rem,5vw,4.2rem);
          line-height: 0.95;
          margin: 0;
          color: var(--stage-text);
        }
        .kp-accent { color: var(--kp-orange); }
        .kp-strip-sub {
          font-family: var(--kp-font-mono, monospace);
          font-size: clamp(0.65rem,1.3vw,0.9rem);
          font-weight: 400;
          letter-spacing: 0.22em;
          color: var(--stage-text-soft);
          display: block;
          margin-top: 0.9rem;
        }

        /* ── Grid ── */
        .kp-ledger-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }
        @media (min-width: 900px) {
          .kp-ledger-grid {
            grid-template-columns: 1fr minmax(280px, 34%);
            gap: 5rem;
            align-items: start;
          }
        }

        /* ── Row list ── */
        .kp-ledger-rows {
          list-style: none;
          padding: 0;
          margin: 0;
          border-top: 1px solid var(--stage-border);
        }

        /* Row link */
        .kp-l-row {
          width: 100%;
          display: grid;
          grid-template-columns: 3rem 1fr;
          align-items: center;
          gap: 1.5rem;
          padding: 1.35rem 0;
          border-bottom: 1px solid var(--stage-border);
          text-decoration: none;
          color: inherit;
          /* Default: fully visible */
          opacity: 1;
          transition: opacity .4s ease;
        }

        /* Content wrapper */
        .kp-l-content {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: baseline;
          gap: 2rem;
          flex: 1;
        }

        /* Number */
        .kp-l-no {
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          color: var(--kp-orange);
        }

        /* Title */
        .kp-l-name {
          font-family: var(--kp-font-display, sans-serif);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          font-size: clamp(1.1rem, 2.4vw, 2rem);
          line-height: 1;
          color: var(--stage-text);
          display: block;
          transition: transform .5s cubic-bezier(.16,1,.3,1), color .4s ease;
        }

        /* Meta */
        .kp-l-meta {
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          color: var(--stage-text-soft);
          text-transform: uppercase;
          text-align: right;
        }

        /* Small mobile thumbnail */
        .kp-l-thumb {
          display: none;
        }

        /* Hover: dim ALL rows first, then un-dim the hovered one */
        .kp-ledger-rows:hover .kp-l-row {
          opacity: 0.25;
        }
        .kp-ledger-rows:hover .kp-l-row:hover {
          opacity: 1;
        }
        /* Hovered title: slide right + orange */
        .kp-l-row:hover .kp-l-name {
          transform: translateX(0.9rem);
          color: var(--kp-orange);
        }

        /* ── Plate (desktop only) ── */
        .kp-plate-wrap { display: none; }
        @media (min-width: 900px) {
          .kp-plate-wrap { display: block; }
        }
        .kp-plate-sticky {
          position: sticky;
          top: 10vh;
          align-self: start;
        }
        .kp-plate {
          position: relative;
          aspect-ratio: 4 / 5;
          max-height: calc(100vh - 160px);
          overflow: hidden;
          background: var(--kp-dark, #07101D);
        }
        .kp-plate-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(1);
        }
        .kp-plate-back {
          clip-path: inset(0 0 100% 0);
        }

        /* Orange corner brackets */
        .kp-corner {
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1px solid var(--kp-orange);
          z-index: 3;
        }
        .kp-tl { top: 8px;    left: 8px;   border-right: 0; border-bottom: 0; }
        .kp-tr { top: 8px;    right: 8px;  border-left:  0; border-bottom: 0; }
        .kp-bl { bottom: 8px; left: 8px;   border-right: 0; border-top:    0; }
        .kp-br { bottom: 8px; right: 8px;  border-left:  0; border-top:    0; }

        /* Coord / description readout */
        .kp-plate-read {
          margin-top: 0.9rem;
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          color: var(--kp-orange);
          text-transform: uppercase;
        }

        /* ── CTA ── */
        .kp-strip-cta { margin-top: clamp(2.5rem,5vh,4rem); }
        .kp-cta-link {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--kp-orange);
          text-decoration: none;
        }
        .kp-cta-line {
          display: block;
          height: 1px;
          width: 32px;
          background: var(--kp-orange);
        }

        /* ── Responsive adjustments for mobile/tablet ── */
        @media (max-width: 899px) {
          .kp-l-row {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            gap: 1.5rem;
            padding: 1.5rem 0;
          }
          .kp-l-content {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            align-items: flex-start;
          }
          .kp-l-name {
            font-size: 1.25rem !important;
            transform: none !important;
          }
          .kp-l-meta {
            text-align: left !important;
            font-size: 0.75rem !important;
          }
          .kp-l-thumb {
            display: block;
            width: 80px;
            height: 60px;
            flex-shrink: 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(231, 227, 218, 0.15);
          }
          .kp-l-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

      `}</style>
    </section>
  );
}
