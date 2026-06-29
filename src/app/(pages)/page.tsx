"use client";

/**
 * page.tsx — Kiran Publicity home page.
 *
 * This file is the single source of truth for all GSAP scroll animation:
 *   • Camera position at each section
 *   • Billboard group entrance (scale 0 → 1)
 *   • Ambient light intensity per section
 *   • Poster image at each scroll step
 *
 * The 3D scene lives in <Billboard>. Everything is driven through
 * billboardRef.current — GSAP never triggers React re-renders to animate 3D.
 *
 * ── How the master timeline works ──────────────────────────────────────────
 * One GSAP timeline with scrub:1.5 spans the full page scroll.
 * Each sequential .to() pair covers one 100vh section:
 *
 *   Section 1 — Hero      (100vh): camera looking away, billboard hidden
 *   Section 2 — About     (100vh): camera flies to billboard front, scale 0→1
 *   Section 3 — Services  (100vh): camera slides left
 *   Section 4 — Why Us    (100vh): camera swings right
 *   Section 5 — Campaign  (100vh): camera zooms in tight
 *   Section 6 — Pinned    (300vh): Phase 5 rotation section (placeholder)
 *
 * ── How poster changes work ────────────────────────────────────────────────
 * Separate ScrollTriggers (not scrubbed) call changePoster() on section entry.
 * changePoster() fades opacity to 0, swaps the texture, fades back to 1.
 * onLeaveBack reverts to the previous section's image when scrolling up.
 *
 * ── How lighting works ─────────────────────────────────────────────────────
 * ambientLight.intensity is animated inside the master scrub timeline so the
 * mood transitions smoothly as the user scrolls through sections.
 */

