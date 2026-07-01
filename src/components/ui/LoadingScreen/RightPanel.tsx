'use client';
import { forwardRef } from 'react';

const RightPanel = forwardRef<HTMLDivElement>(function RightPanel(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        position:           'absolute',
        top:                0,
        right:              0,
        width:              '50%',
        height:             '100%',
        backgroundImage:    "url('/loadingScreenImage/r.png')",
        backgroundSize:     'cover',
        backgroundPosition: 'left center',
        willChange:         'transform',
      }}
    >
      {/* Orange ambient colour wash */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(270deg, rgba(245,130,31,0.22) 0%, transparent 70%)',
      }} />
    </div>
  );
});

export default RightPanel;
