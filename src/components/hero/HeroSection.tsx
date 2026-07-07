"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface HeroProps {
  images: string[];
  children?: React.ReactNode;
}

const KB: { from: gsap.TweenVars; to: gsap.TweenVars }[] = [
  { from: { scale: 1.08 }, to: { scale: 1.0  } },
  { from: { scale: 1.0  }, to: { scale: 1.07 } },
  { from: { scale: 1.09 }, to: { scale: 1.02 } },
  { from: { scale: 1.0  }, to: { scale: 1.06 } },
  { from: { scale: 1.06 }, to: { scale: 1.0  } },
];

const HOLD_MS = 6000;
const XFADE_S = 1.1;
const KB_DUR  = HOLD_MS / 1000 + XFADE_S;

export default function HeroSection({ images, children }: HeroProps) {
  const [curIdx, setCurIdx] = useState(0);
  const [nxtIdx, setNxtIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const curRef  = useRef<HTMLDivElement>(null); // Layer 2 current
  const nxtRef  = useRef<HTMLDivElement>(null); // Layer 2 next (crossfade)
  const bg1Ref  = useRef<HTMLDivElement>(null); // Layer 1 (cover base)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live    = useRef(0);
  const started = useRef(false);
  const disposed = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  const startKB = useCallback((el: HTMLElement | null, idx: number) => {
    if (!el) return;
    const kb = KB[idx % KB.length];
    gsap.killTweensOf(el);
    gsap.fromTo(el, { ...kb.from }, { ...kb.to, duration: KB_DUR, ease: "power1.inOut" });
  }, []);

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
            // Layer 1 swap is instant — the gradient hides the cut
            if (bg1Ref.current) {
              bg1Ref.current.style.backgroundImage = `url(${images[nxt]})`;
            }
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

  // ── Unified render — one return for both mobile and desktop ───────────────
  //
  // IMPORTANT: {children} (HeroSectionContent) must stay at the SAME array
  // index in the parent div on every render. If it moves (e.g. due to a
  // separate mobile/desktop branch), React remounts HeroSectionContent and
  // PinnedHero's cached querySelector reference becomes stale — the depart
  // animation runs on a detached element and content never fades out.
  //
  // Desktop two-layer trick:
  //   Layer 1 (base): cover + gradient overlay — full-bleed atmosphere.
  //   Layer 2 (panel): auto 100%, right-aligned — shows the sharp billboard.
  //   --hero-panel-left (40%→0%) is driven by PinnedHero on scroll.
  //
  // Mobile: single cover+center image. The desktop-only layers are rendered
  // as React nulls (false &&) so they occupy stable array positions without
  // adding DOM nodes on mobile.

  const mobileImgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const layer1Style: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${images[curIdx]})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    width:"200%",
  };

  const gradientStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to right, rgba(5,6,8,0.92) 0%, rgba(5,6,8,0.75) 28%, rgba(5,6,8,0.4) 48%, rgba(5,6,8,0.1) 62%, transparent 75%)",
    pointerEvents: "none",
  };

  const layer2Style: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: "var(--hero-panel-left, 38%)",
    backgroundSize: "auto 100%",
    backgroundPosition: "right center",
    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 14%)",
    maskImage: "linear-gradient(to right, transparent 0%, black 14%)",
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Desktop only — Layer 1 cover base (null slots on mobile keep sibling indices stable) */}
      {!isMobile && <div ref={bg1Ref} style={layer1Style} />}
      {!isMobile && <div aria-hidden style={gradientStyle} />}
      {/* Main image — Layer 2 on desktop, full cover on mobile */}
      <div
        ref={curRef}
        style={isMobile
          ? { ...mobileImgStyle, backgroundImage: `url(${images[curIdx]})` }
          : { ...layer2Style, backgroundImage: `url(${images[curIdx]})` }
        }
      />
      {nxtIdx !== null && (
        <div
          ref={nxtRef}
          style={isMobile
            ? { ...mobileImgStyle, opacity: 0, backgroundImage: `url(${images[nxtIdx]})` }
            : { ...layer2Style, opacity: 0, backgroundImage: `url(${images[nxtIdx]})` }
          }
        />
      )}
      <div aria-hidden className="hero-overlay" />
      {/* children is always at this array index — React reuses the DOM node on mobile/desktop switch */}
      {children && <div style={{ position: "relative", height: "100%" }}>{children}</div>}
    </div>
  );
}

export { HeroSection };
