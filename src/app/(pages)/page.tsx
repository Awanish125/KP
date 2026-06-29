"use client";

/**
 * page.tsx — Kiran Publicity home page.
 *
 * ── Camera animation ──────────────────────────────────────────────────────────
 * Camera position, look-at target, FOV, and ambient light intensity are ALL
 * animated inside Scene.tsx's useFrame — driven by window.scrollY directly.
 * This completely eliminates the GSAP-ScrollTrigger-Lenis timing race that
 * made the camera appear frozen. No camera GSAP code here.
 *
 * ── What GSAP still does here ─────────────────────────────────────────────────
 *   1. Billboard group entrance: scale pop-in when About scrolls into view.
 *   2. Poster crossfades: changePoster() calls at each section boundary.
 *
 * ── Smooth scrolling ─────────────────────────────────────────────────────────
 *   Lenis is created here (single instance, not in HomeLayout).
 *   It emits a "scroll" event each tick which ScrollTrigger.update() reads.
 *   Scene.tsx reads window.scrollY directly — Lenis writes this as part of its
 *   native-scroll mode, so no extra wiring is needed.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Billboard, { BillboardImperativeHandle } from "@/components/ThreeDObject/Billboard";
import { HeroSection } from "@/components/hero";
import { Loading } from "@/components/ui";
import {
  AboutSection,
  ServicesSection,
  WhyUsSection,
  CampaignSection,
} from "@/components/sections";

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- */
/*  Poster images                                                              */
/* -------------------------------------------------------------------------- */

const IMAGES = [
  "/homepage/herosection/1.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/2.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/3.png",
  "/homepage/herosection/kp.png",
];

const POSTER_AT = {
  about:    IMAGES[0],
  services: IMAGES[2],
  whyUs:    IMAGES[4],
  campaign: IMAGES[0],
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

function HomeContent() {
  const billboard = useRef<BillboardImperativeHandle | null>(null);
  const [isReady, setIsReady] = useState(false);

  /* ── Lenis smooth scroll ──────────────────────────────────────────────────
     Single Lenis instance. Lenis writes window.scrollY (native-scroll mode),
     so Scene.tsx's useFrame picks it up automatically without extra wiring. */
  useEffect(() => {
    const lenis = new Lenis({
      lerp:            0.08,
      smoothWheel:     true,
      syncTouch:       false,
      wheelMultiplier: 0.95,
    });

    // Feed Lenis ticks into ScrollTrigger so poster-change triggers fire correctly
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
      lenis.destroy();
    };
  }, []);

  const handleReady = useCallback((instance: BillboardImperativeHandle) => {
    billboard.current = instance;
    setIsReady(true);
  }, []);

  /* ── GSAP: group entrance + poster changes ────────────────────────────── */
  useGSAP(() => {
    if (!isReady) return;

    const group = billboard.current?.group;
    if (!group) return;

    /* ── 1. Billboard group entrance ─────────────────────────────────────
       Billboard model starts at scale 0 (hidden below hero OGL canvas).
       Pops in with a springy ease when About scrolls 75% into the viewport. */
    ScrollTrigger.create({
      trigger: "#section-about",
      start:   "top 75%",
      onEnter: () => {
        gsap.fromTo(
          group.scale,
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 1, duration: 1.4, ease: "back.out(1.4)" },
        );
      },
      onLeaveBack: () => {
        gsap.to(group.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "power3.in" });
      },
    });

    /* ── 2. Poster crossfades ─────────────────────────────────────────────
       changePoster() does a GSAP fade-out → texture swap → fade-in inside
       BillboardMesh, so these one-shot ScrollTriggers are all that's needed. */
    ScrollTrigger.create({
      trigger:     "#section-about",
      start:       "top 60%",
      onEnter:     () => billboard.current?.changePoster("front", POSTER_AT.about),
    });
    ScrollTrigger.create({
      trigger:     "#section-services",
      start:       "top 60%",
      onEnter:     () => billboard.current?.changePoster("front", POSTER_AT.services),
      onLeaveBack: () => billboard.current?.changePoster("front", POSTER_AT.about),
    });
    ScrollTrigger.create({
      trigger:     "#section-why-us",
      start:       "top 60%",
      onEnter:     () => billboard.current?.changePoster("front", POSTER_AT.whyUs),
      onLeaveBack: () => billboard.current?.changePoster("front", POSTER_AT.services),
    });
    ScrollTrigger.create({
      trigger:     "#section-campaign",
      start:       "top 60%",
      onEnter:     () => billboard.current?.changePoster("front", POSTER_AT.campaign),
      onLeaveBack: () => billboard.current?.changePoster("front", POSTER_AT.whyUs),
    });

  }, { dependencies: [isReady] });

  /* ── JSX ─────────────────────────────────────────────────────────────── */
  return (
    <div>
      <Loading />

      {/* Fixed 3D canvas — z-0, always behind section content */}
      <Billboard
        className="fixed inset-0 w-full h-full"
        onReady={handleReady}
        showControls={process.env.NODE_ENV === "development"}
      />

      {/* Hero — 100vh. OGL canvas (z-10) covers the 3D canvas here. */}
      <section id="section-hero" className="relative z-10 h-screen">
        <HeroSection images={IMAGES} />
      </section>

      {/* About — 100vh. Billboard scales in; camera swings to front view. */}
      <section id="section-about" className="relative z-10 h-screen">
        <AboutSection />
      </section>

      {/* Services — 100vh. Camera slides far left; billboard fills right frame. */}
      <section id="section-services" className="relative z-10 h-screen">
        <ServicesSection />
      </section>

      {/* Why Us — 100vh. Camera swings far right; billboard fills left frame. */}
      <section id="section-why-us" className="relative z-10 h-screen">
        <WhyUsSection />
      </section>

      {/* Campaign — 100vh. Camera zooms in tight; ambient light dims. */}
      <section id="section-campaign" className="relative z-10 h-screen">
        <CampaignSection />
      </section>

      {/* Pinned — 300vh. Phase 5: pin-scroll + Y-axis billboard rotation. */}
      <section
        id="section-pinned"
        className="relative z-10 h-[300vh] flex items-start justify-center pt-[40vh]"
      >
        <div className="sticky top-[40vh] text-center">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="block w-8 h-px bg-orange-400/30" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-orange-400/50">
              Interactive
            </span>
            <span className="block w-8 h-px bg-orange-400/30" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-extralight text-white leading-none">
            Billboard Network
          </h2>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/20 mt-4">
            Phase 5 — Rotation section coming next
          </p>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
