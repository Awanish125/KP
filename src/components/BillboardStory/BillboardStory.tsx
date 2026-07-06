"use client";

/**
 * BillboardStory — pinned split section: content steps on the left, a
 * photoreal 3D billboard on the right that flips to a new face for every
 * step. Steps and their media come from src/data/billboardStory.json —
 * each step owns an equal slice of the pinned scroll, so content and
 * timeline always stay mapped 1:1.
 *
 * Perf contract (project scroll rules):
 *  - NO ScrollTrigger: sticky viewport + gsap.ticker progress from cached
 *    offsets, gated by IntersectionObserver (tickWhileVisible).
 *  - The step index changes state only when crossing a boundary — text
 *    swap tweens and the 3D flip are event-driven, never per-frame.
 *  - Three.js chunk lazy-loads when the section approaches; AssetLoader
 *    covers until the first textured frame. Reduced motion → flat list.
 */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { observeOnce, prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import { AssetLoader } from "@/components/AssetLoader";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { BILLBOARD_STORY_DEFAULTS } from "./billboardStoryConfig";
import { isVideoMedia, type BillboardStoryProps } from "./billboardStoryTypes";

const BillboardStoryScene = dynamic(() => import("./BillboardStoryScene"), { ssr: false });

export function BillboardStory({
  steps,
  className,
  label = BILLBOARD_STORY_DEFAULTS.label,
  heading = BILLBOARD_STORY_DEFAULTS.heading,
  vhPerStep = BILLBOARD_STORY_DEFAULTS.vhPerStep,
  flipDuration = BILLBOARD_STORY_DEFAULTS.flipDuration,
}: BillboardStoryProps) {
  const outerRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  /* Lazy-load the Three.js chunk well before the section is visible.
   *
   * LoAF profiling showed the WebGL shader compile blocks the main thread
   * for ~2.7 s. The old requestIdleCallback(timeout:3500) fired exactly
   * when the user started scrolling — the worst possible moment.
   *
   * Fix: start at 1 500 ms (during the initial page-load busy window, before
   * most users scroll) AND keep the proximity observer as a safety net. */
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || prefersReducedMotion()) return;

    let cancelled = false;

    // Primary trigger: fixed 1 500 ms delay — initialisation completes during
    // the page-load phase so the first scroll is never blocked by shader compile.
    const timer = setTimeout(() => {
      if (!cancelled) setShouldLoad(true);
    }, 1500);

    // Safety net: if the user scrolls to the section before 1 500 ms, load now.
    const cleanupObserve = observeOnce(host, () => {
      if (!cancelled) setShouldLoad(true);
    }, "1200px 0px 1200px 0px");

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanupObserve();
    };
  }, []);

  /* Scroll → step index (state changes only at boundaries). */
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer || prefersReducedMotion()) return;

    let outerTop = 0;
    let scrollRange = 1;
    const measure = () => {
      outerTop = outer.getBoundingClientRect().top + window.scrollY;
      scrollRange = Math.max(outer.offsetHeight - window.innerHeight, 1);
    };
    let measureTimeout: any = null;
    const debouncedMeasure = () => {
      if (measureTimeout) clearTimeout(measureTimeout);
      measureTimeout = setTimeout(measure, 80);
    };

    measure();
    window.addEventListener("resize", debouncedMeasure);
    const ro = new ResizeObserver(debouncedMeasure);
    ro.observe(document.body);

    let current = 0;
    const tick = () => {
      const progress = Math.min(Math.max((window.scrollY - outerTop) / scrollRange, 0), 1);
      const idx = Math.min(Math.floor(progress * steps.length), steps.length - 1);
      if (idx !== current) {
        current = idx;
        setStepIndex(idx);
      }
    };

    const cleanup = tickWhileVisible(outer, tick);
    return () => {
      cleanup();
      window.removeEventListener("resize", debouncedMeasure);
      if (measureTimeout) clearTimeout(measureTimeout);
      ro.disconnect();
    };
  }, [steps.length]);

  /* Left column swap tweens on step change. */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const els = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    els.forEach((el, i) => {
      if (i === stepIndex) {
        el.style.pointerEvents = "auto";
        gsap.fromTo(
          el,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", delay: 0.12, overwrite: "auto" },
        );
      } else if (getComputedStyle(el).opacity !== "0") {
        el.style.pointerEvents = "none";
        gsap.to(el, { opacity: 0, y: -16, duration: 0.3, ease: "power2.in", overwrite: "auto" });
      }
    });
  }, [stepIndex]);

  const kickerStyle: React.CSSProperties = {
    fontFamily: "var(--kp-font-mono)",
    fontSize: "0.68rem",
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: "var(--kp-orange-text)",
  };
  const titleStyle: React.CSSProperties = {
    fontFamily: "var(--kp-font-display)",
    fontSize: "clamp(1.5rem, 2.8vw, 2.3rem)",
    lineHeight: 1.08,
    textTransform: "uppercase",
    color: "var(--stage-text)",
  };
  const bodyStyle: React.CSSProperties = {
    fontFamily: "var(--kp-font-body)",
    fontSize: "0.98rem",
    lineHeight: 1.7,
    color: "var(--stage-text-soft)",
  };

  /* ── Reduced motion: flat, fully accessible fallback ─────────────── */
  if (reduced) {
    return (
      <section className={className} style={{ background: "var(--stage-bg)" }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p style={kickerStyle}>{label}</p>
          <h2 className="mt-4 mb-12" style={{ ...titleStyle, fontSize: "var(--text-section)" }}>
            {heading}
          </h2>
          <div className="grid gap-10">
            {steps.map((s) => (
              <div key={s.title} className="grid gap-6 md:grid-cols-2 md:items-center">
                <div>
                  <p style={kickerStyle}>{s.kicker}</p>
                  <h3 className="mt-2" style={titleStyle}>{s.title}</h3>
                  <p className="mt-3" style={bodyStyle}>{s.body}</p>
                </div>
                {!isVideoMedia(s.media) && (
                  <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "5 / 3" }}>
                    <Image src={s.media} alt={s.title} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: "cover" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={outerRef}
      className={className}
      style={{
        background:
          "radial-gradient(ellipse at 70% 45%, var(--stage-bg-2), var(--stage-bg) 72%)",
        height: `${100 + steps.length * vhPerStep * 100}vh`,
      }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-6 lg:grid-cols-2 lg:items-center lg:gap-14">
          {/* ── Left: header + swapping step content ─────────────────── */}
          <div className="order-2 lg:order-1">
            <SectionReveal as="div" staggerChildren={false}>
              <p style={kickerStyle}>{label}</p>
              <TextReveal
                as="h2"
                text={heading}
                className="mt-3"
                style={{ ...titleStyle, fontSize: "var(--text-section)", maxWidth: "14ch" }}
              />
            </SectionReveal>

            {/* Step stack — absolutely stacked, tweened on change */}
            <div className="relative mt-4 lg:mt-10 min-h-[17rem] lg:min-h-[20rem]">
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  className="absolute inset-x-0 top-0"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  <p style={kickerStyle}>{s.kicker}</p>
                  <h3 className="mt-3" style={titleStyle}>{s.title}</h3>
                  <p className="mt-4 max-w-md" style={bodyStyle}>{s.body}</p>
                  {s.stat ? (
                    <div className="mt-6 flex items-baseline gap-3">
                      <span
                        style={{
                          fontFamily: "var(--kp-font-display)",
                          fontSize: "2.2rem",
                          lineHeight: 1,
                          color: "var(--kp-orange-text)",
                        }}
                      >
                        {s.stat.value}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--kp-font-mono)",
                          fontSize: "0.65rem",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "var(--stage-text-soft)",
                        }}
                      >
                        {s.stat.label}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Step indicator */}
            <div className="mt-4 lg:mt-8 flex items-center gap-4">
              <span
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.2em",
                  color: "var(--stage-text-soft)",
                }}
              >
                {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
              </span>
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: i === stepIndex ? "2rem" : "0.6rem",
                      background: i === stepIndex ? "var(--kp-orange)" : "var(--stage-border)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: the 3D billboard ──────────────────────────────── */}
          <div
            ref={canvasHostRef}
            className="relative order-1 h-[34vh] lg:order-2 lg:h-[74vh]"
          >
            {shouldLoad && (
              <BillboardStoryScene
                steps={steps}
                stepIndex={stepIndex}
                flipDuration={flipDuration}
                onReady={() => setReady(true)}
              />
            )}
            {!ready && (
              <div style={{ position: "absolute", inset: 0 }}>
                <AssetLoader label="Raising the billboard" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preload steps media */}
      <div className="sr-only" aria-hidden="true">
        {steps.map((step, i) => {
          if (isVideoMedia(step.media)) {
            return (
              <video key={i} src={step.media} preload="auto" muted />
            );
          }
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={step.media} loading="eager" decoding="async" alt="" />
          );
        })}
      </div>
    </section>
  );
}
