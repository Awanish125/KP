"use client";

/**
 * page.tsx — Kiran Publicity home page.
 *
 * All copy / content lives in src/data/home.json.
 * Edit that file to change text, images, stats, or brand names.
 *
 * The 3D billboard is fully isolated in HeroSection.
 * To disable it (no WebGL, no Three.js loaded at all), remove the hero
 * wrapper block below.
 */

import { useRef, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { HeroSection, HeroSectionContent, PinnedHeroMarquee } from "@/components/hero";
import type { HeroMarqueeConfig } from "@/components/hero/marqueeTypes";
import { Loading } from "@/components/ui";
import { PremiumMarquee } from "@/components/PremiumMarquee";
import { PremiumRevealSection } from "@/components/PremiumRevealSection";
import { CampaignGallery, type Campaign } from "@/components/gallery";
import { GALLERY_CATEGORIES } from "@/data/categories";
import data from "@/data/home.json";

gsap.registerPlugin(ScrollTrigger);

// Transform brands list into the shape PremiumMarquee expects.
const BRANDS = data.brands.map((text) => ({ type: "text" as const, text }));

// Category cards for the homepage gallery section — one premium card per
// category, showing that category's own cover image. Clicking one opens the
// gallery page pre-filtered to it. Covers are configured in data/categories.ts.
const SIZES = ["lg", "md", "tall", "wide", "sm", "md"] as const;
const CATEGORY_CARDS: Campaign[] = GALLERY_CATEGORIES.map((c, i) => ({
  id: `category-${c.name}`,
  title: c.name,
  category: `${c.count} photos`,
  location: "View collection",
  duration: "Tap to explore",
  type: "category",
  image: c.image,
  size: SIZES[i % SIZES.length],
}));

// Module-level constant so the reference is always stable.
// The images come from home.json and never change at runtime.
const SHOWCASE_IMAGES = data.showcase.images;

export default function Home() {
  const router = useRouter();
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  /* ── Lenis smooth scroll ─────────────────────────────────────────────── */
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
    });
    lenis.on("scroll", () => ScrollTrigger.update());
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  /* ── Scroll animations (counters + text reveals) ────────────────────── */
  useGSAP(() => {
    data.about.stats.forEach((stat, i) => {
      const el = counterRefs.current[i];
      if (!el) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: stat.value,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: "#s2", start: "top 60%" },
        onUpdate: () => {
          el.textContent = Math.round(obj.val).toString();
        },
      });
    });

    gsap.fromTo(
      "#s2-content > *",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: "#s2", start: "top 65%" },
      },
    );
    gsap.fromTo(
      "#s3-content > *",
      { opacity: 0, x: 30 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.07,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: "#s3", start: "top 65%" },
      },
    );
  }, []);

  /* ── JSX ──────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-white dark:bg-secondary" style={{ overflowX: "clip" }}>
      <Loading />

      <PinnedHeroMarquee marquee={data.hero.marquee as HeroMarqueeConfig} stats={data.hero.stats}>
        <HeroSection images={data.hero.images}>
          <HeroSectionContent
            subtitle={data.hero.subtitle}
            line1={data.hero.line1}
            line2={data.hero.line2}
            line3={data.hero.line3}
            gradientColors={data.hero.gradientColors}
            primaryCta={null}
            secondaryCta={null}
          />
        </HeroSection>
      </PinnedHeroMarquee>

      {/* ── Brands marquee ─────────────────────────────────────────────── */}
      <PremiumMarquee
        items={BRANDS}
        speed={60}
        direction="left"
        gap={52}
        itemPadding="px-0 py-5"
        borderRadius="rounded-none"
        separatorIcon="diamond"
        separatorPosition="before"
        separatorSpacing={14}
        bgColor="var(--bg)"
        fadeWidth="7rem"
        showTopDivider
        // showBottomDivider
        showScrollSpeedEffect
        showGradientSweep
        showHoverLift
        showFadeEdges
        // showEntranceAnimation
        entranceDirection="top"
        entranceRepeat={true}
        showVelocityStretch
        showSeparatorAnimation
        pauseOnHover
      />
      <PremiumMarquee
        items={BRANDS}
        speed={60}
        direction="left"
        gap={52}
        itemPadding="px-0 py-5"
        borderRadius="rounded-none"
        separatorIcon="diamond"
        separatorPosition="before"
        separatorSpacing={14}
        bgColor="var(--bg)"
        fadeWidth="7rem"
        // showTopDivider
        showBottomDivider
        showScrollSpeedEffect
        showGradientSweep
        showHoverLift
        showFadeEdges
        // showEntranceAnimation
        entranceDirection="bottom"
        entranceRepeat={true}
        showVelocityStretch
        showSeparatorAnimation
        pauseOnHover
      />
      {/* ── S-2: About ─────────────────────────────────────────────────── */}
      <section id="s2" className="relative flex h-screen">
        <div className="relative z-10 w-full md:w-1/2 flex items-center px-8 md:px-16 lg:px-20">
          <div id="s2-content" className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-6 h-px bg-kp-orange/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">
                {data.about.sectionLabel}
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-secondary dark:text-white mb-8">
              {data.about.heading.split("\n").map((line, i) => (
                <Fragment key={i}>
                  {line}
                  <br />
                </Fragment>
              ))}
              <em className="not-italic text-secondary/40 dark:text-white/40">
                {data.about.headingEmphasis}
              </em>
              {data.about.headingSuffix}
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8 pt-6 border-t border-secondary/8 dark:border-white/8">
              {data.about.stats.map((s, i) => (
                <div key={i}>
                  <div className="flex items-baseline gap-0.5">
                    <span
                      ref={(el) => {
                        counterRefs.current[i] = el;
                      }}
                      className="text-3xl lg:text-4xl font-extralight text-secondary dark:text-white tabular-nums"
                    >
                      0
                    </span>
                    <span className="text-lg font-light text-kp-orange">
                      {s.suffix}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-secondary/55 dark:text-white/55 mt-1 whitespace-pre-line">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-sm text-secondary/60 dark:text-white/60 leading-relaxed">
              {data.about.paragraph}
            </p>
          </div>
        </div>

        <div className="hidden md:block w-1/2 h-full" aria-hidden="true" />
      </section>

      {/* ── S-3: Services ──────────────────────────────────────────────── */}
      <section id="s3" className="relative flex h-screen">
        <div className="hidden md:block w-1/2 h-full" aria-hidden="true" />

        <div className="relative z-10 w-full md:w-1/2 flex items-center px-8 md:px-16 lg:px-20">
          <div id="s3-content" className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-6 h-px bg-kp-orange/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">
                {data.services.sectionLabel}
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-secondary dark:text-white mb-10">
              {data.services.heading}
              <br />
              <em className="not-italic text-secondary/40 dark:text-white/40">
                {data.services.headingEmphasis}
              </em>
            </h2>

            <ul className="divide-y divide-secondary/8 dark:divide-white/6">
              {data.services.items.map((s, i) => (
                <li key={i} className="group flex items-start gap-4 py-3.5">
                  <span className="text-[10px] font-mono text-secondary/55 dark:text-white/55 mt-0.5 w-5 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-light text-secondary/80 dark:text-white/80 group-hover:text-secondary dark:group-hover:text-white transition-colors">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-secondary/55 dark:text-white/55 mt-0.5 leading-snug">
                      {s.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── S-5: Showcase (image reveal) ───────────────────────────────── */}
      <PremiumRevealSection
        images={SHOWCASE_IMAGES}
        animationStyle="cameraZoom"
        repeatOnScroll={true}
        scrollStart="top 75%"
        minHeight="100vh"
        backgroundColorClass="bg-white dark:bg-secondary"
        animationEnabled
        showEntranceAnimation
        showBlurEffect
        showScaleAnimation
        showFadeAnimation
        showRotation
        showStaggerAnimation
        animationDuration={0.1}
        staggerAmount={0.5}
        showOvershoot={true}
        showLandingJerk={true}
        showBounceEffect={true}
        showFloatingAnimation
        showMouseParallax
        showScrollParallax
        showDepthEffect
        showHoverInteraction
        showBackgroundGradient
        showNoiseTexture={true}
        showGlow={false}
      >
        {/* Centred content sits above the floating images */}
        <div className="relative flex items-center justify-center min-h-screen px-6">
          <div className="text-center max-w-lg">
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="block w-6 h-px bg-kp-orange/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">
                {data.showcase.sectionLabel}
              </span>
              <span className="block w-6 h-px bg-kp-orange/60" />
            </div>

            <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-secondary dark:text-white mb-6">
              {data.showcase.heading.split("\n").map((line, i) => (
                <Fragment key={i}>
                  {line}
                  <br />
                </Fragment>
              ))}
              <em className="not-italic text-secondary/35 dark:text-white/35">
                {data.showcase.headingEmphasis}
              </em>
            </h2>

            <p className="text-sm text-secondary/60 dark:text-white/60 leading-relaxed mb-10 max-w-sm mx-auto">
              {data.showcase.body}
            </p>

            <button className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-secondary/70 dark:text-white/70 hover:text-kp-orange dark:hover:text-kp-orange transition-colors duration-300">
              {data.showcase.cta}
              <span className="block w-5 h-px bg-current transition-all duration-300 group-hover:w-8" />
            </button>
          </div>
        </div>
      </PremiumRevealSection>

      {/* ── S-6: Gallery categories — click opens /gallery pre-filtered ── */}
      <CampaignGallery
        campaigns={CATEGORY_CARDS}
        glowColor="rgba(0,100,177,0.5)"
        onCardClick={(card) => router.push(`/gallery?category=${encodeURIComponent(card.title)}`)}
      />

      {/* ── S-4: Process (pinned scroll) ───────────────────────────────── */}
      <div id="s4-wrapper" style={{ height: "400vh" }}>
        <section className="sticky top-0 h-screen flex overflow-hidden">
          <div className="relative z-10 w-full md:w-1/2 flex items-center px-8 md:px-16 lg:px-20">
            <div className="absolute top-8 left-8 md:left-16 lg:left-20 flex items-center gap-3">
              <span className="block w-6 h-px bg-kp-orange/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">
                {data.process.sectionLabel}
              </span>
            </div>

            <div
              className="relative w-full max-w-md"
              style={{ minHeight: 280 }}
            >
              {data.process.steps.map((step, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  className="absolute inset-0 flex flex-col justify-center"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="block w-6 h-px bg-kp-orange/60" />
                    <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">
                      {step.label}
                    </span>
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.15] text-secondary dark:text-white mb-6 whitespace-pre-line">
                    {step.heading}
                  </h2>
                  <p className="text-sm text-secondary/60 dark:text-white/60 leading-relaxed max-w-xs">
                    {step.body}
                  </p>
                  <div className="flex gap-2 mt-8">
                    {data.process.steps.map((_, j) => (
                      <span
                        key={j}
                        className={`block h-px w-6 transition-colors duration-300 ${
                          j === i
                            ? "bg-kp-orange"
                            : "bg-secondary/20 dark:bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block w-1/2 h-full" aria-hidden="true" />
        </section>
      </div>
    </div>
  );
}
