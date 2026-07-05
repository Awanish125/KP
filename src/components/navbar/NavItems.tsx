'use client';

import { useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import navData from '@/data/nav.json';

const NAV_LINKS: { label: string; href: string }[] = navData.links;

export function NavItems() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef      = useRef<HTMLDivElement>(null);
  const itemRefs     = useRef<(HTMLAnchorElement | null)[]>([]);

  const positionPill = useCallback(
    (animate: boolean) => {
      const container = containerRef.current;
      const pill = pillRef.current;
      if (!container || !pill) return;

      const activeIdx = NAV_LINKS.findIndex((l) => l.href === pathname);
      if (activeIdx === -1) {
        gsap.to(pill, { opacity: 0, duration: 0.2 });
        return;
      }

      const el = itemRefs.current[activeIdx];
      if (!el) return;

      const x = el.offsetLeft;
      const w = el.offsetWidth;

      if (animate) {
        gsap.to(pill, { x, width: w, opacity: 1, duration: 0.42, ease: 'power3.out' });
      } else {
        gsap.set(pill, { x, width: w, opacity: 1 });
      }
    },
    [pathname]
  );

  // Initial position — no animation, before user sees it
  useEffect(() => {
    positionPill(false);
  }, [positionPill]);

  // Animate pill on route change
  useEffect(() => {
    // Skip on very first mount (handled above)
    const id = requestAnimationFrame(() => positionPill(true));
    return () => cancelAnimationFrame(id);
  }, [pathname, positionPill]);

  // Stagger entrance of items
  useEffect(() => {
    gsap.fromTo(
      itemRefs.current.filter(Boolean),
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.38, stagger: 0.055, ease: 'power2.out', delay: 0.65 }
    );
  }, []);

  const onItemEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    if (el.classList.contains('active')) return;
    gsap.to(el, { y: -1.5, duration: 0.2, ease: 'power2.out' });
  };

  const onItemLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { y: 0, duration: 0.35, ease: 'elastic.out(1, 0.6)' });
  };

  return (
    <div ref={containerRef} className="nav-items-container">
      {/* Sliding active indicator */}
      <div ref={pillRef} className="nav-active-pill" style={{ opacity: 0 }} />

      {NAV_LINKS.map((link, i) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            ref={(el) => { itemRefs.current[i] = el; }}
            className={`nav-item${isActive ? ' active' : ''}`}
            onMouseEnter={onItemEnter}
            onMouseLeave={onItemLeave}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
