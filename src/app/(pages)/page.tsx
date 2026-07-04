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

import { useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroSection, HeroSectionContent, PinnedHero } from "@/components/hero";
import { FirstVisitLoader } from "@/components/FirstVisitLoader";
import { PremiumRevealSection } from "@/components/PremiumRevealSection";
import { CampaignGallery, type Campaign } from "@/components/gallery";
import { GALLERY_CATEGORIES } from "@/data/categories";
import data from "@/data/home.json";
import { PremiumMarquee } from "@/components/PremiumMarquee";

gsap.registerPlugin(ScrollTrigger);
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
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  /* ── Lenis smooth scroll ─────────────────────────────────────────────── */
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
      {/* Cinematic brand reveal — first visit per session only (kp-visited gate) */}
      <FirstVisitLoader />

      <PinnedHero
        stats={data.hero.stats}
        statsPresentation={data.hero.statsPresentation}
        intro={data.hero.intro}
        marquee={data.hero.editorialMarquee}
      >
        <HeroSection images={data.hero.images}>
          <HeroSectionContent
            subtitle={data.hero.subtitle}
            line1={data.hero.line1}
            line2={data.hero.line2}
            line3={data.hero.line3}
            description={data.hero.description}
            gradientColors={data.hero.gradientColors}
            primaryCta={null}
            secondaryCta={null}
          />
        </HeroSection>
      </PinnedHero>

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

      
      <CampaignGallery
        campaigns={CATEGORY_CARDS}
        glowColor="rgba(0,100,177,0.5)"
        onCardClick={(card) => router.push(`/gallery?category=${encodeURIComponent(card.title)}`)}
      />

      
      
    </div>
  );
}
