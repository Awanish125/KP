"use client";

/**
 * page.tsx — Kiran Publicity home page.
 *
 * ── What animates where ───────────────────────────────────────────────────────
 *   Scene.tsx useFrame  — camera position / look-at / FOV / ambient light /
 *                          poster image per section / billboard Y rotation
 *   page.tsx GSAP       — billboard group entrance pop-in only
 *   Lenis               — smooth HTML scrolling (window.scrollY always current)
 *
 * Poster image changes and 360° rotation were moved OUT of GSAP ScrollTrigger
 * into Scene.tsx's useFrame so they never depend on ScrollTrigger timing.
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

const IMAGES = [
  "/homepage/herosection/1.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/2.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/3.png",
  "/homepage/herosection/kp.png",
];

function HomeContent() {
  const billboard = useRef<BillboardImperativeHandle | null>(null);
  const [isReady, setIsReady] = useState(false);

  /* ── Lenis smooth scroll ─────────────────────────────────────────────────── */
  useEffect(() => {
    const lenis = new Lenis({
      lerp:            0.08,
      smoothWheel:     true,
      syncTouch:       false,
      wheelMultiplier: 0.95,
    });

    // Feed Lenis ticks into ScrollTrigger for the group entrance trigger
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    // Use a named function so gsap.ticker.remove works correctly
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  const handleReady = useCallback((instance: BillboardImperativeHandle) => {
    billboard.current = instance;
    setIsReady(true);
  }, []);

  /* ── GSAP: group entrance only ───────────────────────────────────────────── */
  useGSAP(() => {
    if (!isReady) return;

    const group = billboard.current?.group;
    if (!group) return;

    // Billboard model pops in when About section scrolls into view.
    // The 3D scene uses position:fixed so it's always rendered —
    // this just reveals it with a springy scale animation.
    ScrollTrigger.create({
      trigger:  "#section-about",
      start:    "top 75%",
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

  }, { dependencies: [isReady] });

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

      {/* About — 100vh */}
      <section id="section-about" className="relative z-10 h-screen">
        <AboutSection />
      </section>

      {/* Services — 100vh */}
      <section id="section-services" className="relative z-10 h-screen">
        <ServicesSection />
      </section>

      {/* Why Us — 100vh */}
      <section id="section-why-us" className="relative z-10 h-screen">
        <WhyUsSection />
      </section>

      {/* Campaign — 100vh */}
      <section id="section-campaign" className="relative z-10 h-screen">
        <CampaignSection />
      </section>

      {/* Pinned — 300vh. Billboard rotates 360° Y-axis here (handled in Scene.tsx useFrame). */}
      <section
        id="section-pinned"
        className="relative z-10 h-[300vh] flex items-start justify-center pt-[40vh]"
      >
        <div className="sticky top-[40vh] text-center">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="block w-8 h-px bg-orange-400/30" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-orange-400/50">
              Scroll to rotate
            </span>
            <span className="block w-8 h-px bg-orange-400/30" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-extralight text-white leading-none">
            Billboard Network
          </h2>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/20 mt-4">
            Scroll to see all four sides
          </p>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
