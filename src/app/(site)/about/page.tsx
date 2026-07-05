"use client";

/**
 * /about — cinematic story, timeline, values, team, testimonials.
 * All copy lives in src/data/about.json — edit there, not here.
 */

import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { StatCounter } from "@/components/StatCounter";
import { ParallaxImage } from "@/components/ParallaxImage";
import { TestimonialSlider } from "@/components/TestimonialSlider";
import { CTABanner } from "@/components/CTABanner";
import data from "@/data/about.json";

function SectionLabel({ text }: { text: string }) {
  return (
    <p
      style={{
        fontFamily: "var(--kp-font-mono)",
        fontSize: "var(--text-label)",
        letterSpacing: "0.45em",
        textTransform: "uppercase",
        color: "var(--kp-orange)",
      }}
    >
      {text}
    </p>
  );
}

const sectionHeadStyle: React.CSSProperties = {
  fontFamily: "var(--kp-font-display)",
  fontSize: "var(--text-section)",
  lineHeight: 1.05,
  textTransform: "uppercase",
  color: "var(--text)",
};

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <PageHero
        label={data.hero.label}
        line1={data.hero.line1}
        line2={data.hero.line2}
        sub={data.hero.sub}
      />

      {/* ── Story ─────────────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 lg:grid-cols-2 lg:gap-16">
        <SectionReveal as="div" className="flex flex-col justify-center gap-6">
          <SectionLabel text={data.story.label} />
          <TextReveal as="h2" text={data.story.heading} style={sectionHeadStyle} />
          {data.story.paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--kp-font-body)",
                fontSize: "var(--text-body)",
                lineHeight: 1.75,
                color: "var(--text-muted)",
              }}
            >
              {p}
            </p>
          ))}
        </SectionReveal>

        <SectionReveal as="div" staggerChildren={false}>
          <ParallaxImage
            src={data.story.image}
            alt="Kiran Publicity crew installing a hoarding"
            sizes="(max-width: 1024px) 100vw, 50vw"
            aspectRatio="4 / 5"
          />
        </SectionReveal>
      </section>

      {/* ── Stats band ────────────────────────────────────────────────── */}
      <SectionReveal
        className="border-y"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
          {data.stats.map((s) => (
            <StatCounter
              key={s.label}
              value={s.value}
              suffix={s.suffix}
              label={s.label}
              numberClassName="text-5xl md:text-6xl"
            />
          ))}
        </div>
      </SectionReveal>

      {/* ── Timeline ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionReveal as="div" className="mb-16">
          <SectionLabel text="The Journey" />
          <TextReveal as="h2" text="Twenty-seven years, one junction at a time." style={{ ...sectionHeadStyle, marginTop: "1rem" }} />
        </SectionReveal>

        <div className="relative">
          {/* Rail */}
          <div
            aria-hidden
            className="absolute top-0 bottom-0 left-[7px] w-px md:left-1/2"
            style={{ background: "var(--border-strong)" }}
          />
          <div className="flex flex-col gap-14">
            {data.timeline.map((item, i) => (
              <SectionReveal
                key={item.year}
                as="div"
                staggerChildren={false}
                className={`relative pl-10 md:w-1/2 md:pl-0 ${
                  i % 2 === 0
                    ? "md:pr-14 md:text-right"
                    : "md:ml-auto md:pl-14"
                }`}
              >
                {/* Node dot */}
                <span
                  aria-hidden
                  className={`absolute top-1.5 h-[15px] w-[15px] rounded-full left-0 ${
                    i % 2 === 0 ? "md:left-auto md:-right-[7px]" : "md:-left-[7px]"
                  }`}
                  style={{
                    background: "var(--kp-orange)",
                    boxShadow: "0 0 0 4px var(--kp-orange-soft)",
                  }}
                />
                <div
                  style={{
                    fontFamily: "var(--kp-font-mono)",
                    fontSize: "0.8rem",
                    letterSpacing: "0.3em",
                    color: "var(--kp-orange)",
                  }}
                >
                  {item.year}
                </div>
                <h3
                  className="mt-2"
                  style={{
                    fontFamily: "var(--kp-font-display)",
                    fontSize: "1.5rem",
                    textTransform: "uppercase",
                    color: "var(--text)",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "var(--kp-font-body)",
                    fontSize: "var(--text-body)",
                    lineHeight: 1.7,
                    color: "var(--text-muted)",
                  }}
                >
                  {item.body}
                </p>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border-soft)", borderBottom: "1px solid var(--border-soft)" }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionReveal as="div" className="mb-14">
            <SectionLabel text="How We Work" />
          </SectionReveal>
          <SectionReveal as="div" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
            {data.values.map((v, i) => (
              <div key={v.title}>
                <div
                  style={{
                    fontFamily: "var(--kp-font-display)",
                    fontSize: "2.6rem",
                    lineHeight: 1,
                    color: "var(--kp-orange)",
                    opacity: 0.85,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3
                  className="mt-4"
                  style={{
                    fontFamily: "var(--kp-font-display)",
                    fontSize: "1.3rem",
                    textTransform: "uppercase",
                    color: "var(--text)",
                  }}
                >
                  {v.title}
                </h3>
                <p
                  className="mt-3"
                  style={{
                    fontFamily: "var(--kp-font-body)",
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                    color: "var(--text-muted)",
                  }}
                >
                  {v.body}
                </p>
              </div>
            ))}
          </SectionReveal>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionReveal as="div" className="mb-14">
          <SectionLabel text={data.team.label} />
          <TextReveal as="h2" text={data.team.heading} style={{ ...sectionHeadStyle, marginTop: "1rem" }} />
        </SectionReveal>

        <SectionReveal as="div" className="grid grid-cols-2 gap-6 md:grid-cols-3" stagger={0.08}>
          {data.team.members.map((m) => (
            <figure key={m.name} className="group m-0">
              <div
                className="relative overflow-hidden rounded-xl"
                style={{ aspectRatio: "4 / 5", background: "var(--surface-2)" }}
              >
                <Image
                  src={m.image}
                  alt={m.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1/3 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: "linear-gradient(0deg, var(--kp-orange-soft), transparent)",
                  }}
                />
              </div>
              <figcaption className="mt-4">
                <div style={{ fontFamily: "var(--kp-font-body)", fontWeight: 700, color: "var(--text)" }}>
                  {m.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--kp-font-mono)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginTop: "0.2rem",
                  }}
                >
                  {m.role}
                </div>
              </figcaption>
            </figure>
          ))}
        </SectionReveal>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--surface)", borderTop: "1px solid var(--border-soft)" }}>
        <SectionReveal as="div" className="mx-auto mb-12 max-w-6xl px-6">
          <SectionLabel text={data.testimonials.label} />
        </SectionReveal>
        <TestimonialSlider items={data.testimonials.items} />
      </section>

      <CTABanner
        heading={data.cta.heading}
        sub={data.cta.sub}
        button={data.cta.button}
      />
    </div>
  );
}
