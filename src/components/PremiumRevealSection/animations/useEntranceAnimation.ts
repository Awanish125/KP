import { RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { ImageData, AnimationPreset } from '../types';
import { ENTRANCE_DURATION } from '../constants';
import {
  getPresetResult,
  buildToVars,
  resolvePreset,
  type PresetOptions,
} from '../utils/presetAnimations';

export interface EntranceOptions extends PresetOptions {
  enabled:           boolean;
  stagger:           boolean;
  staggerAmount:     number;
  /** Per-card duration in seconds. Overrides preset default when set. */
  animationDuration?: number;
  /** Scale-punch + rotation-wiggle when each card settles. */
  showLandingJerk?:  boolean;
  /**
   * GSAP-style start string, e.g. "top 75%".
   * Converted to IntersectionObserver rootMargin so no ScrollTrigger is needed.
   * "top N%" → trigger when top of section is N% down the viewport.
   */
  scrollStart:       string;
  repeatOnScroll:    boolean;
}

/**
 * Entrance animation — NO ScrollTrigger.
 *
 * Trigger: IntersectionObserver (native, zero per-frame overhead).
 * ScrollTrigger fired on every Lenis RAF tick which caused scroll lag.
 * IntersectionObserver fires only on state-change (enter/leave).
 *
 * Performance:
 *   - will-change applied per-card in onStart (not all at once).
 *   - One master timeline, no per-image timelines.
 */
export function useEntranceAnimation(
  containerRef:  RefObject<HTMLElement | null>,
  entranceRefs:  RefObject<(HTMLElement | null)[]>,
  images:        ImageData[],
  preset:        AnimationPreset,
  opts:          EntranceOptions,
  isReduced:     boolean,
  shakeRef?:     RefObject<HTMLElement | null>,
): void {
  const resolvedPreset = useRef<AnimationPreset>('assemble');
  const hasPlayed      = useRef(false);

  useEffect(() => {
    if (!opts.enabled || !containerRef.current || images.length === 0) return;

    const container = containerRef.current;
    resolvedPreset.current = resolvePreset(preset, images.length);
    const activePreset = resolvedPreset.current;

    if (isReduced) {
      entranceRefs.current.forEach((el, i) => {
        if (el && images[i]) gsap.set(el, buildToVars(images[i]));
      });
      return;
    }

    const cw = container.offsetWidth;
    const ch = container.offsetHeight;

    const presetOpts: PresetOptions = {
      showRotation:  opts.showRotation,
      showBlur:      opts.showBlur,
      showScale:     opts.showScale,
      showFade:      opts.showFade,
      showOvershoot: opts.showOvershoot,
      showBounce:    opts.showBounce,
    };

    type Entry = {
      el:           HTMLElement;
      image:        ImageData;
      fromVars:     gsap.TweenVars;
      toVars:       gsap.TweenVars;
      ease:         string;
      duration:     number;
      staggerOrder: number;
    };

    const entries: Entry[] = [];
    entranceRefs.current.forEach((el, i) => {
      if (!el || !images[i]) return;
      const img    = images[i];
      const result = getPresetResult(activePreset, i, images.length, img, cw, ch, presetOpts);
      entries.push({
        el,
        image:        img,
        fromVars:     result.fromVars,
        toVars:       { ...buildToVars(img), ...(result.toOverrides ?? {}) },
        ease:         result.ease ?? 'power3.out',
        duration:     opts.animationDuration ?? result.duration ?? ENTRANCE_DURATION,
        staggerOrder: result.staggerOrder,
      });
    });
    if (!entries.length) return;

    entries.sort((a, b) => a.staggerOrder - b.staggerOrder);

    const stagger = opts.stagger ? opts.staggerAmount : 0;

    // No will-change here — applied per-card in onStart to avoid GPU spike.
    const applyHidden = () => {
      entries.forEach(({ el, fromVars }) => gsap.set(el, fromVars));
    };

    // ── Master timeline ─────────────────────────────────────────────────────
    const tl = gsap.timeline({ paused: true });

    entries.forEach(({ el, image, fromVars, toVars, ease, duration }, si) => {
      tl.fromTo(
        el,
        fromVars,
        {
          ...toVars,
          ease,
          duration,
          onStart() {
            gsap.set(el, { willChange: 'transform, opacity' });
          },
          onComplete() {
            gsap.set(el, { willChange: 'auto' });

            if (opts.showLandingJerk) {
              // Shake inner wrapper — never the section (Lenis owns its transform).
              const shakeEl = shakeRef?.current;
              if (shakeEl) {
                gsap.to(shakeEl, {
                  keyframes: [
                    { x: -3,   y: -2,   duration: 0.04, ease: 'none' },
                    { x:  2,   y:  1.5, duration: 0.05, ease: 'none' },
                    { x: -1.5, y: -1,   duration: 0.04, ease: 'none' },
                    { x:  1,   y:  0.5, duration: 0.04, ease: 'none' },
                    { x:  0,   y:  0,   duration: 0.05, ease: 'power1.out' },
                  ],
                });
              }

              entranceRefs.current.forEach((otherEl, j) => {
                if (!otherEl || otherEl === el || !images[j]) return;
                const finalRot = images[j].rotation ?? 0;
                const seed     = (j * 37 + (image.zIndex ?? 1)) % 10;
                const rAmp     = 1.5 + seed * 0.22;
                const yAmp     = 2   + seed * 0.5;
                const dir      = j % 2 === 0 ? 1 : -1;
                gsap.to(otherEl, {
                  keyframes: [
                    { rotation: finalRot + rAmp * dir,       y: -yAmp,        duration: 0.07, ease: 'power2.out' },
                    { rotation: finalRot - rAmp * dir * 0.4, y:  yAmp * 0.4,  duration: 0.09, ease: 'power2.in'  },
                    { rotation: finalRot,                    y:  0,            duration: 0.12, ease: 'power1.out' },
                  ],
                });
              });
            }
          },
        },
        si * stagger,
      );
    });

    // ── IntersectionObserver — replaces ScrollTrigger ───────────────────────
    // Convert "top N%" → rootMargin so intersection fires at the same visual
    // position without any ScrollTrigger overhead.
    const match  = opts.scrollStart.match(/top\s+(\d+(?:\.\d+)?)%/i);
    const offset = match ? 100 - parseFloat(match[1]) : 20; // default 20% from bottom
    const rootMargin = `0px 0px -${offset}% 0px`;

    applyHidden();
    hasPlayed.current = false;

    // Track rAF ID so we can cancel on cleanup.
    let rafId = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!opts.repeatOnScroll) {
            if (!hasPlayed.current) {
              hasPlayed.current = true;
              // Defer one rAF so the IO callback doesn't block the scroll
              // frame that triggered intersection.
              rafId = requestAnimationFrame(() => tl.play(0));
            }
          } else {
            rafId = requestAnimationFrame(() => {
              applyHidden();
              tl.restart(true);
            });
          }
        } else if (opts.repeatOnScroll) {
          cancelAnimationFrame(rafId);
          tl.pause(0);
          applyHidden();
        }
      },
      { threshold: 0, rootMargin },
    );

    observer.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      tl.kill();
      entries.forEach(({ el }) => gsap.set(el, { willChange: 'auto', clearProps: 'all' }));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opts.enabled, preset, images.length, isReduced,
    opts.showRotation, opts.showBlur, opts.showScale, opts.showFade,
    opts.showOvershoot, opts.showBounce, opts.stagger,
    opts.staggerAmount, opts.animationDuration, opts.showLandingJerk,
    opts.scrollStart, opts.repeatOnScroll,
  ]);
}
