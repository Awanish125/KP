"use client";

/**
 * PageHero — shared cinematic opener for all inner pages:
 * mono label → two display lines (word-by-word reveal) → lead paragraph.
 */

import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import type { PageHeroProps } from "./pageHeroTypes";

export function PageHero({ label, line1, line2, sub, className }: PageHeroProps) {
  return (
    <header className={className ?? "mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28"}>
      <SectionReveal as="div" stagger={0.14}>
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
        <h1
          className="mt-6"
          style={{
            fontFamily: "var(--kp-font-display)",
            fontSize: "var(--text-hero)",
            lineHeight: 0.98,
            textTransform: "uppercase",
            letterSpacing: "0.005em",
          }}
        >
          <TextReveal as="span" text={line1} style={{ display: "block", color: "var(--text)" }} />
          <TextReveal
            as="span"
            text={line2}
            delay={0.18}
            style={{ display: "block", color: "var(--kp-orange)" }}
          />
        </h1>
        {sub ? (
          <p
            className="mt-8 max-w-xl"
            style={{
              fontFamily: "var(--kp-font-body)",
              fontSize: "var(--text-lead)",
              lineHeight: 1.6,
              color: "var(--text-muted)",
            }}
          >
            {sub}
          </p>
        ) : null}
      </SectionReveal>
    </header>
  );
}
