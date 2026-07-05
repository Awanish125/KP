"use client";

/**
 * MagneticButton — wraps any element so it pulls toward the cursor while
 * hovered and snaps back with an elastic release. Pairs with CustomCursor.
 *
 * Perf contract:
 *  - No ticker: gsap.quickTo tweens fire only on pointermove over the
 *    element itself (zero cost when not hovered).
 *  - will-change set on enter, cleared after the release tween.
 *  - Fine pointers only; reduced motion → plain wrapper.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { MAGNETIC_BUTTON_DEFAULTS } from "./magneticButtonConfig";
import type { MagneticButtonProps } from "./magneticButtonTypes";

export function MagneticButton({
  children,
  className,
  style,
  strength = MAGNETIC_BUTTON_DEFAULTS.strength,
  innerStrength = MAGNETIC_BUTTON_DEFAULTS.innerStrength,
  duration = MAGNETIC_BUTTON_DEFAULTS.duration,
}: MagneticButtonProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!shell || !inner) return;
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;

    const toX = gsap.quickTo(shell, "x", { duration, ease: "power3.out" });
    const toY = gsap.quickTo(shell, "y", { duration, ease: "power3.out" });
    const toIX = gsap.quickTo(inner, "x", { duration: duration * 1.2, ease: "power3.out" });
    const toIY = gsap.quickTo(inner, "y", { duration: duration * 1.2, ease: "power3.out" });

    const onEnter = () => {
      shell.style.willChange = "transform";
      inner.style.willChange = "transform";
    };

    const onMove = (e: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      toX(dx * strength);
      toY(dy * strength);
      toIX(dx * innerStrength);
      toIY(dy * innerStrength);
    };

    const onLeave = () => {
      gsap.to([shell, inner], {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.45)",
        onComplete: () => {
          shell.style.willChange = "auto";
          inner.style.willChange = "auto";
        },
      });
    };

    shell.addEventListener("pointerenter", onEnter);
    shell.addEventListener("pointermove", onMove);
    shell.addEventListener("pointerleave", onLeave);
    return () => {
      shell.removeEventListener("pointerenter", onEnter);
      shell.removeEventListener("pointermove", onMove);
      shell.removeEventListener("pointerleave", onLeave);
      gsap.set([shell, inner], { clearProps: "transform,willChange" });
    };
  }, [strength, innerStrength, duration]);

  return (
    <div ref={shellRef} className={className} style={{ display: "inline-block", ...style }}>
      <div ref={innerRef} style={{ display: "inline-block" }}>
        {children}
      </div>
    </div>
  );
}
