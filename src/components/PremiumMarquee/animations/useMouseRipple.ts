import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { RIPPLE_RADIUS, RIPPLE_SCALE } from '../constants';

// Nearby items bulge very slightly as the cursor passes — a subtle depth cue
// that keeps the marquee feeling alive without being distracting.
// Uses requestAnimationFrame throttling so getBoundingClientRect calls are
// batched and never fire inside a GSAP tick.
export function useMouseRipple(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    let raf = 0;
    let lastX = -9999;
    let lastY = -9999;

    const process = () => {
      container.querySelectorAll('[data-marquee-item]').forEach(el => {
        const r  = el.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        const d  = Math.hypot(lastX - cx, lastY - cy);

        if (d < RIPPLE_RADIUS) {
          const intensity = 1 - d / RIPPLE_RADIUS;
          gsap.to(el, {
            scale:    1 + intensity * RIPPLE_SCALE,
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

    const onMouseMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(process);
    };

    const onMouseLeave = () => {
      cancelAnimationFrame(raf);
      gsap.to(container.querySelectorAll('[data-marquee-item]'), {
        scale:    1,
        duration: 0.55,
        ease:     'power3.out',
        overwrite: true,
      });
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      gsap.killTweensOf(container.querySelectorAll('[data-marquee-item]'));
    };
  }, [enabled]);
}
