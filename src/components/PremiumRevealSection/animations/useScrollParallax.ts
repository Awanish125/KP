import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import type { ImageData } from '../types';
import { SCROLL_PARALLAX_MAX } from '../constants';
import { getDepthTier, getDepthConfig } from '../utils/depthHelpers';

/**
 * Scroll-based vertical parallax — driven by GSAP ticker, no ScrollTrigger.
 *
 * Why GSAP ticker (not window scroll event):
 *   Lenis smooth scroll runs inside gsap.ticker.add(), so by the time our
 *   ticker callback fires, Lenis has already applied the new scroll position.
 *   window "scroll" events fire at native scroll timing which can be out of
 *   sync with Lenis's interpolated position.
 *
 * The ticker callback is added/removed via IntersectionObserver so it only
 * runs while the section is on screen — zero per-frame cost when off-screen.
 */
export function useScrollParallax(
  containerRef: RefObject<HTMLElement | null>,
  scrollRefs:   RefObject<(HTMLElement | null)[]>,
  images:       ImageData[],
  opts:         { enabled: boolean; showDepth: boolean; scrollStart?: string; scrollEnd?: string },
  isReduced:    boolean,
): void {
  useEffect(() => {
    if (!opts.enabled || isReduced || !containerRef.current || images.length === 0) return;

    const container = containerRef.current;

    // Pre-compute ranges and quickSetters once.
    const setters: Array<((v: number) => void) | null> = [];
    const ranges:  number[] = [];

    scrollRefs.current.forEach((el, i) => {
      if (!el || !images[i]) {
        setters.push(null);
        ranges.push(0);
        return;
      }
      const img   = images[i];
      const depth = getDepthTier(img.zIndex ?? 1, img.depth);
      const str   = opts.showDepth ? getDepthConfig(depth).scrollStrength : 0.5;
      setters.push(gsap.quickSetter(el, 'y', 'px') as (v: number) => void);
      ranges.push(SCROLL_PARALLAX_MAX * str);
    });

    let containerTop = 0;
    let ch = 0;
    let vh = 0;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      containerTop = rect.top + window.scrollY;
      ch = container.offsetHeight;
      vh = window.innerHeight;
    };

    const update = () => {
      const rectTop = containerTop - window.scrollY;
      // t: -1 (section below viewport) → 0 (centred) → +1 (above viewport)
      const rawT = (vh / 2 - (rectTop + ch / 2)) / (vh / 2 + ch / 2);
      const t    = Math.max(-1, Math.min(1, rawT));
      for (let i = 0; i < setters.length; i++) {
        setters[i]?.(t * ranges[i]);
      }
    };

    // Add/remove ticker only while section is visible — zero overhead off-screen.
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          measure();
          update(); // snap to correct position immediately on enter
          gsap.ticker.add(update);
        } else {
          gsap.ticker.remove(update);
          scrollRefs.current.forEach(el => el && gsap.set(el, { y: 0 }));
        }
      },
      { threshold: 0, rootMargin: '100px 0px 100px 0px' }, // slightly generous margin
    );
    obs.observe(container);

    window.addEventListener('resize', measure);

    return () => {
      obs.disconnect();
      window.removeEventListener('resize', measure);
      gsap.ticker.remove(update);
      scrollRefs.current.forEach(el => el && gsap.set(el, { y: 0 }));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, opts.showDepth, images.length, isReduced]);
}
