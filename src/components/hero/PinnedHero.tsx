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

    let removeListeners = () => {};
    const context = gsap.context(() => {
      // Set initial values
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

      // Create master timeline once
      const counters = statValues.map((el) => ({ el, value: 0, target: Number(el.dataset.value) || 0 }));
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          setState("Completed");
          window.dispatchEvent(new CustomEvent("kp:scroll-unlock"));
          root.dispatchEvent(new CustomEvent("kp:hero-intro-complete"));
        }
      });
      timelineRef.current = tl;

      tl.addLabel("depart")
        .to(content, {
          autoAlpha: 0,
          y: -54,
          scale: 0.975,
          filter: "blur(8px)",
          duration: intro.timing.contentExit,
          ease: intro.easing.exit,
        }, "depart")
        .to(indicator, { autoAlpha: 0, y: 10, duration: 0.35, ease: "power2.out" }, "depart")
        .to(camera, {
          zoom: intro.camera.peakZoom,
          duration: intro.timing.cameraPush,
          ease: intro.easing.camera,
          onUpdate: applyCamera,
        }, "depart")
        .addLabel("compose", `depart+=${Math.max(intro.timing.contentExit - 0.08, 0)}`)
        .to(camera, {
          zoom: intro.camera.initialZoom,
          offsetX: 0,
          duration: intro.timing.cameraReturn,
          ease: "expo.inOut",
          onUpdate: applyCamera,
        }, "compose")
        .addLabel("reveal", "compose+=0.42")
        .to(statsPanel, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: intro.timing.statsReveal,
          ease: intro.easing.reveal,
        }, "reveal")
        .to(statReveal, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: intro.easing.reveal,
        }, "reveal+=0.12")
        .to(statItems, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.07,
          ease: intro.easing.reveal,
        }, "reveal+=0.2")
        .to(counters, {
          value: (index: number) => counters[index].target,
          duration: intro.timing.counter,
          stagger: 0.045,
          ease: "power3.out",
          onUpdate() {
            counters.forEach((counter) => {
              counter.el.textContent = Math.round(counter.value).toLocaleString("en-IN");
            });
          },
        }, "reveal+=0.28")
        .to(marqueeRoot, {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0% 0 0)",
          duration: intro.timing.marqueeReveal,
          ease: intro.easing.reveal,
        }, `reveal+=${marquee.revealDelay}`)
        .to(marqueeWords, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: 0.06,
          ease: "power2.out",
        }, `reveal+=${marquee.revealDelay + 0.15}`);

      // Scroll-controlled editorial typography movement (right to left)
      const buildScrollAnimation = () => {
        if (scrollTweenRef.current) {
          scrollTweenRef.current.scrollTrigger?.kill();
          scrollTweenRef.current.kill();
        }

        const containerWidth = marqueeRoot?.offsetWidth ?? 0;
        const textWidth = marqueeTrack?.scrollWidth ?? 0;

        scrollTweenRef.current = gsap.fromTo(marqueeTrack, {
          x: containerWidth * 0.25,
        }, {
          x: -textWidth,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
            invalidateOnRefresh: true,
          }
        });
      };

      buildScrollAnimation();
      window.addEventListener("resize", buildScrollAnimation, { passive: true });

      // Reset to exact fresh load state cleanly & deterministically
      const resetToInitial = () => {
        setState("Resetting");
        
        // Return master timeline to beginning instantly
        tl.progress(0).pause();

        // Reset counters to exactly 0
        counters.forEach((counter) => {
          counter.value = 0;
          counter.el.textContent = "0";
        });

        // Reset camera positions
        camera.zoom = intro.camera.initialZoom;
        camera.offsetX = window.innerWidth < 768 ? 0 : intro.camera.initialOffsetX;
        applyCamera();

        // Reset track position
        if (marqueeTrack) {
          const containerWidth = marqueeRoot?.offsetWidth ?? 0;
          gsap.set(marqueeTrack, { x: containerWidth * 0.25 });
        }

        setState("Idle");
      };

      // ScrollTrigger to detect entering/leaving/re-entering Hero region
      const heroTrigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom top",
        onLeave: () => {
          if (stateRef.current === "Completed") {
            resetToInitial();
          }
        },
        onEnterBack: () => {
          if (stateRef.current === "Completed") {
            resetToInitial();
          }
        },
      });

      const play = () => {
        if (!readyRef.current) return;
        if (stateRef.current === "Idle" || stateRef.current === "Resetting") {
          setState("Playing");
          window.dispatchEvent(new CustomEvent("kp:scroll-lock"));
          tl.play();
        }
      };

      const consume = (event: Event) => {
        if (stateRef.current === "Completed") return false;
        if (window.scrollY > 5) return false;
        event.preventDefault();
        if (stateRef.current === "Idle" || stateRef.current === "Resetting") {
          play();
        }
        return true;
      };
      const onWheel = (event: WheelEvent) => {
        if (event.deltaY > 0 || stateRef.current === "Playing") consume(event);
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (TRIGGER_KEYS.has(event.key) && (!event.shiftKey || stateRef.current === "Playing")) consume(event);
      };
      const onTouchStart = (event: TouchEvent) => {
        touchYRef.current = event.touches[0]?.clientY ?? null;
      };
      const onTouchMove = (event: TouchEvent) => {
        const currentY = event.touches[0]?.clientY;
        const startY = touchYRef.current;
        if (stateRef.current === "Playing") consume(event);
        else if (startY != null && currentY != null && startY - currentY > 10) consume(event);
      };

      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKeyDown, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });

      const arm = () => { readyRef.current = true; };
      if (document.documentElement.classList.contains("page-revealed")) arm();
      else window.addEventListener("kp:loaded", arm, { once: true });

      removeListeners = () => {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("kp:loaded", arm);
        window.removeEventListener("resize", buildScrollAnimation);
      };
    }, root);

    return () => {
      removeListeners();
      timelineRef.current?.kill();
      scrollTweenRef.current?.kill();
      window.dispatchEvent(new CustomEvent("kp:scroll-unlock"));
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
