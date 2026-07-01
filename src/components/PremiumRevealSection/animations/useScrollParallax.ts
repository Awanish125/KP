import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ImageData } from '../types';
import { SCROLL_PARALLAX_MAX } from '../constants';
import { getDepthTier, getDepthConfig } from '../utils/depthHelpers';

/**
 * Scroll-based vertical parallax.
 *
 * Performance:
 *   - ONE ScrollTrigger for all images (not one per image).
 *   - quickSetter is ~3× faster than gsap.set in a hot onUpdate path.
 *   - scrub: 1 balances smoothness and lag.
 */
export function useScrollParallax(
  containerRef: RefObject<HTMLElement | null>,
  scrollRefs:   RefObject<(HTMLElement | null)[]>,
  images:       ImageData[],
  opts:         { enabled: boolean; showDepth: boolean; scrollStart?: string; scrollEnd?: string },
  isReduced:    boolean,
): void {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!opts.enabled || isReduced || !containerRef.current || images.length === 0) return;

    const container = containerRef.current;

    // Pre-compute per-image y-range AND quickSetter once — avoids per-frame allocation.
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

    const st = ScrollTrigger.create({
      trigger: container,
      start:   opts.scrollStart ?? 'top bottom',
      end:     opts.scrollEnd   ?? 'bottom top',
      scrub:   1,
      onUpdate(self) {
        const t = (self.progress - 0.5) * 2; // -1 … +1
        for (let i = 0; i < setters.length; i++) {
          setters[i]?.(t * ranges[i]);
        }
      },
    });

    return () => {
      st.kill();
      scrollRefs.current.forEach(el => el && gsap.set(el, { y: 0 }));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, opts.showDepth, images.length, isReduced, opts.scrollStart, opts.scrollEnd]);
}
