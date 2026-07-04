"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import HeroStats from "./stats/HeroStats";
import { HeroEditorialMarquee } from "./HeroEditorialMarquee";
import { heroUniformBridge } from "./heroUniformBridge";
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
}

const TRIGGER_KEYS = new Set([" ", "PageDown", "ArrowDown"]);

export function PinnedHero({
  stats,
  statsPresentation,
  intro,
  marquee,
  children,
}: PinnedHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const scrollTweenRef = useRef<gsap.core.Tween | null>(null);
  const stateRef = useRef<HeroIntroState>("Idle");
  const readyRef = useRef(false);
  const touchYRef = useRef<number | null>(null);

  const setState = useCallback((state: HeroIntroState) => {
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
    const camera = {
      zoom: intro.camera.initialZoom,
      offsetX: window.innerWidth < 768 ? 0 : intro.camera.initialOffsetX,
    };
    const applyCamera = () => {
      heroUniformBridge.setZoom?.(camera.zoom);
      heroUniformBridge.setOffsetX?.(camera.offsetX);
    };

    applyCamera();

    const context = gsap.context(() => {
      // Set initial state values
      gsap.set(statsPanel, { autoAlpha: 0, y: 28, scale: 0.985 });
      gsap.set([...statReveal, ...statItems], { autoAlpha: 0, y: 18 });
      gsap.set(marqueeRoot, { autoAlpha: 0, y: 24, clipPath: "inset(0 100% 0 0)" });
      gsap.set(marqueeWords, { autoAlpha: 0, y: 15, filter: "blur(6px)" });

      if (reduced) {
        gsap.set(content, { autoAlpha: 0 });
        gsap.set(statsPanel, { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set([...statReveal, ...statItems, marqueeRoot, ...marqueeWords], {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0% 0 0)",
          filter: "blur(0px)",
        });
        statValues.forEach((el) => { el.textContent = el.dataset.value ?? "0"; });
        camera.zoom = intro.camera.initialZoom;
        camera.offsetX = 0;
        applyCamera();
        setState("Completed");
        readyRef.current = true;
        return;
      }

      // Initial track translation position
      const containerWidth = marqueeRoot?.offsetWidth ?? 0;
      gsap.set(marqueeTrack, { x: containerWidth * 0.25 });

      // Create master timeline driven entirely by scroll scrub
      const counters = statValues.map((el) => ({ el, value: 0, target: Number(el.dataset.value) || 0 }));
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.5}`,
          scrub: 1.3,
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress === 0) {
              setState("Idle");
            } else if (self.progress > 0 && self.progress < 0.98) {
              setState("Playing");
            } else {
              setState("Completed");
            }
          }
        }
      });
      timelineRef.current = tl;

      // 1. Depart Sequence
      tl.addLabel("depart")
        .to(content, {
          autoAlpha: 0,
          y: -54,
          scale: 0.975,
          filter: "blur(8px)",
          duration: 1.0,
          ease: "power2.inOut",
        }, "depart")
        .to(indicator, { autoAlpha: 0, y: 10, duration: 0.4 }, "depart")
        .to(camera, {
          zoom: intro.camera.peakZoom,
          duration: 1.0,
          ease: "power2.inOut",
          onUpdate: applyCamera,
        }, "depart")
        
        // 2. Compose Camera Zoom Return & Stats Reveal
        .addLabel("compose", "depart+=0.8")
        .to(camera, {
          zoom: intro.camera.initialZoom,
          offsetX: 0,
          duration: 1.2,
          ease: "expo.inOut",
          onUpdate: applyCamera,
        }, "compose")
        .to(statsPanel, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
        }, "compose")
        .to(statReveal, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        }, "compose+=0.1")
        .to(statItems, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        }, "compose+=0.15")
        .to(counters, {
          value: (index: number) => counters[index].target,
          duration: 1.0,
          ease: "power2.out",
          onUpdate() {
            counters.forEach((counter) => {
              counter.el.textContent = Math.round(counter.value).toLocaleString("en-IN");
            });
          },
        }, "compose+=0.2")
        .to(marqueeRoot, {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0% 0 0)",
          duration: 0.8,
          ease: "power2.out",
        }, "compose+=0.25")
        .to(marqueeWords, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: 0.06,
          ease: "power2.out",
        }, "compose+=0.3")

        // 3. Horizontal Editorial Scroll Animation
        .addLabel("scrollMarquee", "compose+=1.2")
        .to(marqueeTrack, {
          x: () => {
            const containerW = marqueeRoot?.offsetWidth ?? 0;
            const textW = marqueeTrack?.scrollWidth ?? 0;
            return containerW - textW;
          },
          duration: 2.0,
          ease: "none",
        }, "scrollMarquee");

      const arm = () => { readyRef.current = true; };
      if (document.documentElement.classList.contains("page-revealed")) arm();
      else window.addEventListener("kp:loaded", arm, { once: true });
    }, root);

    return () => {
      timelineRef.current?.kill();
      scrollTweenRef.current?.kill();
      context.revert();
    };
  }, [intro, marquee, setState]);

  return (
    <section ref={rootRef} className="hero-cinematic" data-intro-state="Idle">
      <div className="hero-cinematic-stage">
        {children}
        <div className="hero-cinematic-lower">
          <HeroStats heroStats={stats} presentation={statsPresentation} />
          <HeroEditorialMarquee config={marquee} />
        </div>
      </div>
    </section>
  );
}
