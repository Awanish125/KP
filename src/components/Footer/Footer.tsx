"use client";

/**
 * Footer — 4-column theme-aware footer with KP orange accents and a
 * giant 3D chrome wordmark filling the background (FooterWordmark).
 * Shell styling lives in globals.css (.kp-footer) driven by the
 * --footer-* tokens: light gradient + dark text in light mode,
 * deep-space gradient + light text in dark mode.
 * Content comes from src/data/footer.json via footerConfig defaults.
 */

import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import { SectionReveal } from "@/components/SectionReveal";
import { CredentialsStrip } from "@/components/CredentialsStrip";
import { FooterWordmark } from "./FooterWordmark";
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
    <footer className={`kp-footer ${className ?? ""} dark:!bg-transparent !bg-[#ffffffa1]`}>
      {/* Atmospheric glows */}
      <div aria-hidden className="kp-glow-blue" style={{ opacity: 0.8 }} />
      <div aria-hidden className="kp-glow-orange" style={{ opacity: 0.6 }} />

      {/* Giant 3D chrome wordmark — fills the footer, behind all content */}
      <FooterWordmark />

      {/* All footer content above the wordmark */}
      <SectionReveal as="div" className="mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-20" style={{ position: "relative", zIndex: 1 }}>
        {/* Brand row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              style={{
                fontFamily: "var(--kp-font-display)",
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              <span style={{ color: "#0065B1" }}>Kiran</span><span style={{ color: "#F58420" }}> Publicity</span>
            </div>
            <p
              className="mt-3 max-w-sm"
              style={{
                fontFamily: "var(--kp-font-body)",
                fontSize: "0.95rem",
                color: "var(--footer-text-muted)",
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
                    color: "var(--footer-text)",
                    border: "1px solid var(--kp-orange-soft)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--kp-orange)";
                    e.currentTarget.style.color = "#08111F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--footer-text)";
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
                  color: "var(--kp-orange-text)",
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
                        color: "var(--footer-text-muted)",
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

        {/* Statutory registrations — trust band for govt/corporate clients */}
        <CredentialsStrip className="mt-16 pt-6" />

        {/* Legal */}
        <div
          className="mt-8 flex flex-col gap-2 pt-6 md:flex-row md:items-center md:justify-between"
          style={{ borderTop: "1px solid var(--footer-hairline)" }}
        >
          <p
            style={{
              fontFamily: "var(--kp-font-body)",
              fontSize: "0.8rem",
              color: "var(--footer-text-faint)",
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
              color: "var(--footer-text-faint)",
            }}
          >
            Owning the skyline since 1998
          </p>
        </div>
      </SectionReveal>
    </footer>
  );
}
