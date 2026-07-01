'use client';

import React from 'react';
import { cx } from './utils/styleHelpers';
import { SKELETON_WIDTHS } from './constants';

interface Props {
  index:        number;
  gap:          number;
  itemPadding:  string;
  borderRadius: string;
}

// Rendered in place of real items while data is loading.
// Width cycles through SKELETON_WIDTHS so the row looks intentionally varied
// rather than a uniform block — the loading state feels designed.
export function MarqueeSkeleton({ index, gap, itemPadding, borderRadius }: Props) {
  const width = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];

  return (
    <div
      className={cx('inline-flex items-center shrink-0', itemPadding)}
      style={{ marginRight: gap }}
      aria-hidden="true"
    >
      <div
        className={cx(
          'h-3.5 animate-pulse',
          borderRadius,
          'bg-secondary/[0.07] dark:bg-white/[0.07]',
        )}
        style={{ width }}
      />
    </div>
  );
}
