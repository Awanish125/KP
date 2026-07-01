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
  // speed: pixels per second the strip scrolls (react-fast-marquee unit).
  // Higher = faster. showScrollSpeedEffect will modulate this on scroll.
  speed?:        number;
  direction?:    'left' | 'right';
  pauseOnHover?: boolean;
  pauseOnClick?: boolean;
  loop?:         number;
  autoFill?:     boolean;

  // ── Item appearance
  gap?:           number;
  itemPadding?:   string;
  borderRadius?:  string;
  // Overrides the default theme-aware text colour on text/imageText items.
  // Accepts any valid CSS color: '#fff', 'rgba(0,0,0,0.8)', 'hsl(...)' etc.
  itemTextColor?: string;

  // ── Strip styling
  // Background colour of the marquee strip.
  // Also used as the colour the left/right edge gradients fade FROM.
  // If omitted, no background is applied and edges fade from the CSS --bg var.
  bgColor?:    string;
  // Width of the left and right fade-edge gradient overlays. Default '5rem'.
  fadeWidth?:  string;

  // ── Separator
  separator?:         boolean;
  separatorIcon?:     string;
  separatorSpacing?:  number;
  // Colour of the separator character. Default is theme-aware (20% opacity).
  separatorColor?:    string;
  // Where the separator appears relative to each item:
  //   'between' — only between items (default, classic behaviour)
  //   'before'  — separator before every item
  //   'after'   — separator after every item
  //   'both'    — separator before AND after every item
  separatorPosition?: 'between' | 'before' | 'after' | 'both';

  // ── Divider lines (top/bottom border)
  // Control each border independently so stacked marquees share no duplicate lines.
  showTopDivider?:    boolean;
  showBottomDivider?: boolean;
  dividerColor?:      string;  // any CSS color

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

  // Entrance animation direction: 'top' | 'bottom' | 'none'. Default 'bottom'.
  entranceDirection?: 'top' | 'bottom' | 'none';
  // Replay full entrance animation every time strip enters viewport.
  // When false (default), only blur→unblur happens on re-entry.
  entranceRepeat?: boolean;

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
  gap           = DEFAULT_GAP,
  itemPadding   = 'px-5 py-2.5',
  borderRadius  = 'rounded-full',
  itemTextColor,

  // Strip styling
  bgColor,
  fadeWidth = '5rem',

  // Separator
  separator         = true,
  separatorIcon     = DEFAULT_SEPARATOR_ICON,
  separatorSpacing  = 20,
  separatorColor,
  separatorPosition = 'between',

  // Dividers
  showTopDivider    = false,
  showBottomDivider = false,
  dividerColor,

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

  entranceDirection = 'bottom',
  entranceRepeat    = false,

  className = '',
}: PremiumMarqueeProps) {
  injectMarqueeStyles();

  const containerRef   = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const motion         = !prefersReduced;
  const isVisible      = useIntersection(containerRef);

  // ── Animation hooks ───────────────────────────────────────────────────────
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
    entranceDirection,
    entranceRepeat,
  );

  // ── Separator ─────────────────────────────────────────────────────────────
  const sepChar = SEPARATOR_ICONS[separatorIcon] ?? separatorIcon;

  const renderSeparator = (key: string) => (
    <span
      key={key}
      className={cx(
        'inline-block shrink-0 select-none',
        // Only apply theme class when no explicit colour is set
        !separatorColor && 'text-secondary/20 dark:text-white/20',
        motion && showSeparatorAnimation && 'pm-sep-pulse',
      )}
      style={{
        marginLeft:  separatorSpacing,
        marginRight: separatorSpacing,
        ...(separatorColor ? { color: separatorColor } : {}),
      }}
      aria-hidden="true"
    >
      {sepChar}
    </span>
  );

  // ── Content builder ───────────────────────────────────────────────────────
  const buildItems = useCallback(
    (sourceItems: MarqueeItemData[], sourceGap: number): React.ReactNode[] => {
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
      const last = sourceItems.length - 1;

      sourceItems.forEach((item, i) => {
        // Before item
        if (separator && (separatorPosition === 'before' || separatorPosition === 'both')) {
          nodes.push(renderSeparator(`sep-before-${i}`));
        }
        if (separator && separatorPosition === 'between' && i > 0) {
          nodes.push(renderSeparator(`sep-between-${i}`));
        }

        nodes.push(
          <MarqueeItem
            key={`item-${i}`}
            item={item}
            gap={separator ? 0 : sourceGap}
            itemPadding={itemPadding}
            borderRadius={borderRadius}
            showHoverLift={motion && showHoverLift}
            showGlow={motion && showGlow}
            itemTextColor={itemTextColor}
          />,
        );

        // After item
        if (separator && (separatorPosition === 'after' || separatorPosition === 'both')) {
          nodes.push(renderSeparator(`sep-after-${i}`));
        }
      });

      return nodes;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      loading, skeletonCount, itemPadding, borderRadius, itemTextColor,
      separator, separatorPosition, motion, showHoverLift, showGlow, showSeparatorAnimation,
      separatorSpacing, sepChar, separatorColor,
    ],
  );

  // ── Divider styles ────────────────────────────────────────────────────────
  // Resolve divider border as inline style so any CSS color works.
  const dividerStyle = dividerColor ? { borderColor: dividerColor } : undefined;
  const defaultDividerClass = 'border-secondary/8 dark:border-white/6';

  // ── Edge gradient overlays ────────────────────────────────────────────────
  // Uses actual color-to-transparent gradients (not mask-image) so the fade is
  // visible regardless of background. fadeFromColor is the strip background.
  const fadeFromColor = bgColor || 'var(--bg, white)';

  const renderFadeEdges = () =>
    showFadeEdges ? (
      <>
        <div
          className="absolute left-0 inset-y-0 z-20 pointer-events-none"
          style={{
            width:      fadeWidth,
            background: `linear-gradient(to right, ${fadeFromColor}, transparent)`,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute right-0 inset-y-0 z-20 pointer-events-none"
          style={{
            width:      fadeWidth,
            background: `linear-gradient(to left, ${fadeFromColor}, transparent)`,
          }}
          aria-hidden="true"
        />
      </>
    ) : null;

  // ── Shared overlays ───────────────────────────────────────────────────────
  const renderOverlays = () => (
    <>
      {motion && showGradientSweep && (
        <div className="pm-gradient-sweep pointer-events-none absolute inset-0 z-10" aria-hidden="true" />
      )}
      {motion && showFloatingNoise && (
        <div className="pm-noise pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true" />
      )}
      {motion && showEdgeBlur && (
        <>
          <div className="pm-edge-left"  aria-hidden="true" />
          <div className="pm-edge-right" aria-hidden="true" />
        </>
      )}
      {renderFadeEdges()}
    </>
  );

  // ── Container style ───────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = bgColor ? { backgroundColor: bgColor } : {};

  // ── Multi-layer rendering ─────────────────────────────────────────────────
  if (showMultiLayer) {
    const resolvedLayers: MarqueeLayer[] =
      layers.length > 0 ? layers : buildDefaultLayers(items, speed, gap);

    return (
      <div
        ref={containerRef}
        className={cx(
          'relative overflow-hidden',
          showTopDivider    && ['border-t', !dividerColor && defaultDividerClass],
          showBottomDivider && ['border-b', !dividerColor && defaultDividerClass],
          motion && showPerspectiveTilt && 'pm-perspective',
          className,
        )}
        style={{ ...containerStyle, ...dividerStyle }}
        role="region"
        aria-label="Scrolling content"
        aria-live="off"
      >
        {renderOverlays()}
        <div className="flex flex-col gap-3">
          {resolvedLayers.map((layer, li) => (
            <Marquee
              key={li}
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
        showTopDivider    && ['border-t', !dividerColor && defaultDividerClass],
        showBottomDivider && ['border-b', !dividerColor && defaultDividerClass],
        motion && showPerspectiveTilt && 'pm-perspective',
        className,
      )}
      style={{ ...containerStyle, ...dividerStyle }}
      role="region"
      aria-label="Scrolling content"
      aria-live="off"
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

function buildDefaultLayers(
  items: MarqueeItemData[],
  speed: number,
  gap:   number,
): MarqueeLayer[] {
  if (items.length === 0) return [{ items: [], speed, direction: 'left' }];
  const third = Math.ceil(items.length / 3);
  return [
    { items: items.slice(0, third),         speed: speed * 0.85, direction: 'left',  gap },
    { items: items.slice(third, third * 2),  speed: speed * 1.1,  direction: 'right', gap },
    { items: items.slice(third * 2),         speed: speed * 0.95, direction: 'left',  gap },
  ];
}
