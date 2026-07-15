"use client";

/**
 * StatCounter — animated number + suffix + label, JSON-driven.
 *
 * Default mode: counts up once when scrolled into view.
 * Odometer mode (`odometer` prop): digits roll into place like a mechanical
 * counter — one 0–9 strip per digit, each strip scrolls to its target
 * position with a staggered cascade (Atlas Brut `.odo` effect).
 *
 * Reduced motion → final value rendered immediately in both modes.
 * SSR renders the final value so markup is meaningful without JS.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { observeOnce, prefersReducedMotion } from "@/lib/motion";
import { STAT_COUNTER_DEFAULTS } from "./statCounterConfig";
import type { StatCounterProps } from "./statCounterTypes";

export function StatCounter({
  value,
  suffix = "",
  label,
  className,
  style,
  numberClassName,
  labelClassName,
  duration = STAT_COUNTER_DEFAULTS.duration,
  ease = STAT_COUNTER_DEFAULTS.ease,
  rootMargin = STAT_COUNTER_DEFAULTS.rootMargin,
  odometer = false,
}: StatCounterProps) {
  const rootRef  = useRef<HTMLDivElement>(null);
  const numRef   = useRef<HTMLSpanElement>(null);
  const odoRef   = useRef<HTMLSpanElement>(null);

  /* ── Standard count-up mode ───────────────────────────────────────────── */
  useEffect(() => {
    if (odometer) return;
    const root = rootRef.current;
    const num  = numRef.current;
    if (!root || !num || prefersReducedMotion()) return;

    num.textContent = "0";
    const state = { val: 0 };
    let tween: gsap.core.Tween | null = null;

    const cancel = observeOnce(root, () => {
      tween = gsap.to(state, {
        val: value,
        duration,
        ease,
        onUpdate: () => {
          num.textContent = Math.round(state.val).toString();
        },
      });
    }, rootMargin);

    return () => {
      cancel();
      tween?.kill();
      num.textContent = value.toString();
    };
  }, [value, duration, ease, rootMargin, odometer]);

  /* ── Odometer mode ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!odometer) return;
    const root = rootRef.current;
    const wrap = odoRef.current;
    if (!root || !wrap || prefersReducedMotion()) return;

    const digits = String(value).split("");

    // Build digit columns imperatively — each column has a 0–9 strip
    wrap.innerHTML = "";

    const strips: HTMLSpanElement[] = digits.map((d) => {
      const col   = document.createElement("span");
      col.className = "kp-odo-col";

      const strip = document.createElement("span");
      strip.className = "kp-odo-strip";

      for (let n = 0; n <= 9; n++) {
        const cell = document.createElement("span");
        cell.className = "kp-odo-cell";
        cell.textContent = String(n);
        strip.appendChild(cell);
      }
      col.appendChild(strip);
      wrap.appendChild(col);
      return strip;
    });

    let rolled = false;

    const cancel = observeOnce(root, () => {
      if (rolled) return;
      rolled = true;
      strips.forEach((strip, i) => {
        const digit = parseInt(digits[i], 10);
        // Each digit cell is 1em → strip is 10em; digit * 10% moves to that digit
        gsap.fromTo(
          strip,
          { yPercent: 0 },
          {
            yPercent: -(digit * 10),
            duration: 1.6,
            delay: i * 0.13,
            ease: "expo.out",
          },
        );
      });
    }, rootMargin);

    return () => {
      cancel();
      wrap.innerHTML = "";
    };
  }, [value, odometer, rootMargin]);

  return (
    <div ref={rootRef} className={className} style={style}>
      <div
        className={numberClassName}
        style={{
          fontFamily: "var(--kp-font-display)",
          color: "var(--text)",
          lineHeight: 1,
        }}
      >
        {odometer ? (
          /* Odometer: JS-built digit strips + suffix */
          <span style={{ display: "inline-flex", alignItems: "flex-end", overflow: "hidden" }}>
            <span
              ref={odoRef}
              className="kp-odo"
              style={{ display: "inline-flex" }}
              aria-label={String(value)}
            >
              {/* Populated imperatively by useEffect */}
              {String(value)}
            </span>
            {suffix && (
              <span style={{ color: "var(--kp-orange)" }}>{suffix}</span>
            )}
          </span>
        ) : (
          /* Standard count-up */
          <>
            <span ref={numRef}>{value}</span>
            <span style={{ color: "var(--kp-orange)" }}>{suffix}</span>
          </>
        )}
      </div>

      {label && (
        <div
          className={labelClassName}
          style={{
            fontFamily: "var(--kp-font-mono)",
            fontSize: "var(--text-label)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginTop: "0.5rem",
          }}
        >
          {label}
        </div>
      )}

      {/* Odometer styles — scoped via unique class prefix */}
      {odometer && (
        <style>{`
          .kp-odo {
            display: inline-flex;
            overflow: hidden;
          }
          .kp-odo-col {
            display: inline-block;
            overflow: hidden;
            height: 1em;
            vertical-align: bottom;
          }
          .kp-odo-strip {
            display: flex;
            flex-direction: column;
          }
          .kp-odo-cell {
            display: block;
            height: 1em;
            line-height: 1;
          }
        `}</style>
      )}
    </div>
  );
}
