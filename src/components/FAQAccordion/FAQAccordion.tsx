"use client";

/**
 * FAQAccordion — animated question list. One item open at a time; the
 * answer height tweens with GSAP (measured, not CSS max-height hacks),
 * the index number warms orange, and a plus icon rotates into a close.
 *
 * Perf contract: tween only on click; will-change set for the tween and
 * cleared after; reduced motion → instant toggle. Full keyboard support
 * via native <button> + aria-expanded/aria-controls.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { FAQ_ACCORDION_DEFAULTS } from "./faqAccordionConfig";
import type { FAQAccordionProps } from "./faqAccordionTypes";

export function FAQAccordion({
  items,
  className,
  label = FAQ_ACCORDION_DEFAULTS.label,
  heading = FAQ_ACCORDION_DEFAULTS.heading,
  duration = FAQ_ACCORDION_DEFAULTS.duration,
}: FAQAccordionProps) {
  const [open, setOpen] = useState<number>(-1);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevOpen = useRef(-1);

  useEffect(() => {
    const prev = prevOpen.current;
    prevOpen.current = open;
    const reduced = prefersReducedMotion();

    const animate = (el: HTMLDivElement | null, show: boolean) => {
      if (!el) return;
      if (reduced) {
        el.style.height = show ? "auto" : "0px";
        el.style.opacity = show ? "1" : "0";
        return;
      }
      el.style.willChange = "height, opacity";
      gsap.to(el, {
        height: show ? el.scrollHeight : 0,
        opacity: show ? 1 : 0,
        duration,
        ease: "power3.inOut",
        onComplete: () => {
          if (show) el.style.height = "auto"; // survive resizes while open
          el.style.willChange = "auto";
        },
      });
    };

    if (prev !== -1 && prev !== open) animate(bodyRefs.current[prev], false);
    if (open !== -1) animate(bodyRefs.current[open], true);
  }, [open, duration]);

  return (
    <section className={className}>
      <SectionReveal as="div" className="mb-12">
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

      <SectionReveal as="div" stagger={0.06}>
        {items.map((item, i) => {
          const isOpen = i === open;
          const panelId = `faq-panel-${i}`;
          const btnId = `faq-button-${i}`;
          return (
            <div key={item.q} style={{ borderTop: "1px solid var(--border-soft)" }}>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="group grid w-full grid-cols-[3rem_1fr_auto] items-center gap-4 py-6 text-left"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "1.5rem 0" }}
              >
                <span
                  className="transition-colors duration-300"
                  style={{
                    fontFamily: "var(--kp-font-mono)",
                    fontSize: "0.8rem",
                    color: isOpen ? "var(--kp-orange)" : "var(--text-subtle)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="transition-colors duration-300"
                  style={{
                    fontFamily: "var(--kp-font-display)",
                    fontSize: "clamp(1.05rem, 2vw, 1.4rem)",
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                    color: isOpen ? "var(--kp-orange)" : "var(--text)",
                  }}
                >
                  {item.q}
                </span>
                {/* Plus → close */}
                <span
                  aria-hidden
                  className="relative h-5 w-5 shrink-0 transition-transform duration-500"
                  style={{ transform: isOpen ? "rotate(135deg)" : "rotate(0deg)" }}
                >
                  <span
                    className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2"
                    style={{ background: isOpen ? "var(--kp-orange)" : "var(--text-muted)" }}
                  />
                  <span
                    className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                    style={{ background: isOpen ? "var(--kp-orange)" : "var(--text-muted)" }}
                  />
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                ref={(el) => {
                  bodyRefs.current[i] = el;
                }}
                style={{ height: 0, opacity: 0, overflow: "hidden" }}
              >
                <p
                  className="max-w-2xl pb-7 pl-0 md:pl-16"
                  style={{
                    fontFamily: "var(--kp-font-body)",
                    fontSize: "var(--text-body)",
                    lineHeight: 1.75,
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  {item.a}
                </p>
              </div>
            </div>
          );
        })}
      </SectionReveal>
    </section>
  );
}
