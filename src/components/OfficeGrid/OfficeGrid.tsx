"use client";

/**
 * OfficeGrid — address cards for KP's offices (HQ Samastipur + branches),
 * mirroring the office-locations pattern on the reference sites with the
 * KP editorial treatment. Content from contact.json offices[].
 */

import { MapPin } from "lucide-react";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { onSpotMove, onSpotLeave } from "@/lib/cursorGlow";
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
      style={{ background: "transparent", borderTop: "1px solid var(--border-soft)", position: "relative", overflow: "hidden" }}
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
                onPointerMove={onSpotMove}
                onPointerLeave={onSpotLeave}
                className="group relative flex flex-col overflow-hidden rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1.5"
                style={{
                  background: isHQ ? "var(--kp-dark)" : "var(--kp-glass-bg)",
                  border: `1px solid var(--kp-orange-glow)`,
                  backdropFilter: isHQ ? undefined : "var(--kp-glass-blur)",
                  WebkitBackdropFilter: isHQ ? undefined : "var(--kp-glass-blur)",
                }}
              >
                <span aria-hidden className="kp-card-glow" />
                <div className="relative flex items-center justify-between">
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
                  className="relative mt-6"
                  style={{
                    fontFamily: "var(--kp-font-display)",
                    fontSize: "1.4rem",
                    textTransform: "uppercase",
                    // HQ card's background stays dark in both themes, so its
                    // text must stay light too — the glass tokens flip to
                    // near-black in light mode and disappear on it.
                    color: isHQ ? "var(--kp-light)" : "var(--kp-glass-text)",
                  }}
                >
                  {office.city}
                </h3>
                <p
                  className="relative mt-2"
                  style={{
                    fontFamily: "var(--kp-font-body)",
                    fontSize: "0.88rem",
                    lineHeight: 1.65,
                    color: isHQ
                      ? "color-mix(in srgb, var(--kp-light) 65%, transparent)"
                      : "var(--kp-glass-text-muted)",
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
