import { RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CENTER_SCALE, CENTER_OPACITY } from '../constants';

// Throttled to every 6th GSAP tick (~10fps) because getBoundingClientRect on
// many cloned marquee items at 60fps causes serious layout thrashing.
// At 10fps the visual falloff is imperceptible — the quickTo easing makes the
// transitions feel continuous even with infrequent measurements.
const TICK_INTERVAL = 6;

export function useCenterHighlight(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  isVisible: boolean,
): void {
  const tickRef = useRef<(() => void) | null>(null);
  const setters = useRef(
    new Map<Element, { scale: (v: number) => void; opacity: (v: number) => void }>(),
  );

  useEffect(() => {
    if (!enabled || !isVisible || !containerRef.current) return;

    const container = containerRef.current;
    const cache     = setters.current;

    // Cached container rect — only re-reads on window resize, not every tick.
    let containerRect = container.getBoundingClientRect();
    const onResize = () => { containerRect = container.getBoundingClientRect(); };
    window.addEventListener('resize', onResize, { passive: true });

    // Item list is stable after initial clone; refresh every 3s as a safety net.
    let items: Element[] = Array.from(container.querySelectorAll('[data-marquee-item]'));
    const refreshTimer = setInterval(() => {
      items = Array.from(container.querySelectorAll('[data-marquee-item]'));
    }, 3000);

    const getSetter = (el: Element) => {
      if (!cache.has(el)) {
        cache.set(el, {
          scale:   gsap.quickTo(el, 'scale',   { duration: 0.3, ease: 'power2.out' }),
          opacity: gsap.quickTo(el, 'opacity', { duration: 0.3, ease: 'power2.out' }),
        });
      }
      return cache.get(el)!;
    };

    let frame = 0;

    const tick = () => {
      frame++;
      // Skip all but every TICK_INTERVAL-th frame to limit BCR calls.
      if (frame % TICK_INTERVAL !== 0) return;

      const cx = containerRect.left + containerRect.width / 2;

      // Read phase — all BCR calls together before any writes.
      const rects = items.map(el => el.getBoundingClientRect());

      // Write phase — GSAP quickTo calls only.
      items.forEach((el, i) => {
        const dist      = Math.abs(rects[i].left + rects[i].width / 2 - cx);
        const proximity = Math.max(0, 1 - dist / (containerRect.width * 0.5));
        const eased     = Math.pow(proximity, 1.8);

        const s = getSetter(el);
        s.scale(1 + (CENTER_SCALE - 1) * eased);
        s.opacity(CENTER_OPACITY + (1 - CENTER_OPACITY) * eased);
      });
    };

    gsap.ticker.add(tick);
    tickRef.current = tick;

    return () => {
      clearInterval(refreshTimer);
      window.removeEventListener('resize', onResize);
      if (tickRef.current) gsap.ticker.remove(tickRef.current);
      items.forEach(el =>
        gsap.to(el, { scale: 1, opacity: 1, duration: 0.3, overwrite: true }),
      );
      cache.clear();
    };
  }, [enabled, isVisible]);
}
