import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { RIPPLE_RADIUS, RIPPLE_SCALE } from '../constants';

// Throttled to one rAF per mousemove burst; items and quickTo setters are
// cached on mouseenter, not on every move event.
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

    // Cache items and pre-allocated quickTo setters on mouseenter.
    // quickTo avoids creating a new tween object on every rAF frame.
    let items: Element[] = [];
    let quickScales: ReturnType<typeof gsap.quickTo>[] = [];

    const refreshItems = () => {
      items = Array.from(container.querySelectorAll('[data-marquee-item]'));
      quickScales = items.map(el =>
        gsap.quickTo(el, 'scale', { duration: 0.25, ease: 'power2.out', overwrite: true }),
      );
    };

    const process = () => {
      // Read phase — batch all BCRs before any writes.
      const rects = items.map(el => el.getBoundingClientRect());

      // Write phase — call pre-allocated setter, no tween allocation.
      for (let i = 0; i < items.length; i++) {
        const cx = rects[i].left + rects[i].width  / 2;
        const cy = rects[i].top  + rects[i].height / 2;
        const d  = Math.hypot(lastX - cx, lastY - cy);
        quickScales[i](d < RIPPLE_RADIUS ? 1 + (1 - d / RIPPLE_RADIUS) * RIPPLE_SCALE : 1);
      }
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
      // Return all items to scale:1 with a separate short tween (runs once, not per-frame).
      if (items.length) gsap.to(items, { scale: 1, duration: 0.55, ease: 'power3.out', overwrite: true });
      items = [];
      quickScales = [];
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
      items = [];
      quickScales = [];
    };
  }, [enabled]);
}
