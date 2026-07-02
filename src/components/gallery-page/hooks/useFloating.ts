"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";

interface UseFloatingOptions {
  enabled: boolean;
  seed?: number;
  startDelay?: number;
}

/**
 * Subtle infinite float on the whole card (never an inner layer — floating
 * an inner layer inside a clipped frame is what caused the panel/frame
 * detachment bug on the campaign gallery cards earlier in this project).
 * Gated by IntersectionObserver so idle, off-screen cards cost nothing.
 */
export function useFloating(cardRef: RefObject<HTMLElement | null>, { enabled, seed = 0, startDelay = 0 }: UseFloatingOptions) {
  useEffect(() => {
    const card = cardRef.current;
    if (!enabled || !card) return;

    const duration = 5 + ((seed * 37) % 50) / 10; // 5s - 10s
    const delay = startDelay + ((seed * 13) % 20) / 10;
    const distance = 6 + (seed % 5);

    const tween = gsap.to(card, {
      y: `-=${distance}`,
      duration,
      delay,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      paused: true,
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.style.willChange = "transform";
          tween.play();
        } else {
          tween.pause();
          card.style.willChange = "auto";
        }
      },
      { threshold: 0 },
    );
    observer.observe(card);

    return () => {
      observer.disconnect();
      tween.kill();
      card.style.willChange = "auto";
    };
  }, [cardRef, enabled, seed, startDelay]);
}
