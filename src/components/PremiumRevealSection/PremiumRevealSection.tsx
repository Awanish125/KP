"use client";

/**
 * PremiumRevealSection
 *
 * Performance contract:
 *   - React.memo: no re-render unless images/props change.
 *   - ONE ScrollTrigger (parallax) + ONE ScrollTrigger (entrance).
 *   - Floating tweens start PAUSED; IntersectionObserver gates them.
 *   - Float starts AFTER entrance completes (no two heavy animations together).
 *   - will-change added before entrance, cleared per-image on complete.
 *   - floatRef has permanent will-change:transform (promoted once, never re-promoted).
 *   - No box-shadow on the img itself (shadows are expensive compositor paint).
 *   - Only GPU-compositable properties: transform, opacity.
 *   - Pass images as a module-level or useMemo ref in the parent to keep the
 *     reference stable and avoid hook re-runs on every render.
 */

import React, { useRef, useMemo } from 'react';
import type { PremiumRevealSectionProps } from './types';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useEntranceAnimation } from './animations/useEntranceAnimation';
import { useFloatingAnimation } from './animations/useFloatingAnimation';
import { useMouseParallax } from './animations/useMouseParallax';
import { useScrollParallax } from './animations/useScrollParallax';
import { ENTRANCE_DURATION, ENTRANCE_STAGGER, FLOAT_ENTRANCE_BUFFER } from './constants';
import { totalEntranceDuration } from './utils/presetAnimations';

// ── Noise SVG (feTurbulence) ──────────────────────────────────────────────────
const NOISE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E";

