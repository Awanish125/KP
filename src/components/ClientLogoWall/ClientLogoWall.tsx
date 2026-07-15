"use client";

/**
 * ClientLogoWall — clients grouped by industry, rendered as display-type
 * logotypes (swap in real logo images later via clients.json).
 *
 * The premium detail: each cell carries a cursor-tracked orange spotlight
 * (two CSS custom properties updated on pointermove — event-driven, no
 * ticker, compositor-friendly radial gradient).
 */

import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { onSpotMove, onSpotLeave } from "@/lib/cursorGlow";
import { CLIENT_LOGO_WALL_DEFAULTS } from "./clientLogoWallConfig";
import type { ClientLogoWallProps } from "./clientLogoWallTypes";

export function ClientLogoWall({
  industries,
  className,
  label = CLIENT_LOGO_WALL_DEFAULTS.label,
  heading = CLIENT_LOGO_WALL_DEFAULTS.heading,
}: ClientLogoWallProps) {
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

        <div className="flex flex-col">
          {industries.map((industry) => (
            <SectionReveal
              key={industry.name}
              as="div"
              className="grid gap-4 py-8 md:grid-cols-[14rem_1fr] md:gap-8"
              style={{ borderTop: "1px solid var(--border-soft)" }}
              staggerChildren={false}
            >
              <h3
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  paddingTop: "0.9rem",
                }}
              >
                {industry.name}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {industry.brands.map((brand) => (
                  <span
                    key={brand}
                    onPointerMove={onSpotMove}
                    onPointerLeave={onSpotLeave}
                    className="group relative flex min-h-16 items-center justify-center overflow-hidden rounded-xl px-3 py-4 text-center transition-transform duration-300 hover:-translate-y-1"
                    style={{
                      background: "var(--kp-glass-bg)",
                      border: "1px solid var(--kp-glass-border)",
                      backdropFilter: "var(--kp-glass-blur)",
                      WebkitBackdropFilter: "var(--kp-glass-blur)",
                    }}
                  >
                    {/* Cursor spotlight */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(140px circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--kp-orange-soft), transparent 70%)",
                      }}
                    />
                    <span
                      className="relative transition-colors duration-300 group-hover:text-(--kp-orange)"
                      style={{
                        fontFamily: "var(--kp-font-display)",
                        fontSize: "clamp(0.85rem, 1.4vw, 1.05rem)",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--kp-glass-text-muted)",
                        lineHeight: 1.2,
                      }}
                    >
                      {brand}
                    </span>
                  </span>
                ))}
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
