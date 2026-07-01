'use client';
import { forwardRef } from 'react';

const LeftPanel = forwardRef<HTMLDivElement>(function LeftPanel(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        position:            'absolute',
        top:                 0,
        left:                0,
        width:               '50%',
        height:              '100%',
        backgroundImage:     "url('/loadingScreenImage/l.png')",
        backgroundSize:      'cover',
        backgroundPosition:  'right center',
        willChange:          'transform',
      }}
    >
      {/* Blue ambient colour wash */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(90deg, rgba(21,85,194,0.22) 0%, transparent 70%)',
      }} />
    </div>
  );
});

export default LeftPanel;
