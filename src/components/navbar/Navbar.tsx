'use client';

import { useRef, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import gsap from 'gsap';
import { NavLogo }       from './NavLogo';
import { NavItems }      from './NavItems';
import { ThemeToggle3D } from './ThemeToggle3D';
import { MobileSidebar } from './MobileSidebar';

export function Navbar() {
  const navRef     = useRef<HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // ── Entrance ─────────────────────────────────────────────
    const entrance = gsap.fromTo(nav,
      { y: -90, opacity: 0, filter: 'blur(8px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.88,
        ease: 'power3.out',
        delay: 0.08,
        onComplete() {
          // ── Idle float starts after entrance ─────────────────
          gsap.to(nav, {
            y: -6,
            duration: 3.0,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
        },
      }
    );

    // ── Mouse parallax (desktop only) ────────────────────────
    const xTo = gsap.quickTo(nav, 'rotateY', { duration: 0.55, ease: 'power2.out' });
    const yTo = gsap.quickTo(nav, 'rotateX', { duration: 0.55, ease: 'power2.out' });

    const onMove = (e: MouseEvent) => {
      const r  = nav.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      // subtle — max ±4° horizontal, ±2° vertical
      xTo(((e.clientX - cx) / (r.width  / 2)) *  4);
      yTo(((cy - e.clientY) / (r.height / 2)) *  2);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    nav.addEventListener('mousemove', onMove);
    nav.addEventListener('mouseleave', onLeave);

    return () => {
      entrance.kill();
      nav.removeEventListener('mousemove', onMove);
      nav.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <>
      <div className="navbar-fixed-wrapper">
        <nav
          ref={navRef}
          className="glass-navbar"
          role="navigation"
          aria-label="Main navigation"
        >
          <NavLogo />

          {/* Desktop nav items */}
          <div className="hidden md:flex items-center">
            <NavItems />
          </div>

          {/* Separator */}
          <div
            className="hidden md:block self-stretch"
            style={{
              width: 1,
              background: 'var(--glass-border)',
              margin: '10px 4px',
            }}
          />

          {/* Desktop theme toggle */}
          <div className="hidden md:flex items-center pr-1">
            <ThemeToggle3D />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu size={18} color="var(--navbar-text)" />
          </button>
        </nav>
      </div>

      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  );
}
