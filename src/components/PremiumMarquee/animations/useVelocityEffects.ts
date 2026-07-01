import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { STRETCH_MAX, TILT_MAX, ROTATE_MAX, COMPRESS_MAX } from '../constants';

interface Options {
  stretch:     boolean; // scaleX items on fast scroll
  tilt:        boolean; // rotateX the inner container on scroll direction
  compression: boolean; // compress scaleX of the inner container
  rotation:    boolean; // rotate items slightly in scroll direction
}

// All four velocity-driven effects share one wheel listener so the velocity
// calculation and decay timer are applied consistently without duplication.
export function useVelocityEffects(
  containerRef: RefObject<HTMLElement | null>,
  { stretch, tilt, compression, rotation }: Options,
): void {
  const anyEnabled = stretch || tilt || compression || rotation;

  useEffect(() => {
    if (!anyEnabled || !containerRef.current) return;

    const container = containerRef.current;
    let decayTimer: ReturnType<typeof setTimeout> | null = null;

    const items     = () => container.querySelectorAll<HTMLElement>('[data-marquee-item]');
    const innerWrap = () => container.querySelector<HTMLElement>('.rfm-marquee-container');

    const onWheel = (e: WheelEvent) => {
      // Normalise to 0–1 regardless of device deltaMode
      const v   = Math.min(Math.abs(e.deltaY) / 100, 1);
      const dir = Math.sign(e.deltaY);

      if (stretch) {
        gsap.to(items(), {
          scaleX: 1 + v * STRETCH_MAX,
          duration: 0.14,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }

      const wrap = innerWrap();
      if (wrap) {
        if (tilt) {
          gsap.to(wrap, {
            rotateX: dir * v * -TILT_MAX,
            duration: 0.2,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
        if (compression) {
          gsap.to(wrap, {
            scaleX: 1 - v * COMPRESS_MAX,
            duration: 0.2,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      }

      if (rotation) {
        gsap.to(items(), {
          rotate: dir * v * ROTATE_MAX,
          duration: 0.18,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }

      // Return everything to rest after scroll ceases.
      if (decayTimer) clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        if (stretch) {
          gsap.to(items(), {
            scaleX: 1,
            duration: 0.75,
            ease: 'elastic.out(1, 0.5)',
          });
        }
        if (rotation) {
          gsap.to(items(), {
            rotate: 0,
            duration: 0.55,
            ease: 'power3.out',
          });
        }
        const w = innerWrap();
        if (w) {
          if (tilt)        gsap.to(w, { rotateX: 0, duration: 0.85, ease: 'elastic.out(1, 0.45)' });
          if (compression) gsap.to(w, { scaleX:  1, duration: 0.7,  ease: 'elastic.out(1, 0.5)'  });
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
  }, [anyEnabled, stretch, tilt, compression, rotation]);
}
