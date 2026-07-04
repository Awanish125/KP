"use client";

/**
 * /locations — interactive 3D dotted-earth globe with the KP network pins.
 * Pan-India presence, HQ in Samastipur, strongest in Bihar & Jharkhand.
 * All content lives in src/data/locations.json — add a pin there and it
 * appears on the globe automatically.
 */

import { useState } from "react";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { DottedGlobe } from "@/components/DottedGlobe";
import { CTABanner } from "@/components/CTABanner";
import data from "@/data/locations.json";

const TYPE_COLORS: Record<string, string> = {
  Billboard: "var(--kp-orange)",
  "Digital LED": "var(--kp-blue)",
  Transit: "var(--kp-purple)",
};

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
        <SectionReveal as="div" className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-stretch">
          {/* Globe — always on the dark stage, both themes */}
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 120%, var(--kp-dark-2), var(--kp-dark) 70%)",
              border: "1px solid var(--border-soft)",
              minHeight: "34rem",
            }}
          >
            <DottedGlobe
              sites={data.sites}
              selectedIndex={selected}
              onSelect={setSelected}
              height="100%"
            />
            {/* Legend */}
            <div className="pointer-events-none absolute bottom-5 left-6 flex flex-wrap gap-x-7 gap-y-2">
              {data.legend.map((l) => (
                <span key={l.type} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: TYPE_COLORS[l.type] ?? "var(--kp-orange)" }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--kp-font-mono)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--kp-light)",
                      opacity: 0.6,
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
            className="flex flex-col overflow-hidden rounded-2xl"
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
            <div className="flex flex-1 flex-col p-7">
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
                {"tag" in site && site.tag ? ` · ${site.tag}` : ""}
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
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {data.sites.map((s, i) => (
                  <button
                    key={`${s.city}-${s.name}`}
                    type="button"
                    onClick={() => setSelected(i)}
                    className="rounded-full px-3.5 py-1.5 transition-colors duration-200"
                    style={{
                      fontFamily: "var(--kp-font-mono)",
                      fontSize: "0.66rem",
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
        heading="Want a pin with your name on it?"
        sub="Tell us your target cities — availability and rates within a day."
        button={{ label: "Check Availability", href: "/contact" }}
      />
    </div>
  );
}
