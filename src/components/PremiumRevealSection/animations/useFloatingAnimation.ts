import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import type { ImageData } from '../types';
import { FLOAT_AMP_Y, FLOAT_AMP_X, FLOAT_DURATION_MIN, FLOAT_DURATION_MAX } from '../constants';
import { getDepthTier, getDepthConfig } from '../utils/depthHelpers';

/**
 * Continuous organic floating.
 *
 * Performance notes:
 *   - All tweens start PAUSED. An IntersectionObserver plays/pauses the
 *     entire batch when the section enters/leaves the viewport.
 *     → Zero GSAP work per frame when off-screen.
 *   - `startDelay`: postpones floating until after the entrance animation
 *     completes so both aren't running simultaneously.
 *   - Tweens are killed on unmount.
 */
export function useFloatingAnimation(
  containerRef: RefObject<HTMLElement | null>,
  floatRefs:    RefObject<(HTMLElement | null)[]>,
  images:       ImageData[],
  opts:         { enabled: boolean; showDepth: boolean; startDelay: number },
  isReduced:    boolean,
): void {
  useEffect(() => {
    if (!opts.enabled || isReduced || images.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const tweens: gsap.core.Tween[] = [];

    floatRefs.current.forEach((el, i) => {
      if (!el || !images[i]) return;

      const img   = images[i];
      const depth = getDepthTier(img.zIndex ?? 1, img.depth);
      const str   = opts.showDepth ? getDepthConfig(depth).floatStrength : 1;

      // Per-image phase offset so images never peak together.
      const phase = (i / Math.max(images.length - 1, 1)) * 2.4;
      const dur   = FLOAT_DURATION_MIN + ((i * 0.37) % (FLOAT_DURATION_MAX - FLOAT_DURATION_MIN));

      tweens.push(
        gsap.to(el, {
          y:        FLOAT_AMP_Y * str,
          x:        FLOAT_AMP_X * str * (i % 2 === 0 ? 1 : -1),
          duration: dur,
          ease:     'sine.inOut',
          repeat:   -1,
          yoyo:     true,
          // startDelay postpones after entrance; phase staggers within the group.
          delay:    opts.startDelay + phase,
          paused:   true,
        }),
      );
    });

    // Play/pause the whole batch based on section visibility.
    // When off-screen: zero GSAP ticks for these tweens.
    const obs = new IntersectionObserver(
      ([entry]) => tweens.forEach(t => entry.isIntersecting ? t.play() : t.pause()),
      { threshold: 0.05 },
    );
    obs.observe(container);

    return () => {
      obs.disconnect();
      tweens.forEach(t => t.kill());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, opts.showDepth, opts.startDelay, images.length, isReduced]);
}
