import { RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';

// Plays once the first time the marquee enters the viewport.
// Items cascade in from a blurred, translated, transparent state.
// hasPlayed prevents re-triggering when the user scrolls away and back.
export function useEntranceAnimation(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  isVisible: boolean,
): void {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!enabled || !isVisible || hasPlayed.current || !containerRef.current) return;

    hasPlayed.current = true;

    const items = containerRef.current.querySelectorAll('[data-marquee-item]');
    if (!items.length) return;

    // Start from invisible/blurred/shifted state.
    gsap.set(items, { opacity: 0, y: 14, scale: 0.95, filter: 'blur(5px)' });

    const tl = gsap.timeline();
    tl.to(items, {
      opacity:  1,
      y:        0,
      scale:    1,
      filter:   'blur(0px)',
      duration: 0.6,
      stagger:  0.032,
      ease:     'power3.out',
      delay:    0.08,
    });

    return () => {
      tl.kill();
    };
  }, [enabled, isVisible]);
}
