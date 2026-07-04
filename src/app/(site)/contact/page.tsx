"use client";

/**
 * /contact — direct contact channels left, 3D globe right.
 * No backend yet, so there is no form: visitors call, WhatsApp, or email
 * directly. All copy lives in src/data/contact.json — edit there, not here.
 */

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { DottedGlobe, type GlobeSite } from "@/components/DottedGlobe";
import data from "@/data/contact.json";

/* The HQ pin on the contact globe — derived from office data. */
const HQ_SITE: GlobeSite[] = [
  {
    name: data.office.heading,
    city: "Samastipur",
    tag: "HQ",
    lat: 25.863,
    lng: 85.781,
    type: "Office",
  },
];

const CHANNEL_ICONS: Record<string, React.ComponentType<{ size?: number | string }>> = {
  phone: Phone,
  whatsapp: FaWhatsapp,
  mail: Mail,
};

const OFFICE_ROWS = [
  { icon: MapPin, key: "address" },
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
        {/* Direct channels */}
        <SectionReveal as="div" className="flex flex-col gap-5" stagger={0.12}>
          {data.channels.map((ch) => {
            const Icon = CHANNEL_ICONS[ch.icon] ?? Phone;
            const external = ch.href.startsWith("http");
            return (
              <a
                key={ch.id}
                href={ch.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-6 rounded-2xl p-7 no-underline transition-transform duration-300 hover:-translate-y-1"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-soft)",
                }}
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors duration-300"
                  style={{ background: "var(--kp-orange-soft)", color: "var(--kp-orange)" }}
                >
                  <Icon size={24} />
                </span>
                <span className="min-w-0">
                  <span
                    className="block"
                    style={{
                      fontFamily: "var(--kp-font-mono)",
                      fontSize: "0.68rem",
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: "var(--kp-orange)",
                    }}
                  >
                    {ch.label}
                  </span>
                  <span
                    className="mt-1.5 block truncate"
                    style={{
                      fontFamily: "var(--kp-font-display)",
                      fontSize: "clamp(1.15rem, 2vw, 1.5rem)",
                      textTransform: "uppercase",
                      color: "var(--text)",
                      lineHeight: 1.15,
                    }}
                  >
                    {ch.value}
                  </span>
                  <span
                    className="mt-1 block"
                    style={{
                      fontFamily: "var(--kp-font-body)",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {ch.note}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="ml-auto shrink-0 transition-transform duration-300 group-hover:translate-x-1.5"
                  style={{ color: "var(--kp-orange)", fontSize: "1.3rem" }}
                >
                  →
                </span>
              </a>
            );
          })}

          {/* Head office */}
          <div
            className="rounded-2xl p-7"
            style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
          >
            <h2
              style={{
                fontFamily: "var(--kp-font-display)",
                fontSize: "1.2rem",
                textTransform: "uppercase",
                color: "var(--text)",
              }}
            >
              {data.office.heading}
            </h2>
            <ul className="mt-4 grid gap-3 p-0">
              {OFFICE_ROWS.map(({ icon: Icon, key }) => (
                <li key={key} className="flex items-start gap-3" style={{ listStyle: "none" }}>
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--kp-orange-soft)", color: "var(--kp-orange)" }}
                  >
                    <Icon size={15} />
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--kp-font-body)",
                      fontSize: "0.92rem",
                      lineHeight: 1.6,
                      color: "var(--text-muted)",
                      paddingTop: "0.3rem",
                    }}
                  >
                    {data.office[key]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>

        {/* Globe */}
        <SectionReveal as="div" staggerChildren={false}>
          <div
            className="overflow-hidden rounded-2xl lg:sticky lg:top-28"
            style={{
              background:
                "radial-gradient(ellipse at 50% 120%, var(--kp-dark-2), var(--kp-dark) 70%)",
              border: "1px solid var(--border-soft)",
              height: "34rem",
            }}
          >
            <DottedGlobe sites={HQ_SITE} selectedIndex={0} height="100%" />
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
