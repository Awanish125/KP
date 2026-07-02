"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";

interface UseRevealOptions {
  enabled: boolean;
  delay?: number;
  duration?: number; // 0.4 - 0.8s, snappy by design
  borderRadius?: string;
}

/**
 * Fast cinematic reveal — same visual language as PremiumRevealSection
 * (scale down, blur out, fade in) but tuned for a much snappier finish, and
 * adds a clip-path "iris" reveal on top: the frame grows from a slightly
 * inset rect to full size while the image itself scales/blurs/fades in.
 * Driven by IntersectionObserver, not ScrollTrigger, per this project's
 * Lenis-compatibility rule (ScrollTrigger recomputes on every Lenis frame).
 */
export function useReveal(
  frameRef: RefObject<HTMLElement | null>,
  imageRef: RefObject<HTMLElement | null>,
  { enabled, delay = 0, duration = 0.6, borderRadius = "1.5rem" }: UseRevealOptions,
) {
  useEffect(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;

    if (!enabled) {
      gsap.set([frame, image], { clearProps: "all" });
      return;
    }

    gsap.set(frame, { clipPath: `inset(9% round ${borderRadius})` });
    gsap.set(image, { scale: 1.35, opacity: 0, filter: "blur(18px)" });

    const play = () => {
      const tl = gsap.timeline({ delay });
      tl.to(frame, { clipPath: `inset(0% round ${borderRadius})`, duration, ease: "power3.out" }, 0);
      tl.to(image, { scale: 1, opacity: 1, filter: "blur(0px)", duration, ease: "power3.out" }, 0);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(frame);

    return () => observer.disconnect();
  }, [frameRef, imageRef, enabled, delay, duration, borderRadius]);
}
