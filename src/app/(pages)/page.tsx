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

import { Fragment } from "react";
import { GallerySection } from "./_GallerySection";
import { HeroSection, HeroSectionContent, PinnedHero } from "@/components/hero";
import { PremiumRevealSection } from "@/components/PremiumRevealSection";
import type { Campaign } from "@/components/gallery";
import { ServicesStrip } from "@/components/ServicesStrip";
import { ProcessSteps } from "@/components/ProcessSteps";
import { OfficeGrid } from "@/components/OfficeGrid";
import { TestimonialSlider } from "@/components/TestimonialSlider";
import { SectionReveal } from "@/components/SectionReveal";
import { CTABanner } from "@/components/CTABanner";
import { Footer } from "@/components/Footer";
import { ClientLogoWall } from "@/components/ClientLogoWall";
import { VideoShowcase } from "@/components/VideoShowcase";
import { HorizontalScrollGallery } from "@/components/HorizontalScrollGallery";
import { BillboardStory, BILLBOARD_STORY_STEPS } from "@/components/BillboardStory";
import { IdleWarmup } from "@/components/IdleWarmup";
import { GALLERY_CATEGORIES } from "@/data/categories";
import data from "@/data/home.json";
import aboutData from "@/data/about.json";
import contactData from "@/data/contact.json";
import clientsData from "@/data/clients.json";
import caseStudiesData from "@/data/caseStudies.json";

// Horizontal gallery cards come from the case-study covers — each one
// links straight to its full story.
const PLACEMENT_ITEMS = caseStudiesData.items.map((cs) => ({
  image: cs.hero,
  title: cs.title,
  meta: `${cs.brand} · ${cs.category}`,
  href: `/case-studies/${cs.slug}`,
}));
import { PremiumMarquee } from "@/components/PremiumMarquee";

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
  /* ── JSX ──────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-white dark:bg-secondary" style={{ overflowX: "clip" }}>
      {/* The first-visit / refresh loader is mounted globally in providers.tsx */}
      {/* Pre-decodes below-fold images and pre-buffers videos on idle so the
          first scroll never pays fetch/decode costs mid-frame. */}
      <IdleWarmup />
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
        showBottomDivider
        showHoverLift
        showFadeEdges
        showSeparatorAnimation
        pauseOnHover
      />
      <PremiumRevealSection
        images={SHOWCASE_IMAGES}
        animationStyle="cameraZoom"
        repeatOnScroll={false}
        scrollStart="top 75%"
        minHeight="100vh"
        backgroundColorClass="bg-white dark:bg-secondary"
        animationEnabled
        showEntranceAnimation
        showBlurEffect={false}
        showScaleAnimation
        showFadeAnimation
        showRotation
        showStaggerAnimation
        animationDuration={0.1}
        staggerAmount={0.5}
        showOvershoot={true}
        showLandingJerk={false}
        showBounceEffect={true}
        showFloatingAnimation={false}
        showMouseParallax={false}
        showScrollParallax={false}
        showDepthEffect={false}
        showHoverInteraction={false}
        showBackgroundGradient
        showNoiseTexture={false}
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

      
      <GallerySection campaigns={CATEGORY_CARDS} />

      {/* ── Business sections (JSON-driven) ─────────────────────────────── */}
      <ServicesStrip
        items={data.services.items}
        label={data.services.sectionLabel}
        heading={data.services.heading}
        headingEmphasis={data.services.headingEmphasis}
      />

      <ProcessSteps steps={data.process.steps} />

      <HorizontalScrollGallery items={PLACEMENT_ITEMS} staticMode={false} />

      <VideoShowcase />

      {/* Pinned billboard story — flips a photoreal 3D board per step */}
      <BillboardStory steps={BILLBOARD_STORY_STEPS} staticMode={false} />

      {/* Testimonials */}
      <section
        className="py-24"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border-soft)" }}
      >
        <SectionReveal as="div" className="mx-auto mb-12 max-w-6xl px-6">
          <p
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "var(--text-label)",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: "var(--kp-orange)",
            }}
          >
            {aboutData.testimonials.label}
          </p>
        </SectionReveal>
        <TestimonialSlider items={aboutData.testimonials.items} />
      </section>

      <ClientLogoWall industries={clientsData.industries} />

      <OfficeGrid offices={contactData.offices} />

      <CTABanner />

      <Footer />
    </div>
  );
}
