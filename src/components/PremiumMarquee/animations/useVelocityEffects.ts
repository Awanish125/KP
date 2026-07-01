import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { STRETCH_MAX, TILT_MAX, ROTATE_MAX, COMPRESS_MAX } from '../constants';

interface Options {
  stretch:     boolean; // scale items in the scroll direction
  tilt:        boolean; // tilt the inner container on scroll
  compression: boolean; // compress the inner container in the scroll direction
  rotation:    boolean; // rotate items slightly in scroll direction
  isVertical:  boolean; // true when direction='up'|'down' — swaps X↔Y axes
}

// All four velocity-driven effects share one wheel listener so velocity
// calculation and decay are applied consistently without duplication.
export function useVelocityEffects(
  containerRef: RefObject<HTMLElement | null>,
  { stretch, tilt, compression, rotation, isVertical }: Options,
): void {
  const anyEnabled = stretch || tilt || compression || rotation;

  useEffect(() => {
    if (!anyEnabled || !containerRef.current) return;

    const container = containerRef.current;
    let decayTimer: ReturnType<typeof setTimeout> | null = null;

    const items     = () => container.querySelectorAll<HTMLElement>('[data-marquee-item]');
    const innerWrap = () => container.querySelector<HTMLElement>('.rfm-marquee-container');

    const onWheel = (e: WheelEvent) => {
      const v   = Math.min(Math.abs(e.deltaY) / 100, 1);
      const dir = Math.sign(e.deltaY);

      if (stretch) {
        // Horizontal → stretch width; vertical → stretch height.
        gsap.to(items(), {
          [isVertical ? 'scaleY' : 'scaleX']: 1 + v * STRETCH_MAX,
          duration:  0.14,
          ease:      'power2.out',
          overwrite: 'auto',
        });
      }

      const wrap = innerWrap();
      if (wrap) {
        if (tilt) {
          // Horizontal strip → tip forward/back (rotateX).
          // Vertical strip   → tip left/right (rotateY).
          gsap.to(wrap, {
            [isVertical ? 'rotateY' : 'rotateX']: dir * v * -TILT_MAX,
            duration:  0.2,
            ease:      'power2.out',
            overwrite: 'auto',
          });
        }
        if (compression) {
          // Compress in the direction of movement.
          gsap.to(wrap, {
            [isVertical ? 'scaleY' : 'scaleX']: 1 - v * COMPRESS_MAX,
            duration:  0.2,
            ease:      'power2.out',
            overwrite: 'auto',
          });
        }
      }

      if (rotation) {
        gsap.to(items(), {
          rotate:    dir * v * ROTATE_MAX,
          duration:  0.18,
          ease:      'power2.out',
          overwrite: 'auto',
        });
      }

      // Return everything to rest after scroll ceases.
      if (decayTimer) clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        const scaleAxis = isVertical ? 'scaleY' : 'scaleX';
        const tiltAxis  = isVertical ? 'rotateY' : 'rotateX';

        if (stretch) {
          gsap.to(items(), {
            [scaleAxis]: 1,
            duration: 0.45,
            ease:     'power3.out',
          });
        }
        if (rotation) {
          gsap.to(items(), {
            rotate:   0,
            duration: 0.45,
            ease:     'power3.out',
          });
        }
        const w = innerWrap();
        if (w) {
          if (tilt)        gsap.to(w, { [tiltAxis]:  0, duration: 0.5, ease: 'power3.out' });
          if (compression) gsap.to(w, { [scaleAxis]: 1, duration: 0.45, ease: 'power3.out' });
        }
      }, 130);
    };

    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (decayTimer) clearTimeout(decayTimer);
      gsap.killTweensOf(items());
      const w = innerWrap();
      if (w) gsap.killTweensOf(w);
    };
  }, [anyEnabled, stretch, tilt, compression, rotation, isVertical]);
}
