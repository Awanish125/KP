'use client';
import { useEffect, useRef } from "react";
import gsap from "gsap";

const FINAL_TEXT = "KIRAN";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default function Loading() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    const overlay = overlayRef.current;

    if (!title || !overlay) return;

    document.body.style.overflow = "hidden";

    let frame = 0;
    let reveal = 0;
    let animationId = 0;

    const scramble = () => {
      let output = "";

      for (let i = 0; i < FINAL_TEXT.length; i++) {
        if (i < reveal) {
          output += FINAL_TEXT[i];
        } else {
          output += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      title.textContent = output;

      frame++;

      if (frame % 6 === 0) {
        reveal++;
      }

      if (reveal <= FINAL_TEXT.length) {
        animationId = requestAnimationFrame(scramble);
      } else {
        title.textContent = FINAL_TEXT;

        gsap.timeline({ delay: 2 })
          .to(title, {
            letterSpacing: "0.6em",
            scale: 1.05,
            duration: 1.5,
            ease: "power2.out",
          })
          .to(
            [title, subtitleRef.current],
            {
              opacity: 0,
              y: -30,
              duration: 0.5,
            },
            "<"
          )
          .to(overlay, {
            yPercent: -100,
            duration: 1.2,
            ease: "power4.inOut",
            onComplete: () => {
              document.body.style.overflow = "";
            },
          });
      }
    };

    gsap.from(title, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power3.out",
      onComplete: scramble,
    });

    gsap.from(subtitleRef.current, {
      opacity: 0,
      y: 15,
      delay: 0.8,
      duration: 0.6,
    });

    return () => {
      cancelAnimationFrame(animationId);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] overflow-hidden bg-black"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Animated scan line */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-full left-0 h-full w-full bg-gradient-to-b from-transparent via-white/5 to-transparent animate-[scan_3s_linear_infinite]" />
      </div>

      <div className="flex h-full flex-col items-center justify-center">
        <h1
          ref={titleRef}
          className="font-mono text-6xl font-light tracking-[0.45em] text-white select-none"
        />

        <p
          ref={subtitleRef}
          className="mt-6 text-xs uppercase tracking-[0.8em] text-white/45"
        >
          OUTDOOR PUBLICITY
        </p>
      </div>

      {/* Film grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:100%_4px]" />
    </div>
  );
}