import { useRef, useState, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Billboard, { BillboardImperativeHandle } from "@/components/ThreeDObject/Billboard";
import { HeroSection } from "@/components/hero";
import { Loading } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- */
/*  Poster images                                                              */
/* -------------------------------------------------------------------------- */

// Six images — alternating campaign art and the KP logo/brand image.
// Phase 4 replaces these with real Kiran Publicity campaign artwork.
const IMAGES = [
  "/homepage/herosection/1.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/2.png",
  "/homepage/herosection/kp.png",
  "/homepage/herosection/3.png",
  "/homepage/herosection/kp.png",
];

// Which image shows on the FRONT face when each section enters.
// The back face keeps the KP brand image throughout.
const POSTER_AT = {
  about:    IMAGES[0],
  services: IMAGES[2],
  whyUs:    IMAGES[4],
  campaign: IMAGES[0], // zoom in on the first campaign again
};

/* -------------------------------------------------------------------------- */
/*  Camera keyframes                                                           */
/* -------------------------------------------------------------------------- */

// Captured with Leva's "📋 Copy Current State" button.
// The billboard is always at world origin [0, 0, 0]. Only the camera moves.
const CAM = {
  // Camera is in front of the billboard (positive Z) but its target is far in
  // positive Z — so it's looking AWAY from origin. The billboard is behind it.
  // This is the "pre-reveal" state the user sees during the hero section.
  hero: {
    pos:    [0, 3, 12]  as [number, number, number],
    target: [0, 3, 25]  as [number, number, number],
    fov: 55,
  },

  // Camera swings around and flies toward the billboard front face.
  // This is the cinematic "billboard reveal" moment.
  about: {
    pos:    [5.5, 1.2, 9.5] as [number, number, number],
    target: [0, 0.8, 0]     as [number, number, number],
    fov: 38,
  },

  // Camera moves left — billboard fills the right half of the frame.
  services: {
    pos:    [-8, 1.5, 6] as [number, number, number],
    target: [0, 0, 0]    as [number, number, number],
    fov: 42,
  },

  // Camera mirrors right — billboard fills the left half of the frame.
  whyUs: {
    pos:    [8, 1.5, 6] as [number, number, number],
    target: [0, 0, 0]   as [number, number, number],
    fov: 42,
  },

  // Tight close-up on the poster face for the campaign highlight.
  campaign: {
    pos:    [0, 0.5, 4.5] as [number, number, number],
    target: [0, 0.2, 0]   as [number, number, number],
    fov: 30,
  },

  // Slight 3/4 angle for Phase 5's rotation reveal — the side is visible so
  // the 180° rotation reads clearly as the billboard turns.
  pinned: {
    pos:    [3, 1.2, 7] as [number, number, number],
    target: [0, 0, 0]   as [number, number, number],
    fov: 38,
  },
} as const;

// Ambient light intensity at each section.
// Lower = darker/moodier, higher = brighter/more confident.
const LIGHT = {
  hero:     0.08,  // dark hero — billboard is hidden, focus is on the 2D imagery
  about:    0.22,  // brightens as the billboard appears
  services: 0.28,  // well-lit — business content section
  whyUs:    0.28,
  campaign: 0.12,  // dim spotlight — focus is on the close-up poster
  pinned:   0.08,  // dramatic dark for the rotation reveal
} as const;

/* -------------------------------------------------------------------------- */
/*  HomeContent                                                                */
/* -------------------------------------------------------------------------- */

function HomeContent() {
  const billboard = useRef<BillboardImperativeHandle | null>(null);
  const pageRef   = useRef<HTMLDivElement>(null);

  // isReady flips to true once the Canvas has drawn its first frame.
  // useGSAP depends on it so the timeline is only built after all refs exist.
  const [isReady, setIsReady] = useState(false);

  // Called by Billboard AFTER Canvas.onCreated (two rAF ticks) so that
  // billboard.current.camera and .orbit are guaranteed to be populated.
  const handleReady = useCallback((instance: BillboardImperativeHandle) => {
    billboard.current = instance;
    setIsReady(true);
  }, []);

  /* ── GSAP scroll timeline ─────────────────────────────────────────────── */
  useGSAP(() => {
    if (!isReady) return;

    const cam          = billboard.current?.camera;
    const orbit        = billboard.current?.orbit;
    const group        = billboard.current?.group;
    const ambientLight = billboard.current?.ambientLight;

    // Guard: all refs must exist before building the timeline
    if (!cam || !orbit || !group || !ambientLight) return;

    /* ── 1. Initial state ──────────────────────────────────────────────────
       Set synchronously — no animation. This is the state the user sees the
       instant the page loads (before any scrolling). */
    gsap.set(cam.position,  { x: CAM.hero.pos[0],    y: CAM.hero.pos[1],    z: CAM.hero.pos[2]    });
    gsap.set(orbit.target,  { x: CAM.hero.target[0], y: CAM.hero.target[1], z: CAM.hero.target[2] });
    cam.fov = CAM.hero.fov;
    cam.updateProjectionMatrix();
    ambientLight.intensity = LIGHT.hero;

    // Block all user input but keep orbit.enabled = true.
    // Drei's OrbitControls only calls controls.update() inside useFrame when
    // orbit.enabled is true. update() is what applies orbit.target → camera
    // lookAt each frame. If we set enabled=false, GSAP can move orbit.target
    // all it wants but the camera quaternion never updates — it stays frozen.
    orbit.enablePan    = false;
    orbit.enableRotate = false;
    orbit.enableZoom   = false;
    orbit.enableDamping = false; // GSAP scrub provides all smoothing needed

    /* ── 2. Billboard group entrance ───────────────────────────────────────
       The group starts at scale 0 (set in BillboardMesh on mount).
       When the About section enters, GSAP scales it to 1 with a springy
       overshoot. When the user scrolls back past it, it scales back to 0.

       This is NOT in the scrub timeline — the entrance always plays at
       full speed regardless of how fast the user scrolls. */
    // fromTo guarantees the scale starts at 0 on enter regardless of prior state.
    // The billboard is scale 1 in R3F by default (no hidden-on-mount trick),
    // so even if this trigger never fires the billboard is still visible —
    // it just won't have the pop-in animation.
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
        gsap.to(group.scale, {
          x: 0, y: 0, z: 0,
          duration: 0.5,
          ease: "power3.in",
        });
      },
    });

    /* ── 3. Master scrub timeline ──────────────────────────────────────────
       One timeline covers the full page scroll. scrub:1.5 means the camera
       lags 1.5 seconds behind the user's scroll position — this is the
       Apple-style "camera feels heavy" effect.

       Each .to() pair = one section (100vh of scroll distance).
       ease:"none" on individual tweens is intentional: the scrub provides
       all the smoothing needed. Adding ease ON TOP of scrub would cause the
       camera to accelerate/decelerate unevenly through each section.

       The "<" position label starts the second tween AT THE SAME TIME as
       the first, so camera position and orbit target always move together. */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pageRef.current,
        start:   "top top",
        end:     "bottom bottom",
        scrub:   1.5,
      },
    });

    // Hero → About: camera swings around to face the billboard
    // Light brightens as the billboard appears
    tl.to(cam.position,          { x: CAM.about.pos[0],    y: CAM.about.pos[1],    z: CAM.about.pos[2],    ease: "none", duration: 1 })
      .to(orbit.target,          { x: CAM.about.target[0], y: CAM.about.target[1], z: CAM.about.target[2], ease: "none", duration: 1 }, "<")
      .to(ambientLight,          { intensity: LIGHT.about,                                                  ease: "none", duration: 1 }, "<");

    // About → Services: camera slides left
    tl.to(cam.position,          { x: CAM.services.pos[0],    y: CAM.services.pos[1],    z: CAM.services.pos[2],    ease: "none", duration: 1 })
      .to(orbit.target,          { x: CAM.services.target[0], y: CAM.services.target[1], z: CAM.services.target[2], ease: "none", duration: 1 }, "<")
      .to(ambientLight,          { intensity: LIGHT.services,                                                        ease: "none", duration: 1 }, "<");

    // Services → Why Us: camera swings right
    tl.to(cam.position,          { x: CAM.whyUs.pos[0],    y: CAM.whyUs.pos[1],    z: CAM.whyUs.pos[2],    ease: "none", duration: 1 })
      .to(orbit.target,          { x: CAM.whyUs.target[0], y: CAM.whyUs.target[1], z: CAM.whyUs.target[2], ease: "none", duration: 1 }, "<")
      .to(ambientLight,          { intensity: LIGHT.whyUs,                                                  ease: "none", duration: 1 }, "<");

    // Why Us → Campaign: camera zooms in tight, light dims to a spotlight
    tl.to(cam.position,          { x: CAM.campaign.pos[0],    y: CAM.campaign.pos[1],    z: CAM.campaign.pos[2],    ease: "none", duration: 1 })
      .to(orbit.target,          { x: CAM.campaign.target[0], y: CAM.campaign.target[1], z: CAM.campaign.target[2], ease: "none", duration: 1 }, "<")
      .to(ambientLight,          { intensity: LIGHT.campaign,                                                        ease: "none", duration: 1 }, "<");

    // Campaign → Pinned: camera settles into the 3/4 angle for Phase 5's rotation
    // Light drops further for a dramatic mood
    tl.to(cam.position,          { x: CAM.pinned.pos[0],    y: CAM.pinned.pos[1],    z: CAM.pinned.pos[2],    ease: "none", duration: 1 })
      .to(orbit.target,          { x: CAM.pinned.target[0], y: CAM.pinned.target[1], z: CAM.pinned.target[2], ease: "none", duration: 1 }, "<")
      .to(ambientLight,          { intensity: LIGHT.pinned,                                                    ease: "none", duration: 1 }, "<");

    /* ── 4. FOV transitions ────────────────────────────────────────────────
       FOV needs cam.updateProjectionMatrix() after each change, so it lives
       in separate ScrollTriggers rather than the scrub timeline. */

    // Hero → About: widen FOV slightly as we approach the billboard
    ScrollTrigger.create({
      trigger: "#section-about",
      start:   "top 80%",
      end:     "top 10%",
      scrub:   2,
      onUpdate: (self) => {
        cam.fov = gsap.utils.interpolate(CAM.hero.fov, CAM.about.fov, self.progress);
        cam.updateProjectionMatrix();
      },
    });

    // Why Us → Campaign: narrow FOV for the close-up zoom
    ScrollTrigger.create({
      trigger: "#section-campaign",
      start:   "top 80%",
      end:     "top 10%",
      scrub:   2,
      onUpdate: (self) => {
        cam.fov = gsap.utils.interpolate(CAM.whyUs.fov, CAM.campaign.fov, self.progress);
        cam.updateProjectionMatrix();
      },
    });

    // Campaign → Pinned: restore normal FOV
    ScrollTrigger.create({
      trigger: "#section-pinned",
      start:   "top 80%",
      end:     "top 30%",
      scrub:   2,
      onUpdate: (self) => {
        cam.fov = gsap.utils.interpolate(CAM.campaign.fov, CAM.pinned.fov, self.progress);
        cam.updateProjectionMatrix();
      },
    });

    /* ── 5. Poster changes per section ─────────────────────────────────────
       changePoster() fades the poster image out, loads the new one, fades in.
       Not scrubbed — always plays at full speed on section entry.
       onLeaveBack reverts the image when the user scrolls back up.

       To add a new poster step: add a new ScrollTrigger pointing at the
       section element, then call billboard.current.changePoster(...). */

    ScrollTrigger.create({
      trigger:     "#section-about",
      start:       "top 60%",
      onEnter:     () => billboard.current?.changePoster("front", POSTER_AT.about),
      // No onLeaveBack here — hero section doesn't show the billboard anyway
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
    <div ref={pageRef}>
      <Loading />

      {/*
        Billboard canvas — fixed to viewport, renders behind all HTML content.
        showControls is dev-only: enables Leva panel AND re-enables OrbitControls
        so you can drag to find new camera positions, then hit "📋 Copy Current State".
      */}
      <Billboard
        className="fixed inset-0 w-full h-full"
        onReady={handleReady}
        showControls={process.env.NODE_ENV === "development"}
      />

      {/* ── Hero — 100vh ──────────────────────────────────────────────────
          Camera looks away from billboard. The OGL hero shader fills the
          screen with the campaign images. Billboard is hidden (scale 0).   */}
      <section id="section-hero" className="relative z-10 h-screen">
        <HeroSection images={IMAGES} />
      </section>

      {/* ── About — 100vh ─────────────────────────────────────────────────
          Camera swings around and the billboard pops into view (scale 0→1).
          Content sits on the right; billboard is on the left in the frame.  */}
      <section
        id="section-about"
        className="relative z-10 h-screen flex items-center justify-end pr-16"
      >
        <div className="max-w-md text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40 mb-4">
            About Us
          </p>
          <h2 className="text-4xl font-light mb-6 leading-tight">
            India&apos;s Premier<br />
            Outdoor Advertising<br />
            Network
          </h2>
          <p className="text-white/60 leading-relaxed text-sm">
            For over two decades, Kiran Publicity has been transforming
            cityscapes into powerful brand narratives across India.
          </p>
        </div>
      </section>

      {/* ── Services — 100vh ──────────────────────────────────────────────
          Camera slides left. Billboard fills the right side of the frame.   */}
      <section
        id="section-services"
        className="relative z-10 h-screen flex items-center justify-end pr-16"
      >
        <div className="max-w-md text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40 mb-4">
            What We Do
          </p>
          <h2 className="text-4xl font-light mb-8 leading-tight">
            Advertising<br />Solutions
          </h2>
          <ul className="space-y-3 text-white/60 text-sm">
            {[
              "Billboards & Hoardings",
              "Unipoles & Gantries",
              "Digital LED Displays",
              "Transit Advertising",
              "Bus Shelters",
              "Wall Wraps",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Why Choose Us — 100vh ─────────────────────────────────────────
          Camera swings right. Billboard fills the left side of the frame.   */}
      <section
        id="section-why-us"
        className="relative z-10 h-screen flex items-center pl-16"
      >
        <div className="max-w-md text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40 mb-4">
            Why Us
          </p>
          <h2 className="text-4xl font-light mb-8 leading-tight">
            Built on Trust,<br />Driven by Impact
          </h2>
          <ul className="space-y-3 text-white/60 text-sm">
            {[
              "20+ Years of Experience",
              "500+ Prime Locations Nationwide",
              "In-house Creative Design Support",
              "Fast Installation & Maintenance",
              "End-to-End Campaign Management",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Campaign — 100vh ──────────────────────────────────────────────
          Camera zooms in tight on the poster. Light dims to a spotlight feel. */}
      <section
        id="section-campaign"
        className="relative z-10 h-screen flex items-end justify-center pb-20"
      >
        <div className="text-center text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40 mb-3">
            Featured
          </p>
          <h2 className="text-4xl font-light mb-2">Campaign Showcase</h2>
          <p className="text-white/30 text-xs tracking-wider">
            Continue scrolling
          </p>
        </div>
      </section>

      {/* ── Pinned Billboard Rotation — 300vh ─────────────────────────────
          Phase 5 implements the full pin-scroll rotation + content swap.
          300vh gives enough scroll distance for the pin to play out.
          Camera is at the 3/4 angle defined in CAM.pinned.               */}
      <section
        id="section-pinned"
        className="relative z-10 h-[300vh] flex items-start justify-center pt-[40vh]"
      >
        <div className="sticky top-[40vh] text-center text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40 mb-3">
            Interactive
          </p>
          <h2 className="text-4xl font-light">Billboard Network</h2>
          <p className="text-white/20 text-xs tracking-wider mt-3">
            Phase 5 — pinned rotation section coming next
          </p>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
