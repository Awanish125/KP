'use client';

import { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { NavLogo } from './NavLogo';
import { ThemeToggle3D } from './ThemeToggle3D';

const NAV_LINKS = [
  { label: 'Home',        href: '/' },
  { label: 'About',       href: '/about' },
  { label: 'Features',    href: '/features' },
  { label: 'Pricing',     href: '/pricing' },
  { label: 'Integration', href: '/integration' },
  { label: 'Blog',        href: '/blog' },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);
  const itemsRef    = useRef<(HTMLAnchorElement | null)[]>([]);
  const toggleRef   = useRef<HTMLDivElement>(null);

  // Initialise hidden on mount
  useEffect(() => {
    gsap.set(backdropRef.current, { autoAlpha: 0 });
    gsap.set(panelRef.current,    { x: '110%', opacity: 0 });
  }, []);

  const openSidebar = useCallback(() => {
    const tl = gsap.timeline();

    tl.to(backdropRef.current, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
    tl.to(panelRef.current,
      { x: 0, opacity: 1, duration: 0.48, ease: 'back.out(1.2)' },
      '-=0.15'
    );
    tl.fromTo(
      itemsRef.current.filter(Boolean),
      { x: 28, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.065, duration: 0.32, ease: 'power2.out' },
      '-=0.22'
    );
    tl.fromTo(toggleRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
      '-=0.1'
    );
  }, []);

  const closeSidebar = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onClose });

    tl.to(itemsRef.current.filter(Boolean),
      { x: 20, opacity: 0, stagger: 0.04, duration: 0.18, ease: 'power2.in' }
    );
    tl.to(toggleRef.current, { opacity: 0, y: 8, duration: 0.18 }, '-=0.1');
    tl.to(panelRef.current,
      { x: '110%', opacity: 0, duration: 0.36, ease: 'power2.in' },
      '-=0.05'
    );
    tl.to(backdropRef.current, { autoAlpha: 0, duration: 0.28 }, '-=0.2');
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      openSidebar();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, openSidebar]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) closeSidebar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeSidebar]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div ref={backdropRef} className="sidebar-backdrop" onClick={closeSidebar} />

      {/* Glass panel */}
      <div ref={panelRef} className="sidebar-panel">
        <div className="sidebar-inner">
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <NavLogo />
            <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
              <X size={16} />
            </button>
          </div>

          {/* Divider */}
          <div className="sidebar-divider" />

          {/* Nav links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Divider + toggle */}
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
    </>,
    document.body
  );
}
