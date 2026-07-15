'use client';

interface LoaderTextProps {
  titleRef:    React.RefObject<HTMLDivElement | null>;
  subtitleRef: React.RefObject<HTMLDivElement | null>;
}

export default function LoaderText({ titleRef, subtitleRef }: LoaderTextProps) {
  return (
    <div style={{
      position:       'absolute',
      bottom:         '18%',
      left:           '50%',
      transform:      'translateX(-50%)',
      textAlign:      'center',
      zIndex:         10,
      pointerEvents:  'none',
    }}>
      {/* Title — SplitType will split this into .char spans */}
      <div
        ref={titleRef}
        style={{
          fontSize:      'clamp(1.1rem, 2.5vw, 1.6rem)',
          fontWeight:    300,
          letterSpacing: '0.45em',
          background:    "linear-gradient(90deg, #0065B1 0%, #0065B1 36%, #F58420 52%, #F58420 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color:         "transparent",
          textTransform: 'uppercase',
          whiteSpace:    'nowrap',
          marginBottom:  '0.5em',
        }}
      >
        KIRAN PUBLICITY
      </div>

      {/* Subtitle */}
      <div
        ref={subtitleRef}
        style={{
          fontSize:      'clamp(0.55rem, 1.1vw, 0.75rem)',
          fontWeight:    300,
          letterSpacing: '0.35em',
          color:         'rgba(255,255,255,0.45)',
          textTransform: 'uppercase',
          whiteSpace:    'nowrap',
        }}
      >
        OOH MEDIA ASSETS &amp; SOLUTION
      </div>
    </div>
  );
}
