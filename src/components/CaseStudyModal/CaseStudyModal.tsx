"use client";

/**
 * CaseStudyModal — detail overlay opened from the case-study grid.
 *
 *  - Portal to <body>; Escape or backdrop click closes.
 *  - GSAP entrance (opacity + y) with will-change managed around the tween.
 *  - Body scroll locked while open; focus moves to the dialog.
 *  - "Full story" links to /case-studies/[slug] for the immersive page.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { CASE_STUDY_MODAL_DEFAULTS } from "./caseStudyModalConfig";
import type { CaseStudyModalProps } from "./caseStudyModalTypes";

export function CaseStudyModal({
  study,
  onClose,
  duration = CASE_STUDY_MODAL_DEFAULTS.duration,
  ease = CASE_STUDY_MODAL_DEFAULTS.ease,
}: CaseStudyModalProps) {
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Escape to close + scroll lock while open.
  useEffect(() => {
    if (!study) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Lenis attaches a wheel listener to window and calls preventDefault() on
    // every wheel event, even when lenis.stop() is called — so native overflow
    // scroll on the modal panel never fires. Fix: intercept wheel events on the
    // panel in the capture phase, stop propagation so Lenis never sees them,
    // and drive scrollTop manually.
    const panel = panelRef.current;
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      if (panel) panel.scrollTop += e.deltaY;
    };
    panel?.addEventListener("wheel", onWheel, { passive: true, capture: true });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      panel?.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [study, onClose]);

  // Entrance animation + focus.
  useEffect(() => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!study || !backdrop || !panel) return;

    panel.focus({ preventScroll: true });
    if (prefersReducedMotion()) return;

    panel.style.willChange = "transform, opacity";
    const tl = gsap.timeline({
      onComplete: () => {
        panel.style.willChange = "auto";
      },
    });
    tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: duration * 0.6, ease: "none" });
    tl.fromTo(
      panel,
      { opacity: 0, y: 28, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration, ease },
      0.05,
    );
    return () => {
      tl.kill();
    };
  }, [study, duration, ease]);

  if (!mounted || !study) return null;

  const stats = [
    { v: study.results.impressions, l: "Impressions" },
    { v: study.results.sites,       l: "Sites" },
    { v: study.results.cities,      l: "Cities" },
    { v: study.results.uplift,      l: study.results.upliftLabel },
  ];

  return createPortal(
    <>
      {/* Scoped scrollbar styles — re-enable a thin styled bar inside the panel
          (the global html rule hides all scrollbars; we restore it here only). */}
      <style>{`
        .kp-csm-panel {
          scrollbar-width: thin;
          scrollbar-color: var(--kp-orange) transparent;
        }
        .kp-csm-panel::-webkit-scrollbar { width: 3px; }
        .kp-csm-panel::-webkit-scrollbar-track { background: transparent; }
        .kp-csm-panel::-webkit-scrollbar-thumb {
          background: var(--kp-orange);
          border-radius: 99px;
        }
      `}</style>

      <div
        ref={backdropRef}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.25rem",
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${study.brand}: ${study.title}`}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className="kp-csm-panel w-full max-w-2xl overflow-y-auto"
          style={{
            maxHeight: "90svh",
            borderRadius: "1.5rem",
            background: "var(--bg)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
            outline: "none",
            overscrollBehavior: "contain",
          }}
        >
          {/* ── Hero image ──────────────────────────────────────────────── */}
          <div className="relative" style={{ aspectRatio: "16 / 9" }}>
            <Image
              src={study.hero}
              alt={`${study.brand} campaign`}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              style={{ objectFit: "cover", borderRadius: "1.5rem 1.5rem 0 0" }}
              priority
            />
            {/* gradient scrim at bottom of image */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "1.5rem 1.5rem 0 0",
                background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55) 100%)",
              }}
            />
            {/* Category pill — bottom-left of image */}
            <div
              style={{
                position: "absolute",
                bottom: "1rem",
                left: "1.25rem",
                fontFamily: "var(--kp-font-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.75)",
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(8px)",
                padding: "0.3rem 0.75rem",
                borderRadius: "99px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {study.category} · {study.year}
            </div>
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(8px)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Body ─────────────────────────────────────────────────────── */}
          <div style={{ padding: "2rem 2rem 2.5rem" }}>
            {/* Brand label */}
            <div
              style={{
                fontFamily: "var(--kp-font-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "var(--kp-orange)",
                marginBottom: "0.6rem",
              }}
            >
              {study.brand}
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: "var(--kp-font-display)",
                fontSize: "clamp(1.5rem, 3.2vw, 2.1rem)",
                lineHeight: 1.06,
                textTransform: "uppercase",
                color: "var(--text)",
                margin: 0,
              }}
            >
              {study.title}
            </h2>

            {/* Divider */}
            <div
              aria-hidden
              style={{
                width: "2.5rem",
                height: "2px",
                background: "var(--kp-orange)",
                borderRadius: "2px",
                margin: "1.25rem 0",
              }}
            />

            {/* Summary */}
            <p
              style={{
                fontFamily: "var(--kp-font-body)",
                fontSize: "0.95rem",
                lineHeight: 1.75,
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              {study.summary}
            </p>

            {/* ── Stats row ────────────────────────────────────────────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0",
                marginTop: "2rem",
                borderRadius: "1rem",
                overflow: "hidden",
                border: "1px solid var(--border-soft)",
              }}
            >
              {stats.map((r, i) => (
                <div
                  key={r.l}
                  style={{
                    padding: "1.1rem 0.75rem",
                    background: "var(--surface)",
                    borderRight: i < stats.length - 1 ? "1px solid var(--border-soft)" : "none",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--kp-font-display)",
                      fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
                      lineHeight: 1,
                      color: "var(--kp-orange)",
                      fontWeight: 700,
                    }}
                  >
                    {r.v}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--kp-font-mono)",
                      fontSize: "0.55rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginTop: "0.4rem",
                    }}
                  >
                    {r.l}
                  </div>
                </div>
              ))}
            </div>

            {/* ── CTA ──────────────────────────────────────────────────── */}
            <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <Link
                href={`/case-studies/${study.slug}`}
                className="no-underline"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--kp-orange)",
                  color: "var(--kp-dark)",
                  fontFamily: "var(--kp-font-body)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.02em",
                  padding: "0.75rem 1.75rem",
                  borderRadius: "99px",
                }}
              >
                Full story →
              </Link>
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem 0",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
