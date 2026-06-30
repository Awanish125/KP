"use client";

/**
 * page.tsx — Kiran Publicity home page.
 *
 * ONE WebGL canvas (TrackingBillboard) — no multiple contexts.
 * Invisible "slot" divs mark where the model should appear in each section.
 * GSAP ScrollTrigger scrubs canvas left/top/opacity between slot positions.
 *
 * S-1  Hero         — no billboard
 * S-2  About        — slot on RIGHT  (left: 50%)
 * S-3  Services     — slot on LEFT   (left: 0%)
 * S-4  Pinned 360°  — slot on RIGHT  (left: 50%, sticky)
 */

import { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  TrackingBillboard,
  type TrackingBillboardHandle,
} from "@/components/ThreeDObject/Billboard/TrackingBillboard";
import { HeroSection } from "@/components/hero";
import { Loading } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger);

/* ── images ───────────────────────────────────────────────────────────────── */
const IMG = {
  kp: "/homepage/herosection/kp.png",
  i1: "/homepage/herosection/1.png",
  i2: "/homepage/herosection/2.png",
  i3: "/homepage/herosection/3.png",
} as const;

/* ── S-4 content steps (one per 90° of rotation) ─────────────────────────── */
const STEPS = [
  { label: "Prime Locations",       heading: "Hand-curated\nSites",     body: "Highest-traffic junctions, highways, and corridors across Maharashtra.", image: IMG.i1 },
  { label: "Creative Partnership",  heading: "Concept to\nCampaign",    body: "In-house design team handles artwork, print files and production.",       image: IMG.i2 },
  { label: "72-Hour Installation",  heading: "Approval\nto Live",       body: "From artwork sign-off to live billboard in 72 hours, guaranteed.",        image: IMG.i3 },
  { label: "End-to-End Management", heading: "One Roof,\nAll Services", body: "Site scouting, permits, installation, maintenance and reports.",          image: IMG.kp },
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
  const billRef     = useRef<TrackingBillboardHandle>(null);
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

      // Which section are we currently in?
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
      // Wait 100 ms after the last wheel tick, then decide
      wheelTimer = setTimeout(() => {
        const acc = wheelAcc;
        wheelAcc = 0;
        if (Math.abs(acc) < 80) return; // tiny nudge — no snap
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

  /* ── GSAP ─────────────────────────────────────────────────────────────── */
  useGSAP(() => {
    const bill = billRef.current;
    if (!bill) return;
    const wrap = bill.wrapRef.current;
    if (!wrap) return;

    /* ── Utility: premium scrubbed transition between section slots ───────
         left  : scrubs fromPct → toPct
         scale : pulses up to peakScale at mid-transit, returns to 1
         rotation: scrubs fromDeg → toDeg so the model spins during transit
    ─────────────────────────────────────────────────────────────────────── */
    function scrubTransition(
      triggerId: string,
      fromPct: number,
      toPct: number,
      fromDeg: number,
      toDeg: number,
      peakScale = 1.12,
    ) {
      ScrollTrigger.create({
        trigger: triggerId,
        start: "top bottom",
        end:   "top top",
        scrub: 0.5,
        onUpdate(self) {
          const p = self.progress;
          // Horizontal slide
          const left  = fromPct + (toPct - fromPct) * p;
          // Scale: bell-curve pulse — larger mid-flight, back to 1 on landing
          const scale = 1 + (peakScale - 1) * Math.sin(p * Math.PI);
          gsap.set(wrap, { left: `${left}%`, scale });
          // Model spins during transit (scroll-synced, no easing lag)
          bill?.setRotationDirect(fromDeg + (toDeg - fromDeg) * p);
        },
      });
    }

    /* ── S-1 → S-2 : slide in from right + fade ────────────────────────── */
    ScrollTrigger.create({
      trigger: "#s2",
      start: "top bottom",
      end:   "top top",
      scrub: 0.4,
      onUpdate(self) {
        const p = self.progress;
        gsap.set(wrap, {
          left:    `${50 + (1 - p) * 20}%`,    // 70% → 50%
          opacity: p,
          scale:   0.85 + 0.15 * p,
        });
      },
      onLeaveBack() {
        gsap.set(wrap, { opacity: 0, scale: 0.85 });
      },
    });

    /* ── S-2 fully in view ─────────────────────────────────────────────── */
    ScrollTrigger.create({
      trigger: "#s2",
      start: "top top",
      onEnter() {
        gsap.set(wrap, { left: "50%", width: "50%", opacity: 1, scale: 1 });
        bill.changePoster("front", IMG.i1);
        // Rotate 180° with poster swap at 90°
        bill.rotateTo(180, {
          duration: 1.8,
          ease: "power2.inOut",
          images: [
            { atDegrees: 90,  front: IMG.kp },
            { atDegrees: 180, front: IMG.i1 },
          ],
        });
      },
      onLeaveBack() {
        bill.stopScrollRotation();
        bill.resetRotation({ duration: 0.5 });
      },
    });

    /* ── S-2 → S-3 : slides left + spins 180° (model was at 180° after S-2) */
    scrubTransition("#s3", 50, 0, 180, 360);

    /* ── S-3 fully in view ─────────────────────────────────────────────── */
    ScrollTrigger.create({
      trigger: "#s3",
      start: "top top",
      onEnter() {
        // Transit scrub already set rotation to 360° — snap canvas to final slot
        gsap.set(wrap, { left: "0%", width: "50%", scale: 1 });
        bill.changePoster("front", IMG.i2);
        // Gentle settle spin: continue from 360° to 400° and ease back to 360°
        bill.rotateTo(400, { duration: 0.6, ease: "power2.out" });
        gsap.delayedCall(0.6, () => bill.rotateTo(360, { duration: 0.4, ease: "power2.inOut" }));
      },
      onLeaveBack() {
        bill.stopScrollRotation();
        // Return to S-2 position
        gsap.set(wrap, { left: "50%", width: "50%" });
        bill.changePoster("front", IMG.i1);
        bill.resetRotation({ duration: 0.5 });
      },
    });

    /* ── S-3 → S-4 : slides right + spins another 180° (was at 360° after S-3) */
    scrubTransition("#s4-wrapper", 0, 50, 360, 540);

    /* ── S-4 fully in view — start scroll-driven 360° rotation ─────────── */
    ScrollTrigger.create({
      trigger: "#s4-wrapper",
      start: "top top",
      onEnter() {
        gsap.set(wrap, { left: "50%", width: "50%", opacity: 1 });
        bill.changePoster("front", STEPS[0].image);
        bill.startScrollRotation(
          360,
          "#s4-wrapper",
          STEPS.map((step, i) => ({ atDegrees: i * 90, front: step.image })),
        );
      },
      onLeaveBack() {
        bill.stopScrollRotation();
        // Return to S-3 position
        gsap.set(wrap, { left: "0%", width: "50%" });
        bill.changePoster("front", IMG.i2);
      },
    });

    /* ── After S-4 ends : fade out ──────────────────────────────────────── */
    ScrollTrigger.create({
      trigger: "#s4-wrapper",
      start: "bottom bottom",
      onEnter() {
        bill.stopScrollRotation();
        gsap.to(wrap, { opacity: 0, scale: 0.85, duration: 0.5, ease: "power2.in" });
      },
      onLeaveBack() {
        gsap.to(wrap, { opacity: 1, scale: 1, duration: 0.3 });
      },
    });

    /* ── S-4 content steps sync'd to billboard rotation ─────────────────── */
    ScrollTrigger.create({
      trigger: "#s4-wrapper",
      start: "top top",
      end:   "bottom bottom",
      scrub: true,
      onUpdate(self) {
        const deg = 360 * self.progress;
        stepRefs.current.forEach((el, i) => {
          if (!el) return;
          const active = deg >= i * 90 && deg < (i + 1) * 90;
          gsap.to(el, {
            opacity: active ? 1 : 0,
            y: active ? 0 : 16,
            duration: 0.3,
            overwrite: true,
          });
        });
      },
    });

    /* ── About stat counters ────────────────────────────────────────────── */
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

    /* ── Text reveals ───────────────────────────────────────────────────── */
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
    <div className="bg-[#070a13]">
      <Loading />

      {/* Single fixed canvas — positioned by GSAP above */}
      <TrackingBillboard
        ref={billRef}
        initialImage={IMG.i1}
        cameraAngle="front"
      />

      {/* ── S-1: Hero ────────────────────────────────────────────────────── */}
      <section id="s1" className="relative h-screen">
        <HeroSection images={[IMG.i1, IMG.kp, IMG.i2, IMG.kp, IMG.i3, IMG.kp]} />
      </section>

      {/* ── S-2: About content (left) | Billboard slot (right) ───────────── */}
      <section id="s2" className="relative flex h-screen">

        <div className="relative z-10 w-full md:w-1/2 flex items-center px-8 md:px-16 lg:px-20">
          <div id="s2-content" className="w-full max-w-md">

            <div className="flex items-center gap-3 mb-8">
              <span className="block w-6 h-px bg-orange-400/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-orange-400/80">About Us</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-white mb-8">
              India&apos;s Premier<br />Outdoor<br />
              <em className="not-italic text-white/40">Advertising</em> Network
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8 pt-6 border-t border-white/[0.08]">
              {STATS.map((s, i) => (
                <div key={i}>
                  <div className="flex items-baseline gap-0.5">
                    <span
                      ref={(el) => { counterRefs.current[i] = el; }}
                      className="text-3xl lg:text-4xl font-extralight text-white tabular-nums"
                    >0</span>
                    <span className="text-lg font-light text-orange-400">{s.suffix}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1 whitespace-pre-line">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-white/40 leading-relaxed">
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
              <span className="block w-6 h-px bg-orange-400/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-orange-400/80">What We Do</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-white mb-10">
              Advertising<br /><em className="not-italic text-white/40">Solutions</em>
            </h2>

            <ul className="divide-y divide-white/[0.06]">
              {SERVICES.map((s) => (
                <li key={s.num} className="group flex items-start gap-4 py-3.5">
                  <span className="text-[10px] font-mono text-white/20 mt-0.5 w-5 flex-shrink-0">{s.num}</span>
                  <div>
                    <p className="text-sm font-light text-white/80 group-hover:text-white transition-colors">{s.title}</p>
                    <p className="text-[11px] text-white/25 mt-0.5 leading-snug">{s.desc}</p>
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

          {/* S-4.1 — Changing content steps */}
          <div className="relative z-10 w-full md:w-1/2 flex items-center px-8 md:px-16 lg:px-20">

            <div className="absolute top-8 left-8 md:left-16 lg:left-20 flex items-center gap-3">
              <span className="block w-6 h-px bg-orange-400/60" />
              <span className="text-[10px] uppercase tracking-[0.45em] text-orange-400/80">Scroll to explore</span>
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
                    <span className="block w-6 h-px bg-orange-400/60" />
                    <span className="text-[10px] uppercase tracking-[0.45em] text-orange-400/80">{step.label}</span>
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.15] text-white mb-6 whitespace-pre-line">
                    {step.heading}
                  </h2>
                  <p className="text-sm text-white/40 leading-relaxed max-w-xs">{step.body}</p>
                  <div className="flex gap-2 mt-8">
                    {STEPS.map((_, j) => (
                      <span key={j} className={`block h-px w-6 transition-colors duration-300 ${j === i ? "bg-orange-400" : "bg-white/15"}`} />
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
