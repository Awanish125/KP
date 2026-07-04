"use client";

/**
 * StatCounter — animated number + suffix + label, JSON-driven.
 * Counts up once when scrolled into view (IntersectionObserver, not
 * ScrollTrigger). Reduced motion → final value rendered immediately.
 * SSR renders the final value so the markup is meaningful without JS.
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
}: StatCounterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const num = numRef.current;
    if (!root || !num || prefersReducedMotion()) return;

    num.textContent = "0";
    const state = { val: 0 };
    let tween: gsap.core.Tween | null = null;

    const cancel = observeOnce(
      root,
      () => {
        tween = gsap.to(state, {
          val: value,
          duration,
          ease,
          onUpdate: () => {
            num.textContent = Math.round(state.val).toString();
          },
        });
      },
      rootMargin,
    );

    return () => {
      cancel();
      tween?.kill();
      num.textContent = value.toString();
    };
  }, [value, duration, ease, rootMargin]);

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
        <span ref={numRef}>{value}</span>
        <span style={{ color: "var(--kp-orange)" }}>{suffix}</span>
      </div>
      {label ? (
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
      ) : null}
    </div>
  );
}
