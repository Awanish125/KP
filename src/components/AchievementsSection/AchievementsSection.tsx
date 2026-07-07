"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import Link from "next/link";
import { observeOnce, prefersReducedMotion } from "@/lib/motion";
import { attachCursorGlow } from "@/lib/cursorGlow";
import { DEFAULT_STATS, ACHIEVEMENTS_DEFAULTS } from "./achievementsSectionConfig";
import type { AchievementsSectionProps } from "./achievementsSectionTypes";
import styles from "./AchievementsSection.module.css";

/* ── SVG icons ──────────────────────────────────────────────────────── */
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconBillboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="7" width="20" height="11" rx="1" />
      <path d="M2 11h20M8 18v3M16 18v3M8 21h8" />
      <line x1="6" y1="7" x2="6" y2="3" />
      <line x1="18" y1="7" x2="18" y2="3" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const ICON_MAP = {
  calendar: IconCalendar,
  billboard: IconBillboard,
  eye: IconEye,
  pin: IconPin,
  users: IconUsers,
  clock: IconClock,
} as const;

/* ── Count-up (pure rAF, no GSAP ticker — not per-frame scroll work) ── */
function animateCount(el: HTMLElement, target: number, duration = 1500) {
  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(ease(progress) * target).toLocaleString("en-IN");
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── Component ──────────────────────────────────────────────────────── */
export function AchievementsSection({
  eyebrow = ACHIEVEMENTS_DEFAULTS.eyebrow,
  heading = ACHIEVEMENTS_DEFAULTS.heading,
  headingAccent = ACHIEVEMENTS_DEFAULTS.headingAccent,
  stats = DEFAULT_STATS,
  tagline = ACHIEVEMENTS_DEFAULTS.tagline,
  taglineAccent = ACHIEVEMENTS_DEFAULTS.taglineAccent,
  ctaLabel = ACHIEVEMENTS_DEFAULTS.ctaLabel,
  ctaHref = ACHIEVEMENTS_DEFAULTS.ctaHref,
  className,
}: AchievementsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = prefersReducedMotion();

    /* Elements */
    const eyebrowEl = section.querySelector<HTMLElement>(`.${styles.eyebrow}`);
    const headingEl = section.querySelector<HTMLElement>(`.${styles.heading}`);
    const bottomEl = section.querySelector<HTMLElement>(`.${styles.bottom}`);
    const statEls = Array.from(section.querySelectorAll<HTMLElement>(`.${styles.stat}`));

    if (reduced) {
      /* Skip motion — just show everything */
      [eyebrowEl, headingEl, bottomEl].forEach((el) => {
        if (el) { el.style.opacity = "1"; el.style.transform = "none"; }
      });
      statEls.forEach((stat) => {
        stat.querySelectorAll<HTMLElement>(`.${styles.statIcon},.${styles.statNumber},.${styles.statSuffix},.${styles.statLabel},.${styles.statDesc}`)
          .forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
        const sweep = stat.querySelector<HTMLElement>(`.${styles.sweep}`);
        if (sweep) sweep.style.width = "100%";
        const numEl = stat.querySelector<HTMLElement>(`.${styles.statNumber}`);
        const idx = statEls.indexOf(stat);
        if (numEl && stats[idx]) numEl.textContent = String(stats[idx].value);
      });
      return;
    }

    /* Set initial GSAP state */
    if (eyebrowEl) gsap.set(eyebrowEl, { opacity: 0, y: 14 });
    if (headingEl) gsap.set(headingEl, { opacity: 0, y: 20 });
    if (bottomEl) gsap.set(bottomEl, { opacity: 0, y: 20 });
    statEls.forEach((stat) => {
      gsap.set(stat.querySelectorAll(`.${styles.statIcon},.${styles.statNumber},.${styles.statSuffix},.${styles.statLabel},.${styles.statDesc}`), { opacity: 0, y: 16 });
    });

    const cleanupGlow = attachCursorGlow(section);
    const cleanup = observeOnce(section, () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      /* Header */
      if (eyebrowEl) tl.to(eyebrowEl, { opacity: 1, y: 0, duration: 0.55 }, 0);
      if (headingEl) tl.to(headingEl, { opacity: 1, y: 0, duration: 0.65 }, 0.08);

      /* Orange sweep lines — all fire simultaneously, staggered by inline delay */
      statEls.forEach((stat, i) => {
        const sweep = stat.querySelector<HTMLElement>(`.${styles.sweep}`);
        if (!sweep) return;
        tl.to(sweep, { width: "100%", duration: 0.9, ease: "power2.inOut" }, 0.18 + i * 0.07);
      });

      /* Stat content — staggered per cell */
      statEls.forEach((stat, i) => {
        const delay = 0.22 + i * 0.07;
        const children = stat.querySelectorAll<HTMLElement>(
          `.${styles.statIcon},.${styles.statNumber},.${styles.statSuffix},.${styles.statLabel},.${styles.statDesc}`
        );
        tl.to(children, { opacity: 1, y: 0, duration: 0.5, stagger: 0.055 }, delay);

        /* Count-up fires independently so it can run its own rAF loop */
        const numEl = stat.querySelector<HTMLElement>(`.${styles.statNumber}`);
        if (numEl && stats[i]) {
          const countDelay = (delay + 0.08) * 1000;
          setTimeout(() => animateCount(numEl, stats[i].value), countDelay);
        }
      });

      /* Bottom bar */
      if (bottomEl) tl.to(bottomEl, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" }, 0.55);
    }, "0px 0px -14% 0px");

    return () => { cleanup(); cleanupGlow(); };
  }, [stats]);

  return (
    <section ref={sectionRef} className={[styles.section, className].filter(Boolean).join(" ")} aria-label="Achievements">
      {/* Cursor glow overlay — fed by attachCursorGlow in useEffect */}
      <div className="kp-glow-layer" aria-hidden />
      {/* Atmospheric orbs */}
      <div className={styles.orbOrange} aria-hidden />
      <div className={styles.orbBlue} aria-hidden />

      <div className={styles.inner}>
        {/* Header */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 className={styles.heading}>
            {heading} <em className={styles.headingAccent}>{headingAccent}</em>
          </h2>
        </header>

        {/* Stats grid */}
        <div className={styles.grid} role="list">
          {stats.map((stat, i) => {
            const Icon = ICON_MAP[stat.icon];
            return (
              <div key={i} className={styles.stat} role="listitem">
                <span className={styles.sweep} aria-hidden />
                {stat.image ? (
                  <div className={styles.statImg}>
                    <Image
                      src={stat.image}
                      alt={stat.imageAlt ?? stat.label}
                      fill
                      sizes="56px"
                      className={styles.statImgEl}
                    />
                  </div>
                ) : (
                  <Icon />
                )}
                <div className={styles.numRow} aria-label={`${stat.value}${stat.suffix} ${stat.label}`}>
                  <span className={styles.statNumber}>0</span>
                  {stat.suffix && <span className={styles.statSuffix} aria-hidden>{stat.suffix}</span>}
                </div>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statDesc}>{stat.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className={styles.bottom}>
          <p className={styles.tagline}>
            {tagline} <strong className={styles.taglineAccent}>{taglineAccent}</strong>
          </p>
          <Link href={ctaHref} className={styles.cta}>
            {ctaLabel}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
