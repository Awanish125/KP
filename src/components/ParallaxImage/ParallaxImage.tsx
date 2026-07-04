"use client";

/**
 * ParallaxImage — next/image with GSAP scroll parallax.
 *
 * Perf contract:
 *  - Per-frame work runs on gsap.ticker ONLY while the frame is on screen
 *    (tickWhileVisible adds/removes the ticker via IntersectionObserver).
 *  - No scroll listeners, no ScrollTrigger — position derives from
 *    getBoundingClientRect of one element per tick.
 *  - will-change applied on IO enter, cleared on leave.
 *  - Reduced motion → plain static image.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import { PARALLAX_IMAGE_DEFAULTS } from "./parallaxImageConfig";
import type { ParallaxImageProps } from "./parallaxImageTypes";

export function ParallaxImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  style,
  aspectRatio = "16 / 10",
  borderRadius = "1rem",
  amplitude = PARALLAX_IMAGE_DEFAULTS.amplitude,
  lerp = PARALLAX_IMAGE_DEFAULTS.lerp,
  overscan = PARALLAX_IMAGE_DEFAULTS.overscan,
}: ParallaxImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner || prefersReducedMotion()) return;

    const setY = gsap.quickSetter(inner, "y", "px");
    let current = 0;

    const tick = () => {
      const rect = frame.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1 (frame below viewport) → +1 (frame above viewport)
      const progress = 1 - (2 * (rect.top + rect.height / 2)) / (vh + rect.height);
      const target = progress * amplitude * rect.height;
      current += (target - current) * lerp;
      setY(current);
    };

    const cleanup = tickWhileVisible(frame, tick, {
      onEnter: () => {
        inner.style.willChange = "transform";
      },
      onLeave: () => {
        inner.style.willChange = "auto";
      },
    });

    return () => {
      cleanup();
      inner.style.willChange = "auto";
      gsap.set(inner, { clearProps: "transform" });
    };
  }, [amplitude, lerp]);

  return (
    <div
      ref={frameRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio,
        borderRadius,
        ...style,
      }}
    >
      <div
        ref={innerRef}
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${overscan})`,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ objectFit: "cover" }}
        />
      </div>
    </div>
  );
}
