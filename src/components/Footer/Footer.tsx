"use client";

/**
 * Footer — 4-column dark footer with KP orange accents.
 * Always dark (var(--kp-dark)) in both themes, per design.
 * Content comes from src/data/footer.json via footerConfig defaults.
 */

import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import { SectionReveal } from "@/components/SectionReveal";
import { FOOTER_DEFAULTS } from "./footerConfig";
import type { FooterProps } from "./footerTypes";

const SOCIAL_ICONS: Record<string, React.ComponentType<{ size?: number | string }>> = {
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  facebook: FaFacebookF,
  youtube: FaYoutube,
};

export function Footer({
  tagline = FOOTER_DEFAULTS.tagline,
  columns = FOOTER_DEFAULTS.columns,
  social = FOOTER_DEFAULTS.social,
  legal = FOOTER_DEFAULTS.legal,
  className,
}: FooterProps) {
  return (
    <footer
      className={className}
      style={{
        background: "var(--kp-dark)",
        borderTop: "1px solid var(--kp-orange-soft)",
      }}
    >
      <SectionReveal as="div" className="mx-auto max-w-6xl px-6 pt-16 pb-8 md:pt-20">
        {/* Brand row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              style={{
                fontFamily: "var(--kp-font-display)",
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                textTransform: "uppercase",
                color: "var(--kp-light)",
                lineHeight: 1,
              }}
            >
              Kiran<span style={{ color: "var(--kp-orange)" }}> Publicity</span>
            </div>
            <p
              className="mt-3 max-w-sm"
              style={{
                fontFamily: "var(--kp-font-body)",
                fontSize: "0.95rem",
                color: "var(--kp-light)",
                opacity: 0.55,
                lineHeight: 1.6,
              }}
            >
              {tagline}
            </p>
          </div>

          <div className="flex gap-3">
            {Object.entries(social).map(([key, href]) => {
              const Icon = SOCIAL_ICONS[key];
              if (!Icon) return null;
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={key}
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300"
                  style={{
                    color: "var(--kp-light)",
                    border: "1px solid var(--kp-orange-soft)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--kp-orange)";
                    e.currentTarget.style.color = "var(--kp-dark)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--kp-light)";
                  }}
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Link columns */}
        <div className="mt-14 grid grid-cols-2 gap-10 md:grid-cols-4">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "var(--text-label)",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--kp-orange)",
                }}
              >
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label} style={{ listStyle: "none" }}>
                    <Link
                      href={link.href}
                      className="no-underline transition-opacity duration-200 hover:opacity-100"
                      style={{
                        fontFamily: "var(--kp-font-body)",
                        fontSize: "0.95rem",
                        color: "var(--kp-light)",
                        opacity: 0.6,
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Legal */}
        <div
          className="mt-16 flex flex-col gap-2 pt-6 md:flex-row md:items-center md:justify-between"
          style={{ borderTop: "1px solid rgba(245, 247, 250, 0.08)" }}
        >
          <p
            style={{
              fontFamily: "var(--kp-font-body)",
              fontSize: "0.8rem",
              color: "var(--kp-light)",
              opacity: 0.4,
            }}
          >
            {legal}
          </p>
          <p
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--kp-light)",
              opacity: 0.3,
            }}
          >
            Owning the skyline since 1998
          </p>
        </div>
      </SectionReveal>
    </footer>
  );
}
