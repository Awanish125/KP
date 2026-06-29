"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    num: "01",
    title: "Prime Locations",
    body: "Hand-curated sites at the highest-traffic junctions, highways, and commercial corridors across Maharashtra.",
  },
  {
    num: "02",
    title: "Creative Partnership",
    body: "Our in-house design team handles everything from concept art to final print-ready files, at no extra cost.",
  },
  {
    num: "03",
    title: "72-Hour Installation",
    body: "From artwork approval to live billboard — we guarantee installation within 72 hours at every site.",
  },
  {
    num: "04",
    title: "End-to-End Management",
    body: "Site scouting, MCGM permits, installation, maintenance, and post-campaign reports — all under one roof.",
  },
];

export function WhyUsSection() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const pillarRefs  = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
        },
      );

      pillarRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            delay: 0.1 + i * 0.1,
            scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="h-full flex items-center justify-end pr-12 lg:pr-20">
      {/* Content panel — right side, billboard visible on the left in the camera frame */}
      <div className="w-full max-w-sm lg:max-w-md">

        {/* Label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="block w-6 h-px bg-orange-400/60" />
          <span className="text-[10px] uppercase tracking-[0.45em] text-orange-400/80">
            Why Choose Us
          </span>
        </div>

        {/* Headline */}
        <h2
          ref={headlineRef}
          className="opacity-0 text-4xl lg:text-5xl font-extralight leading-[1.1] text-white mb-10"
        >
          Built on Trust,<br />
          <em className="not-italic text-white/40">Driven</em> by Impact
        </h2>

        {/* Pillars */}
        <div className="space-y-0 divide-y divide-white/[0.06]">
          {PILLARS.map((p, i) => (
            <div
              key={p.num}
              ref={(el) => { pillarRefs.current[i] = el; }}
              className="opacity-0 py-4"
            >
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-[10px] font-mono text-orange-400/50">{p.num}</span>
                <span className="text-sm font-light text-white/80">{p.title}</span>
              </div>
              <p className="text-[11px] text-white/25 leading-relaxed pl-7">{p.body}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
