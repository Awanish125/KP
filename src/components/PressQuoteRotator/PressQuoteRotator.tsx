"use client";

/**
 * PressQuoteRotator — Atlas Brut press section effect.
 *
 * Quotes swap on a timer (default 4.5 s), but ONLY while the section is
 * visible (IntersectionObserver gates the interval — no wasted timers
 * running off-screen). Atlas Brut swap sequence:
 *   1. Old quote slides up + fades out (y: −14, duration 0.45)
 *   2. New quote rises in from below  (y: +22 → 0, duration 0.75)
 * The two tweens are strictly sequential (no overlap) so text blocks
 * never collide on screen.
 *
 * Usage:
 *   <PressQuoteRotator items={[{ quote: "...", source: "— BRAND" }, …]} />
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

export interface PressQuoteItem {
  quote: string;
  source: string;
}

interface PressQuoteRotatorProps {
  items: PressQuoteItem[];
  /** Rotation interval in ms. Default 4500 */
  interval?: number;
  className?: string;
}

export function PressQuoteRotator({
  items,
  interval = 4500,
  className,
}: PressQuoteRotatorProps) {
  const rootRef  = useRef<HTMLDivElement>(null);
  const idxRef   = useRef<HTMLSpanElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || items.length < 2 || prefersReducedMotion()) return;

    const els   = itemsRef.current.filter(Boolean);
    let current = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    // Set initial state: first visible, rest hidden
    gsap.set(els[0], { autoAlpha: 1, y: 0 });
    els.slice(1).forEach((el) => gsap.set(el, { autoAlpha: 0, y: 22 }));

    const swap = () => {
      const prev = els[current];
      current    = (current + 1) % els.length;
      const next = els[current];

      if (idxRef.current) {
        idxRef.current.textContent = String(current + 1).padStart(2, "0");
      }

      gsap.timeline()
        .to(prev, { autoAlpha: 0, y: -14, duration: 0.45, ease: "power2.in" })
        .fromTo(
          next,
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 0.75, ease: "expo.out" },
          "+=0.08",
        );
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !timer) {
          timer = setInterval(swap, interval);
        } else if (!e.isIntersecting && timer) {
          clearInterval(timer);
          timer = null;
        }
      },
      { threshold: 0.2 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [items, interval]);

  return (
    <div ref={rootRef} className={`kp-pqr ${className ?? ""}`}>
      {/* Quote stack — all items positioned absolutely over each other */}
      <div className="kp-pqr-stage">
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => { if (el) itemsRef.current[i] = el; }}
            className="kp-pqr-item"
            aria-hidden={i !== 0}
          >
            <p className="kp-pqr-quote">&ldquo;{item.quote}&rdquo;</p>
            <cite className="kp-pqr-source">{item.source}</cite>
          </div>
        ))}
      </div>

      {/* Index counter */}
      <div className="kp-pqr-index" aria-hidden>
        <span ref={idxRef}>01</span>
        <span className="kp-pqr-total"> / {String(items.length).padStart(2, "0")}</span>
      </div>

      <style>{`
        .kp-pqr { position: relative; }

        .kp-pqr-stage {
          position: relative;
          min-height: 8rem;
        }

        .kp-pqr-item {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        /* First item is relative so it sets the natural height */
        .kp-pqr-item:first-child {
          position: relative;
        }

        .kp-pqr-quote {
          font-family: var(--kp-font-display, sans-serif);
          font-weight: 700;
          font-size: clamp(1.4rem, 3vw, 2.4rem);
          line-height: 1.1;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          color: var(--text);
          margin: 0;
        }

        .kp-pqr-source {
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--kp-orange, #F5821F);
          font-style: normal;
        }

        .kp-pqr-index {
          margin-top: 2.5rem;
          font-family: var(--kp-font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .kp-pqr-total { opacity: 0.5; }

        @media (prefers-reduced-motion: reduce) {
          .kp-pqr-item { position: relative; visibility: visible !important; opacity: 1 !important; }
          .kp-pqr-item + .kp-pqr-item { display: none; }
        }
      `}</style>
    </div>
  );
}
