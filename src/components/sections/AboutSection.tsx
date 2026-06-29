"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: 20,  suffix: "+", label: "Years of\nExcellence"  },
  { value: 500, suffix: "+", label: "Prime\nLocations"      },
  { value: 100, suffix: "+", label: "Brands\nServed"        },
];

export function AboutSection() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const statsRef    = useRef<HTMLDivElement>(null);
  const bodyRef     = useRef<HTMLParagraphElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered content slide-in when section enters viewport
      const elements = [headlineRef.current, statsRef.current, bodyRef.current].filter(Boolean);
      gsap.fromTo(
        elements,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
          },
        },
      );

      // Animated stat counters — tween a plain object's .val property
      STATS.forEach((stat, i) => {
        const el = counterRefs.current[i];
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
          },
          onUpdate: () => {
            el.textContent = Math.round(obj.val).toString();
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="h-full flex items-center justify-end pr-12 lg:pr-20">
      {/* Content panel — right half, leaving the left free for the 3D billboard */}
      <div className="w-full max-w-sm lg:max-w-md">

        {/* Label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="block w-6 h-px bg-orange-400/60" />
          <span className="text-[10px] uppercase tracking-[0.45em] text-orange-400/80">
            About Us
          </span>
        </div>

        {/* Headline */}
        <div ref={headlineRef} className="opacity-0">
          <h2 className="text-4xl lg:text-5xl font-extralight leading-[1.1] text-white mb-8">
            India&apos;s Premier<br />
            Outdoor<br />
            <em className="not-italic text-white/40">Advertising</em> Network
          </h2>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="opacity-0 grid grid-cols-3 gap-4 mb-8 pt-6 border-t border-white/8">
          {STATS.map((stat, i) => (
            <div key={i}>
              <div className="flex items-baseline gap-0.5">
                <span
                  ref={(el) => { counterRefs.current[i] = el; }}
                  className="text-3xl lg:text-4xl font-extralight text-white tabular-nums"
                >
                  0
                </span>
                <span className="text-lg font-light text-orange-400">{stat.suffix}</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1 whitespace-pre-line">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Body */}
        <p ref={bodyRef} className="opacity-0 text-sm text-white/40 leading-relaxed">
          For over two decades, Kiran Publicity has been transforming
          cityscapes into powerful brand narratives — from highways to
          high streets, across Maharashtra and beyond.
        </p>

      </div>
    </div>
  );
}
