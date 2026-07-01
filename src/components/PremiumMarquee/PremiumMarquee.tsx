'use client';

import React, { useRef, useCallback } from 'react';
import Marquee from 'react-fast-marquee';

import { MarqueeItem, type MarqueeItemData } from './MarqueeItem';
import { MarqueeSkeleton }                    from './MarqueeSkeleton';
import { useScrollSpeed }                     from './animations/useScrollSpeed';
import { useMouseParallax }                   from './animations/useMouseParallax';
import { useCenterHighlight }                 from './animations/useCenterHighlight';
import { useVelocityEffects }                 from './animations/useVelocityEffects';
import { useMouseRipple }                     from './animations/useMouseRipple';
import { useEntranceAnimation }               from './animations/useEntranceAnimation';
import { useReducedMotion }                   from './hooks/useReducedMotion';
import { useIntersection }                    from './hooks/useIntersection';
import { cx }                                 from './utils/styleHelpers';
import { injectMarqueeStyles }                from './utils/injectStyles';
import {
  DEFAULT_SPEED,
  DEFAULT_GAP,
  DEFAULT_SEPARATOR_ICON,
  SEPARATOR_ICONS,
} from './constants';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MarqueeLayer {
  items:      MarqueeItemData[];
  speed?:     number;
  direction?: 'left' | 'right';
  gap?:       number;
}

export interface PremiumMarqueeProps {
  // ── Content
  items?:         MarqueeItemData[];
  loading?:       boolean;
  skeletonCount?: number;

  // ── Marquee behaviour
  speed?:        number;
  direction?:    'left' | 'right';
  pauseOnHover?: boolean;
  pauseOnClick?: boolean;
  loop?:         number;
  autoFill?:     boolean;

  // ── Item appearance
  gap?:          number;
  itemPadding?:  string;
  borderRadius?: string;

  // ── Separator
  separator?:          boolean;
  separatorIcon?:      string;
  separatorSpacing?:   number;

  // ── Multi-layer mode
  showMultiLayer?: boolean;
  layers?:         MarqueeLayer[];

