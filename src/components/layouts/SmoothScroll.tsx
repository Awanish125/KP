'use client';

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.95,
    });

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    const stop = () => lenis.stop();
    const start = () => lenis.start();
    window.addEventListener("kp:scroll-lock", stop);
    window.addEventListener("kp:scroll-unlock", start);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      window.removeEventListener("kp:scroll-lock", stop);
      window.removeEventListener("kp:scroll-unlock", start);
      lenis.destroy();
    };
  }, []);

  return null;
}
