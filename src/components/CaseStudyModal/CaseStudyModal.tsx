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
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
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

  return createPortal(
    <div
      ref={backdropRef}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "var(--scrim)",
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
        className="w-full max-w-3xl overflow-y-auto rounded-3xl"
        style={{
          maxHeight: "88vh",
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-ambient)",
          outline: "none",
        }}
      >
        {/* Cover */}
        <div className="relative" style={{ aspectRatio: "16 / 8" }}>
          <Image
            src={study.hero}
            alt={`${study.brand} campaign`}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            style={{ objectFit: "cover" }}
            priority
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: "var(--scrim)",
              color: "var(--text)",
              border: "1px solid var(--border-soft)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8 md:p-10">
          <div
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--kp-orange)",
            }}
          >
            {study.brand} · {study.category} · {study.year}
          </div>
          <h2
            className="mt-3"
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              lineHeight: 1.08,
              textTransform: "uppercase",
              color: "var(--text)",
            }}
          >
            {study.title}
          </h2>
          <p
            className="mt-4"
            style={{
              fontFamily: "var(--kp-font-body)",
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "var(--text-muted)",
            }}
          >
            {study.summary}
          </p>

          {/* Results */}
          <div
            className="mt-8 grid grid-cols-2 gap-6 rounded-2xl p-6 md:grid-cols-4"
            style={{ background: "var(--bg)", border: "1px solid var(--border-soft)" }}
          >
            {[
              { v: study.results.impressions, l: "Impressions" },
              { v: study.results.sites, l: "Sites" },
              { v: study.results.cities, l: "Cities" },
              { v: study.results.uplift, l: study.results.upliftLabel },
            ].map((r) => (
              <div key={r.l}>
                <div
                  style={{
                    fontFamily: "var(--kp-font-display)",
                    fontSize: "1.9rem",
                    lineHeight: 1,
                    color: "var(--kp-orange)",
                  }}
                >
                  {r.v}
                </div>
                <div
                  className="mt-1.5"
                  style={{
                    fontFamily: "var(--kp-font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {r.l}
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/case-studies/${study.slug}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 no-underline"
            style={{
              background: "var(--kp-orange)",
              color: "var(--kp-dark)",
              fontFamily: "var(--kp-font-body)",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            Read the full story →
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
