'use client';

import { useRef, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import gsap from 'gsap';
import { useTheme } from '@components/theme';

const TRACK_W   = 112;
const TRACK_H   = 50;
const KNOB_SIZE = 42;
const PAD       = 4;
const TRAVEL    = TRACK_W - KNOB_SIZE - PAD * 2; // 62px

export function ThemeToggle3D() {
  const { resolvedTheme, setTheme, mounted } = useTheme();
  const isDark = mounted && resolvedTheme === 'dark';

  const knobRef      = useRef<HTMLDivElement>(null);
  const sunRef       = useRef<HTMLDivElement>(null);
  const moonRef      = useRef<HTMLDivElement>(null);
  const glowRef      = useRef<HTMLDivElement>(null);
  const labelDarkRef = useRef<HTMLSpanElement>(null);
  const labelLitRef  = useRef<HTMLSpanElement>(null);
  const animating    = useRef(false);
  // Tracks the last isDark value we've applied so we can detect external changes
  const prevIsDark   = useRef<boolean | null>(null);

  useEffect(() => {
    if (!mounted) return;

    /* ── First mount: set position instantly, no animation ─────────────────── */
    if (prevIsDark.current === null) {
      prevIsDark.current = isDark;

      gsap.set(knobRef.current,     { x: isDark ? TRAVEL : 0 });
      gsap.set(sunRef.current,      { opacity: isDark ? 0 : 1, rotate: isDark ?  90 : 0, scale: isDark ? 0.6 : 1 });
      gsap.set(moonRef.current,     { opacity: isDark ? 1 : 0, rotate: isDark ?   0 : -90, scale: isDark ? 1 : 0.6 });
      gsap.set(labelDarkRef.current, { opacity: isDark ? 1 : 0.3 });
      gsap.set(labelLitRef.current,  { opacity: isDark ? 0.3 : 1 });
      gsap.set(glowRef.current,     { opacity: 0, scale: 1 });

      // Idle knob breathing
      gsap.to(knobRef.current, {
        boxShadow: isDark
          ? '0 4px 16px rgba(0,0,0,0.7),  0 1px 4px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
          : '0 4px 16px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)',
        duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
      });
      return;
    }

    /* ── External theme change (another toggle / system pref) ───────────────
       Our own handleToggle sets prevIsDark before calling setTheme, so by the
       time this effect fires after our own click, prevIsDark already matches
       isDark and we skip — no double-animation.
    ────────────────────────────────────────────────────────────────────────── */
    if (prevIsDark.current === isDark) return;
    prevIsDark.current = isDark;

    if (animating.current) return; // our own animation is mid-flight, skip

    // Animate toggle visuals to match the new theme
    const outIcon = isDark ? sunRef.current  : moonRef.current;
    const inIcon  = isDark ? moonRef.current : sunRef.current;

    gsap.to(knobRef.current, { x: isDark ? TRAVEL : 0, duration: 0.48, ease: 'back.out(1.8)' });
    gsap.to(outIcon, { opacity: 0, rotate: isDark ? -90 : 90, scale: 0.5, duration: 0.22 });
    gsap.fromTo(inIcon,
      { opacity: 0, rotate: isDark ? 90 : -90, scale: 0.5 },
      { opacity: 1, rotate: 0, scale: 1, duration: 0.32, ease: 'back.out(1.6)', delay: 0.1 }
    );
    gsap.to(labelDarkRef.current, { opacity: isDark ? 1 : 0.3, duration: 0.3 });
    gsap.to(labelLitRef.current,  { opacity: isDark ? 0.3 : 1, duration: 0.3 });
  }, [mounted, isDark]);

  /* ── User clicks the toggle ─────────────────────────────────────────────── */
  const handleToggle = () => {
    if (!mounted || animating.current) return;
    animating.current = true;

    const goingDark = !isDark;
    // Mark the next state NOW so the sync effect skips when it fires
    prevIsDark.current = goingDark;

    const tl = gsap.timeline({ onComplete: () => { animating.current = false; } });

    tl.to(knobRef.current, { x: goingDark ? TRAVEL : 0, duration: 0.48, ease: 'back.out(1.8)' }, 0);

    // Squish during travel
    tl.to(knobRef.current, { scaleX: 0.86, scaleY: 1.08, duration: 0.14, ease: 'power2.in' }, 0);
    tl.to(knobRef.current, { scaleX: 1, scaleY: 1, duration: 0.38, ease: 'elastic.out(1, 0.48)' }, 0.14);

    const outIcon = goingDark ? sunRef.current  : moonRef.current;
    const inIcon  = goingDark ? moonRef.current : sunRef.current;
    tl.to(outIcon, { opacity: 0, rotate: goingDark ? -90 : 90, scale: 0.5, duration: 0.22, ease: 'power2.in' }, 0);
    tl.fromTo(inIcon,
      { opacity: 0, rotate: goingDark ? 90 : -90, scale: 0.5 },
      { opacity: 1, rotate: 0, scale: 1, duration: 0.32, ease: 'back.out(1.6)' },
      0.18
    );

    tl.to(labelDarkRef.current, { opacity: goingDark ? 1 : 0.3, duration: 0.3 }, 0);
    tl.to(labelLitRef.current,  { opacity: goingDark ? 0.3 : 1, duration: 0.3 }, 0);

    tl.fromTo(glowRef.current,
      { opacity: 0, scale: 0.7 },
      { opacity: 0.9, scale: 1.3, duration: 0.28, ease: 'power2.out' },
      0.06
    );
    tl.to(glowRef.current, { opacity: 0, scale: 2, duration: 0.34, ease: 'power2.in' }, 0.34);

    tl.call(() => setTheme(goingDark ? 'dark' : 'light'), [], 0.16);
  };

  if (!mounted) {
    return <div className="toggle-skeleton" style={{ width: TRACK_W, height: TRACK_H }} />;
  }

  return (
    <button
      type="button"
      className="toggle-btn"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="toggle-track" style={{ width: TRACK_W, height: TRACK_H }}>
        <span ref={labelDarkRef} className="toggle-label toggle-label-dark">Dark</span>
        <span ref={labelLitRef}  className="toggle-label toggle-label-light">Light</span>

        <div ref={knobRef} className="toggle-knob" style={{ width: KNOB_SIZE, height: KNOB_SIZE, top: PAD, left: PAD }}>
          <div ref={glowRef} className="toggle-knob-glow" />
          <div ref={sunRef}  className="toggle-icon-wrap toggle-icon-sun"><Sun  size={17} strokeWidth={2.5} /></div>
          <div ref={moonRef} className="toggle-icon-wrap toggle-icon-moon"><Moon size={15} strokeWidth={2.5} /></div>
        </div>
      </div>
    </button>
  );
}
