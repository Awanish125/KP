'use client';

import { RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Animates marquee items when the strip enters the viewport.
 *
 * direction — how items arrive on first entry (and every entry when repeat=true):
 *   'top'    → items slide down from above into place
 *   'bottom' → items slide up from below into place  (default)
 *   'none'   → no movement, just fade + unblur
 *
 * repeat — whether to replay the full animation on every viewport re-entry.
 *   true  → full slide-in plays every time the strip comes into view
 *   false → full slide-in plays once; subsequent entries only blur→unblur
 */
export function useEntranceAnimation(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  isVisible: boolean,
  direction: 'top' | 'bottom' | 'none' = 'bottom',
  repeat: boolean = false,
): void {
  const hasPlayedOnce = useRef(false);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-marquee-item]'),
    );
    if (!items.length) return;

    const yFrom = direction === 'top' ? -18 : direction === 'bottom' ? 18 : 0;
    const scaleFrom = direction !== 'none' ? 0.93 : 1;

    if (isVisible) {
      const isFirst = !hasPlayedOnce.current;

      if (isFirst || repeat) {
        // ── Full entrance animation ──────────────────────────────────────────
        hasPlayedOnce.current = true;
        gsap.set(items, { opacity: 0, y: yFrom, scale: scaleFrom, filter: 'blur(6px)' });

        const tl = gsap.timeline();
        tl.to(items, {
          opacity:  1,
          y:        0,
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
        // Reset to initial hidden state so next entry replays the full slide-in.
        gsap.set(items, { opacity: 0, y: yFrom, scale: scaleFrom, filter: 'blur(6px)' });
      } else if (hasPlayedOnce.current) {
        // Blur-out when leaving (pairs with blur-in on re-entry above).
        gsap.to(items, {
          filter:   'blur(8px)',
          opacity:  0.25,
          duration: 0.35,
          ease:     'power2.in',
        });
        return () => { gsap.killTweensOf(items); };
      }
    }
  }, [enabled, isVisible, direction, repeat]);
}
