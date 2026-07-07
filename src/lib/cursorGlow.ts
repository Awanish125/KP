import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * onSpotMove / onSpotLeave — per-card cursor spotlight, cheaper than
 * attachCursorGlow: no ref/effect, rect is cached on the element and
 * cleared on leave. Pair with a .kp-card-glow span/div (see globals.css)
 * using --spot-x / --spot-y.
 */
export function onSpotMove(e: ReactPointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  let rect = (el as unknown as { __rect?: DOMRect }).__rect;
  if (!rect) {
    rect = el.getBoundingClientRect();
    (el as unknown as { __rect?: DOMRect }).__rect = rect;
  }
  el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
}

export function onSpotLeave(e: ReactPointerEvent<HTMLElement>) {
  delete (e.currentTarget as unknown as { __rect?: DOMRect }).__rect;
}

/**
 * attachCursorGlow — tracks the pointer across a section element and updates
 * two CSS custom properties (--glow-x, --glow-y) + --glow-opacity on it.
 *
 * Pair with a .kp-glow-layer <div> inside the section (see globals.css).
 * Only activates on fine-pointer devices and respects prefers-reduced-motion.
 * getBoundingClientRect is called on pointermove (event-driven, not per-frame).
 */
export function attachCursorGlow(el: HTMLElement): () => void {
  if (typeof window === "undefined") return () => {};
  if (!window.matchMedia("(pointer: fine)").matches) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const onMove = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--glow-opacity", "1");
  };

  const onLeave = () => {
    el.style.setProperty("--glow-opacity", "0");
  };

  el.addEventListener("pointermove", onMove, { passive: true });
  el.addEventListener("pointerleave", onLeave, { passive: true });

  return () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
  };
}
