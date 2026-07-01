import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HeroSectionContent = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Initial hidden state
      gsap.set(
        [
          subtitleRef.current,
          line1Ref.current,
          line2Ref.current,
          line3Ref.current,
        ],
        {
          opacity: 0,
          y: 80,
        }
      );

      const tl = gsap.timeline({
        paused: true,
      });

      tl.to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
      })
        .to(
          line1Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power4.out",
          },
          "-=0.2"
        )
        .to(
          line2Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power4.out",
          },
          "-=0.55"
        )
        .to(
          line3Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power4.out",
          },
          "-=0.55"
        );

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 75%",
        end: "bottom 20%",

        onEnter: () => tl.restart(),

        onEnterBack: () => tl.restart(),

        onLeave: () => {
          gsap.set(
            [
              subtitleRef.current,
              line1Ref.current,
              line2Ref.current,
              line3Ref.current,
            ],
            {
              opacity: 0,
              y: 80,
            }
          );
          tl.pause(0);
        },

        onLeaveBack: () => {
          gsap.set(
            [
              subtitleRef.current,
              line1Ref.current,
              line2Ref.current,
              line3Ref.current,
            ],
            {
              opacity: 0,
              y: 80,
            }
          );
          tl.pause(0);
        },
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
          Premium Outdoor Advertising
        </h2>

        <h1 className="font-heading font-bold tracking-[-0.06em] leading-[0.85] text-6xl md:text-[7rem] lg:text-[8.5rem] xl:text-[9rem]">
          <span ref={line1Ref} className="block text-white">
            MAKING BRANDS
          </span>

          <span
            ref={line2Ref}
            className="block text-transparent bg-clip-text bg-gradient-to-r from-[#6F5BFF] via-[#B86CCB] via-[#F16B57] to-[#FF6B1A] bg-[length:200%_100%]"
          >
            IMPOSSIBLE
          </span>

          <span ref={line3Ref} className="block text-white">
            TO IGNORE
          </span>
        </h1>
      </div>

      <div className="w-1/2 h-full" />
    </div>
  );
};

export default HeroSectionContent;