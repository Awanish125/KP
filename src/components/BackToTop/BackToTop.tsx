"use client";

/**
 * BackToTop — small orange chip above the WhatsApp FAB that appears after
 * one viewport of scroll and glides the page home through Lenis.
 *
 * Perf contract: the gsap.ticker callback only compares scrollY against a
 * cached threshold and flips React state exclusively when the boundary is
 * crossed — zero DOM work per frame.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";
import { BACK_TO_TOP_DEFAULTS } from "./backToTopConfig";
import type { BackToTopProps } from "./backToTopTypes";

export function BackToTop({
  showAfterVh = BACK_TO_TOP_DEFAULTS.showAfterVh,
}: BackToTopProps) {
  const [show, setShow] = useState(false);
  const showRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let threshold = window.innerHeight * showAfterVh;
    const measure = () => {
      threshold = window.innerHeight * showAfterVh;
    };
    window.addEventListener("resize", measure);

    const tick = () => {
      const past = window.scrollY > threshold;
      if (past !== showRef.current) {
        showRef.current = past;
        setShow(past);
      }
    };

    if (prefersReducedMotion()) {
      window.addEventListener("scroll", tick, { passive: true });
      return () => {
        window.removeEventListener("scroll", tick);
        window.removeEventListener("resize", measure);
      };
    }

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", measure);
    };
  }, [showAfterVh]);

  useEffect(() => {
    const btn = btnRef.current;
    if (!show || !btn || prefersReducedMotion()) return;
    btn.style.willChange = "transform, opacity";
    gsap.fromTo(
      btn,
      { opacity: 0, y: 16, scale: 0.7 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: "back.out(2)",
        onComplete: () => {
          btn.style.willChange = "auto";
        },
      },
    );
  }, [show]);

  const scrollTop = () => {
    const lenis = window.__kpLenis;
    if (lenis) {
      lenis.scrollTo(0, {
        duration: 1.2,
        // Pinned-hero scrubs need one final update at rest — Lenis stops
        // emitting once settled, which can strand smoothed scrubs mid-way.
        onComplete: () => ScrollTrigger.update(),
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!show) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={scrollTop}
      aria-label="Back to top"
      className="group"
      style={{
        position: "fixed",
        right: "1.65rem",
        bottom: "5.6rem",
        zIndex: 94,
        width: "2.6rem",
        height: "2.6rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        background: "var(--surface)",
        color: "var(--kp-orange)",
        border: "1px solid var(--border-strong)",
        boxShadow: "var(--shadow-ambient)",
        cursor: "pointer",
      }}
    >
      <ArrowUp
        size={16}
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />
    </button>
  );
}
