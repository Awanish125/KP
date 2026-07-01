'use client';

import React, { useState } from 'react';
import { cx } from './utils/styleHelpers';
import { ItemLink } from './utils/itemHelpers';

export interface MarqueeItemData {
  type:    'text' | 'image' | 'imageText';
  text?:   string;
  image?:  string;
  alt?:    string;
  href?:   string;
  target?: string;
  rel?:    string;
}

interface Props {
  item:         MarqueeItemData;
  gap:          number;
  itemPadding:  string;
  borderRadius: string;
  showHoverLift: boolean;
  showGlow:      boolean;
}

export function MarqueeItem({
  item,
  gap,
  itemPadding,
  borderRadius,
  showHoverLift,
  showGlow,
}: Props) {
  const [imgReady, setImgReady] = useState(false);
  const [imgError, setImgError] = useState(false);

  const wrapClass = cx(
    // Base layout
    'group relative inline-flex items-center shrink-0 select-none',
    'transition-[transform,box-shadow,filter] duration-300 ease-out',
    'outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
    itemPadding,
    borderRadius,
    // Hover lift
    showHoverLift && [
      item.href && 'cursor-pointer',
      'hover:-translate-y-[5px] hover:scale-[1.045]',
      'hover:shadow-xl hover:shadow-secondary/[0.12] dark:hover:shadow-black/40',
    ],
    // Glow variant: orange aura on hover
    showGlow && [
      'hover:shadow-lg',
      'hover:shadow-kp-orange/[0.22] dark:hover:shadow-kp-orange/[0.18]',
    ],
  );

  // ── Text ──────────────────────────────────────────────────────────────────
  if (item.type === 'text') {
    return (
      <ItemLink
        href={item.href}
        target={item.target}
        rel={item.rel}
        className={wrapClass}
        data-marquee-item="true"
        style={{ marginRight: gap }}
        tabIndex={item.href ? 0 : -1}
      >
        <span
          className={cx(
            'text-sm font-medium tracking-wide whitespace-nowrap',
            'text-secondary/65 dark:text-white/65',
            'transition-colors duration-300',
            showHoverLift && 'group-hover:text-secondary dark:group-hover:text-white',
          )}
        >
          {item.text}
        </span>
      </ItemLink>
    );
  }

  // ── Image ─────────────────────────────────────────────────────────────────
  if (item.type === 'image') {
    return (
      <ItemLink
        href={item.href}
        target={item.target}
        rel={item.rel}
        className={wrapClass}
        data-marquee-item="true"
        style={{ marginRight: gap }}
        tabIndex={item.href ? 0 : -1}
      >
        <span className="relative flex items-center justify-center min-w-[2rem] min-h-[1.75rem]">
          {/* Skeleton shimmer while image loads */}
          {!imgReady && !imgError && (
            <span
              className={cx(
                'absolute inset-0 rounded animate-pulse',
                'bg-secondary/[0.06] dark:bg-white/[0.06]',
              )}
            />
          )}
          {!imgError ? (
            <img
              src={item.image}
              alt={item.alt ?? ''}
              className={cx(
                'h-6 w-auto max-w-[7rem] object-contain',
                'dark:brightness-[0.88] dark:contrast-[1.08]',
                'transition-opacity duration-300',
                imgReady ? 'opacity-100' : 'opacity-0',
              )}
              onLoad={() => setImgReady(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            // Fallback placeholder when the image fails to load
            <span
              className={cx(
                'w-7 h-7 rounded flex items-center justify-center',
                'bg-secondary/[0.06] dark:bg-white/[0.06]',
                'text-[9px] text-secondary/30 dark:text-white/30',
              )}
            >
              ?
            </span>
          )}
        </span>
      </ItemLink>
    );
  }

  // ── Image + Text ──────────────────────────────────────────────────────────
  if (item.type === 'imageText') {
    return (
      <ItemLink
        href={item.href}
        target={item.target}
        rel={item.rel}
        className={wrapClass}
        data-marquee-item="true"
        style={{ marginRight: gap }}
        tabIndex={item.href ? 0 : -1}
      >
        {item.image && !imgError && (
          <span className="relative mr-2.5 flex items-center">
            {!imgReady && (
              <span
                className={cx(
                  'absolute inset-0 w-5 h-5 rounded animate-pulse',
                  'bg-secondary/[0.06] dark:bg-white/[0.06]',
                )}
              />
            )}
            <img
              src={item.image}
              alt={item.alt ?? ''}
              className={cx(
                'h-5 w-auto object-contain',
                'dark:brightness-[0.88]',
                !imgReady ? 'opacity-0' : 'opacity-100 transition-opacity duration-300',
              )}
              onLoad={() => setImgReady(true)}
              onError={() => setImgError(true)}
            />
          </span>
        )}
        <span
          className={cx(
            'text-sm font-medium whitespace-nowrap',
            'text-secondary/65 dark:text-white/65',
            'transition-colors duration-300',
            showHoverLift && 'group-hover:text-secondary dark:group-hover:text-white',
          )}
        >
          {item.text}
        </span>
      </ItemLink>
    );
  }

  return null;
}
