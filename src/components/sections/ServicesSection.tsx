"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    num: "01",
    title: "Billboards & Hoardings",
    desc: "Large-format roadside displays at premium traffic junctions.",
  },
  {
    num: "02",
    title: "Unipoles & Gantries",
    desc: "Sky-high single-pole structures and highway arch gantries.",
  },
  {
    num: "03",
    title: "Digital LED Displays",
    desc: "Dynamic full-colour LED screens with real-time content updates.",
  },
  {
    num: "04",
    title: "Transit Advertising",
    desc: "Bus, auto, and fleet wraps that move your brand city-wide.",
  },
  {
    num: "05",
    title: "Bus Shelter Branding",
    desc: "Eye-level panels at high-dwell commuter shelters.",
  },
  {
    num: "06",
    title: "Wall Wraps & Murals",
    desc: "Large-scale building wraps and hand-painted murals.",
  },
];

export function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rowRefs    = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        gsap.fromTo(
          row,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: "power3.out",
            delay: i * 0.07,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 65%",
            },
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="h-full flex items-center pl-12 lg:pl-20">
      <div className="w-full max-w-sm lg:max-w-md">

        {/* Label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="block w-6 h-px bg-kp-orange/60" />
          <span className="text-[10px] uppercase tracking-[0.45em] text-kp-orange/80">
            What We Do
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-secondary dark:text-white mb-10">
          Advertising<br />
          <em className="not-italic text-secondary/40 dark:text-white/40">Solutions</em>
        </h2>

        {/* Service rows */}
        <ul className="space-y-0 divide-y divide-secondary/8 dark:divide-white/6">
          {SERVICES.map((s, i) => (
            <li key={s.num}>
              <div
                ref={(el) => { rowRefs.current[i] = el; }}
                className="opacity-0 group flex items-start gap-4 py-3.5 cursor-default"
              >
                <span className="text-[10px] font-mono text-secondary/40 dark:text-white/20 mt-0.5 flex-shrink-0 w-5">
                  {s.num}
                </span>
                <div>
                  <p className="text-sm font-medium text-secondary dark:text-white/80 group-hover:text-secondary dark:group-hover:text-white transition-colors duration-200">
                    {s.title}
                  </p>
                  <p className="text-[11px] text-secondary/50 dark:text-white/25 mt-0.5 leading-snug">
                    {s.desc}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
