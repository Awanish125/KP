"use client";

/**
 * WhatsAppFab — floating WhatsApp button, bottom-right on every page.
 * Pops in after a short delay, breathes a soft pulse ring (pure CSS,
 * compositor-only), and slides a label out on hover. The single most
 * effective contact path for Indian B2B — kept deliberately unmissable.
 */

import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { WHATSAPP_FAB_DEFAULTS } from "./whatsAppFabConfig";
import type { WhatsAppFabProps } from "./whatsAppFabTypes";

export function WhatsAppFab({
  href = WHATSAPP_FAB_DEFAULTS.href,
  label = WHATSAPP_FAB_DEFAULTS.label,
  appearAfter = WHATSAPP_FAB_DEFAULTS.appearAfter,
}: WhatsAppFabProps) {
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), appearAfter);
    return () => window.clearTimeout(t);
  }, [appearAfter]);

  useEffect(() => {
    const el = rootRef.current;
    if (!visible || !el) return;
    if (prefersReducedMotion()) {
      el.style.opacity = "1";
      return;
    }
    el.style.willChange = "transform, opacity";
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.4, y: 24 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.65,
        ease: "back.out(2.2)",
        onComplete: () => {
          el.style.willChange = "auto";
        },
      },
    );
  }, [visible]);

  if (!visible) return null;

  return (
    <a
      ref={rootRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="group"
      style={{
        position: "fixed",
        right: "1.4rem",
        bottom: "1.4rem",
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        gap: 0,
        opacity: 0,
        textDecoration: "none",
      }}
    >
      {/* Hover label */}
      <span
        className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-500 ease-out group-hover:mr-3 group-hover:max-w-56"
        style={{
          fontFamily: "var(--kp-font-mono)",
          fontSize: "0.7rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text)",
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 999,
          padding: "0.55rem 0",
          paddingLeft: 0,
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        <span className="px-4">{label}</span>
      </span>

      {/* Button */}
      <span
        className="relative flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
        style={{
          background: "var(--kp-orange)",
          color: "var(--kp-dark)",
          boxShadow: "0 10px 34px var(--kp-orange-glow)",
        }}
      >
        {/* CSS pulse ring — transform/opacity only */}
        <span
          aria-hidden
          className="kp-fab-pulse absolute inset-0 rounded-full"
          style={{ border: "2px solid var(--kp-orange)" }}
        />
        <FaWhatsapp size={26} />
      </span>

      <style>{`
        @keyframes kp-fab-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.7); opacity: 0; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .kp-fab-pulse { animation: kp-fab-pulse 2.4s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .kp-fab-pulse { animation: none; opacity: 0; }
        }
      `}</style>
    </a>
  );
}
