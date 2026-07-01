'use client';

/**
 * BillboardController — self-contained owner of the 3D billboard.
 *
 * Mounts TrackingBillboard after 'kp:loaded', wires all ScrollTrigger
 * animations, and syncs the S-4 content steps to billboard rotation.
 *
 * To disable the entire billboard (and prevent any ThreeJS/WebGL loading):
 *   1. Comment out the import in page.tsx
 *   2. Comment out <BillboardController stepRefs={stepRefs} /> in JSX
 * Nothing else in page.tsx needs to change.
 */

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrackingBillboard, type TrackingBillboardHandle } from './TrackingBillboard';

gsap.registerPlugin(ScrollTrigger);

/* ── Images ──────────────────────────────────────────────────────────────── */
const I1 = '/homepage/herosection/1.png';
const I2 = '/homepage/herosection/2.png';
const I3 = '/homepage/herosection/3.png';
const KP = '/homepage/herosection/kp.png';

// Image shown at each 90° step of the S-4 scroll-driven rotation
const STEP_IMAGES = [I1, I2, I3, KP];

/* ── Types ───────────────────────────────────────────────────────────────── */
interface BillboardControllerProps {
  /** Refs to the four S-4 content step divs — synced to billboard rotation. */
  stepRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

/* ════════════════════════════════════════════════════════════════════════════ */

export function BillboardController({ stepRefs }: BillboardControllerProps) {
  const billRef = useRef<TrackingBillboardHandle>(null);
  const [mounted, setMounted] = useState(false);

  /* Preload poster images so Three.js gets cache hits on first render */
  useEffect(() => {
    [I1, I2, I3, KP].forEach(url => {
      const img = new Image();
      img.src = url;
    });
    window.addEventListener('kp:loaded', () => setMounted(true), { once: true });
  }, []);

  /* ── All billboard scroll animations ─────────────────────────────────── */
  useGSAP(() => {
    const bill = billRef.current;
    if (!bill) return;
    const wrap = bill.wrapRef.current;
    if (!wrap) return;

    /* Smooth scrubbed transit: slides left%, pulses scale, spins model */
    function scrubTransition(
      triggerId: string,
      fromPct: number,
      toPct: number,
      fromDeg: number,
      toDeg: number,
      peakScale = 1.12,
    ) {
      ScrollTrigger.create({
        trigger: triggerId,
        start: 'top bottom',
        end:   'top top',
        scrub: 0.5,
        onUpdate(self) {
          const p     = self.progress;
          const left  = fromPct + (toPct - fromPct) * p;
          const scale = 1 + (peakScale - 1) * Math.sin(p * Math.PI);
          gsap.set(wrap, { x: `${left * 2}%`, scale });
          bill.setRotationDirect(fromDeg + (toDeg - fromDeg) * p);
        },
      });
    }

    /* ── S-1 → S-2 : slide in from right + fade ──────────────────────── */
    ScrollTrigger.create({
      trigger: '#s2',
      start: 'top bottom',
      end:   'top top',
      scrub: 0.4,
      onUpdate(self) {
        const p = self.progress;
        gsap.set(wrap, {
          x:       `${(50 + (1 - p) * 20) * 2}%`,
          opacity: p,
          scale:   0.85 + 0.15 * p,
        });
      },
      onLeaveBack() {
        gsap.set(wrap, { opacity: 0, scale: 0.85 });
      },
    });

    /* ── S-2 fully in view ────────────────────────────────────────────── */
    ScrollTrigger.create({
      trigger: '#s2',
      start: 'top top',
      onEnter() {
        gsap.set(wrap, { x: '100%', opacity: 1, scale: 1 });
        bill.changePoster('front', I1);
        bill.rotateTo(180, {
          duration: 1.8,
          ease: 'power2.inOut',
          images: [
            { atDegrees: 90,  front: KP },
            { atDegrees: 180, front: I1 },
          ],
        });
      },
      onLeaveBack() {
        bill.stopScrollRotation();
        bill.resetRotation({ duration: 0.5 });
      },
    });

    /* ── S-2 → S-3 : slides left + spins 180° ────────────────────────── */
    scrubTransition('#s3', 50, 0, 180, 360);

    /* ── S-3 fully in view ────────────────────────────────────────────── */
    ScrollTrigger.create({
      trigger: '#s3',
      start: 'top top',
      onEnter() {
        gsap.set(wrap, { x: '0%', scale: 1 });
        bill.changePoster('front', I2);
        bill.rotateTo(400, { duration: 0.6, ease: 'power2.out' });
        gsap.delayedCall(0.6, () =>
          bill.rotateTo(360, { duration: 0.4, ease: 'power2.inOut' }),
        );
      },
      onLeaveBack() {
        bill.stopScrollRotation();
        gsap.set(wrap, { x: '100%' });
        bill.changePoster('front', I1);
        bill.resetRotation({ duration: 0.5 });
      },
    });

    /* ── S-3 → S-4 : slides right + spins another 180° ──────────────── */
    scrubTransition('#s4-wrapper', 0, 50, 360, 540);

    /* ── S-4 fully in view — scroll-driven 360° rotation ─────────────── */
    ScrollTrigger.create({
      trigger: '#s4-wrapper',
      start: 'top top',
      onEnter() {
        gsap.set(wrap, { x: '100%', opacity: 1 });
        bill.changePoster('front', STEP_IMAGES[0]);
        bill.startScrollRotation(
          360,
          '#s4-wrapper',
          STEP_IMAGES.map((image, i) => ({ atDegrees: i * 90, front: image })),
        );
      },
      onLeaveBack() {
        bill.stopScrollRotation();
        gsap.set(wrap, { x: '0%' });
        bill.changePoster('front', I2);
      },
    });

    /* ── After S-4 ends : fade out ────────────────────────────────────── */
    ScrollTrigger.create({
      trigger: '#s4-wrapper',
      start: 'bottom bottom',
      onEnter() {
        bill.stopScrollRotation();
        gsap.to(wrap, { opacity: 0, scale: 0.85, duration: 0.5, ease: 'power2.in' });
      },
      onLeaveBack() {
        gsap.to(wrap, { opacity: 1, scale: 1, duration: 0.3 });
      },
    });

    /* ── S-4 content steps synced to billboard rotation ──────────────── */
    ScrollTrigger.create({
      trigger: '#s4-wrapper',
      start:   'top top',
      end:     'bottom bottom',
      scrub:   true,
      onUpdate(self) {
        const deg = 360 * self.progress;
        stepRefs.current.forEach((el, i) => {
          if (!el) return;
          const active = deg >= i * 90 && deg < (i + 1) * 90;
          gsap.to(el, {
            opacity:   active ? 1 : 0,
            y:         active ? 0 : 16,
            duration:  0.3,
            overwrite: true,
          });
        });
      },
    });
  }, [mounted]);

  if (!mounted) return null;

  return (
    <TrackingBillboard
      ref={billRef}
      initialImage={I1}
      cameraAngle="front"
      showLeva={false}
    />
  );
}
