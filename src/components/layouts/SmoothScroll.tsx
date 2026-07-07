'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __kpLenis?: Lenis;
  }
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      // lerp raised 0.08→0.1 and multiplier 0.95→1.2 after user reports:
      // the page is long, and a slow catch-up reads as "gesture stuck".
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.2,
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
    // Deferred — refresh blocks the main thread on long pages and causes the
    // 1-2 s scroll freeze on load. Idle callback fires after first paint+interaction.
    const idleId =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(() => ScrollTrigger.refresh(), { timeout: 2000 })
        : setTimeout(() => ScrollTrigger.refresh(), 500) as unknown as number;

    // Expose for components that need programmatic scrolling in sync with
    // Lenis (e.g. CustomScrollbar drag). Cleared on unmount.
    window.__kpLenis = lenis;

    if (process.env.NODE_ENV !== "production") {
      // Dev-only handles for profiling GSAP/ScrollTrigger from the console.
      (window as any).__kpGsap = gsap;
      (window as any).__kpST = ScrollTrigger;
    }

    return () => {
      if (typeof requestIdleCallback !== "undefined") cancelIdleCallback(idleId);
      else clearTimeout(idleId as unknown as ReturnType<typeof setTimeout>);
      gsap.ticker.remove(raf);
      window.removeEventListener("kp:scroll-lock", stop);
      window.removeEventListener("kp:scroll-unlock", start);
      lenis.destroy();
      delete window.__kpLenis;
    };
  }, []);

  // Guarantee that scroll is never locked on page transition, and refresh ScrollTrigger/Lenis dimensions.
  useEffect(() => {
    const lenis = window.__kpLenis;
    if (lenis) {
      lenis.start();
      window.dispatchEvent(new Event("resize"));
      requestAnimationFrame(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      });
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
  }, [pathname]);

  return null;
}
