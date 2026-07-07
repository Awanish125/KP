"use client";

/**
 * ServicesStrip — editorial numbered list of service lines for the home
 * page (the reference sites use format grids; this is the premium take:
 * an index, not a brochure). Rows reveal via SectionReveal; hover slides
 * the row and warms the number. Content from home.json services.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { HoverImagePreview } from "@/components/HoverImagePreview";
import { SERVICES_STRIP_DEFAULTS } from "./servicesStripConfig";
import type { ServicesStripProps } from "./servicesStripTypes";

export function ServicesStrip({
  items,
  className,
  label = SERVICES_STRIP_DEFAULTS.label,
  heading = SERVICES_STRIP_DEFAULTS.heading,
  headingEmphasis = SERVICES_STRIP_DEFAULTS.headingEmphasis,
  href = SERVICES_STRIP_DEFAULTS.href,
  linkLabel = SERVICES_STRIP_DEFAULTS.linkLabel,
}: ServicesStripProps) {
  // Which row's format photo floats beside the cursor (null = none).
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Lenis uses virtual scroll (CSS transforms), so the native scroll event
  // won't fire. Use the exposed Lenis instance directly; fall back to native
  // scroll for cases where Lenis isn't running (reduced motion, SSR hydration).
  useEffect(() => {
    if (!previewSrc) return;
    const clear = () => setPreviewSrc(null);
    const lenis = window.__kpLenis;
    if (lenis) {
      lenis.on("scroll", clear);
      return () => lenis.off("scroll", clear);
    }
    window.addEventListener("scroll", clear, { passive: true, once: true });
    return () => window.removeEventListener("scroll", clear);
  }, [previewSrc]);

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
          <h2
            className="mt-4"
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "var(--text-section)",
              lineHeight: 1.02,
              textTransform: "uppercase",
              color: "var(--text)",
            }}
          >
            <TextReveal as="span" text={heading} style={{ display: "block" }} />
            <TextReveal
              as="span"
              text={headingEmphasis}
              delay={0.15}
              style={{ display: "block", color: "var(--kp-orange)" }}
            />
          </h2>
        </SectionReveal>

        <SectionReveal as="ul" className="m-0 grid p-0" stagger={0.07}>
          {items.map((item, i) => (
            <li key={item.title} style={{ listStyle: "none" }}>
              <Link
                href={href}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 py-5 no-underline transition-transform duration-300 hover:translate-x-2 md:grid-cols-[6rem_1fr_1fr_auto] md:gap-x-6 md:py-6 md:items-center"
                style={{ borderTop: "1px solid var(--border-soft)" }}
                onMouseEnter={() => setPreviewSrc(item.image ?? null)}
                onMouseLeave={() => setPreviewSrc(null)}
              >
                <span
                  className="transition-colors duration-300"
                  style={{
                    fontFamily: "var(--kp-font-mono)",
                    fontSize: "0.8rem",
                    color: "var(--text-subtle)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="transition-colors duration-300 group-hover:text-(--kp-orange)"
                  style={{
                    fontFamily: "var(--kp-font-display)",
                    fontSize: "clamp(1.25rem, 2.6vw, 1.9rem)",
                    textTransform: "uppercase",
                    lineHeight: 1.1,
                    color: "var(--text)",
                  }}
                >
                  {item.title}
                </span>
                {/* Mobile thumbnail — inline image, hidden on desktop where hover preview takes over */}
                {item.image && (
                  <span
                    aria-hidden
                    className="row-span-2 md:hidden"
                    style={{ alignSelf: "center" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt=""
                      style={{
                        width: 64,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--border-soft)",
                        display: "block",
                        flexShrink: 0,
                      }}
                    />
                  </span>
                )}
                <span
                  className="col-start-2 md:col-start-3"
                  style={{
                    fontFamily: "var(--kp-font-body)",
                    fontSize: "0.92rem",
                    lineHeight: 1.6,
                    color: "var(--text-muted)",
                  }}
                >
                  {item.description}
                </span>
                <span
                  aria-hidden
                  className="hidden transition-transform duration-300 group-hover:translate-x-1.5 md:inline"
                  style={{ color: "var(--kp-orange)", fontSize: "1.2rem" }}
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </SectionReveal>

        <SectionReveal as="div" className="mt-10" staggerChildren={false}>
          <Link
            href={href}
            className="inline-flex items-center gap-3 no-underline"
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--kp-orange)",
            }}
          >
            {linkLabel}
            <span aria-hidden className="block h-px w-8" style={{ background: "var(--kp-orange)" }} />
          </Link>
        </SectionReveal>
      </div>

      {/* Cursor-following format photo for the hovered row */}
      <HoverImagePreview src={previewSrc} />
    </section>
  );
}
