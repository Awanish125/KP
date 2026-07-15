'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';

export function NavLogo() {
  const logoRef = useRef<HTMLAnchorElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance: slides in from left after the navbar itself appears
    gsap.fromTo(
      logoRef.current,
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out', delay: 0.55 }
    );

    // no pulse — logo image has its own circle, don't add CSS rings
  }, []);

  const onEnter = () => {
    gsap.to(logoRef.current, {
      scale: 1.04,
      rotateY: 8,
      duration: 0.3,
      ease: 'power2.out',
    });
    gsap.to(markRef.current, { scale: 1.08, duration: 0.3, ease: 'back.out(2)' });
  };

  const onLeave = () => {
    gsap.to(logoRef.current, {
      scale: 1,
      rotateY: 0,
      duration: 0.55,
      ease: 'elastic.out(1, 0.55)',
    });
    gsap.to(markRef.current, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.55)' });
  };

  return (
    <Link
      ref={logoRef}
      href="/"
      className="nav-logo"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div ref={markRef} className="nav-logo-mark">
        <Image src="/logo/kp-mark.png" alt="KP" width={44} height={44} priority />
      </div>
      <span className="nav-logo-text hidden lg:block">
        <span style={{ color: "#0065B1" }}>Kiran</span>
        <span style={{ color: "#F58420" }}> Publicity</span>
      </span>
    </Link>
  );
}
