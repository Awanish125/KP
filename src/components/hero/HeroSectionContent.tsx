"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollIndicator } from "./ScrollIndicator";
import { ScrambleText } from "@/components/ScrambleText";

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

    // Separate focus-line spans (h1 children) from the other hero items
    const focusLines = Array.from(
      section.querySelectorAll<HTMLElement>("[data-focus-line]"),
    );
    const regularItems = Array.from(items).filter(
      (el) => !el.hasAttribute("data-focus-line"),
    );

    // Letter dropout idle loop — wraps individual letters of non-gradient
    // focus lines (line1 = index 0, line3 = index 2) into spans so a random
    // letter can dip to opacity 0.18 and recover on a staggered timer.
    // Line 2 (gradient) is skipped to avoid breaking background-clip:text.
    const startDropout = () => {
      if (reduced) return;
      const letters: HTMLSpanElement[] = [];
      [focusLines[0], focusLines[2]].filter(Boolean).forEach((line) => {
        [...(line.childNodes)].forEach((node) => {
          if (node.nodeType !== Node.TEXT_NODE) return;
          const frag = document.createDocumentFragment();
          [...(node.textContent ?? "")].forEach((ch) => {
            const s = document.createElement("span");
            s.textContent = ch;
            s.style.display = "inline";
            frag.appendChild(s);
            if (ch.trim()) letters.push(s);
          });
          node.replaceWith(frag);
        });
      });

      if (!letters.length) return;
      const flick = () => {
        const s = letters[(Math.random() * letters.length) | 0];
        gsap.timeline({
          onComplete: () =>
            gsap.delayedCall(1.8 + Math.random() * 3.2, flick),
        })
          .to(s, { opacity: 0.18, duration: 0.08, ease: "power2.in" })
          .to(s, { opacity: 1,    duration: 0.45, ease: "power2.out" });
      };
      gsap.delayedCall(1.5, flick);
    };

    const play = () => {
      if (reduced) {
        gsap.set(items, { autoAlpha: 1, y: 0, filter: "none", scale: 1 });
        return;
      }
      timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: startDropout,
      });
      timeline
        // Subtitle, divider, description, CTAs — simple fade-up
        .to(regularItems, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.075 })
        // Rack focus: h1 lines snap from blurred+oversized → sharp
        .fromTo(
          focusLines,
          { scale: 1.18, filter: "blur(22px)", autoAlpha: 0, transformOrigin: "0% 100%" },
          { scale: 1, filter: "blur(0px)", autoAlpha: 1, duration: 1.4, stagger: 0.12, ease: "expo.out" },
          "<0.15",
        )
        .fromTo(indicatorRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55 }, "-=0.4");
    };

    // PinnedHero owns the content wrapper's visibility (via its fromTo depart tween).
    // We only hide/animate the inner items — the container stays under PinnedHero control.
    gsap.set(regularItems, { autoAlpha: reduced ? 1 : 0, y: reduced ? 0 : 24 });
    gsap.set(focusLines, { autoAlpha: reduced ? 1 : 0 });
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
          <ScrambleText text={subtitle} duration={1.0} trigger="immediate" />
        </p>
        {/* h1 has no data-hero-item — each span is animated individually via data-focus-line */}
        <h1 className="hero-text-balance font-heading text-[2.6rem] font-bold leading-[1.08] text-white sm:text-6xl md:text-[4rem] md:leading-[1.05] xl:text-[4.5rem] 2xl:text-[5rem]">
          <span data-focus-line className="block">{line1}</span>
          <span data-focus-line className="block bg-[length:200%_100%] bg-clip-text text-transparent" style={{ backgroundImage: gradient }}>{line2}</span>
          <span data-focus-line className="block">{line3}</span>
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
