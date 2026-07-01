'use client';
import { forwardRef } from 'react';

const CenterGlow = forwardRef<HTMLDivElement>(function CenterGlow(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        position:  'absolute',
        top:       0,
        left:      '50%',
        transform: 'translateX(-50%)',
        width:     '3px',
        height:    '100%',
        background: '#fff',
        boxShadow: [
          /* left side — blue */
          '-2px 0 12px 4px rgba(21,85,194,0.7)',
          '-6px 0 32px 10px rgba(21,85,194,0.35)',
          /* right side — orange */
          '2px 0 12px 4px rgba(245,130,31,0.7)',
          '6px 0 32px 10px rgba(245,130,31,0.35)',
          /* white core */
          '0 0 6px 2px rgba(255,255,255,0.9)',
        ].join(', '),
        opacity:    0,
        willChange: 'opacity',
      }}
    />
  );
});

export default CenterGlow;
