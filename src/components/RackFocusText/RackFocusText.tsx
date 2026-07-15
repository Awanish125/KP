"use client";

/**
 * RackFocusText — Atlas Brut epilogue inscription effect.
 *
 * Every word starts as a faint, blurred ghost (opacity 0.12, blur 7px, y +8px).
 * A wave of focus rolls through the sentence as you scroll — words sharpen
 * left→right, the reading act itself driving the reveal.
 *
 * Scroll range: top of element hits `startVH` (default 78%) → bottom hits `endVH` (42%).
 * Wave params mirror Atlas Brut: duration 1.4, stagger 0.35 (both normalized to 0–1).
 *
 * No ScrollTrigger — uses tickWhileVisible (GSAP ticker + IntersectionObserver).
 * SSR renders real text at full opacity; JS re-dims to ghost state on mount.
 */

import { useEffect, useRef } from "react";
import { tickWhileVisible, prefersReducedMotion } from "@/lib/motion";

type Tag = "p" | "div" | "blockquote" | "span";

interface RackFocusTextProps {
  text: string;
  as?: Tag;
  className?: string;
  style?: React.CSSProperties;
  /** Viewport fraction where scroll wave starts (top of el). Default 0.78 */
  startVH?: number;
  /** Viewport fraction where scroll wave ends (bottom of el). Default 0.42 */
  endVH?: number;
  /** Per-word animation duration in normalized time. Default 1.4 */
  wordDuration?: number;
  /** Per-word stagger in normalized time. Default 0.35 */
  stagger?: number;
}

export function RackFocusText({
  text,
  as: Tag = "p",
  className,
  style,
  startVH  = 0.78,
  endVH    = 0.42,
  wordDuration = 1.4,
  stagger  = 0.35,
}: RackFocusTextProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    // Collect word spans rendered into the DOM
    const words = Array.from(root.querySelectorAll<HTMLSpanElement>(".kp-rft-w"));
    if (!words.length) return;

    const N = words.length;
    const total = (N - 1) * stagger + wordDuration;

    // Ghost state — applied once on mount so SSR text is never flashed dim
    words.forEach((w) => {
      w.style.opacity     = "0.12";
      w.style.filter      = "blur(7px)";
      w.style.display     = "inline-block"; // needed for transform
      w.style.transform   = "translateY(8px)";
      w.style.willChange  = "opacity, filter, transform";
    });

    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));

    const tick = () => {
      const rect = root.getBoundingClientRect();
      const vh   = window.innerHeight;
      const elH  = rect.height;

      // p = 0 when top hits startVH, p = 1 when bottom hits endVH
      const rangeTotal = elH + (startVH - endVH) * vh;
      const scrolled   = startVH * vh - rect.top;
      const p          = clamp(scrolled / rangeTotal, 0, 1);

      words.forEach((w, i) => {
        const pStart  = (i * stagger) / total;
        const pEnd    = pStart + wordDuration / total;
        const wordP   = clamp((p - pStart) / (pEnd - pStart), 0, 1);

        w.style.opacity   = String(0.12 + 0.88 * wordP);
        w.style.filter    = `blur(${7 * (1 - wordP)}px)`;
        w.style.transform = `translateY(${8 * (1 - wordP)}px)`;
      });
    };

    const cleanup = tickWhileVisible(root, tick, {
      onLeave: () => {
        // clear will-change when off screen
        words.forEach((w) => { w.style.willChange = "auto"; });
      },
      onEnter: () => {
        words.forEach((w) => { w.style.willChange = "opacity, filter, transform"; });
      },
    });

    return () => {
      cleanup();
      words.forEach((w) => {
        w.style.willChange = "auto";
      });
    };
  }, [text, startVH, endVH, wordDuration, stagger]);

  // Split text into word spans. SSR renders real text — no flash.
  const wordSpans = text.split(/(\s+)/).map((chunk, i) =>
    /^\s+$/.test(chunk)
      ? chunk
      : <span key={i} className="kp-rft-w">{chunk}</span>
  );

  return (
    <div ref={rootRef}>
      <Tag className={className} style={style}>
        {wordSpans}
      </Tag>
    </div>
  );
}
