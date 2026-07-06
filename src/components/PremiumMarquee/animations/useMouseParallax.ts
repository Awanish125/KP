import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { PARALLAX_X, PARALLAX_Y } from '../constants';

// Each item shifts slightly based on the cursor's position within the container.
// Items at different cycle positions receive different depth multipliers so the
// row feels three-dimensional rather than moving as a flat plane.
export function useMouseParallax(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // quickTo setters are created once per element and reused on every mousemove.
    const setterCache = new Map<
      Element,
      { x: (v: number) => void; y: (v: number) => void }
    >();

    const getSetter = (el: Element) => {
      if (!setterCache.has(el)) {
        setterCache.set(el, {
          x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power2.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power2.out' }),
        });
      }
      return setterCache.get(el)!;
    };

    let rect: DOMRect | null = null;
    let items: Element[] = [];

    const onMouseEnter = () => {
      rect = container.getBoundingClientRect();
      items = Array.from(container.querySelectorAll('[data-marquee-item]'));
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!rect) {
        rect = container.getBoundingClientRect();
      }
      if (items.length === 0) {
        items = Array.from(container.querySelectorAll('[data-marquee-item]'));
      }
      // Normalise to –1 … +1 relative to container centre
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      items.forEach((el, i) => {
        // Three depth tiers: forward, mid, backward
        const depth = i % 3 === 0 ? 1 : i % 3 === 1 ? 0.55 : -0.35;
        const s = getSetter(el);
        s.x(nx * PARALLAX_X * depth);
        s.y(ny * PARALLAX_Y * Math.abs(depth));
      });
    };

    const onMouseLeave = () => {
      rect = null;
      if (items.length) {
        items.forEach(el => {
          gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'power3.out' });
        });
      }
      items = [];
      setterCache.clear();
    };

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      setterCache.forEach((_, el) => gsap.killTweensOf(el));
      setterCache.clear();
    };
  }, [enabled]);
}
