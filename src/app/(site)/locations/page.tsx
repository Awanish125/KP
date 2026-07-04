"use client";

/**
 * /locations — interactive Maharashtra map with site pins.
 * All copy lives in src/data/locations.json — edit there, not here.
 */

import { useState } from "react";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { MapEmbed, MAP_EMBED_DEFAULTS } from "@/components/MapEmbed";
import { CTABanner } from "@/components/CTABanner";
import data from "@/data/locations.json";

export default function LocationsPage() {
  const [selected, setSelected] = useState(0);
  const site = data.sites[selected];

  return (
    <div style={{ background: "var(--bg)" }}>
      <PageHero
        label={data.hero.label}
        line1={data.hero.line1}
        line2={data.hero.line2}
        sub={data.hero.sub}
      />

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <SectionReveal as="div" className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          {/* Map */}
          <div
            className="rounded-2xl p-6 md:p-10"
            style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
          >
            <MapEmbed
              sites={data.sites}
              selectedIndex={selected}
              onSelect={setSelected}
            />
            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {data.legend.map((l) => (
                <span key={l.type} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 rounded-full"
                    style={{
                      background:
                        MAP_EMBED_DEFAULTS.typeColors[l.type] ?? "var(--kp-orange)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--kp-font-mono)",
                      fontSize: "0.72rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}
                  >
                    {l.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Selected site panel */}
          <aside
            className="overflow-hidden rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
            aria-live="polite"
          >
            <div className="relative" style={{ aspectRatio: "16 / 10" }}>
              <Image
                key={site.image}
                src={site.image}
                alt={`${site.name}, ${site.city}`}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="p-7">
              <div
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--kp-orange)",
                }}
              >
                {site.type} · {site.city}
              </div>
              <h2
                className="mt-3"
                style={{
                  fontFamily: "var(--kp-font-display)",
                  fontSize: "1.7rem",
                  lineHeight: 1.1,
                  textTransform: "uppercase",
                  color: "var(--text)",
                }}
              >
                {site.name}
              </h2>
              <p
                className="mt-4"
                style={{
                  fontFamily: "var(--kp-font-body)",
                  fontSize: "0.95rem",
                  color: "var(--text-muted)",
                }}
              >
                <strong style={{ color: "var(--text)" }}>{site.count}</strong>{" "}
                media structures in this cluster.
              </p>

              {/* City quick-jump */}
              <div className="mt-6 flex flex-wrap gap-2">
                {data.sites.map((s, i) => (
                  <button
                    key={`${s.city}-${s.name}`}
                    type="button"
                    onClick={() => setSelected(i)}
                    className="rounded-full px-3.5 py-1.5 transition-colors duration-200"
                    style={{
                      fontFamily: "var(--kp-font-mono)",
                      fontSize: "0.68rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      background: i === selected ? "var(--kp-orange)" : "transparent",
                      color: i === selected ? "var(--kp-dark)" : "var(--text-muted)",
                      border: `1px solid ${i === selected ? "var(--kp-orange)" : "var(--border-soft)"}`,
                    }}
                  >
                    {s.city}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </SectionReveal>
      </section>

      <CTABanner
        heading="Want a site on this map?"
        sub="Tell us your target cities — we'll send availability and rates within a day."
        button={{ label: "Check Availability", href: "/contact" }}
      />
    </div>
  );
}
