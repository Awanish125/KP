import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import type { ImageData } from '../types';
import { MOUSE_PARALLAX_MAX, MOUSE_LERP_DURATION } from '../constants';
import { getDepthTier, getDepthConfig } from '../utils/depthHelpers';

/**
 * Mouse-driven parallax.
 *
 * Performance notes:
 *   - quickTo is called once per image per mousemove; GSAP batches the writes.
 *   - The listener is passive and bound on the container only (not window).
 *   - quickTo functions are created once and reused for the lifetime of the hook.
 */
export function useMouseParallax(
  containerRef: RefObject<HTMLElement | null>,
  mouseRefs:    RefObject<(HTMLElement | null)[]>,
  images:       ImageData[],
  opts:         { enabled: boolean; showDepth: boolean },
  isReduced:    boolean,
): void {
  useEffect(() => {
    if (!opts.enabled || isReduced || !containerRef.current || images.length === 0) return;

    const container = containerRef.current;
    const els       = mouseRefs.current;

    // Create quickTo functions once.
    const quickXs = els.map(el =>
      el ? gsap.quickTo(el, 'x', { duration: MOUSE_LERP_DURATION, ease: 'power2.out' }) : null,
    );
    const quickYs = els.map(el =>
      el ? gsap.quickTo(el, 'y', { duration: MOUSE_LERP_DURATION, ease: 'power2.out' }) : null,
    );

    // Pre-compute per-image strength so we don't recalculate in the hot path.
    const strengths = images.map(img => {
      const depth = getDepthTier(img.zIndex ?? 1, img.depth);
      return opts.showDepth ? getDepthConfig(depth).mouseStrength : 0.6;
    });

    let rect: DOMRect | null = null;

    const onEnter = () => {
      rect = container.getBoundingClientRect();
    };

    const onMove = (e: MouseEvent) => {
      if (!rect) {
        rect = container.getBoundingClientRect();
      }
      const nx = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
      const ny = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;

      for (let i = 0; i < images.length; i++) {
        const str = strengths[i];
        quickXs[i]?.(nx * MOUSE_PARALLAX_MAX * str);
        quickYs[i]?.(ny * MOUSE_PARALLAX_MAX * str);
      }
    };

    const onLeave = () => {
      rect = null;
      for (let i = 0; i < images.length; i++) {
        quickXs[i]?.(0);
        quickYs[i]?.(0);
      }
    };

    container.addEventListener('mouseenter', onEnter, { passive: true });
    container.addEventListener('mousemove', onMove, { passive: true });
    container.addEventListener('mouseleave', onLeave, { passive: true });

    return () => {
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      els.forEach(el => el && gsap.killTweensOf(el));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, opts.showDepth, images.length, isReduced]);
}
