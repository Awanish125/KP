import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { STRETCH_MAX, TILT_MAX, ROTATE_MAX, COMPRESS_MAX } from '../constants';

interface Options {
  stretch:     boolean;
  tilt:        boolean;
  compression: boolean;
  rotation:    boolean;
  isVertical:  boolean;
}

export function useVelocityEffects(
  containerRef: RefObject<HTMLElement | null>,
  { stretch, tilt, compression, rotation, isVertical }: Options,
): void {
  const anyEnabled = stretch || tilt || compression || rotation;

  useEffect(() => {
    if (!anyEnabled || !containerRef.current) return;

    const container = containerRef.current;
    const scaleAxis = isVertical ? 'scaleY' : 'scaleX';
    const tiltAxis  = isVertical ? 'rotateY' : 'rotateX';

    // Cache DOM queries once — querySelectorAll in a 60 fps wheel handler is expensive.
    const itemEls   = Array.from(container.querySelectorAll<HTMLElement>('[data-marquee-item]'));
    const innerWrap = container.querySelector<HTMLElement>('.rfm-marquee-container');
    if (!itemEls.length) return;

    // quickTo: pre-allocated per-element tween updater — no tween object is created on each
    // call, just the target value is updated. ~5× faster than gsap.to in a hot event handler.
    const quickScale = stretch
      ? itemEls.map(el => gsap.quickTo(el, scaleAxis, { duration: 0.14, ease: 'power2.out' }))
      : null;
    const quickRot = rotation
      ? itemEls.map(el => gsap.quickTo(el, 'rotate', { duration: 0.18, ease: 'power2.out' }))
      : null;
    const quickTilt = tilt && innerWrap
      ? gsap.quickTo(innerWrap, tiltAxis, { duration: 0.2, ease: 'power2.out' })
      : null;
    const quickComp = compression && innerWrap
      ? gsap.quickTo(innerWrap, scaleAxis, { duration: 0.2, ease: 'power2.out' })
      : null;

    let decayTimer: ReturnType<typeof setTimeout> | null = null;

    const onWheel = (e: WheelEvent) => {
      const v   = Math.min(Math.abs(e.deltaY) / 100, 1);
      const dir = Math.sign(e.deltaY);

      // Hot path — only value updates, no tween creation.
      quickScale?.forEach(fn => fn(1 + v * STRETCH_MAX));
      quickRot?.forEach(fn => fn(dir * v * ROTATE_MAX));
      quickTilt?.(dir * v * -TILT_MAX);
      quickComp?.(1 - v * COMPRESS_MAX);

      // Return-to-rest fires once after scroll stops (not per-frame — gsap.to is fine here).
      if (decayTimer) clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        if (stretch)              gsap.to(itemEls,  { [scaleAxis]: 1, duration: 0.45, ease: 'power3.out' });
        if (rotation)             gsap.to(itemEls,  { rotate: 0,      duration: 0.45, ease: 'power3.out' });
        if (tilt && innerWrap)    gsap.to(innerWrap, { [tiltAxis]: 0,  duration: 0.5,  ease: 'power3.out' });
        if (compression && innerWrap) gsap.to(innerWrap, { [scaleAxis]: 1, duration: 0.45, ease: 'power3.out' });
      }, 130);
    };

    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (decayTimer) clearTimeout(decayTimer);
      gsap.set(itemEls, { [scaleAxis]: 1, rotate: 0 });
      if (innerWrap) gsap.set(innerWrap, { [tiltAxis]: 0, [scaleAxis]: 1 });
    };
  }, [anyEnabled, stretch, tilt, compression, rotation, isVertical]);
}