  // ── Optional premium effects
  showScrollSpeedEffect?:  boolean;
  showMouseParallax?:      boolean;
  showCenterHighlight?:    boolean;
  showGradientSweep?:      boolean;
  showHoverLift?:          boolean;
  showGlow?:               boolean;
  showEdgeBlur?:           boolean;
  showEntranceAnimation?:  boolean;
  showVelocityStretch?:    boolean;
  showFloatingNoise?:      boolean;
  showPerspectiveTilt?:    boolean;
  showScrollCompression?:  boolean;
  showDirectionRotation?:  boolean;
  showFadeEdges?:          boolean;
  showItemReveal?:         boolean;
  showMouseRipple?:        boolean;
  showSeparatorAnimation?: boolean;

  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PremiumMarquee({
  // Content
  items         = [],
  loading       = false,
  skeletonCount = 6,

  // Marquee behaviour
  speed        = DEFAULT_SPEED,
  direction    = 'left',
  pauseOnHover = true,
  pauseOnClick = false,
  loop         = 0,
  autoFill     = true,

  // Item appearance
  gap          = DEFAULT_GAP,
  itemPadding  = 'px-5 py-2.5',
  borderRadius = 'rounded-full',

  // Separator
  separator         = true,
  separatorIcon     = DEFAULT_SEPARATOR_ICON,
  separatorSpacing  = 20,

  // Multi-layer
  showMultiLayer = false,
  layers         = [],

  // Effects
  showScrollSpeedEffect  = false,
  showMouseParallax      = false,
  showCenterHighlight    = false,
  showGradientSweep      = false,
  showHoverLift          = false,
  showGlow               = false,
  showEdgeBlur           = false,
  showEntranceAnimation  = false,
  showVelocityStretch    = false,
  showFloatingNoise      = false,
  showPerspectiveTilt    = false,
  showScrollCompression  = false,
  showDirectionRotation  = false,
  showFadeEdges          = false,
  showItemReveal         = false,
  showMouseRipple        = false,
  showSeparatorAnimation = false,

  className = '',
}: PremiumMarqueeProps) {
  // Inject CSS for keyframe-based effects (idempotent — runs once per page).
  injectMarqueeStyles();

  const containerRef   = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Gate every effect through this flag — respects OS accessibility settings.
  const motion = !prefersReduced;

  // Used by center highlight and entrance animation to pause when off-screen.
  const isVisible = useIntersection(containerRef);

  // ── Animation hooks ───────────────────────────────────────────────────────
  // Each hook checks its own `enabled` flag and becomes a no-op when false.
  useScrollSpeed(containerRef,  motion && showScrollSpeedEffect);
  useMouseParallax(containerRef, motion && showMouseParallax);
  useCenterHighlight(containerRef, motion && showCenterHighlight, isVisible);
  useVelocityEffects(containerRef, {
    stretch:     motion && showVelocityStretch,
    tilt:        motion && showPerspectiveTilt,
    compression: motion && showScrollCompression,
    rotation:    motion && showDirectionRotation,
  });
  useMouseRipple(containerRef,   motion && showMouseRipple);
  useEntranceAnimation(
    containerRef,
    motion && (showEntranceAnimation || showItemReveal),
    isVisible,
  );

  // ── Separator element ─────────────────────────────────────────────────────
  const sepChar = SEPARATOR_ICONS[separatorIcon] ?? separatorIcon;

  const renderSeparator = (key: string) => (
    <span
      key={key}
      className={cx(
        'inline-block shrink-0 select-none',
        'text-secondary/20 dark:text-white/20',
        motion && showSeparatorAnimation && 'pm-sep-pulse',
      )}
      style={{ marginRight: separatorSpacing }}
      aria-hidden="true"
    >
      {sepChar}
    </span>
  );

  // ── Content builder ───────────────────────────────────────────────────────
  const buildItems = useCallback(
    (
      sourceItems: MarqueeItemData[],
      sourceGap: number,
    ): React.ReactNode[] => {
      if (loading || sourceItems.length === 0) {
        return Array.from({ length: skeletonCount }, (_, i) => (
          <MarqueeSkeleton
            key={`sk-${i}`}
            index={i}
            gap={sourceGap}
            itemPadding={itemPadding}
            borderRadius={borderRadius}
          />
        ));
      }

      const nodes: React.ReactNode[] = [];
      sourceItems.forEach((item, i) => {
        nodes.push(
          <MarqueeItem
            key={`item-${i}`}
            item={item}
            gap={separator ? 0 : sourceGap}
            itemPadding={itemPadding}
            borderRadius={borderRadius}
            showHoverLift={motion && showHoverLift}
            showGlow={motion && showGlow}
          />,
        );
        if (separator && i < sourceItems.length - 1) {
          nodes.push(renderSeparator(`sep-${i}`));
        }
      });

      return nodes;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      loading, skeletonCount, itemPadding, borderRadius,
      separator, motion, showHoverLift, showGlow, showSeparatorAnimation,
      separatorSpacing, sepChar,
    ],
  );

  // ── Shared overlays (gradient sweep, noise, edge effects) ─────────────────
  const renderOverlays = () => (
    <>
      {motion && showGradientSweep && (
        <div
          className="pm-gradient-sweep pointer-events-none absolute inset-0 z-10"
          aria-hidden="true"
        />
      )}
      {motion && showFloatingNoise && (
        <div
          className="pm-noise pointer-events-none absolute inset-0 z-10 overflow-hidden"
          aria-hidden="true"
        />
      )}
      {motion && showEdgeBlur && (
        <>
          <div className="pm-edge-left"  aria-hidden="true" />
          <div className="pm-edge-right" aria-hidden="true" />
        </>
      )}
    </>
  );

  // ── Multi-layer rendering ─────────────────────────────────────────────────
  // When showMultiLayer is true, render several rows with alternating directions.
  // Caller provides `layers` for full control, or we auto-split `items` 3 ways.
  if (showMultiLayer) {
    const resolvedLayers: MarqueeLayer[] =
      layers.length > 0
        ? layers
        : buildDefaultLayers(items, speed, gap);

    return (
      <div
        ref={containerRef}
        className={cx(
          'relative overflow-hidden',
          motion && showPerspectiveTilt && 'pm-perspective',
          className,
        )}
        role="region"
        aria-label="Scrolling content"
        aria-live="off"
      >
        {renderOverlays()}

        <div className="flex flex-col gap-3">
          {resolvedLayers.map((layer, li) => (
            <div
              key={li}
              style={
                showFadeEdges
                  ? {
                      WebkitMaskImage:
                        'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                      maskImage:
                        'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                    }
                  : undefined
              }
            >
              <Marquee
                speed={layer.speed ?? speed}
                direction={layer.direction ?? (li % 2 === 0 ? 'left' : 'right')}
                pauseOnHover={pauseOnHover}
                pauseOnClick={pauseOnClick}
                loop={loop}
                autoFill={autoFill}
                gradient={false}
              >
                {buildItems(layer.items, layer.gap ?? gap)}
              </Marquee>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Single-row rendering ──────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={cx(
        'relative overflow-hidden',
        motion && showPerspectiveTilt && 'pm-perspective',
        className,
      )}
      role="region"
      aria-label="Scrolling content"
      aria-live="off"
      style={
        showFadeEdges
          ? {
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
              maskImage:
                'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            }
          : undefined
      }
    >
      {renderOverlays()}

      <Marquee
        speed={speed}
        direction={direction}
        pauseOnHover={pauseOnHover}
        pauseOnClick={pauseOnClick}
        loop={loop}
        autoFill={autoFill}
        gradient={false}
      >
        {buildItems(items, gap)}
      </Marquee>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Auto-generates three marquee layers from a flat item array when the caller
// enables showMultiLayer without providing explicit layer configs.
function buildDefaultLayers(
  items:  MarqueeItemData[],
  speed:  number,
  gap:    number,
): MarqueeLayer[] {
  if (items.length === 0) return [{ items: [], speed, direction: 'left' }];

  const third = Math.ceil(items.length / 3);
  return [
    { items: items.slice(0, third),        speed: speed * 0.85, direction: 'left',  gap },
    { items: items.slice(third, third * 2), speed: speed * 1.1,  direction: 'right', gap },
    { items: items.slice(third * 2),        speed: speed * 0.95, direction: 'left',  gap },
  ];
}
