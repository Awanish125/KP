import { RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { RIPPLE_RADIUS, RIPPLE_SCALE } from '../constants';

// Throttled to one rAF per mousemove burst; items are cached and only re-queried
// when the container is first entered, not on every move event.
export function useMouseRipple(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    let raf  = 0;
    let lastX = -9999;
    let lastY = -9999;

    // Cache items on mouseenter — avoids querySelectorAll on every move event.
    let items: Element[] = [];
    const refreshItems = () => {
      items = Array.from(container.querySelectorAll('[data-marquee-item]'));
    };

    const process = () => {
      // Read phase
      const rects = items.map(el => el.getBoundingClientRect());

      // Write phase
      items.forEach((el, i) => {
        const cx = rects[i].left + rects[i].width  / 2;
        const cy = rects[i].top  + rects[i].height / 2;
        const d  = Math.hypot(lastX - cx, lastY - cy);

        if (d < RIPPLE_RADIUS) {
          gsap.to(el, {
            scale:    1 + (1 - d / RIPPLE_RADIUS) * RIPPLE_SCALE,
            duration: 0.25,
            ease:     'power2.out',
            overwrite: 'auto',
          });
        } else {
          gsap.to(el, {
            scale:    1,
            duration: 0.4,
            ease:     'power3.out',
            overwrite: 'auto',
          });
        }
      });
    };

    const onMouseEnter = () => refreshItems();

    const onMouseMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(process);
    };

    const onMouseLeave = () => {
      cancelAnimationFrame(raf);
      gsap.to(items, { scale: 1, duration: 0.55, ease: 'power3.out', overwrite: true });
      items = [];
    };

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mousemove',  onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mousemove',  onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      if (items.length) gsap.killTweensOf(items);
    };
  }, [enabled]);
}
