"use client";

/**
 * /services — 3D card grid of all six services.
 * All copy lives in src/data/services.json — edit there, not here.
 */

import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { ServiceCard } from "@/components/ServiceCard";
import { CTABanner } from "@/components/CTABanner";
import data from "@/data/services.json";

export default function ServicesPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <PageHero
        label={data.hero.label}
        line1={data.hero.line1}
        line2={data.hero.line2}
        sub={data.hero.sub}
      />

      <SectionReveal
        className="mx-auto grid max-w-6xl gap-6 px-6 pb-28 sm:grid-cols-2 lg:grid-cols-3"
        stagger={0.1}
      >
        {data.items.map((item) => (
          <ServiceCard key={item.id} item={item} />
        ))}
      </SectionReveal>

      <CTABanner
        heading={data.cta.heading}
        sub={data.cta.sub}
        button={data.cta.button}
      />
    </div>
  );
}
