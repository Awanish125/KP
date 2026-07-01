import { RefObject, useEffect } from 'react';
import gsap from 'gsap';

// Adjusts react-fast-marquee's animation speed in response to scroll velocity.
// Rather than triggering React re-renders, this reads the animationDuration that
// react-fast-marquee sets as an inline style on its .rfm-marquee elements and
// overwrites it directly — zero re-renders, pure DOM mutation via GSAP.
export function useScrollSpeed(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const getMarqueeEls = (): HTMLElement[] =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>('.rfm-marquee') ?? [],
      );

    // Base durations are read once after react-fast-marquee has painted.
    let baseDurations: number[] = [];

    const readBase = () => {
      baseDurations = getMarqueeEls().map(
        el => parseFloat(el.style.animationDuration) || 10,
      );
    };

    // Small delay lets react-fast-marquee finish its own style application.
    const initTimer = setTimeout(readBase, 100);

    // Tweening an intermediate object avoids needing a state setter.
    const state = { factor: 1 };

    const apply = () => {
      getMarqueeEls().forEach((el, i) => {
        const base = baseDurations[i] ?? baseDurations[0] ?? 10;
        el.style.animationDuration = `${base * state.factor}s`;
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (baseDurations.length === 0) readBase();

      // Scroll down → shorter duration (faster). Scroll up → longer (slower).
      const mag = Math.min(Math.abs(e.deltaY) / 80, 2);
      const target = e.deltaY > 0 ? 1 / (1 + mag * 0.55) : 1 + mag * 0.18;

      gsap.killTweensOf(state);

      gsap.to(state, {
        factor: target,
        duration: 0.18,
        ease: 'power2.out',
        onUpdate: apply,
      });

      // Drift back to normal once scrolling stops.
      gsap.to(state, {
        factor: 1,
        duration: 1.6,
        ease: 'power3.out',
        delay: 0.38,
        onUpdate: apply,
      });
    };

    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('wheel', onWheel);
      gsap.killTweensOf(state);
    };
  }, [enabled]);
}
