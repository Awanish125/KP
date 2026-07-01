import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionContentProps {
  subtitle?:       string;
  line1?:          string;
  line2?:          string;
  line3?:          string;
  /** CSS colors for the left-to-right gradient on line2. Min 2 values. */
  gradientColors?: string[];
}

const HeroSectionContent = ({
  subtitle       = "Premium Outdoor Advertising",
  line1          = "MAKING BRANDS",
  line2          = "IMPOSSIBLE",
  line3          = "TO IGNORE",
  gradientColors = ["#6F5BFF", "#B86CCB", "#F16B57", "#FF6B1A"],
}: HeroSectionContentProps) => {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const line1Ref    = useRef<HTMLSpanElement>(null);
  const line2Ref    = useRef<HTMLSpanElement>(null);
  const line3Ref    = useRef<HTMLSpanElement>(null);

  // Build gradient string from the colors array.
  const gradient = `linear-gradient(to right, ${gradientColors.join(", ")})`;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const els = [
        subtitleRef.current,
        line1Ref.current,
        line2Ref.current,
        line3Ref.current,
      ];

      gsap.set(els, { opacity: 0, y: 80 });

      const tl = gsap.timeline({ paused: true });
      tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
        .to(line1Ref.current, { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }, "-=0.2")
        .to(line2Ref.current, { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }, "-=0.55")
        .to(line3Ref.current, { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }, "-=0.55");

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start:   "top 75%",
        end:     "bottom 20%",
        onEnter:      () => tl.restart(),
        onEnterBack:  () => tl.restart(),
        onLeave:      () => { gsap.set(els, { opacity: 0, y: 80 }); tl.pause(0); },
        onLeaveBack:  () => { gsap.set(els, { opacity: 0, y: 80 }); tl.pause(0); },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="w-full h-full flex">
      <div className="w-1/2 h-full">
        <h2
          ref={subtitleRef}
          className="text-xs md:text-sm uppercase tracking-[0.5em] text-primary font-semibold mb-4"
        >
          {subtitle}
        </h2>

        <h1 className="font-heading font-bold tracking-[-0.06em] leading-[0.85] text-6xl md:text-[7rem] lg:text-[8.5rem] xl:text-[9rem]">
          <span ref={line1Ref} className="block text-white">
            {line1}
          </span>

          <span
            ref={line2Ref}
            className="block text-transparent bg-clip-text bg-[length:200%_100%]"
            style={{ backgroundImage: gradient }}
          >
            {line2}
          </span>

          <span ref={line3Ref} className="block text-white">
            {line3}
          </span>
        </h1>
      </div>

      <div className="w-1/2 h-full" />
    </div>
  );
};

export default HeroSectionContent;
