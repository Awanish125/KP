"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function CampaignSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef    = useRef<HTMLDivElement>(null);
  const lineRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [lineRef.current, textRef.current],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.2,
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="h-full flex flex-col items-center justify-end pb-16 lg:pb-24"
    >
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div className="relative z-10 text-center">
        {/* Thin top rule */}
        <div
          ref={lineRef}
          className="opacity-0 flex items-center justify-center gap-4 mb-5"
        >
          <span className="block w-12 h-px bg-kp-orange/40" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-kp-orange/70">
            Featured Campaign
          </span>
          <span className="block w-12 h-px bg-kp-orange/40" />
        </div>

        <div ref={textRef} className="opacity-0">
          <h2 className="text-4xl lg:text-6xl font-extralight text-secondary dark:text-white leading-none mb-3">
            The Billboard<br />
            <em className="not-italic text-secondary/35 dark:text-white/35">That Stops</em> Traffic
          </h2>
          <p className="text-xs uppercase tracking-[0.4em] text-secondary/25 dark:text-white/25 mt-5">
            Continue scrolling to explore
          </p>
        </div>
      </div>
    </div>
  );
}
