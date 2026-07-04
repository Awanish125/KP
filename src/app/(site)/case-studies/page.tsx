"use client";

/**
 * /case-studies — filterable grid; each card opens a detail modal.
 * All content lives in src/data/caseStudies.json — edit there, not here.
 */

import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { CaseStudyCard, type CaseStudy } from "@/components/CaseStudyCard";
import { CaseStudyModal } from "@/components/CaseStudyModal";
import { CTABanner } from "@/components/CTABanner";
import data from "@/data/caseStudies.json";

const STUDIES = data.items as CaseStudy[];

export default function CaseStudiesPage() {
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState<CaseStudy | null>(null);

  const filtered =
    category === "All"
      ? STUDIES
      : STUDIES.filter((s) => s.category === category);

  return (
    <div style={{ background: "var(--bg)" }}>
      <PageHero
        label={data.hero.label}
        line1={data.hero.line1}
        line2={data.hero.line2}
        sub={data.hero.sub}
      />

      {/* Filter row */}
      <SectionReveal as="div" className="mx-auto max-w-6xl px-6 pb-10" staggerChildren={false}>
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter case studies">
          {data.categories.map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={active}
                className="rounded-full px-5 py-2.5 transition-colors duration-200"
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  background: active ? "var(--kp-orange)" : "transparent",
                  color: active ? "var(--kp-dark)" : "var(--text-muted)",
                  border: `1px solid ${active ? "var(--kp-orange)" : "var(--border-strong)"}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </SectionReveal>

      {/* Grid — keyed by category so the reveal replays on filter change */}
      <SectionReveal
        key={category}
        className="mx-auto grid max-w-6xl gap-6 px-6 pb-28 md:grid-cols-2 lg:grid-cols-3"
        stagger={0.08}
        rootMargin="0px 0px 0px 0px"
      >
        {filtered.map((study) => (
          <CaseStudyCard key={study.slug} study={study} onOpen={setOpen} />
        ))}
      </SectionReveal>

      <CaseStudyModal study={open} onClose={() => setOpen(null)} />

      <CTABanner
        heading="The next case study could be yours."
        sub="Brief us today — live in 72 hours."
        button={{ label: "Start a Campaign", href: "/contact" }}
      />
    </div>
  );
}
