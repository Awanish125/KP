import { RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ImageData, AnimationPreset } from '../types';
import { ENTRANCE_DURATION, ENTRANCE_STAGGER } from '../constants';
import {
  getPresetResult,
  buildToVars,
  resolvePreset,
  type PresetOptions,
} from '../utils/presetAnimations';

export interface EntranceOptions extends PresetOptions {
  enabled:        boolean;
  stagger:        boolean;
  staggerAmount:  number;
  scrollStart:    string;
  repeatOnScroll: boolean;
}

/**
 * ONE master GSAP timeline + ONE ScrollTrigger for the entire image set.
 *
 * Performance:
 *   - will-change is applied just before play() and removed on complete.
 *   - fromTo keeps "to" state explicit so repeatOnScroll restarts cleanly.
 *   - No individual timelines or triggers per image.
 */
export function useEntranceAnimation(
  containerRef:  RefObject<HTMLElement | null>,
  entranceRefs:  RefObject<(HTMLElement | null)[]>,
  images:        ImageData[],
  preset:        AnimationPreset,
  opts:          EntranceOptions,
  isReduced:     boolean,
): void {
  const resolvedPreset = useRef<AnimationPreset>('assemble');

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
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

    // ── Build entries sorted by stagger order ─────────────────────────────────
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
        ease:         result.ease     ?? 'power3.out',
        duration:     result.duration ?? ENTRANCE_DURATION,
        staggerOrder: result.staggerOrder,
      });
    });
    if (!entries.length) return;

    entries.sort((a, b) => a.staggerOrder - b.staggerOrder);

    const stagger = opts.stagger ? opts.staggerAmount : 0;

    // ── Apply hidden state to every image ─────────────────────────────────────
    const applyHidden = () => {
      entries.forEach(({ el, fromVars }) => {
        gsap.set(el, { ...fromVars, willChange: 'transform, opacity' });
      });
    };

    // ── Master timeline ───────────────────────────────────────────────────────
    const tl = gsap.timeline({ paused: true });

    entries.forEach(({ el, fromVars, toVars, ease, duration }, si) => {
      tl.fromTo(
        el,
        fromVars,
        {
          ...toVars,
          ease,
          duration,
          onComplete() {
            // Remove will-change after each image settles to free compositor layer.
            gsap.set(el, { willChange: 'auto' });
          },
        },
        si * stagger,
      );
    });

    // ── ScrollTrigger ─────────────────────────────────────────────────────────
    applyHidden();

    let st: ScrollTrigger;

    if (!opts.repeatOnScroll) {
      st = ScrollTrigger.create({
        trigger: container,
        start:   opts.scrollStart,
        once:    true,
        onEnter: () => tl.play(0),
      });
    } else {
      const play  = () => { applyHidden(); tl.restart(true); };
      const reset = () => { tl.pause(0);  applyHidden(); };
      st = ScrollTrigger.create({
        trigger:     container,
        start:       opts.scrollStart,
        onEnter:     play,
        onLeave:     reset,
        onEnterBack: play,
        onLeaveBack: reset,
      });
    }

    return () => {
      tl.kill();
      st?.kill();
      entries.forEach(({ el }) => gsap.set(el, { willChange: 'auto', clearProps: 'all' }));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opts.enabled, preset, images.length, isReduced,
    opts.showRotation, opts.showBlur, opts.showScale, opts.showFade,
    opts.showOvershoot, opts.showBounce, opts.stagger,
    opts.staggerAmount, opts.scrollStart, opts.repeatOnScroll,
  ]);
}
