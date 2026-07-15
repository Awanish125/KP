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
import { DollyZoomChapter } from "@/components/DollyZoomChapter";
import { RackFocusText } from "@/components/RackFocusText";
import { ParallaxWordmark } from "@/components/ParallaxWordmark";
import { PressQuoteRotator } from "@/components/PressQuoteRotator";
import data from "@/data/about.json";
import { ParticleEntity } from "@/components/ParticleEntity";

const PRESS_QUOTES = [
  { quote: "One of eastern India's most trusted outdoor names.", source: "— OUTDOOR ASIA" },
  { quote: "Where the hoarding meets the highway and stays.", source: "— CAMPAIGN INDIA" },
  { quote: "A network built on sight lines, not just square footage.", source: "— AFAQS" },
  { quote: "Twenty-seven years of knowing which corner earns the glance.", source: "— EXCHANGE4MEDIA" },
];

const LANDMARK_CHAPTERS = [
  {
    image: "/homepage/herosection/3.png",
    sectionLabel: "LANDMARK 01 / 03",
    coordinate: "19.0760°N / 72.8777°E",
    title: "Andheri Overpass",
    meta: "MUMBAI · MAHARASHTRA",
    description:
      "A gantry hoarding above the Western Express Highway — twelve uninterrupted seconds of dwell time for every commuter heading north.",
  },
  {
    image: "/homepage/herosection/5.png",
    sectionLabel: "LANDMARK 02 / 03",
    coordinate: "12.9716°N / 77.5946°E",
    title: "Silk Board Junction",
    meta: "BENGALURU · KARNATAKA",
    description:
      "The busiest intersection in South India, surveyed and served by Kiran Publicity since 1999 — over two million impressions per week.",
  },
  {
    image: "/homepage/herosection/7.png",
    sectionLabel: "LANDMARK 03 / 03",
    coordinate: "22.5726°N / 88.3639°E",
    title: "VIP Road Gantry",
    meta: "KOLKATA · WEST BENGAL",
    description:
      "Airport arterial tri-face commanding every terminal approach — the last hoarding the city sees, and the first one travellers remember.",
  },
];

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
    <div style={{ background: "transparent" }}>
      <ParticleEntity />
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

      {/* ── Stats band — odometer rolls digits into place ─────────────── */}
      <SectionReveal
        className="border-y"
        style={{ borderColor: "var(--border-soft)", background: "var(--section-bg-stats)" }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
          {data.stats.map((s) => (
            <StatCounter
              key={s.label}
              value={s.value}
              suffix={s.suffix}
              label={s.label}
              numberClassName="text-5xl md:text-6xl"
              odometer
            />
          ))}
        </div>
      </SectionReveal>

      {/* ── Manifesto — rack-focus word scroll ────────────────────────── */}
      <section
        className="mx-auto max-w-4xl px-6 py-24 md:py-36"
        style={{ position: "relative" }}
      >
        <p
          style={{
            fontFamily: "var(--kp-font-mono)",
            fontSize: "0.72rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--kp-orange)",
            marginBottom: "2rem",
          }}
        >
          Field Note
        </p>
        <RackFocusText
          text="Concrete does not apologise. A hoarding holds its ground through monsoon, haze, and ten thousand commutes — and waits to be read. We don't sell space. We engineer the moment a brand becomes the skyline."
          style={{
            fontFamily: "var(--kp-font-display)",
            fontWeight: 700,
            fontSize: "clamp(1.5rem, 3.2vw, 2.8rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            color: "var(--text)",
          }}
        />
      </section>

      {/* ── Landmark Chapters (Dolly Zoom) ───────────────────────────── */}
      {LANDMARK_CHAPTERS.map((ch) => (
        <DollyZoomChapter key={ch.sectionLabel} {...ch} />
      ))}

      {/* ── Parallax wordmark divider ─────────────────────────────────── */}
      <ParallaxWordmark xFrom={-62} xTo={-38} style={{ paddingBlock: "2rem" }}>
        <span style={{ WebkitTextStroke: "1px rgba(0,101,177,0.35)", color: "transparent" }}>KIRAN</span>
        <span style={{ WebkitTextStroke: "1px rgba(245,132,32,0.25)", color: "transparent" }}> · </span>
        <span style={{ WebkitTextStroke: "1px rgba(245,132,32,0.35)", color: "transparent" }}>PUBLICITY</span>
      </ParallaxWordmark>

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
      <section style={{ background: "var(--section-bg-alt)" }}>
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

      {/* ── Press Quote Rotator ───────────────────────────────────────── */}
      <section
        className="mx-auto max-w-6xl px-6 py-24"
        style={{ position: "relative" }}
      >
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <SectionReveal as="div">
            <SectionLabel text="What the record says" />
            <p
              style={{
                fontFamily: "var(--kp-font-display)",
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                lineHeight: 1.05,
                color: "var(--text)",
                marginTop: "1rem",
              }}
            >
              Industry recognition, earned one hoarding at a time.
            </p>
          </SectionReveal>
          <SectionReveal as="div" staggerChildren={false}>
            <PressQuoteRotator items={PRESS_QUOTES} interval={4500} />
          </SectionReveal>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{ background: "var(--section-bg-alt)", position: "relative" }}
      >
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
