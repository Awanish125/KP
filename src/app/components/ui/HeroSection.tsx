"use client";

import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "next-themes";
import { useBrowserHeight, useViewportHeight } from "@/app/utils";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const viewportHeight = useViewportHeight();
  const browserHeight = useBrowserHeight();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkTheme = mounted && resolvedTheme === "dark";
  const videoSrc = isDarkTheme
    ? "/homepage/herosection/hero-dark.mp4"
    : "/homepage/herosection/hero-light.mp4";

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const content = contentRef.current;
    const headline = headlineRef.current;
    const lead = leadRef.current;
    const actions = actionsRef.current;

    if (!section || !video || !content || !headline || !lead || !actions) {
      return;
    }

    let removeMetadataListener = () => {};

    const ctx = gsap.context(() => {
      let timeline: gsap.core.Timeline | null = null;

      gsap.set([headline, lead, actions], {
        opacity: 0,
        y: 34,
        scale: 0.985,
      });

      gsap.set(video, {
        scale: 1.08,
      });

      const onLoaded = () => {
        timeline?.kill();

        const endDistance = Math.max(
          (browserHeight || viewportHeight || window.innerHeight) * 2.25,
          1800,
        );

        timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${endDistance}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(
            video,
            {
              currentTime: video.duration || 0,
              scale: 1,
              ease: "none",
            },
            0,
          )
          .to(
            content,
            {
              yPercent: -4,
              ease: "none",
            },
            0,
          )
          .to(
            headline,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
              ease: "power4.out",
            },
            0.05,
          )
          .to(
            lead,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.55,
              ease: "power3.out",
            },
            0.16,
          )
          .to(
            actions,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.45,
              ease: "power3.out",
            },
            0.24,
          );

        ScrollTrigger.refresh();
      };

      if (video.readyState >= 1 && video.duration) {
        onLoaded();
      } else {
        video.addEventListener("loadedmetadata", onLoaded);
        removeMetadataListener = () => {
          video.removeEventListener("loadedmetadata", onLoaded);
        };
      }
    }, section);

    return () => {
      removeMetadataListener();
      ctx.revert();
    };
  }, [browserHeight, viewportHeight, videoSrc]);

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/45 will-change-opacity dark:bg-black/55" />

      <div
        ref={contentRef}
        className="relative z-10 flex h-full min-h-full items-center justify-center"
      >
        <div className="max-w-5xl px-6 text-center text-white">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.4em] text-white/75">
            Outdoor. Transit. Digital OOH.
          </p>
          <h1
            ref={headlineRef}
            className="text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl"
          >
            Making Brands
            <br />
            Impossible To Ignore
          </h1>

          <p
            ref={leadRef}
            className="mx-auto mt-8 max-w-3xl text-lg text-gray-200 md:text-2xl"
          >
            Outdoor Advertising &bull; Digital OOH &bull; Transit Media &bull;
            Mall Branding &bull; Printing & Fabrication
          </p>

          <div ref={actionsRef} className="mt-10 flex justify-center gap-4">
            <button className="rounded-full bg-orange-500 px-8 py-4 font-semibold text-white shadow-[0_20px_60px_rgba(249,115,22,0.35)] transition-transform duration-300 hover:scale-[1.03]">
              Explore Services
            </button>

            <button className="rounded-full border border-white/70 px-8 py-4 text-white backdrop-blur-sm transition-transform duration-300 hover:scale-[1.03] hover:bg-white/10">
              View Projects
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
