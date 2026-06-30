'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { NavLogo }       from './NavLogo';
import { NavItems }      from './NavItems';
import { ThemeToggle3D } from './ThemeToggle3D';
import { MobileSidebar } from './MobileSidebar';

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
    window.dispatchEvent(new Event('kp:sidebarOpen'));
  };
  const closeSidebar = () => {
    setSidebarOpen(false);
    window.dispatchEvent(new Event('kp:sidebarClose'));
  };

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    /* ── Premium 3D entrance ──────────────────────────────────────────────────
       The navbar starts rotated backward on the X axis (like a hatch folding
       down from above), scaled slightly small, blurred, and invisible.
       It unfolds into flat/full as it enters — a genuinely spatial arrival.
    ────────────────────────────────────────────────────────────────────────── */
    const entrance = gsap.fromTo(nav,
      {
        y:       -70,
        opacity: 0,
        rotateX: -40,      // tilted back — top face visible, hatch-open pose
        scaleX:  0.82,
        filter:  'blur(12px)',
      },
      {
        y:       0,
        opacity: 1,
        rotateX: 0,
        scaleX:  1,
        filter:  'blur(0px)',
        duration: 1.05,
        ease:    'power3.out',
        delay:   0.1,
        onComplete() {
          /* ── Idle float loop ─────────────────────────────────────────────── */
          gsap.to(nav, {
            y:       -5,
            rotateX:  0.6,   // breathes with a hair of perspective tilt
            duration: 3.0,
            ease:    'sine.inOut',
            yoyo:    true,
            repeat:  -1,
          });
        },
      }
    );

    /* ── Mouse parallax — 3D tilt follows cursor ──────────────────────────────
       IMPORTANT: use a single gsap.to that animates BOTH rotateX and rotateY
       together.  Separate quickTo calls for each axis conflict because they
       both try to own the same CSS transform property and GSAP cannot
       independently reset shorthand rotation aliases. Combining them into one
       tween + overwrite:'auto' avoids that entirely.
    ────────────────────────────────────────────────────────────────────────── */
    const onMove = (e: MouseEvent) => {
      const r  = nav.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;

      gsap.to(nav, {
        rotateY: ((e.clientX - cx) / (r.width  / 2)) * 5,
        rotateX: ((cy - e.clientY) / (r.height / 2)) * 2.5,
        duration:  0.55,
        ease:     'power2.out',
        overwrite: 'auto',
      });
    };

    const onLeave = () => {
      gsap.to(nav, {
        rotateY:   0,
        rotateX:   0,
        duration:  0.9,
        ease:     'elastic.out(1, 0.45)',
        overwrite: 'auto',
      });
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

          <div className="hidden md:flex items-center">
            <NavItems />
          </div>

          <div
            className="hidden md:block self-stretch"
            style={{ width: 1, background: 'var(--navbar-border)', margin: '12px 8px' }}
          />

          <div className="hidden md:flex items-center pr-1">
            <ThemeToggle3D />
          </div>

          <button
            className="md:hidden hamburger-btn"
            onClick={openSidebar}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <span className="hamburger-lines">
              <span /><span /><span />
            </span>
          </button>
        </nav>
      </div>

      <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
    </>
  );
}
