'use client';

import { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { NavLogo }       from './NavLogo';
import { ThemeToggle3D } from './ThemeToggle3D';
import navData from '@/data/nav.json';

const NAV_LINKS: { label: string; href: string }[] = navData.links;

type Props = {
  isOpen:  boolean;
  onClose: () => void;
};

export function MobileSidebar({ isOpen, onClose }: Props) {
  const pathname    = usePathname();
  const [portalMounted, setPortalMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);
  const itemsRef    = useRef<(HTMLAnchorElement | null)[]>([]);
  const toggleRef   = useRef<HTMLDivElement>(null);
  const closeRef    = useRef<HTMLButtonElement>(null);

  /* ── Mount portal on client, then immediately hide elements via GSAP ───────
     Both must happen in the same effect so refs are non-null when gsap.set runs.
  ────────────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    setPortalMounted(true);
  }, []);

  /* useLayoutEffect (NOT useEffect): passive effects run AFTER paint, which
     let the panel flash fully-open for a frame on slow/heavy loads. Layout
     effects run before the browser paints the portal content. */
  useLayoutEffect(() => {
    if (!portalMounted) return;
    gsap.set(backdropRef.current, { autoAlpha: 0 });
    gsap.set(panelRef.current, {
      x:       '110%',
      rotateY:  28,
      opacity:  0,
    });
  }, [portalMounted]);

  /* ── Open ───────────────────────────────────────────────────────────────── */
  const openSidebar = useCallback(() => {
    const tl = gsap.timeline();

    // Backdrop fades in
    tl.to(backdropRef.current, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' });

    /* Panel swings in from the right — starts translated AND rotated (like a
       door opening on its right-edge hinge), then both animate to 0.           */
    tl.to(panelRef.current, {
      x:        0,
      rotateY:  0,
      opacity:  1,
      duration: 0.52,
      ease:    'back.out(1.15)',
    }, '-=0.14');

    // Close button pops in
    tl.fromTo(closeRef.current,
      { scale: 0.4, opacity: 0, rotate: -90 },
      { scale: 1,   opacity: 1, rotate: 0, duration: 0.3, ease: 'back.out(2)' },
      '-=0.22'
    );

    // Nav items flip up one by one (rotateX from tilted-back to flat)
    tl.fromTo(
      itemsRef.current.filter(Boolean),
      { x: 20, opacity: 0, rotateX: 22, transformOrigin: '0% 50%' },
      { x: 0,  opacity: 1, rotateX:  0, duration: 0.3, stagger: 0.055, ease: 'power2.out' },
      '-=0.24'
    );

    // Toggle appears last
    tl.fromTo(toggleRef.current,
      { opacity: 0, y: 10, scale: 0.9 },
      { opacity: 1, y: 0,  scale: 1,   duration: 0.26, ease: 'back.out(1.6)' },
      '-=0.1'
    );
  }, []);

  /* ── Close ──────────────────────────────────────────────────────────────── */
  const closeSidebar = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onClose });

    tl.to(toggleRef.current, { opacity: 0, y: 6, scale: 0.9, duration: 0.14 });
    tl.to(itemsRef.current.filter(Boolean), {
      x: 16, opacity: 0, rotateX: 18, stagger: 0.035, duration: 0.16, ease: 'power2.in',
    }, '-=0.08');
    tl.to(closeRef.current, { scale: 0.4, opacity: 0, rotate: 90, duration: 0.18 }, '-=0.1');
    tl.to(panelRef.current, {
      x:       '110%',
      rotateY:  28,
      opacity:  0,
      duration: 0.36,
      ease:    'power2.in',
    }, '-=0.06');
    tl.to(backdropRef.current, { autoAlpha: 0, duration: 0.24 }, '-=0.2');
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      openSidebar();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, openSidebar]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) closeSidebar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeSidebar]);

  if (!portalMounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div ref={backdropRef} className="sidebar-backdrop" onClick={closeSidebar} />

      {/* Perspective wrapper — the panel rotates in 3D within this space.
          perspectiveOrigin at the right edge mimics a right-edge hinge.        */}
      <div
        style={{
          position:          'fixed',
          inset:             0,
          zIndex:            99,
          perspective:       '900px',
          perspectiveOrigin: 'right center',
          pointerEvents:     'none',
        }}
      >
        <div ref={panelRef} className="sidebar-panel" style={{ pointerEvents: 'auto' }}>
          <div className="sidebar-inner">

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <NavLogo />
              <button
                ref={closeRef}
                className="sidebar-close-btn"
                onClick={closeSidebar}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="sidebar-divider" />

            {/* Nav links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, perspective: '600px' }}>
              {NAV_LINKS.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    ref={(el) => { itemsRef.current[i] = el; }}
                    className={`sidebar-nav-item${isActive ? ' active' : ''}`}
                    onClick={closeSidebar}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div style={{ flex: 1 }} />

            <div className="sidebar-divider" />
            <div
              ref={toggleRef}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
                Theme
              </span>
              <ThemeToggle3D />
            </div>

          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
