"use client";

/**
 * ServiceCard — 3D tilt on hover via CSS perspective + GSAP quickTo.
 *
 * Perf contract:
 *  - Tilt updates only on pointermove over the card (no ticker, no RAF).
 *  - gsap.quickTo reuses one tween per axis — zero allocation per move.
 *  - will-change set on pointer enter, cleared after the reset completes.
 *  - Reduced motion → static card, hover ring only.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Bus,
  Building2,
  Megaphone,
  Monitor,
  Printer,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion";
import { SERVICE_CARD_DEFAULTS } from "./serviceCardConfig";
import type { ServiceCardProps } from "./serviceCardTypes";

const ICONS: Record<string, LucideIcon> = {
  billboard: Megaphone,
  led: Monitor,
  bus: Bus,
  building: Building2,
  spark: Sparkles,
  printer: Printer,
};

export function ServiceCard({
  item,
  className,
  maxTilt = SERVICE_CARD_DEFAULTS.maxTilt,
  tiltDuration = SERVICE_CARD_DEFAULTS.tiltDuration,
  lift = SERVICE_CARD_DEFAULTS.lift,
}: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = ICONS[item.icon] ?? Megaphone;

  useEffect(() => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion()) return;

    const toRotX = gsap.quickTo(card, "rotationX", { duration: tiltDuration, ease: "power2.out" });
    const toRotY = gsap.quickTo(card, "rotationY", { duration: tiltDuration, ease: "power2.out" });
    const toY = gsap.quickTo(card, "y", { duration: tiltDuration, ease: "power2.out" });

    const onEnter = () => {
      card.style.willChange = "transform";
      toY(-lift);
    };

    const onMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 … 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      toRotY(px * maxTilt * 2);
      toRotX(-py * maxTilt * 2);
    };

    const onLeave = () => {
      toRotX(0);
      toRotY(0);
      toY(0);
      // Clear the hint once the reset tween has finished.
      gsap.delayedCall(tiltDuration, () => {
        card.style.willChange = "auto";
      });
    };

    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    return () => {
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      card.style.willChange = "auto";
    };
  }, [maxTilt, tiltDuration, lift]);

  return (
    // Perspective lives on the wrapper so the card itself rotates in 3D.
    <div className={className} style={{ perspective: "900px" }}>
      <div
        ref={cardRef}
        className="group flex h-full flex-col rounded-2xl p-8 transition-shadow duration-300"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          transformStyle: "preserve-3d",
          boxShadow: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "var(--shadow-ambient)";
          e.currentTarget.style.borderColor = "var(--kp-orange-glow)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "var(--border-soft)";
        }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl"
          style={{
            background: "var(--kp-orange-soft)",
            color: "var(--kp-orange)",
            transform: "translateZ(30px)",
          }}
        >
          <Icon size={26} strokeWidth={1.8} />
        </div>

        <h3
          className="mt-6"
          style={{
            fontFamily: "var(--kp-font-display)",
            fontSize: "1.45rem",
            textTransform: "uppercase",
            color: "var(--text)",
            transform: "translateZ(24px)",
          }}
        >
          {item.title}
        </h3>

        <p
          className="mt-3 flex-1"
          style={{
            fontFamily: "var(--kp-font-body)",
            fontSize: "0.95rem",
            lineHeight: 1.7,
            color: "var(--text-muted)",
            transform: "translateZ(16px)",
          }}
        >
          {item.desc}
        </p>

        <ul className="mt-6 grid gap-2 p-0" style={{ transform: "translateZ(12px)" }}>
          {item.features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2.5"
              style={{
                listStyle: "none",
                fontFamily: "var(--kp-font-mono)",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              <span
                aria-hidden
                className="inline-block h-1 w-4 rounded-full"
                style={{ background: "var(--kp-orange)" }}
              />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
