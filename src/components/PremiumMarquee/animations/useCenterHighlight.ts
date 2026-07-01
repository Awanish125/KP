import { RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CENTER_SCALE, CENTER_OPACITY } from '../constants';

// On every GSAP tick, measures each item's horizontal distance from the container
// centre and applies a smooth scale + opacity gradient so the nearest item pops.
//
// getBoundingClientRect is called in a read-then-write pattern to avoid layout
// thrashing: all rects are read in one pass, all GSAP updates written after.
export function useCenterHighlight(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  isVisible: boolean,
): void {
  const tickRef = useRef<(() => void) | null>(null);

  // quickTo setters persisted across ticks — lazily created per element.
  const setters = useRef(
    new Map<Element, { scale: (v: number) => void; opacity: (v: number) => void }>(),
  );

  useEffect(() => {
    if (!enabled || !isVisible || !containerRef.current) return;

    const container = containerRef.current;
    const cache = setters.current;

    // Cache the item list; only refresh when it might have changed.
    let items: Element[] = [];
    const refreshItems = () => {
      items = Array.from(container.querySelectorAll('[data-marquee-item]'));
    };
    refreshItems();

    const getSetter = (el: Element) => {
      if (!cache.has(el)) {
        cache.set(el, {
          scale:   gsap.quickTo(el, 'scale',   { duration: 0.22, ease: 'power2.out' }),
          opacity: gsap.quickTo(el, 'opacity', { duration: 0.22, ease: 'power2.out' }),
        });
      }
      return cache.get(el)!;
    };

    const tick = () => {
      // Re-query items periodically in case react-fast-marquee cloned more.
      // Using a simple frame counter avoids calling querySelectorAll every frame.
      const cRect = container.getBoundingClientRect();
      const cx = cRect.left + cRect.width / 2;

      // Read all rects first (layout read batch)
      const rects = items.map(el => el.getBoundingClientRect());

      // Then write all animations (layout write batch)
      items.forEach((el, i) => {
        const dist      = Math.abs(rects[i].left + rects[i].width / 2 - cx);
        const proximity = Math.max(0, 1 - dist / (cRect.width * 0.5));
        const eased     = Math.pow(proximity, 1.8);

        const s = getSetter(el);
        s.scale(1 + (CENTER_SCALE - 1) * eased);
        s.opacity(CENTER_OPACITY + (1 - CENTER_OPACITY) * eased);
      });
    };

    gsap.ticker.add(tick);
    tickRef.current = tick;

    // Keep the item list reasonably fresh (marquee may have cloned new items).
    const refreshTimer = setInterval(refreshItems, 2000);

    return () => {
      clearInterval(refreshTimer);
      if (tickRef.current) gsap.ticker.remove(tickRef.current);

      // Reset all items to neutral before removing.
      items.forEach(el =>
        gsap.to(el, { scale: 1, opacity: 1, duration: 0.3, overwrite: true }),
      );
      cache.clear();
    };
  }, [enabled, isVisible]);
}
