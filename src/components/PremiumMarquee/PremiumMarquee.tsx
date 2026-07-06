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

export type MarqueeDirection = 'left' | 'right' | 'up' | 'down';

export interface MarqueeLayer {
  items:      MarqueeItemData[];
  speed?:     number;
  direction?: MarqueeDirection;
  gap?:       number;
}

export interface PremiumMarqueeProps {
  // ── Content
  items?:         MarqueeItemData[];
  loading?:       boolean;
  skeletonCount?: number;

  // ── react-fast-marquee core props (full library API)
  // speed: pixels per second. Higher = faster. showScrollSpeedEffect modulates this on scroll.
  speed?:           number;
  // 'up' / 'down' are experimental in rfm — set an explicit height for those.
  direction?:       MarqueeDirection;
  play?:            boolean;
  pauseOnHover?:    boolean;
  pauseOnClick?:    boolean;
  loop?:            number;
  autoFill?:        boolean;
  delay?:           number;
  // Built-in rfm gradient (alternative to showFadeEdges custom overlay).
  gradient?:        boolean;
  gradientColor?:   string;
  gradientWidth?:   number | string;
  onFinish?:        () => void;
  onCycleComplete?: () => void;
  onMount?:         () => void;

  // ── Item appearance
  gap?:           number;
  itemPadding?:   string;
  borderRadius?:  string;
  // Overrides the default theme-aware text colour on text/imageText items.
  // Accepts any valid CSS color: '#fff', 'rgba(0,0,0,0.8)', 'hsl(...)' etc.
  itemTextColor?: string;

  // ── Strip styling
  // Height of the strip. Required for direction='up'|'down' (vertical marquees).
  height?:     string | number;
  // Background colour of the marquee strip.
  // Also used as the colour the fade-edge gradients fade FROM.
  bgColor?:    string;
  // Size of the fade-edge gradient overlays. Default '5rem'.
  // For horizontal: controls width. For vertical: controls height.
  fadeWidth?:  string;

  // ── Separator
  separator?:         boolean;
  separatorIcon?:     string;
  separatorSpacing?:  number;
  separatorColor?:    string;
  // 'between' | 'before' | 'after' | 'both'
  separatorPosition?: 'between' | 'before' | 'after' | 'both';

  // ── Divider lines (top/bottom border)
  showTopDivider?:    boolean;
  showBottomDivider?: boolean;
  dividerColor?:      string;

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

  // Entrance animation: direction items arrive from. 'top' | 'bottom' | 'none'.
  // For vertical marquees (up/down) 'top'/'bottom' map to the visual leading/trailing edge.
  entranceDirection?: 'top' | 'bottom' | 'none';
  // true → full animation replays on every viewport re-entry.
  // false (default) → plays once; subsequent entries only blur→unblur.
  entranceRepeat?: boolean;

  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PremiumMarquee({
  // Content
  items         = [],
  loading       = false,
  skeletonCount = 6,

  // rfm core
  speed           = DEFAULT_SPEED,
  direction       = 'left',
  play            = true,
  pauseOnHover    = true,
  pauseOnClick    = false,
  loop            = 0,
  autoFill        = true,
  delay           = 0,
  gradient        = false,
  gradientColor   = 'white',
  gradientWidth   = 200,
  onFinish,
  onCycleComplete,
  onMount,

  // Item appearance
  gap           = DEFAULT_GAP,
  itemPadding   = 'px-5 py-2.5',
  borderRadius  = 'rounded-full',
  itemTextColor,

  // Strip styling
  height,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const motion         = !prefersReduced;
  const needsIntersection = motion && (showCenterHighlight || showEntranceAnimation || showItemReveal);
  const isVisible      = useIntersection(containerRef, needsIntersection);
  const isVertical     = direction === 'up' || direction === 'down';

  // ── Animation hooks ───────────────────────────────────────────────────────
  useScrollSpeed(containerRef,  motion && showScrollSpeedEffect);
  useMouseParallax(containerRef, motion && showMouseParallax);
  useCenterHighlight(containerRef, motion && showCenterHighlight, isVisible);
  useVelocityEffects(containerRef, {
    stretch:     motion && showVelocityStretch,
    tilt:        motion && showPerspectiveTilt,
    compression: motion && showScrollCompression,
    rotation:    motion && showDirectionRotation,
    isVertical,
  });
  useMouseRipple(containerRef,   motion && showMouseRipple);
  useEntranceAnimation(
    containerRef,
    motion && (showEntranceAnimation || showItemReveal),
    isVisible,
    entranceDirection,
    entranceRepeat,
    isVertical,
  );

  // ── Separator ─────────────────────────────────────────────────────────────
  const sepChar = SEPARATOR_ICONS[separatorIcon] ?? separatorIcon;

  const renderSeparator = (key: string) => (
    <span
      key={key}
      className={cx(
        'inline-block shrink-0 select-none',
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

      sourceItems.forEach((item, i) => {
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
  const dividerStyle = dividerColor ? { borderColor: dividerColor } : undefined;
  const defaultDividerClass = 'border-secondary/8 dark:border-white/6';

  // ── Edge gradient overlays ────────────────────────────────────────────────
  // Color-to-transparent gradients (not mask-image) so the fade works on any bg.
  // For horizontal: left/right overlays. For vertical: top/bottom overlays.
  const fadeFromColor = bgColor || 'var(--bg, white)';

  const renderFadeEdges = () => {
    if (!showFadeEdges) return null;

    if (isVertical) {
      return (
        <>
          <div
            className="absolute top-0 inset-x-0 z-20 pointer-events-none"
            style={{
              height:     fadeWidth,
              background: `linear-gradient(to bottom, ${fadeFromColor}, transparent)`,
            }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 inset-x-0 z-20 pointer-events-none"
            style={{
              height:     fadeWidth,
              background: `linear-gradient(to top, ${fadeFromColor}, transparent)`,
            }}
            aria-hidden="true"
          />
        </>
      );
    }

    return (
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
    );
  };

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
  const containerStyle: React.CSSProperties = {
    ...(bgColor ? { backgroundColor: bgColor } : {}),
    // Vertical marquees need an explicit height on the wrapper; rfm uses 100vh
    // internally (its container width maps to the visible height after rotation).
    ...(isVertical && height ? { height } : {}),
  };

  // ── Shared rfm props ──────────────────────────────────────────────────────
  const rfmProps = {
    play,
    pauseOnHover,
    pauseOnClick,
    loop,
    autoFill,
    delay,
    gradient,
    gradientColor,
    gradientWidth,
    onFinish,
    onCycleComplete,
    onMount,
  };

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
              {...rfmProps}
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
        {...rfmProps}
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
