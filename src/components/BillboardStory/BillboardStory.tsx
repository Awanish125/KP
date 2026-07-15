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

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import { SectionReveal } from "@/components/SectionReveal";
import { TextReveal } from "@/components/TextReveal";
import { BILLBOARD_STORY_DEFAULTS } from "./billboardStoryConfig";
import { isVideoMedia, type BillboardStoryProps } from "./billboardStoryTypes";
import BillboardStoryScene from "./BillboardStoryScene";

gsap.registerPlugin(ScrollTrigger);

export function BillboardStory({
  steps,
  className,
  label = BILLBOARD_STORY_DEFAULTS.label,
  heading = BILLBOARD_STORY_DEFAULTS.heading,
  vhPerStep = BILLBOARD_STORY_DEFAULTS.vhPerStep,
  flipDuration = BILLBOARD_STORY_DEFAULTS.flipDuration,
  staticMode = false,
}: BillboardStoryProps) {
  const outerRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Stacking depth veil animation for mobile cards
  useEffect(() => {
    if (!isMobile || reduced || !steps.length) return;

    const cards = gsap.utils.toArray<Element>(".mobile-stack-card");
    const STEP_VEIL = 0.25;

    const triggers: ScrollTrigger[] = [];

    cards.forEach((card: any, i: number) => {
      const veil = card.querySelector(".sc-veil");
      if (!veil) return;

      for (let j = i + 1; j < cards.length; j++) {
        const before = j - 1 - i;
        const after = j - i;
        const st = ScrollTrigger.create({
          trigger: cards[j],
          start: "top 95%",
          end: "top 45%",
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const currentOpacity = (STEP_VEIL * before) + (STEP_VEIL * progress);
            gsap.set(veil, { opacity: Math.min(currentOpacity, 0.65) });
          }
        });
        triggers.push(st);
      }
    });

    return () => {
      triggers.forEach((st) => st.kill());
    };
  }, [isMobile, reduced, steps.length]);


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

  /* ── Static / reduced-motion: clean step grid, no 3D, no scroll ticker ── */
  if (staticMode || reduced || isMobile) {
    return (
      <section className={className} style={{ background: "transparent" }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p style={kickerStyle}>{label}</p>
          <h2 className="mt-4 mb-16" style={{ ...titleStyle, fontSize: "var(--text-section)" }}>
            {heading}
          </h2>
          <div className="flex flex-col gap-12 relative pb-24">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="mobile-stack-card grid gap-6 md:grid-cols-2 md:items-center relative overflow-hidden"
                style={{
                  position: "sticky",
                  top: `calc(100px + ${i * 1.5}rem)`,
                  zIndex: i,
                  transform: `scale(${1 - (steps.length - 1 - i) * 0.025})`,
                  transformOrigin: "center top",
                  background: "var(--kp-card-bg)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "16px",
                  padding: "2rem",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Depth veil overlays other elements inside card */}
                <span className="sc-veil" aria-hidden="true" />
                
                <div style={{ position: "relative", zIndex: 2 }}>
                  <p style={kickerStyle}>{s.kicker}</p>
                  <h3 className="mt-2" style={titleStyle}>{s.title}</h3>
                  <p className="mt-3" style={bodyStyle}>{s.body}</p>
                </div>
                <div style={{ position: "relative", zIndex: 2 }}>
                  {isVideoMedia(s.media) ? (
                    <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "5 / 3" }}>
                      <video src={s.media} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "5 / 3" }}>
                      <Image src={s.media} alt={s.title} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: "cover" }} />
                    </div>
                  )}
                </div>
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
        background: "transparent",
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

          {/* ── Right: billboard ─────────────────────────────────────── */}
          <div className="relative order-1 w-full aspect-[5/3] lg:order-2 lg:h-[74vh] lg:aspect-none">
            <BillboardStoryScene
              steps={steps}
              stepIndex={stepIndex}
              flipDuration={flipDuration}
            />
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
