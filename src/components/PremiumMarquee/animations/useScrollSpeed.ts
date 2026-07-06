import { RefObject, useEffect } from 'react';
import gsap from 'gsap';

// react-fast-marquee v1.6.x controls speed via the CSS custom property --duration
// on each .rfm-marquee element (animation: scroll var(--duration) linear …).
// We read/write that CSS variable — NOT animationDuration — to modulate speed.
//
// baseDurations is cleared after returning to normal so the next scroll always
// re-reads from the DOM, picking up any speed-prop changes rfm made in between.
export function useScrollSpeed(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Cache elements once — never re-query the DOM inside onUpdate (60fps).
    let cachedEls: HTMLElement[] = [];
    const getMarqueeEls = (): HTMLElement[] => {
      if (cachedEls.length === 0) {
        cachedEls = Array.from(
          containerRef.current?.querySelectorAll<HTMLElement>('.rfm-marquee') ?? [],
        );
      }
      return cachedEls;
    };

    let baseDurations: number[] = [];

    const readBase = () => {
      // Refresh cached els in case rfm re-renders.
      cachedEls = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>('.rfm-marquee') ?? [],
      );
      if (!cachedEls.length) return;
      baseDurations = cachedEls.map(el => {
        const raw = el.style.getPropertyValue('--duration');
        return parseFloat(raw) || 0;
      });
      // Drop the read if rfm hasn't applied --duration yet (all zeros).
      if (baseDurations.every(d => d === 0)) baseDurations = [];
    };

    // Give rfm time to finish its own layout measurement and style application.
    const initTimer = setTimeout(readBase, 200);

    const state = { factor: 1 };
    let returnTimer: ReturnType<typeof setTimeout> | null = null;

    // apply() uses the cached element list — zero DOM traversal per frame.
    const apply = () => {
      const els = getMarqueeEls();
      for (let i = 0; i < els.length; i++) {
        const base = baseDurations[i] ?? baseDurations[0];
        if (!base) continue;
        els[i].style.setProperty('--duration', `${base * state.factor}s`);
      }
    };

    const scheduleReturn = () => {
      if (returnTimer) clearTimeout(returnTimer);
      returnTimer = setTimeout(() => {
        returnTimer = null;
        gsap.killTweensOf(state);
        gsap.to(state, {
          factor:     1,
          duration:   0.7,
          ease:       'power2.inOut',
          onUpdate:   apply,
          onComplete: () => {
            // Clear cache so next scroll re-reads rfm's current --duration,
            // which reflects any speed-prop changes made during this interaction.
            baseDurations = [];
            cachedEls = [];
          },
        });
      }, 380);
    };

    const onWheel = (e: WheelEvent) => {
      if (baseDurations.length === 0) readBase();
      if (baseDurations.length === 0) return; // rfm not ready

      // Only react to downward scroll — speeding up on scroll-down is intuitive.
      if (e.deltaY <= 0) return;

      const mag    = Math.min(e.deltaY / 60, 3);
      const target = 1 / (1 + mag * 0.7); // up to ~3.3× faster on scroll down

      gsap.killTweensOf(state);
      gsap.to(state, {
        factor:   target,
        duration: 0.14,
        ease:     'power2.out',
        onUpdate: apply,
      });

      scheduleReturn();
    };

    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      clearTimeout(initTimer);
      if (returnTimer) clearTimeout(returnTimer);
      window.removeEventListener('wheel', onWheel);
      gsap.killTweensOf(state);
      cachedEls = [];
    };
  }, [enabled]);
}
