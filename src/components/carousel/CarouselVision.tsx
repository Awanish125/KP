"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";

interface DepthState {
  x: number;
  z: number;
  rotateY: number;
  scale: number;
  opacity: number;
  blur: number;
  zIndex: number;
}

// z / rotateY / scale / opacity / blur are fixed "depth" cues — they don't
// need to scale with card size. x (the lateral shift) is expressed as a
// ratio of the active card's own rendered width instead of a fixed pixel
// value, so the ~60-70%-visible overlap ratio holds true whether the active
// card is 50vw on desktop or 90vw on mobile.
const ACTIVE: DepthState = { x: 0, z: 0, rotateY: 0, scale: 1, opacity: 1, blur: 0, zIndex: 50 };
const NEAR = { xRatio: 0.62, z: -90, rotateY: 26, scale: 0.86, opacity: 0.85, blur: 1 };
const FAR = { xRatio: 0.98, z: -260, rotateY: 42, scale: 0.64, opacity: 0.4, blur: 3 };
const WINDOW = 2; // render active ± this many on each side

function targetFor(diff: number, baseWidth: number): DepthState {
  if (diff === 0) return ACTIVE;
  const sign = diff < 0 ? -1 : 1;
  const bucket = Math.abs(diff) === 1 ? NEAR : FAR;
  const zIndex = Math.abs(diff) === 1 ? 40 : 30;
  return {
    x: sign * bucket.xRatio * baseWidth,
    z: bucket.z,
    rotateY: -sign * bucket.rotateY,
    scale: bucket.scale,
    opacity: bucket.opacity,
    blur: bucket.blur,
    zIndex,
  };
}

// One step further than a bucket's own resting position, at zero opacity —
// used as the entry state for a slide that has just scrolled into the
// rendered window, so it fades in from slightly deeper instead of popping.
function enterStateFor(diff: number, baseWidth: number): DepthState {
  const t = targetFor(diff, baseWidth);
  return { ...t, x: t.x * 1.15, z: t.z * 1.15, opacity: 0 };
}

