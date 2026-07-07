"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface HeroProps {
  images: string[];
  children?: React.ReactNode;
}

// Ken Burns pairs: subtle pan-zoom so each image feels cinematically alive
const KB: { from: gsap.TweenVars; to: gsap.TweenVars }[] = [
  { from: { scale: 1.08, x: "2%",    y: "1%"   }, to: { scale: 1.0,  x: "0%",    y: "0%"   } },
  { from: { scale: 1.0,  x: "0%",    y: "0%"   }, to: { scale: 1.07, x: "-2%",   y: "-1%"  } },
  { from: { scale: 1.09, x: "-1.5%", y: "1%"   }, to: { scale: 1.02, x: "1%",    y: "-1%"  } },
  { from: { scale: 1.0,  x: "1%",    y: "-1%"  }, to: { scale: 1.06, x: "-1.5%", y: "1%"   } },
  { from: { scale: 1.06, x: "0%",    y: "-2%"  }, to: { scale: 1.0,  x: "0%",    y: "0%"   } },
];

const HOLD_MS = 6000;
const XFADE_S = 1.1;
const KB_DUR  = HOLD_MS / 1000 + XFADE_S;

export default function HeroSection({ images, children }: HeroProps) {
  const [curIdx, setCurIdx] = useState(0);
  const [nxtIdx, setNxtIdx] = useState<number | null>(null);

  const curRef   = useRef<HTMLDivElement>(null);
  const nxtRef   = useRef<HTMLDivElement>(null);
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live     = useRef(0);      // tracks curIdx without closure staleness
  const started  = useRef(false);
  const disposed = useRef(false);

  const startKB = useCallback((el: HTMLElement | null, idx: number) => {
    if (!el) return;
    const kb = KB[idx % KB.length];
    gsap.killTweensOf(el);
    gsap.fromTo(el, { ...kb.from }, { ...kb.to, duration: KB_DUR, ease: "power1.inOut" });
  }, []);

  // Apply Ken Burns whenever the current slot changes
  useEffect(() => { startKB(curRef.current, curIdx); }, [curIdx, startKB]);

  const runTransition = useCallback(() => {
    if (disposed.current) return;
    const cur = live.current;
    const nxt = (cur + 1) % images.length;

    const img = new Image();
    img.src = images[nxt];
    const doFade = () => {
      if (disposed.current) return;
      setNxtIdx(nxt);
      // Double rAF to let React mount the next layer before animating
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (disposed.current) return;
        const el = nxtRef.current;
        if (!el) return;
        startKB(el, nxt);
        gsap.fromTo(el, { opacity: 0 }, {
          opacity: 1,
          duration: XFADE_S,
          ease: "power2.inOut",
          onComplete: () => {
            if (disposed.current) return;
            live.current = nxt;
            setCurIdx(nxt);
            setNxtIdx(null);
            timer.current = setTimeout(runTransition, HOLD_MS);
          },
        });
      }));
    };

    if (img.complete) doFade();
    else { img.onload = doFade; img.onerror = doFade; }
  }, [images, startKB]);

  const begin = useCallback(() => {
    if (started.current || images.length <= 1) return;
    started.current = true;
    timer.current = setTimeout(runTransition, HOLD_MS);
  }, [images.length, runTransition]);

  useEffect(() => {
    window.addEventListener("kp:loaded", begin, { once: true });
    if (document.documentElement.classList.contains("page-revealed")) begin();
    return () => {
      disposed.current = true;
      window.removeEventListener("kp:loaded", begin);
      if (timer.current) clearTimeout(timer.current);
      gsap.killTweensOf(curRef.current);
      gsap.killTweensOf(nxtRef.current);
    };
  }, [begin]);

  if (!images.length) return <>{children}</>;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Current image */}
      <div
        ref={curRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${images[curIdx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Next image — only mounted during crossfade */}
      {nxtIdx !== null && (
        <div
          ref={nxtRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            backgroundImage: `url(${images[nxtIdx]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      {/* Gradient for text legibility */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Content above images */}
      {children && (
        <div style={{ position: "relative", height: "100%" }}>{children}</div>
      )}
    </div>
  );
}

export { HeroSection };
