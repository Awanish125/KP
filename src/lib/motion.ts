/**
 * Shared motion utilities for KP animation components.
 *
 * Hard rules these helpers exist to enforce (see project scroll-perf rules):
 *  - Trigger animations with IntersectionObserver, never ScrollTrigger.
 *  - Per-frame work runs on gsap.ticker only, and only while visible.
 *  - `will-change` is set just before animating and cleared after.
 *  - Everything respects prefers-reduced-motion.
 */

import gsap from "gsap";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fire `onEnter` the first time `el` crosses into view, then disconnect.
 * `rootMargin` default triggers when the element is ~18% up from the
 * bottom edge — the IO equivalent of ScrollTrigger's "top 82%".
 */
export function observeOnce(
  el: Element,
  onEnter: () => void,
  rootMargin = "0px 0px -18% 0px",
): () => void {
  const obs = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        obs.disconnect();
        onEnter();
      }
    },
    { rootMargin, threshold: 0 },
  );
  obs.observe(el);
  return () => obs.disconnect();
}

/**
 * Run a gsap.ticker callback only while `el` is on screen.
 * Adds the callback on IO enter, removes it on leave — per-frame cost is
 * zero when the section isn't visible. Returns a full cleanup function.
 */
export function tickWhileVisible(
  el: Element,
  onTick: () => void,
  options?: { onEnter?: () => void; onLeave?: () => void },
): () => void {
  let active = false;
  const obs = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !active) {
        active = true;
        options?.onEnter?.();
        gsap.ticker.add(onTick);
      } else if (!entry.isIntersecting && active) {
        active = false;
        gsap.ticker.remove(onTick);
        options?.onLeave?.();
      }
    },
    { threshold: 0 },
  );
  obs.observe(el);
  return () => {
    obs.disconnect();
    if (active) gsap.ticker.remove(onTick);
  };
}

/** Set will-change right before a tween and clear it when done. */
export function withWillChange(
  targets: Element | Element[],
  props: string,
): { onStart: () => void; onComplete: () => void } {
  const list = Array.isArray(targets) ? targets : [targets];
  return {
    onStart: () => list.forEach((t) => ((t as HTMLElement).style.willChange = props)),
    onComplete: () => list.forEach((t) => ((t as HTMLElement).style.willChange = "auto")),
  };
}