export interface CarouselVisionHandle {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

interface CarouselVisionProps {
  count: number;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  enableKeyboard?: boolean;
  enableSwipe?: boolean;
  enableMouseWheel?: boolean;
  className?: string;
  renderSlide: (index: number) => ReactNode;
}

/**
 * True 3D "coverflow" — a custom GSAP stage rather than Swiper's
 * EffectCoverflow. Swiper keeps every slide in normal flow (just rotated
 * and scaled in place), so neighbors sit *beside* the active slide instead
 * of receding behind it. Here every slide shares one absolutely-positioned
 * origin and GSAP alone controls x / z / rotateY / scale / opacity / blur,
 * tweened together on every index change (power4.out) so the whole rig
 * reads as one physical wheel turning, not slides swapping state.
 */
export const CarouselVision = forwardRef<CarouselVisionHandle, CarouselVisionProps>(function CarouselVision(
  { count, initialIndex = 0, onIndexChange, enableKeyboard = true, enableSwipe = true, enableMouseWheel = true, className, renderSlide },
  ref,
) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef(new Map<number, HTMLDivElement>());
  const wheelLockRef = useRef(false);
  const dragRef = useRef<{ startX: number; dragging: boolean } | null>(null);

  const goTo = useCallback(
    (index: number) => {
      const nextIndex = ((index % count) + count) % count;
      setActiveIndex(nextIndex);
      onIndexChange?.(nextIndex);
    },
    [count, onIndexChange],
  );
  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);
  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);

  useImperativeHandle(ref, () => ({ next, prev, goTo }), [next, prev, goTo]);

  const renderedIndices = useMemo(() => {
    const list: number[] = [];
    for (let d = -WINDOW; d <= WINDOW; d++) list.push(((activeIndex + d) % count + count) % count);
    return list;
  }, [activeIndex, count]);

  const getDiff = useCallback(
    (index: number) => {
      let diff = index - activeIndex;
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;
      return diff;
    },
    [activeIndex, count],
  );

  // `transform: scale()` doesn't affect layout, so every slide's own
  // offsetWidth reflects the same un-transformed CSS box size — safe to
  // measure from whichever slide happens to be mounted.
  const measureBaseWidth = useCallback(() => {
    const anyEl = slideRefs.current.values().next().value as HTMLDivElement | undefined;
    return anyEl?.offsetWidth ?? 320;
  }, []);

  // Reposition every rendered slide. `animate: false` snaps instantly
  // (used on resize, where a tween would look laggy).
  const layout = useCallback(
    (animate: boolean) => {
      const baseWidth = measureBaseWidth();
      renderedIndices.forEach((index) => {
        const el = slideRefs.current.get(index);
        if (!el) return;
        const target = targetFor(getDiff(index), baseWidth);
        const props = {
          x: target.x,
          z: target.z,
          rotateY: target.rotateY,
          scale: target.scale,
          opacity: target.opacity,
          filter: `blur(${target.blur}px)`,
          zIndex: target.zIndex,
        };
        if (animate) gsap.to(el, { ...props, duration: 0.75, ease: "power4.out" });
        else gsap.set(el, props);
      });
    },
    [renderedIndices, getDiff, measureBaseWidth],
  );

  // Animate every currently-rendered slide to its new target depth whenever
  // the active index changes.
  useEffect(() => {
    layout(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, count]);

  // Snap to the correct layout on viewport resize (card widths are
  // vw-based, so the ratio-driven x offsets need to be recalculated).
  useEffect(() => {
    const handleResize = () => layout(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [layout]);

  const registerSlide = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      if (!el) {
        slideRefs.current.delete(index);
        return;
      }
      const isNew = !slideRefs.current.has(index);
      slideRefs.current.set(index, el);
      if (isNew) {
        const baseWidth = el.offsetWidth || measureBaseWidth();
        const enter = enterStateFor(getDiff(index), baseWidth);
        gsap.set(el, {
          position: "absolute",
          left: "50%",
          top: "50%",
          xPercent: -50,
          yPercent: -50,
          transformPerspective: 1600,
          x: enter.x,
          z: enter.z,
          rotateY: enter.rotateY,
          scale: enter.scale,
          opacity: enter.opacity,
          filter: `blur(${enter.blur}px)`,
          zIndex: enter.zIndex,
        });
      }
    },
    [getDiff, measureBaseWidth],
  );

  // Keyboard
  useEffect(() => {
    if (!enableKeyboard) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enableKeyboard, next, prev]);

  // Mouse wheel — horizontal or vertical gesture, cooldown to avoid
  // triggering multiple slide changes per physical scroll gesture.
  useEffect(() => {
    if (!enableMouseWheel) return;
    const stage = stageRef.current;
    if (!stage) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLockRef.current) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 12) return;
      wheelLockRef.current = true;
      if (delta > 0) next();
      else prev();
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 500);
    };
    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [enableMouseWheel, next, prev]);

  // Swipe / drag
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!enableSwipe) return;
    dragRef.current = { startX: e.clientX, dragging: true };
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!enableSwipe || !dragRef.current?.dragging) return;
    const delta = e.clientX - dragRef.current.startX;
    dragRef.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) next();
    else prev();
  };

  return (
    <div
      ref={stageRef}
      className={className}
      style={{ position: "relative", perspective: 1600 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
        {renderedIndices.map((index) => (
          <div
            key={index}
            ref={(el) => registerSlide(index, el)}
            className="h-full w-[90vw] max-w-[760px] cursor-pointer sm:w-[75vw] md:w-[60vw] lg:w-[50vw]"
            onClick={() => index !== activeIndex && goTo(index)}
          >
            {renderSlide(index)}
          </div>
        ))}
      </div>
    </div>
  );
});
