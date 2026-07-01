"use client";

/**
 * page.tsx — Kiran Publicity home page.
 *
 * The 3D billboard is fully isolated in BillboardController.
 * To disable it (no WebGL, no Three.js loaded at all):
 *   1. Comment out the BillboardController import below
 *   2. Comment out <BillboardController stepRefs={stepRefs} /> in JSX
 */

import { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
//import { BillboardController } from "@/components/ThreeDObject/Billboard/BillboardController"; // ← comment to disable billboard
import { HeroSection, HeroSectionContent } from "@/components/hero";
import { Loading } from "@/components/ui";
import { PremiumMarquee } from "@/components/PremiumMarquee";

gsap.registerPlugin(ScrollTrigger);

/* ── Images (hero section) ───────────────────────────────────────────────── */
const IMG = {
  kp: "/homepage/herosection/kp.png",
  i1: "/homepage/herosection/1.png",
  i2: "/homepage/herosection/2.png",
  i3: "/homepage/herosection/3.png",
} as const;

/* ── S-4 content steps ───────────────────────────────────────────────────── */
const STEPS = [
  { label: "Prime Locations",       heading: "Hand-curated\nSites",     body: "Highest-traffic junctions, highways, and corridors across Maharashtra." },
  { label: "Creative Partnership",  heading: "Concept to\nCampaign",    body: "In-house design team handles artwork, print files and production."       },
  { label: "72-Hour Installation",  heading: "Approval\nto Live",       body: "From artwork sign-off to live billboard in 72 hours, guaranteed."        },
  { label: "End-to-End Management", heading: "One Roof,\nAll Services", body: "Site scouting, permits, installation, maintenance and reports."          },
] as const;

const STATS = [
  { value: 20,  suffix: "+", label: "Years of\nExcellence" },
  { value: 500, suffix: "+", label: "Prime\nLocations"     },
  { value: 100, suffix: "+", label: "Brands\nServed"       },
] as const;

const SERVICES = [
  { num: "01", title: "Billboards & Hoardings",  desc: "Large-format roadside displays at premium traffic junctions."  },
  { num: "02", title: "Unipoles & Gantries",      desc: "Sky-high single-pole structures and highway arch gantries."    },
  { num: "03", title: "Digital LED Displays",     desc: "Dynamic full-colour LED screens with real-time content."       },
  { num: "04", title: "Transit Advertising",      desc: "Bus, auto and fleet wraps that move your brand city-wide."     },
  { num: "05", title: "Bus Shelter Branding",     desc: "Eye-level panels at high-dwell commuter shelters."            },
  { num: "06", title: "Wall Wraps & Murals",      desc: "Large-scale building wraps and hand-painted murals."           },
] as const;

/* ════════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const stepRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  /* ── Lenis + section snap ────────────────────────────────────────────── */
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, syncTouch: false });

    const SNAP_IDS = ["s1", "s2", "s3", "s4-wrapper"];
    let wheelAcc  = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;
    let snapping  = false;

    function snapToSection(direction: 1 | -1) {
      const targets = SNAP_IDS
        .map((id) => document.getElementById(id))
        .filter(Boolean) as HTMLElement[];

      const scroll = lenis.scroll;

      let currentIdx = 0;
      for (let i = 0; i < targets.length; i++) {
        if (targets[i].offsetTop <= scroll + 10) currentIdx = i;
      }

      // Inside S-4 past first 45 vh → user is scrolling the pinned rotation; don't snap
      const s4 = document.getElementById("s4-wrapper");
      if (s4 && scroll > s4.offsetTop + window.innerHeight * 0.45) return;

      const nextIdx = Math.max(0, Math.min(targets.length - 1, currentIdx + direction));
      if (nextIdx === currentIdx) return;

      snapping = true;
      lenis.scrollTo(targets[nextIdx].offsetTop, {
        duration: 0.75,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        onComplete: () => { snapping = false; },
      });
    }

    function onWheel(e: WheelEvent) {
      if (snapping) return;
      wheelAcc += e.deltaY;
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        const acc = wheelAcc;
        wheelAcc = 0;
        if (Math.abs(acc) < 80) return;
        snapToSection(acc > 0 ? 1 : -1);
      }, 100);
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    lenis.on("scroll", () => ScrollTrigger.update());
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      if (wheelTimer) clearTimeout(wheelTimer);
      window.removeEventListener("wheel", onWheel);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  /* ── Non-billboard scroll animations (counters + text reveals) ───────── */
  useGSAP(() => {
    STATS.forEach((stat, i) => {
      const el = counterRefs.current[i];
      if (!el) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: stat.value, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: "#s2", start: "top 60%" },
        onUpdate: () => { el.textContent = Math.round(obj.val).toString(); },
      });
    });

    gsap.fromTo("#s2-content > *", { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, stagger: 0.12, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: "#s2", start: "top 65%" },
    });
    gsap.fromTo("#s3-content > *", { opacity: 0, x: 30 }, {
      opacity: 1, x: 0, stagger: 0.07, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: "#s3", start: "top 65%" },
    });
  }, []);

  /* ── JSX ──────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-white dark:bg-secondary">
      <Loading />

      {/* ↓ Comment this out to disable the 3D billboard entirely */}
      {/* <BillboardController stepRefs={stepRefs} /> */}

      {/* ── S-1: Hero ────────────────────────────────────────────────────── */}
      <section id="s1" className="relative h-screen">
        <HeroSection images={[IMG.i1, IMG.kp, IMG.i2, IMG.kp, IMG.i3, IMG.kp]}>
          <HeroSectionContent />
          
        </HeroSection>
      </section>
      <PremiumMarquee/>
      {/* ── S-2: About content (left) | Billboard slot (right) ───────────── */}
      <section id="s2" className="relative flex h-screen">
        <div className="relative z-10 w-full md:w-1/2 flex items-center px-8 md:px-16 lg:px-20">
          <div id="s2-content" className="w-full max-w-md">

            <div className="flex items-center gap-3 mb-8">
              <span className="block w-6 h-px bg-kp-orange/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">About Us</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-secondary dark:text-white mb-8">
              India&apos;s Premier<br />Outdoor<br />
              <em className="not-italic text-secondary/40 dark:text-white/40">Advertising</em> Network
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8 pt-6 border-t border-secondary/8 dark:border-white/8">
              {STATS.map((s, i) => (
                <div key={i}>
                  <div className="flex items-baseline gap-0.5">
                    <span
                      ref={(el) => { counterRefs.current[i] = el; }}
                      className="text-3xl lg:text-4xl font-extralight text-secondary dark:text-white tabular-nums"
                    >0</span>
                    <span className="text-lg font-light text-kp-orange">{s.suffix}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-secondary/55 dark:text-white/55 mt-1 whitespace-pre-line">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-secondary/60 dark:text-white/60 leading-relaxed">
              For over two decades, Kiran Publicity has been transforming cityscapes
              into powerful brand narratives — from highways to high streets, across Maharashtra.
            </p>
          </div>
        </div>

        {/* Invisible slot — marks right half for the floating canvas */}
        <div className="hidden md:block w-1/2 h-full" aria-hidden="true" />
      </section>

      {/* ── S-3: Billboard slot (left) | Services content (right) ────────── */}
      <section id="s3" className="relative flex h-screen">

        {/* Invisible slot — left half */}
        <div className="hidden md:block w-1/2 h-full" aria-hidden="true" />

        <div className="relative z-10 w-full md:w-1/2 flex items-center px-8 md:px-16 lg:px-20">
          <div id="s3-content" className="w-full max-w-md">

            <div className="flex items-center gap-3 mb-8">
              <span className="block w-6 h-px bg-kp-orange/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">What We Do</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-secondary dark:text-white mb-10">
              Advertising<br /><em className="not-italic text-secondary/40 dark:text-white/40">Solutions</em>
            </h2>

            <ul className="divide-y divide-secondary/8 dark:divide-white/6">
              {SERVICES.map((s) => (
                <li key={s.num} className="group flex items-start gap-4 py-3.5">
                  <span className="text-[10px] font-mono text-secondary/55 dark:text-white/55 mt-0.5 w-5 flex-shrink-0">{s.num}</span>
                  <div>
                    <p className="text-sm font-light text-secondary/80 dark:text-white/80 group-hover:text-secondary dark:group-hover:text-white transition-colors">{s.title}</p>
                    <p className="text-[11px] text-secondary/55 dark:text-white/55 mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── S-4: Pinned 400vh — content steps (left) | Billboard slot (right) */}
      <div id="s4-wrapper" style={{ height: "400vh" }}>
        <section className="sticky top-0 h-screen flex overflow-hidden">

          {/* S-4 — Changing content steps */}
          <div className="relative z-10 w-full md:w-1/2 flex items-center px-8 md:px-16 lg:px-20">

            <div className="absolute top-8 left-8 md:left-16 lg:left-20 flex items-center gap-3">
              <span className="block w-6 h-px bg-kp-orange/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">Scroll to explore</span>
            </div>

            <div className="relative w-full max-w-md" style={{ minHeight: 280 }}>
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  ref={(el) => { stepRefs.current[i] = el; }}
                  className="absolute inset-0 flex flex-col justify-center"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="block w-6 h-px bg-kp-orange/60" />
                    <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">{step.label}</span>
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.15] text-secondary dark:text-white mb-6 whitespace-pre-line">
                    {step.heading}
                  </h2>
                  <p className="text-sm text-secondary/60 dark:text-white/60 leading-relaxed max-w-xs">{step.body}</p>
                  <div className="flex gap-2 mt-8">
                    {STEPS.map((_, j) => (
                      <span key={j} className={`block h-px w-6 transition-colors duration-300 ${j === i ? "bg-kp-orange" : "bg-secondary/20 dark:bg-white/20"}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invisible slot — right half */}
          <div className="hidden md:block w-1/2 h-full" aria-hidden="true" />
        </section>
      </div>

    </div>
  );
}
