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

  

  return (
    <div ref={sectionRef} className="w-full h-full flex">
      <div className="w-full md:w-[50%] h-full flex flex-col justify-center gap-4 md:gap-6 px-6 text-center md:text-left">
        <h2
          ref={subtitleRef}
          className="text-xs md:text-sm uppercase tracking-[0.5em] text-primary font-semibold mb-4"
        >
          {subtitle}
        </h2>

        <h1 className="font-heading font-bold   text-6xl md:text-[4rem] xl:text-[4.5rem] 2xl:text-[5rem] leading-[1.1] md:leading-[1.05] xl:leading-[1.05] 2xl:leading-[1.05]">
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

      {/* <div className="w-1/2 h-full" /> */}
    </div>
  );
};

export default HeroSectionContent;
