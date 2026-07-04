"use client";

/**
 * OfficeGrid — address cards for KP's offices (HQ Samastipur + branches),
 * mirroring the office-locations pattern on the reference sites with the
 * KP editorial treatment. Content from contact.json offices[].
 */

import { MapPin } from "lucide-react";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { OFFICE_GRID_DEFAULTS } from "./officeGridConfig";
import type { OfficeGridProps } from "./officeGridTypes";

export function OfficeGrid({
  offices,
  className,
  label = OFFICE_GRID_DEFAULTS.label,
  heading = OFFICE_GRID_DEFAULTS.heading,
}: OfficeGridProps) {
  return (
    <section
      className={className}
      style={{ background: "var(--bg)", borderTop: "1px solid var(--border-soft)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <SectionReveal as="div" className="mb-14">
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
          <TextReveal
            as="h2"
            text={heading}
            className="mt-4"
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "var(--text-section)",
              lineHeight: 1.02,
              textTransform: "uppercase",
              color: "var(--text)",
              maxWidth: "18ch",
            }}
          />
        </SectionReveal>

        <SectionReveal as="div" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {offices.map((office) => {
            const isHQ = office.tag === "HQ";
            return (
              <div
                key={office.city}
                className="flex flex-col rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1.5"
                style={{
                  background: isHQ ? "var(--kp-dark)" : "var(--surface)",
                  border: `1px solid ${isHQ ? "var(--kp-orange-glow)" : "var(--border-soft)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      background: "var(--kp-orange-soft)",
                      color: "var(--kp-orange)",
                    }}
                  >
                    <MapPin size={17} />
                  </span>
                  <span
                    className="rounded-full px-3 py-1"
                    style={{
                      fontFamily: "var(--kp-font-mono)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: isHQ ? "var(--kp-dark)" : "var(--kp-orange)",
                      background: isHQ ? "var(--kp-orange)" : "var(--kp-orange-soft)",
                    }}
                  >
                    {office.tag}
                  </span>
                </div>
                <h3
                  className="mt-6"
                  style={{
                    fontFamily: "var(--kp-font-display)",
                    fontSize: "1.4rem",
                    textTransform: "uppercase",
                    color: isHQ ? "var(--kp-light)" : "var(--text)",
                  }}
                >
                  {office.city}
                </h3>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "var(--kp-font-body)",
                    fontSize: "0.88rem",
                    lineHeight: 1.65,
                    color: isHQ ? "rgba(245, 247, 250, 0.6)" : "var(--text-muted)",
                  }}
                >
                  {office.address}
                </p>
              </div>
            );
          })}
        </SectionReveal>
      </div>
    </section>
  );
}
