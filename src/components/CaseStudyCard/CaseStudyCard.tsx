"use client";

/**
 * CaseStudyCard — cover image + brand overlay + results chips.
 * Pure CSS hover (compositor-only transform) — no JS per frame.
 */

import Image from "next/image";
import { CASE_STUDY_CARD_DEFAULTS } from "./caseStudyCardConfig";
import type { CaseStudyCardProps } from "./caseStudyCardTypes";

export function CaseStudyCard({
  study,
  onOpen,
  className,
  hoverScale = CASE_STUDY_CARD_DEFAULTS.hoverScale,
}: CaseStudyCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(study)}
      className={`group block w-full overflow-hidden rounded-2xl text-left ${className ?? ""}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-soft)",
        padding: 0,
        cursor: "pointer",
        ["--cs-hover-scale" as string]: hoverScale,
      }}
      aria-label={`Open case study: ${study.title}`}
    >
      {/* Cover */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
        <Image
          src={study.hero}
          alt={`${study.brand} — ${study.title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          className="transition-transform duration-700 ease-out group-hover:scale-(--cs-hover-scale)"
        />
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: "linear-gradient(180deg, transparent 45%, var(--kp-dark) 100%)",
            opacity: 0.75,
          }}
        />
        {/* Brand + category */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
          <span
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "1.25rem",
              textTransform: "uppercase",
              color: "var(--kp-light)",
              lineHeight: 1,
            }}
          >
            {study.brand}
          </span>
          <span
            className="rounded-full px-3 py-1"
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              background: "var(--kp-purple-soft)",
              color: "var(--kp-light)",
              border: "1px solid var(--kp-purple)",
            }}
          >
            {study.category}
          </span>
        </div>
      </div>

      {/* Copy + result chips */}
      <div className="p-6">
        <h3
          style={{
            fontFamily: "var(--kp-font-display)",
            fontSize: "1.35rem",
            lineHeight: 1.15,
            textTransform: "uppercase",
            color: "var(--text)",
          }}
        >
          {study.title}
        </h3>
        <p
          className="mt-3"
          style={{
            fontFamily: "var(--kp-font-body)",
            fontSize: "0.9rem",
            lineHeight: 1.65,
            color: "var(--text-muted)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {study.summary}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            `${study.results.impressions} impressions`,
            `${study.results.sites} sites`,
            `${study.results.upliftLabel} ${study.results.uplift}`,
          ].map((chip) => (
            <span
              key={chip}
              className="rounded-full px-3 py-1.5"
              style={{
                fontFamily: "var(--kp-font-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "var(--kp-orange-soft)",
                color: "var(--kp-orange)",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