function PremiumRevealSectionInner({
  images = [],
  children,
  className,
  minHeight = '100vh',

  animationEnabled       = true,
  animationStyle         = 'assemble',
  repeatOnScroll         = false,
  scrollStart            = 'top 80%',
  scrollEnd              = 'bottom top',

  showEntranceAnimation  = true,
  showBlurEffect         = true,
  showScaleAnimation     = true,
  showFadeAnimation      = true,
  showRotation           = true,
  showStaggerAnimation   = true,
  showOvershoot          = false,
  showBounceEffect       = false,
  staggerAmount          = ENTRANCE_STAGGER,

  showFloatingAnimation  = true,
  showMouseParallax      = true,
  showScrollParallax     = true,
  showDepthEffect        = true,
  showHoverInteraction   = true,

  showGlow               = false,
  showPerspective        = false,
  showBackgroundGradient = false,
  showNoiseTexture       = false,

  backgroundColorClass,
  backgroundGradientClass,
}: PremiumRevealSectionProps) {
  const isReduced = useReducedMotion();
  const master    = animationEnabled && !isReduced;
  const hasImages = images.length > 0;

  // cameraZoom preset is declared to need perspective in the component JSX.
  const needsPerspective = showPerspective || animationStyle === 'cameraZoom';

  const containerRef  = useRef<HTMLDivElement>(null);

  // Four layers per image — each hook owns exactly one.
  const scrollRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const entranceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const floatRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRefs    = useRef<(HTMLDivElement | null)[]>([]);

  // ── Entrance ─────────────────────────────────────────────────────────────────
  const entranceOpts = useMemo(() => ({
    enabled:        master && showEntranceAnimation,
    showRotation,
    showBlur:       showBlurEffect,
    showScale:      showScaleAnimation,
    showFade:       showFadeAnimation,
    showOvershoot,
    showBounce:     showBounceEffect,
    stagger:        showStaggerAnimation,
    staggerAmount,
    scrollStart,
    repeatOnScroll,
  }), [
    master, showEntranceAnimation, showRotation, showBlurEffect,
    showScaleAnimation, showFadeAnimation, showOvershoot, showBounceEffect,
    showStaggerAnimation, staggerAmount, scrollStart, repeatOnScroll,
  ]);

  useEntranceAnimation(containerRef, entranceRefs, images, animationStyle, entranceOpts, isReduced);

  // ── Floating — starts AFTER entrance completes to avoid competing animations ─
  const floatStartDelay = useMemo(() => {
    if (!master || !showEntranceAnimation) return 0;
    return totalEntranceDuration(images.length, staggerAmount, ENTRANCE_DURATION) + FLOAT_ENTRANCE_BUFFER;
  }, [master, showEntranceAnimation, images.length, staggerAmount]);

  const floatOpts = useMemo(
    () => ({ enabled: master && showFloatingAnimation, showDepth: showDepthEffect, startDelay: floatStartDelay }),
    [master, showFloatingAnimation, showDepthEffect, floatStartDelay],
  );
  useFloatingAnimation(containerRef, floatRefs, images, floatOpts, isReduced);

  // ── Mouse parallax ───────────────────────────────────────────────────────────
  const mouseOpts = useMemo(
    () => ({ enabled: master && showMouseParallax, showDepth: showDepthEffect }),
    [master, showMouseParallax, showDepthEffect],
  );
  useMouseParallax(containerRef, mouseRefs, images, mouseOpts, isReduced);

  // ── Scroll parallax ──────────────────────────────────────────────────────────
  const scrollOpts = useMemo(
    () => ({ enabled: master && showScrollParallax, showDepth: showDepthEffect, scrollStart, scrollEnd }),
    [master, showScrollParallax, showDepthEffect, scrollStart, scrollEnd],
  );
  useScrollParallax(containerRef, scrollRefs, images, scrollOpts, isReduced);

  // ── Section class ─────────────────────────────────────────────────────────────
  const sectionClass = [
    'relative overflow-hidden',
    backgroundColorClass   ?? '',
    backgroundGradientClass ?? '',
    className              ?? '',
  ].filter(Boolean).join(' ');

  return (
    <section
      ref={containerRef}
      className={sectionClass}
      style={{
        minHeight,
        ...(needsPerspective
          ? { perspective: '1100px', perspectiveOrigin: '50% 40%' }
          : {}),
      }}
    >
      {/* ── Built-in radial gradient (only when no custom gradient class given) ── */}
      {showBackgroundGradient && !backgroundGradientClass && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 18% 28%, rgba(111,91,255,0.09) 0%, transparent 65%),' +
              'radial-gradient(ellipse 60% 50% at 82% 72%, rgba(241,107,87,0.08) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Decorative image layer ─────────────────────────────────────────── */}
      {hasImages && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}       // explicitly below children (z-10)
          aria-hidden="true"
        >
          {images.map((img, i) => (
            <div
              key={i}
              // Layer 1 — CSS position + scroll-parallax target
              ref={el => { scrollRefs.current[i] = el; }}
              style={{ position: 'absolute', left: img.x, top: img.y, width: img.width, zIndex: img.zIndex ?? 1 }}
            >
              {/* Layer 2 — entrance animation (x / y / scale / opacity / rotation / filter) */}
              <div ref={el => { entranceRefs.current[i] = el; }}>

                {/* Layer 3 — floating (y, x).
                    Permanent will-change:transform promotes this element to its
                    own compositor layer once at mount so floating never triggers
                    a full repaint cycle. */}
                <div
                  ref={el => { floatRefs.current[i] = el; }}
                  style={{ willChange: 'transform' }}
                >
                  {/* Layer 4 — mouse parallax (x, y) */}
                  <div
                    ref={el => { mouseRefs.current[i] = el; }}
                    className={showHoverInteraction ? 'group' : ''}
                  >
                    {/* Glow halo — rendered behind via negative z-index */}
                    {showGlow && (
                      <div
                        className="absolute inset-0 -z-10 rounded-2xl opacity-40 blur-2xl scale-[1.4]"
                        style={{
                          background: img.glowColor ??
                            'radial-gradient(circle, rgba(255,160,80,0.7) 0%, transparent 70%)',
                        }}
                      />
                    )}

                    <img
                      src={img.src}
                      alt={img.alt ?? ''}
                      width={img.width}
                      draggable={false}
                      decoding="async"
                      className={[
                        // No shadow-2xl here — box-shadow is expensive compositor paint.
                        // A shadow-md keeps the look without the perf cost.
                        'w-full h-auto block rounded-xl object-cover select-none',
                        'shadow-[0_8px_30px_rgba(0,0,0,0.18)]',
                        showHoverInteraction
                          ? 'transition-transform duration-300 ease-out group-hover:-translate-y-1.5'
                          : '',
                      ].filter(Boolean).join(' ')}
                      // Reduced-motion: static rotation only, no GSAP.
                      style={isReduced ? { transform: `rotate(${img.rotation ?? 0}deg)` } : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Noise overlay ─────────────────────────────────────────────────── */}
      {showNoiseTexture && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
          style={{ backgroundImage: `url("${NOISE_URL}")`, backgroundRepeat: 'repeat' }}
          aria-hidden="true"
        />
      )}

      {/* ── Content — always above the image layer ─────────────────────── */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export const PremiumRevealSection = React.memo(PremiumRevealSectionInner);
