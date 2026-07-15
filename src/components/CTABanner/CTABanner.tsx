"use client";

/**
 * CTABanner — full-width split band: headline left, button right.
 * Entrance handled by SectionReveal (IO-triggered, no ScrollTrigger).
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { SectionReveal } from "@/components/SectionReveal";
import { MagneticButton } from "@/components/MagneticButton";
import { attachCursorGlow } from "@/lib/cursorGlow";
import { CTA_BANNER_DEFAULTS } from "./ctaBannerConfig";
import type { CTABannerProps } from "./ctaBannerTypes";

export function CTABanner({
  heading = CTA_BANNER_DEFAULTS.heading,
  sub = CTA_BANNER_DEFAULTS.sub,
  button = CTA_BANNER_DEFAULTS.button,
  className,
}: CTABannerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    return attachCursorGlow(wrapRef.current);
  }, []);

  return (
    <SectionReveal
      className={className}
      style={{
        background: "transparent",
        borderTop: "1px solid var(--border-soft)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={wrapRef}
        style={{ position: "relative", overflow: "hidden" }}
      >
      <div aria-hidden className="kp-glow-blue" style={{ opacity: 0.5 }} />
      <div aria-hidden className="kp-glow-orange" style={{ opacity: 0.6 }} />
      <div className="kp-glow-layer" aria-hidden />
      <div
        className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between md:py-28"
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--kp-font-display)",
              fontSize: "var(--text-section)",
              lineHeight: 1.02,
              textTransform: "uppercase",
              color: "var(--text)",
              letterSpacing: "0.01em",
            }}
          >
            {heading}
          </h2>
          <p
            className="mt-4 max-w-md"
            style={{
              fontFamily: "var(--kp-font-body)",
              fontSize: "var(--text-lead)",
              color: "var(--text-muted)",
            }}
          >
            {sub}
          </p>
        </div>

        <MagneticButton className="shrink-0">
          <Link
            href={button.href}
            className="group inline-flex items-center gap-3 rounded-full px-9 py-5 no-underline"
            style={{
              background: "var(--kp-gradient-cta)",
              color: "#fff",
              fontFamily: "var(--kp-font-body)",
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "0 8px 40px rgba(244,122,32,0.50), 0 2px 8px rgba(0,0,0,0.25)",
              transition: "transform 200ms ease, box-shadow 200ms ease",
            }}
          >
            {button.label}
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </MagneticButton>
      </div>
      </div>
    </SectionReveal>
  );
}
