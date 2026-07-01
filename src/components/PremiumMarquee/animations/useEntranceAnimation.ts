'use client';

import { RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Animates marquee items when the strip enters the viewport.
 *
 * direction — how items arrive on first entry (and every entry when repeat=true):
 *   'top'    → horizontal: slide down from above. vertical: slide from leading edge.
 *   'bottom' → horizontal: slide up from below.  vertical: slide from trailing edge.
 *   'none'   → no movement, just fade + unblur.
 *
 * repeat    — true: full animation every viewport entry.
 *             false: once only; subsequent entries do blur→unblur.
 *
 * isVertical — when true, swaps y↔x because rfm rotates its container 90°,
 *              so a y-offset on items appears as horizontal drift visually.
 */
export function useEntranceAnimation(
  containerRef:  RefObject<HTMLElement | null>,
  enabled:       boolean,
  isVisible:     boolean,
  direction:     'top' | 'bottom' | 'none' = 'bottom',
  repeat:        boolean = false,
  isVertical:    boolean = false,
): void {
  const hasPlayedOnce = useRef(false);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-marquee-item]'),
    );
    if (!items.length) return;

    // For vertical marquees, rfm rotates the container -90deg (up) or +90deg (down).
    // A y transform on items inside appears as horizontal drift on screen, so we use
    // x instead to get the visually correct "coming from top/bottom" effect.
    const offset = direction === 'top' ? -18 : direction === 'bottom' ? 18 : 0;
    const fromProps = isVertical
      ? { x: offset, y: 0 }
      : { x: 0,      y: offset };
    const toProps   = { x: 0, y: 0 };

    const scaleFrom = direction !== 'none' ? 0.93 : 1;

    if (isVisible) {
      const isFirst = !hasPlayedOnce.current;

      if (isFirst || repeat) {
        // ── Full entrance animation ──────────────────────────────────────────
        hasPlayedOnce.current = true;
        gsap.set(items, { opacity: 0, ...fromProps, scale: scaleFrom, filter: 'blur(6px)' });

        const tl = gsap.timeline();
        tl.to(items, {
          opacity:  1,
          ...toProps,
          scale:    1,
          filter:   'blur(0px)',
          duration: 0.6,
          stagger:  0.032,
          ease:     'power3.out',
          delay:    0.1,
        });

        return () => { tl.kill(); };
      } else {
        // ── Blur → unblur on re-entry (no position shift) ───────────────────
        const tl = gsap.timeline();
        tl.fromTo(
          items,
          { filter: 'blur(8px)', opacity: 0.25 },
          { filter: 'blur(0px)', opacity: 1, duration: 0.45, ease: 'power2.out' },
        );
        return () => { tl.kill(); };
      }
    } else {
      // ── Leaving viewport ─────────────────────────────────────────────────
      if (repeat) {
        gsap.set(items, { opacity: 0, ...fromProps, scale: scaleFrom, filter: 'blur(6px)' });
      } else if (hasPlayedOnce.current) {
        gsap.to(items, {
          filter:   'blur(8px)',
          opacity:  0.25,
          duration: 0.35,
          ease:     'power2.in',
        });
        return () => { gsap.killTweensOf(items); };
      }
    }
  }, [enabled, isVisible, direction, repeat, isVertical]);
}
