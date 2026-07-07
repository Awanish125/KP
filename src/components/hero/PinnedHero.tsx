"use client";

/**
 * PinnedHero — the cinematic intro: hero stage pinned while 2.5 viewports
 * of scroll scrub through depart → compose → marquee.
 *
 * Perf contract (project scroll rules):
 *  - NO ScrollTrigger. The stage is position:sticky (hero.css); a paused
 *    timeline is driven by gsap.ticker from window.scrollY, gated by
 *    IntersectionObserver. The old ScrollTrigger pin re-positioned the
 *    viewport-sized stage every scrolled frame (~5ms/frame compositing,
 *    measured) and its smoothed scrub could wedge near the top — both
 *    problems disappear with sticky + our own lerp.
 *  - NO filter:blur() in scrubbed tweens: blur re-rasterizes the layer at
 *    every scrub frame. Opacity/transform sell the same motion.
 */

import { useCallback, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import HeroStats from "./stats/HeroStats";
import { HeroEditorialMarquee } from "./HeroEditorialMarquee";
import { tickWhileVisible, withWillChange } from "@/lib/motion";
import type {
  EditorialMarqueeConfig,
  HeroIntroConfig,
  HeroIntroState,
  HeroStatsPresentation,
} from "./cinematicTypes";
import type { HeroStat } from "./stats/types";

interface PinnedHeroProps {
  stats: HeroStat[];
  statsPresentation: HeroStatsPresentation;
  intro: HeroIntroConfig;
  marquee: EditorialMarqueeConfig;
  children: ReactNode;
  /** When true: 100svh, no scroll ticker, timeline plays once on load. */
  staticMode?: boolean;
}

/** Lerp factor for the scroll → timeline smoothing (old scrub:1.3 feel). */
const PROGRESS_LERP = 0.14;

export function PinnedHero({
  stats,
  statsPresentation,
  intro,
  marquee,
  children,
  staticMode = false,
}: PinnedHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const stateRef = useRef<HeroIntroState>("Idle");

  const setState = useCallback((state: HeroIntroState) => {
    if (stateRef.current === state) return;
    stateRef.current = state;
    rootRef.current?.setAttribute("data-intro-state", state);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const content = root.querySelector<HTMLElement>("[data-hero-content]");
    const statsPanel = root.querySelector<HTMLElement>("[data-hero-stats]");
    const statReveal = gsap.utils.toArray<HTMLElement>("[data-stat-reveal]", root);
    const statItems = gsap.utils.toArray<HTMLElement>("[data-stat-item]", root);
    const statValues = gsap.utils.toArray<HTMLElement>("[data-stat-value]", root);
    const marqueeRoot = root.querySelector<HTMLElement>("[data-hero-marquee]");
    const marqueeTrack = root.querySelector<HTMLElement>("[data-marquee-track]");
    const marqueeWords = gsap.utils.toArray<HTMLElement>("[data-marquee-word]", root);
    const indicator = root.querySelector<HTMLElement>("[data-scroll-indicator]");
let cleanupTicker: (() => void) | null = null;

    const context = gsap.context(() => {
      // Set initial state values
      gsap.set(statsPanel, { autoAlpha: 0, y: 28, scale: 0.985 });
      gsap.set([...statReveal, ...statItems], { autoAlpha: 0, y: 18 });
      gsap.set(marqueeRoot, { autoAlpha: 0, y: 24, clipPath: "inset(0 100% 0 0)" });
      gsap.set(marqueeWords, { autoAlpha: 0, y: 15 });

      if (reduced) {
        gsap.set(content, { autoAlpha: 0 });
        gsap.set(statsPanel, { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set([...statReveal, ...statItems, marqueeRoot, ...marqueeWords], {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0% 0 0)",
        });
        statValues.forEach((el) => { el.textContent = el.dataset.value ?? "0"; });
        setState("Completed");
        return;
      }

      const counters = statValues.map((el) => ({ el, value: 0, target: Number(el.dataset.value) || 0 }));
      const tl = gsap.timeline({ paused: true });
      timelineRef.current = tl;

      if (staticMode) {
        // ── Static mode timeline ─────────────────────────────────────────
        // Skip "depart" entirely — content (hero text) stays visible.
        // Only animate the stats panel + marquee in as an entrance sequence.
        gsap.set(marqueeTrack, { x: 0 });
        gsap.set(indicator, { autoAlpha: 0 }); // no scroll story, hide indicator

        tl.addLabel("compose")
          .to(statsPanel, {
            autoAlpha: 1, y: 0, scale: 1,
            duration: 0.8, ease: "power3.out",
          }, "compose")
          .to(statReveal, {
            autoAlpha: 1, y: 0,
            duration: 0.6, stagger: 0.08, ease: "power2.out",
          }, "compose+=0.1")
          .to(statItems, {
            autoAlpha: 1, y: 0,
            duration: 0.6, stagger: 0.08, ease: "power2.out",
          }, "compose+=0.15")
          .to(counters, {
            value: (index: number) => counters[index].target,
            duration: 1.0, ease: "power2.out",
            onUpdate() {
              counters.forEach((c) => {
                c.el.textContent = Math.round(c.value).toLocaleString("en-IN");
              });
            },
          }, "compose+=0.2")
          .to(marqueeRoot, {
            autoAlpha: 1, y: 0, clipPath: "inset(0 0% 0 0)",
            duration: 0.8, ease: "power2.out",
          }, "compose+=0.25")
          .to(marqueeWords, {
            autoAlpha: 1, y: 0,
            duration: 0.8, stagger: 0.06, ease: "power2.out",
            ...withWillChange(marqueeWords, "transform, opacity"),
          }, "compose+=0.3");
      } else {
        // ── Scroll-driven timeline ───────────────────────────────────────
        // Marquee track starts offset so the scroll animation moves it left.
        const containerWidth = marqueeRoot?.offsetWidth ?? 0;
        gsap.set(marqueeTrack, { x: containerWidth * 0.25 });

        // 1. Depart — fromTo keeps rewind state deterministic when scrubbing
        tl.addLabel("depart")
          .fromTo(content, {
            autoAlpha: 1, y: 0, scale: 1,
          }, {
            autoAlpha: 0, y: -54, scale: 0.975,
            duration: 1.0, ease: "power2.inOut",
          }, "depart")
          .fromTo(indicator, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 10, duration: 0.4 }, "depart")

          // 2. Compose — stats + marquee revealed
          .addLabel("compose", "depart+=0.8")
          .to(statsPanel, {
            autoAlpha: 1, y: 0, scale: 1,
            duration: 0.8, ease: "power3.out",
          }, "compose")
          .to(statReveal, {
            autoAlpha: 1, y: 0,
            duration: 0.6, stagger: 0.08, ease: "power2.out",
          }, "compose+=0.1")
          .to(statItems, {
            autoAlpha: 1, y: 0,
            duration: 0.6, stagger: 0.08, ease: "power2.out",
          }, "compose+=0.15")
          .to(counters, {
            value: (index: number) => counters[index].target,
            duration: 1.0, ease: "power2.out",
            onUpdate() {
              counters.forEach((c) => {
                c.el.textContent = Math.round(c.value).toLocaleString("en-IN");
              });
            },
          }, "compose+=0.2")
          .to(marqueeRoot, {
            autoAlpha: 1, y: 0, clipPath: "inset(0 0% 0 0)",
            duration: 0.8, ease: "power2.out",
          }, "compose+=0.25")
          .to(marqueeWords, {
            autoAlpha: 1, y: 0,
            duration: 0.8, stagger: 0.06, ease: "power2.out",
            ...withWillChange(marqueeWords, "transform, opacity"),
          }, "compose+=0.3")

          // 3. Editorial marquee horizontal scroll
          .addLabel("scrollMarquee", "compose+=1.2")
          .to(marqueeTrack, {
            x: () => {
              const containerW = marqueeRoot?.offsetWidth ?? 0;
              const textW = marqueeTrack?.scrollWidth ?? 0;
              return containerW - textW;
            },
            duration: 2.0, ease: "none",
          }, "scrollMarquee");
      }

      if (staticMode) {
        /* ── Static mode: play once on load, no scroll driver ──────────
           Timeline plays forward at full speed when the page-revealed
           signal fires (or immediately if it already has). */
        const play = () => {
          tl.play();
          setState("Completed");
        };
        if (document.documentElement.classList.contains("page-revealed")) {
          play();
        } else {
          window.addEventListener("page-revealed", play as EventListener, { once: true });
          window.addEventListener("kp:loaded", play as EventListener, { once: true });
        }
        cleanupTicker = () => {
          window.removeEventListener("page-revealed", play as EventListener);
          window.removeEventListener("kp:loaded", play as EventListener);
        };
      } else {
        /* ── Scroll driver ───────────────────────────────────────────────
           The section spans 350svh with a sticky 100svh stage; timeline
           progress = scroll progress through the runway, smoothed with a
           lerp. Cached measurements only — no layout reads per frame. */
        let rootTop = 0;
        let range = 1;
        const measure = () => {
          rootTop = root.getBoundingClientRect().top + window.scrollY;
          range = Math.max(root.offsetHeight - window.innerHeight, 1);
        };
        measure();
        let measureTimeout: ReturnType<typeof setTimeout> | null = null;
        const debouncedMeasure = () => {
          if (measureTimeout) clearTimeout(measureTimeout);
          measureTimeout = setTimeout(measure, 80);
        };
        window.addEventListener("resize", debouncedMeasure);

        let current = -1;
        const tick = () => {
          const target = Math.min(Math.max((window.scrollY - rootTop) / range, 0), 1);
          let next = current < 0 ? target : current + (target - current) * PROGRESS_LERP;
          if (Math.abs(next - target) < 0.0005) next = target;
          if (next === current) return;
          current = next;
          tl.progress(current);
          setState(current <= 0 ? "Idle" : current < 0.98 ? "Playing" : "Completed");
        };

        const cleanupTick = tickWhileVisible(root, tick);
        cleanupTicker = () => {
          cleanupTick();
          window.removeEventListener("resize", debouncedMeasure);
          if (measureTimeout) clearTimeout(measureTimeout);
        };
      }
    }, root);

    return () => {
      cleanupTicker?.();
      timelineRef.current?.kill();
      timelineRef.current = null;
      context.revert();
    };
  }, [intro, setState, staticMode]);

  return (
    <section ref={rootRef} className={staticMode ? "hero-static" : "hero-cinematic"} data-intro-state="Idle">
      <div className={staticMode ? undefined : "hero-cinematic-stage"}
        style={staticMode ? { position: "relative", height: "100%", overflow: "clip" } : undefined}
      >
        {children}
        <div className="hero-cinematic-lower">
          <HeroStats heroStats={stats} presentation={statsPresentation} />
          <HeroEditorialMarquee config={marquee} />
        </div>
      </div>
    </section>
  );
}
