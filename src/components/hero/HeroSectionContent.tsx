"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollIndicator } from "./ScrollIndicator";

interface HeroCta {
  label: string;
  href: string;
}

interface HeroSectionContentProps {
  badgeText?: string | null;
  subtitle: string;
  line1: string;
  line2: string;
  line3: string;
  description: string;
  primaryCta?: HeroCta | null;
  secondaryCta?: HeroCta | null;
  showScrollIndicator?: boolean;
  gradientColors: string[];
}

const HeroSectionContent = ({
  badgeText = null,
  subtitle,
  line1,
  line2,
  line3,
  description,
  primaryCta = null,
  secondaryCta = null,
  showScrollIndicator = true,
  gradientColors,
}: HeroSectionContentProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const gradient = `linear-gradient(to right, ${gradientColors.join(", ")})`;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;
    const items = section.querySelectorAll<HTMLElement>("[data-hero-item]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timeline: gsap.core.Timeline | null = null;

    const play = () => {
      if (reduced) {
        gsap.set([content, items], { autoAlpha: 1, y: 0 });
        return;
      }
      timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .to(content, { autoAlpha: 1, duration: 0.9, ease: "expo.out" })
        .to(items, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.075 }, 0.12)
        .fromTo(indicatorRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55 }, "-=0.35");
    };

    gsap.set(content, { autoAlpha: reduced ? 1 : 0 });
    gsap.set(items, { autoAlpha: reduced ? 1 : 0, y: reduced ? 0 : 24 });
    if (document.documentElement.classList.contains("page-revealed")) play();
    else window.addEventListener("kp:loaded", play, { once: true });

    return () => {
      window.removeEventListener("kp:loaded", play);
      timeline?.kill();
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative h-full w-full">
      <div aria-hidden className="hero-content-scrim pointer-events-none absolute inset-0" />
      <div
        ref={contentRef}
        data-hero-content
        className="relative flex h-full w-full flex-col items-center justify-center px-6 pt-24 text-center sm:px-10 md:w-[58%] md:items-start md:pt-0 md:text-left lg:px-16 2xl:px-24 [&_*]:[text-shadow:0_1px_18px_rgba(0,0,0,0.35)]"
      >
        {badgeText && (
          <div data-hero-item className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] py-1.5 pl-3 pr-4 backdrop-blur-md md:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-[11px] font-medium tracking-wide text-white/85 sm:text-xs">{badgeText}</span>
          </div>
        )}

        <p data-hero-item className="mb-4 text-[10px] font-semibold uppercase tracking-[0.45em] text-primary-light sm:text-xs sm:tracking-[0.5em] md:mb-5">
          {subtitle}
        </p>
        <h1 data-hero-item className="hero-text-balance font-heading text-[2.6rem] font-bold leading-[1.08] text-white sm:text-6xl md:text-[4rem] md:leading-[1.05] xl:text-[4.5rem] 2xl:text-[5rem]">
          <span className="block">{line1}</span>
          <span className="block bg-[length:200%_100%] bg-clip-text text-transparent" style={{ backgroundImage: gradient }}>{line2}</span>
          <span className="block">{line3}</span>
        </h1>
        <span data-hero-item aria-hidden className="mt-6 block h-px w-16 bg-gradient-to-r from-accent/80 to-transparent md:mt-8 md:w-24" />
        <p data-hero-item className="mt-5 max-w-md text-sm leading-relaxed text-white/70 sm:text-base md:mt-6 lg:max-w-lg">{description}</p>

        {(primaryCta || secondaryCta) && (
          <div data-hero-item className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4 md:mt-10">
            {primaryCta && (
              <Link href={primaryCta.href} className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white no-underline">
                {primaryCta.label}<ArrowUpRight size={16} />
              </Link>
            )}
            {secondaryCta && (
              <Link href={secondaryCta.href} className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/[0.06] px-7 py-3.5 text-sm font-medium text-white no-underline backdrop-blur-md">
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
      {showScrollIndicator && <ScrollIndicator scrollIndicatorRef={indicatorRef} />}
    </div>
  );
};

export default HeroSectionContent;
