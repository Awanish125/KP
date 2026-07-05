"use client";

/**
 * CaseStudyStory — immersive campaign story for /case-studies/[slug].
 * Full-bleed hero, results band, narrative, parallax imagery, pull quote,
 * prev/next navigation. Content arrives fully typed from the server page.
 */

import Image from "next/image";
import Link from "next/link";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { ParallaxImage } from "@/components/ParallaxImage";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { CTABanner } from "@/components/CTABanner";
import type { CaseStudyStoryProps } from "./caseStudyStoryTypes";

export function CaseStudyStory({ study, prev, next }: CaseStudyStoryProps) {
  return (
    <article style={{ background: "var(--bg)" }}>
      {/* ── Full-bleed hero ───────────────────────────────────────────── */}
      <header className="relative" style={{ minHeight: "70vh" }}>
        <Image
          src={study.hero}
          alt={`${study.brand} campaign hero`}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, var(--kp-dark) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl px-6 pb-14">
          <p
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "var(--text-label)",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: "var(--kp-orange)",
            }}
          >
            {study.brand} · {study.category} · {study.year}
          </p>
          <TextReveal
            as="h1"
            text={study.title}
            className="mt-4"
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "var(--text-section)",
              lineHeight: 1.02,
              textTransform: "uppercase",
              color: "var(--kp-light)",
              maxWidth: "18ch",
            }}
          />
        </div>
      </header>

      {/* ── Results band ──────────────────────────────────────────────── */}
      <SectionReveal
        style={{ background: "var(--kp-dark-2)" }}
        className="border-b"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
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
                  fontSize: "clamp(2rem, 4vw, 3.2rem)",
                  lineHeight: 1,
                  color: "var(--kp-orange)",
                }}
              >
                {r.v}
              </div>
              <div
                className="mt-2"
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.68rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--kp-light)",
                  opacity: 0.55,
                }}
              >
                {r.l}
              </div>
            </div>
          ))}
        </div>
      </SectionReveal>

      {/* ── Narrative ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <SectionReveal as="div" className="flex flex-col gap-7" stagger={0.12}>
          {study.body.map((p, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--kp-font-body)",
                fontSize: i === 0 ? "var(--text-lead)" : "var(--text-body)",
                lineHeight: 1.8,
                color: i === 0 ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {p}
            </p>
          ))}
        </SectionReveal>
      </section>

      {/* ── Site transformation — drag to compare ─────────────────────── */}
      <SectionReveal className="mx-auto max-w-5xl px-6 pb-20" staggerChildren={false}>
        <p
          className="mb-6"
          style={{
            fontFamily: "var(--kp-font-mono)",
            fontSize: "var(--text-label)",
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "var(--kp-orange)",
          }}
        >
          Drag to see the takeover
        </p>
        <BeforeAfterSlider
          before={`${study.hero}?grayscale`}
          after={study.hero}
          alt={`${study.brand} site before and after the campaign`}
        />
      </SectionReveal>

      {/* ── Imagery ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          <ParallaxImage
            src={study.images[0]}
            alt={`${study.brand} campaign photo 1`}
            sizes="(max-width: 768px) 100vw, 50vw"
            aspectRatio="4 / 3"
            className="md:col-span-2"
          />
          {study.images.slice(1).map((img, i) => (
            <ParallaxImage
              key={img}
              src={img}
              alt={`${study.brand} campaign photo ${i + 2}`}
              sizes="(max-width: 768px) 100vw, 50vw"
              aspectRatio="4 / 3"
            />
          ))}
        </div>
      </section>

      {/* ── Pull quote ────────────────────────────────────────────────── */}
      <SectionReveal className="mx-auto max-w-4xl px-6 pb-24" staggerChildren={false}>
        <figure
          className="rounded-3xl p-10 md:p-14"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-soft)",
            borderLeft: "4px solid var(--kp-orange)",
            margin: 0,
          }}
        >
          <blockquote
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "clamp(1.4rem, 2.6vw, 2rem)",
              lineHeight: 1.25,
              color: "var(--text)",
              margin: 0,
            }}
          >
            &ldquo;{study.quote.text}&rdquo;
          </blockquote>
          <figcaption
            className="mt-6"
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            {study.quote.name} — {study.quote.role}
          </figcaption>
        </figure>
      </SectionReveal>

      {/* ── Prev / next ───────────────────────────────────────────────── */}
      <nav
        aria-label="More case studies"
        className="border-t"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <div className="mx-auto grid max-w-6xl md:grid-cols-2">
          {[
            { s: prev, dir: "Previous", align: "left" as const },
            { s: next, dir: "Next", align: "right" as const },
          ].map(({ s, dir, align }) => (
            <Link
              key={dir}
              href={`/case-studies/${s.slug}`}
              className="group px-6 py-10 no-underline transition-colors duration-300"
              style={{ textAlign: align }}
            >
              <div
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.68rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--kp-orange)",
                }}
              >
                {dir}
              </div>
              <div
                className="mt-2 transition-transform duration-300 group-hover:translate-x-0"
                style={{
                  fontFamily: "var(--kp-font-display)",
                  fontSize: "1.3rem",
                  textTransform: "uppercase",
                  color: "var(--text)",
                }}
              >
                {s.brand}: {s.title}
              </div>
            </Link>
          ))}
        </div>
      </nav>

      <CTABanner
        heading="Want numbers like these?"
        sub="Send the brief. We'll map the junctions."
        button={{ label: "Start a Campaign", href: "/contact" }}
      />
    </article>
  );
}
