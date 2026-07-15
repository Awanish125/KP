"use client";

/**
 * ProcessSteps — the campaign workflow as a four-step band on the dark
 * stage: oversized step numbers, connecting rail, staggered reveal.
 * Content from home.json process.steps.
 */

import { Fragment, useEffect, useRef } from "react";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { attachCursorGlow } from "@/lib/cursorGlow";
import { PROCESS_STEPS_DEFAULTS } from "./processStepsConfig";
import type { ProcessStepsProps } from "./processStepsTypes";

export function ProcessSteps({
  steps,
  className,
  label = PROCESS_STEPS_DEFAULTS.label,
  heading = PROCESS_STEPS_DEFAULTS.heading,
}: ProcessStepsProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    return attachCursorGlow(sectionRef.current);
  }, []);

  return (
    <section ref={sectionRef} className={className} style={{ background: "transparent", position: "relative", overflow: "hidden" }}>
      <div aria-hidden className="kp-glow-blue" style={{ opacity: 0.7 }} />
      <div aria-hidden className="kp-glow-orange" style={{ opacity: 0.7 }} />
      <div className="kp-glow-layer" aria-hidden />
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <SectionReveal as="div" className="mb-16">
          <p
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "var(--text-label)",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: "var(--kp-orange-text)",
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
              color: "var(--stage-text)",
              maxWidth: "16ch",
            }}
          />
        </SectionReveal>

        <SectionReveal
          as="ol"
          className="relative m-0 grid gap-12 p-0 md:grid-cols-4 md:gap-8"
          stagger={0.14}
        >
          {steps.map((step, i) => (
            <li key={step.label} className="relative" style={{ listStyle: "none" }}>
              {/* Rail segment to the next step (desktop) */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-7 left-16 hidden h-px w-[calc(100%-2rem)] md:block"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--kp-orange-glow), rgba(245,130,31,0.06))",
                  }}
                />
              )}
              <span
                className="relative flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  fontFamily: "var(--kp-font-display)",
                  fontSize: "1.15rem",
                  color: "var(--kp-orange-text)",
                  border: "1px solid var(--kp-orange-glow)",
                  background: "var(--stage-bg-2)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div
                className="mt-6"
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.66rem",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "var(--kp-orange-text)",
                }}
              >
                {step.label}
              </div>
              <h3
                className="mt-3"
                style={{
                  fontFamily: "var(--kp-font-display)",
                  fontSize: "1.45rem",
                  lineHeight: 1.12,
                  textTransform: "uppercase",
                  color: "var(--stage-text)",
                }}
              >
                {step.heading.split("\n").map((line, li, arr) => (
                  <Fragment key={li}>
                    {line}
                    {li < arr.length - 1 && <br />}
                  </Fragment>
                ))}
              </h3>
              <p
                className="mt-3"
                style={{
                  fontFamily: "var(--kp-font-body)",
                  fontSize: "0.92rem",
                  lineHeight: 1.65,
                  color: "var(--stage-text-soft)",
                }}
              >
                {step.body}
              </p>
            </li>
          ))}
        </SectionReveal>
      </div>
    </section>
  );
}
