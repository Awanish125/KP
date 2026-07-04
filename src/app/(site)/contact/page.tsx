"use client";

/**
 * /contact — split layout: enquiry form left, 3D globe right.
 * All copy lives in src/data/contact.json — edit there, not here.
 */

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { ContactForm } from "@/components/ContactForm";
import { ContactGlobe } from "@/components/ContactGlobe";
import data from "@/data/contact.json";

const OFFICE_ROWS = [
  { icon: MapPin, key: "address" },
  { icon: Phone, key: "phone" },
  { icon: Mail, key: "email" },
  { icon: Clock, key: "hours" },
] as const;

export default function ContactPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <PageHero
        label={data.hero.label}
        line1={data.hero.line1}
        line2={data.hero.line2}
        sub={data.hero.sub}
      />

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-28 lg:grid-cols-2 lg:gap-16">
        {/* Form */}
        <SectionReveal as="div" staggerChildren={false}>
          <ContactForm
            onSubmit={async () => {
              // No backend yet — simulate a round trip so the submitting
              // state is honest. Swap for a fetch() when the API exists.
              await new Promise((r) => setTimeout(r, 900));
            }}
          />
        </SectionReveal>

        {/* Globe + office info */}
        <SectionReveal as="div" staggerChildren={false} className="flex flex-col gap-8">
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-soft)",
              height: "26rem",
            }}
          >
            <ContactGlobe height="100%" />
          </div>

          <div
            className="rounded-2xl p-8"
            style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
          >
            <h2
              style={{
                fontFamily: "var(--kp-font-display)",
                fontSize: "1.3rem",
                textTransform: "uppercase",
                color: "var(--text)",
              }}
            >
              {data.office.heading}
            </h2>
            <ul className="mt-5 grid gap-4 p-0">
              {OFFICE_ROWS.map(({ icon: Icon, key }) => (
                <li key={key} className="flex items-start gap-3.5" style={{ listStyle: "none" }}>
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--kp-orange-soft)", color: "var(--kp-orange)" }}
                  >
                    <Icon size={17} />
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--kp-font-body)",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      color: "var(--text-muted)",
                      paddingTop: "0.35rem",
                    }}
                  >
                    {data.office[key]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
