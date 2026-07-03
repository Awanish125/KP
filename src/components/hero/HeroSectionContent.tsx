"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ArrowUpRight } from "lucide-react";
import { ScrollIndicator } from "./ScrollIndicator";

interface HeroCta {
  label: string;
  href: string;
}

interface HeroSectionContentProps {
  /** Pass null / omit to hide the announcement badge. */
  badgeText?: string | null;
  subtitle?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  description?: string;
  /** Pass null to hide a CTA. */
  primaryCta?: HeroCta | null;
  secondaryCta?: HeroCta | null;
  showScrollIndicator?: boolean;
  /** CSS colors for the left-to-right gradient on line2. Min 2 values. */
  gradientColors?: string[];
}

/**
 * Hero overlay content. The animated WebGL background lives in
 * HeroSection.tsx and is untouched — this layer only renders on top of it
 * (HeroSection already provides the z-20 children slot and its own
 * top/bottom scrims).
 *
 * Sequencing contract: the entrance timeline NEVER starts while the Loading
 * overlay is playing. Loading.tsx dispatches `kp:loaded` and adds
 * `.page-revealed` to <html> when its exit finishes — we start on that
 * event, or immediately if the class is already present (client-side
 * back-navigation, HMR).
 *
 * Scroll parallax follows the project's Lenis rules (memory:
 * feedback-scroll-performance): one gsap.ticker callback gated by
 * IntersectionObserver — no scrubbed ScrollTrigger, no per-frame work once
 * the hero has scrolled out of view. Transform/opacity only.
 */
const HeroSectionContent = ({
  badgeText = null,
  subtitle = "Premium Outdoor Advertising",
  line1 = "MAKING BRANDS",
  line2 = "IMPOSSIBLE",
  line3 = "TO IGNORE",
  description = "Billboards, transit and digital placements engineered to stop traffic — from concept to installation, handled end to end.",
  primaryCta = null,
  secondaryCta = null,
  showScrollIndicator = true,
  gradientColors = ["#6F5BFF", "#B86CCB", "#F16B57", "#FF6B1A"],
}: HeroSectionContentProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const gradient = `linear-gradient(to right, ${gradientColors.join(", ")})`;

  // ── Entrance (gated on the loading overlay finishing) ──────────────────
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const items = section.querySelectorAll<HTMLElement>("[data-hero-item]");

    if (reduced) {
      gsap.set(content, { autoAlpha: 1 });
      return;
    }

    // Hidden before first paint (useLayoutEffect) — no flash even if the
    // loading overlay were skipped.
    gsap.set(content, { autoAlpha: 0, scale: 1.06 });
    gsap.set(items, { autoAlpha: 0, y: 26 });

    let tl: gsap.core.Timeline | null = null;

    const play = () => {
      content.style.willChange = "transform, opacity";
      tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          content.style.willChange = "auto";
        },
      });
      tl.to(content, {
        autoAlpha: 1,
        scale: 1,
        duration: 1.1,
        ease: "expo.out",
      });
      tl.to(items, { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.09 }, 0.15);
      if (indicatorRef.current) {
        tl.fromTo(
          indicatorRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.6 },
          "-=0.4",
        );
      }
    };

    if (document.documentElement.classList.contains("page-revealed")) {
      play();
    } else {
      window.addEventListener("kp:loaded", play, { once: true });
    }

    return () => {
      window.removeEventListener("kp:loaded", play);
      tl?.kill();
    };
  }, []);

  // ── Scroll parallax — gsap.ticker gated by IntersectionObserver ────────
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const headline = section.querySelector<HTMLElement>("[data-hero-headline]");
    const indicator = indicatorRef.current;

    const setContentY = gsap.quickSetter(content, "y", "px");
    const setContentAlpha = gsap.quickSetter(content, "opacity");
    const setHeadY = headline ? gsap.quickSetter(headline, "y", "px") : null;
    const setIndAlpha = indicator
      ? gsap.quickSetter(indicator, "opacity")
      : null;

    let lastY = -1;
    const update = () => {
      const y = window.scrollY;
      if (y === lastY) return;
      lastY = y;
      const p = Math.min(Math.max(y / window.innerHeight, 0), 1);
      // Layers drift at different speeds; everything fades as the hero exits.
      setContentY(p * -46);
      setContentAlpha(1 - p * 1.1);
      setHeadY?.(p * -28);
      setIndAlpha?.(Math.max(1 - p * 3, 0));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) gsap.ticker.add(update);
        else gsap.ticker.remove(update);
      },
      { threshold: 0 },
    );
    observer.observe(section);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative h-full w-full">
      {/* Desktop readability scrim — left column only, so the background
          stays the star on wide screens. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] md:block"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.22) 55%, transparent 100%)",
        }}
      />

      {/* Mobile readability scrim — content is centered full-width over the
          image (which can be bright behind the text), so darken the whole
          band vertically. Strongest through the middle where the headline
          sits; lighter at the edges to keep the background visible. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.58) 42%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      <div
        ref={contentRef}
        className="relative flex h-full w-full flex-col items-center justify-center px-6 pt-24 text-center sm:px-10 md:w-[58%] md:items-start md:pt-0 md:text-left lg:px-16 2xl:px-24 [&_*]:[text-shadow:0_1px_18px_rgba(0,0,0,0.35)]"
      >
        {/* Announcement badge (optional) */}
        {badgeText && (
          <div
            data-hero-item
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] py-1.5 pl-3 pr-4 backdrop-blur-md md:mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-[11px] font-medium tracking-wide text-white/85 sm:text-xs">
              {badgeText}
            </span>
          </div>
        )}

        {/* Eyebrow */}
        <p
          data-hero-item
          className="mb-4 text-[10px] font-semibold uppercase tracking-[0.45em] text-primary-light sm:text-xs sm:tracking-[0.5em] md:mb-5"
        >
          {subtitle}
        </p>

        {/* Headline */}
        <h1
          data-hero-item
          data-hero-headline
          className="hero-text-balance font-heading text-[2.6rem] font-bold leading-[1.08] text-white sm:text-6xl md:text-[4rem] md:leading-[1.05] xl:text-[4.5rem] 2xl:text-[5rem]"
        >
          <span className="block">{line1}</span>
          <span
            className="block bg-[length:200%_100%] bg-clip-text text-transparent"
            style={{ backgroundImage: gradient }}
          >
            {line2}
          </span>
          <span className="block">{line3}</span>
        </h1>

        {/* Divider */}
        <span
          data-hero-item
          aria-hidden
          className="mt-6 block h-px w-16 bg-gradient-to-r from-accent/80 to-transparent md:mt-8 md:w-24"
        />

        {/* Description */}
        <p
          data-hero-item
          className="mt-5 max-w-md text-sm leading-relaxed text-white/70 sm:text-base md:mt-6 lg:max-w-lg"
        >
          {description}
        </p>

        {/* CTAs */}

        {(primaryCta || secondaryCta) && (
          <div
            data-hero-item
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4 md:mt-10"
          >
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white no-underline shadow-[0_10px_30px_rgba(245,131,32,0.35)] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-[0_14px_36px_rgba(245,131,32,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:px-8"
              >
                {primaryCta.label}
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            )}

            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-7 py-3.5 text-sm font-medium text-white no-underline backdrop-blur-md transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:px-8"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>

      {showScrollIndicator && (
        <ScrollIndicator scrollIndicatorRef={indicatorRef} />
      )}
    </div>
  );
};

export default HeroSectionContent;
