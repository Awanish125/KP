'use client';
import { forwardRef } from 'react';

const Logo = forwardRef<HTMLDivElement>(function Logo(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        position:       'absolute',
        top:            '50%',
        left:           '50%',
        transform:      'translate(-50%, -50%)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '100px',
        height:         '100px',
        borderRadius:   '50%',
        border:         '2px solid rgba(245,130,31,0.6)',
        boxShadow:      '0 0 24px 4px rgba(245,130,31,0.2), inset 0 0 20px rgba(0,0,0,0.4)',
        background:     'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        zIndex:         10,
        opacity:        0,
        willChange:     'transform, opacity',
        transformStyle: 'preserve-3d',
      }}
    >
      <span style={{
        fontSize:   '2.4rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        textShadow: '0 0 18px rgba(245,130,31,0.5)',
      }}>
        <span style={{ color: '#1555C2' }}>K</span>
        <span style={{ color: '#F5821F' }}>P</span>
      </span>
    </div>
  );
});

export default Logo;
