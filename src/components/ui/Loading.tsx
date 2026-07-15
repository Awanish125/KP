'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const BLUE   = '#0065B1';
const ORANGE = '#F58420';

export default function Loading() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const kRef       = useRef<HTMLSpanElement>(null);
  const iranRef    = useRef<HTMLSpanElement>(null);
  const pRef       = useRef<HTMLSpanElement>(null);
  const ublRef     = useRef<HTMLSpanElement>(null);
  const ringSvgRef = useRef<SVGSVGElement>(null);
  const ringRef    = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const K       = kRef.current;
    const IRAN    = iranRef.current;
    const P       = pRef.current;
    const UBL     = ublRef.current;
    const ringSvg = ringSvgRef.current;
    const ring    = ringRef.current;

    if (!overlay || !K || !IRAN || !P || !UBL || !ringSvg || !ring) return;

    document.body.style.overflow = 'hidden';

    /* Promote animated elements to compositor layers upfront */
    K.style.willChange    = 'transform, opacity';
    IRAN.style.willChange = 'transform, opacity';
    P.style.willChange    = 'transform, opacity';
    UBL.style.willChange  = 'transform, opacity';

    /* Pre-calculate ALL positions BEFORE GSAP touches anything */
    const kRect = K.getBoundingClientRect();
    const pRect = P.getBoundingClientRect();
    const vw    = window.innerWidth;
    const vh    = window.innerHeight;
    const cx    = vw / 2;
    const cy    = (kRect.top + kRect.bottom) / 2;

    const gap = 4;
    const kpW = kRect.width + gap + pRect.width;

    const kDx = (cx - kpW / 2) - kRect.left;
    const pDx = (cx - kpW / 2 + kRect.width + gap) - pRect.left;

    const radius = kpW / 2 + 24;
    const circum = 2 * Math.PI * radius;

    ringSvg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    ring.setAttribute('cx', `${cx}`);
    ring.setAttribute('cy', `${cy}`);
    ring.setAttribute('r',  `${radius}`);
    ring.style.strokeDasharray  = `${circum}`;
    ring.style.strokeDashoffset = `${circum}`;

    /* Single unified timeline — no Three.js dependency, runs fully independently */
    const tl = gsap.timeline({ defaults: { ease: 'power4.inOut' } });

    // ① KIRAN PUBLICITY enters
    tl.from([K, IRAN, P, UBL], {
      opacity: 0, y: 32, duration: 0.45, ease: 'power4.out', stagger: 0,
    });

    // ② Hold
    tl.to({}, { duration: 0.45 });

    // ③ IRAN and UBLICITY dissolve (compositor-only: opacity + x)
    tl.to(IRAN, { opacity: 0, x: -22, duration: 0.34 });
    tl.to(UBL,  { opacity: 0, x:  22, duration: 0.34 }, '<');

    // ④ K and P converge to center
    tl.to(K, { x: kDx, duration: 0.50 });
    tl.to(P, { x: pDx, duration: 0.50 }, '<');

    // ⑤ Ring fades in and draws
    tl.to(ringSvg, { opacity: 1, duration: 0.14 }, '-=0.14');
    tl.to(ring, { strokeDashoffset: 0, duration: 0.52 }, '<0.1');

    // ⑥ Brief hold on KP logo
    tl.to({}, { duration: 0.16 });

    // ⑦ Fade out KP + ring
    tl.to([K, P, ringSvg], { opacity: 0, duration: 0.20, ease: 'power4.in' });

    /* ⑧ Iris-close: animate a CSS clip-path circle from full-coverage to zero.
       clip-path runs on the GPU compositor — zero main-thread cost, always 60fps.
       The Three.js canvas is NOT mounted yet, so no shader compilation competes. */
    tl.add(() => {
      gsap.set(overlay, { clipPath: 'circle(150% at 50% 50%)' });
    });

    tl.to(overlay, {
      clipPath: 'circle(0% at 50% 50%)',
      duration: 0.75,
      ease: 'power4.inOut',
      onComplete: () => {
        [K, IRAN, P, UBL].forEach(el => { el.style.willChange = 'auto'; });
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        document.documentElement.classList.add('page-revealed');
        /* Signal page.tsx to mount the Three.js canvas now that the animation is done */
        window.dispatchEvent(new Event('kp:loaded'));
      },
    });

    return () => {
      tl.kill();
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ background: '#000', contain: 'layout paint' }}
    >
      {/* ── Brand text ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div
          className="flex items-center"
          style={{ fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif" }}
        >
          <span ref={kRef}    style={{ fontSize: '5rem', fontWeight: 900, color: BLUE,   lineHeight: 1, letterSpacing: '-0.025em' }}>K</span>
          <span ref={iranRef} style={{ fontSize: '5rem', fontWeight: 900, color: BLUE,   lineHeight: 1, letterSpacing: '-0.025em' }}>IRAN</span>
          <span style={{ display: 'inline-block', width: '0.6rem', flexShrink: 0 }} />
          <span ref={pRef}    style={{ fontSize: '5rem', fontWeight: 900, color: ORANGE, lineHeight: 1, letterSpacing: '-0.025em' }}>P</span>
          <span ref={ublRef}  style={{ fontSize: '5rem', fontWeight: 900, color: ORANGE, lineHeight: 1, letterSpacing: '-0.025em' }}>UBLICITY</span>
        </div>
      </div>

      {/* ── Ring SVG ────────────────────────────────────────────────────── */}
      <svg
        ref={ringSvgRef}
        viewBox="0 0 1 1"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0 }}
      >
        <circle
          ref={ringRef}
          cx="0" cy="0" r="60"
          fill="none"
          stroke={ORANGE}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
      </svg>
    </div>
  );
}
