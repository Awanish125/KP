"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

const LAT_TOP = 35.5;
const LAT_BTM = 8.0;

export function MeridianRail() {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    const dot  = dotRef.current;
    const read = readRef.current;
    const line = lineRef.current;
    if (!root || !fill || !dot || !read || !line) return;

    if (!window.matchMedia("(pointer: fine)").matches) return;
    root.style.display = "flex";

    let max = 1;
    let last = -1;

    const measure = () => {
      max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    };
    measure();

    const tick = () => {
      const p = Math.min(window.scrollY / max, 1);
      if (Math.abs(p - last) < 0.001) return;
      last = p;

      fill.style.transform = `scaleY(${p})`;

      const h = line.offsetHeight;
      dot.style.transform = `translateY(${p * h}px)`;

      const lat = LAT_TOP + (LAT_BTM - LAT_TOP) * p;
      read.textContent = lat.toFixed(2) + "°N";
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { measure(); tick(); }, 80);
    });
    ro.observe(document.body);

    if (prefersReducedMotion()) {
      window.addEventListener("scroll", tick, { passive: true });
      return () => {
        ro.disconnect();
        if (resizeTimer) clearTimeout(resizeTimer);
        window.removeEventListener("scroll", tick);
      };
    }

    gsap.ticker.add(tick);
    return () => {
      ro.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      gsap.ticker.remove(tick);
    };
  }, [pathname]);

  const capStyle: React.CSSProperties = {
    fontFamily: "var(--kp-font-mono, monospace)",
    fontSize: "0.6rem",
    letterSpacing: "0.14em",
    lineHeight: 1,
    /* White text with a dark shadow — visible on both light and dark sections */
    color: "#fff",
    textShadow: "0 0 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.5)",
  };

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-kp-meridian-rail
      style={{
        position: "fixed",
        left: "clamp(18px, 2vw, 32px)",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 60,
        display: "none",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.65rem",
        height: "42vh",
        pointerEvents: "none",
      }}
    >
      {/* N cap */}
      <span style={capStyle}>N</span>

      {/* Line region — plain container so mix-blend children target the page */}
      <div
        ref={lineRef}
        style={{ position: "relative", flex: 1, width: 1 }}
      >
        {/* Track — white with dark shadow → visible on both light and dark sections */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#fff",
            boxShadow: "0 0 3px rgba(0,0,0,0.8)",
          }}
        />

        {/* Orange fill — normal blend, renders on top of track */}
        <div
          ref={fillRef}
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--kp-orange)",
            transform: "scaleY(0)",
            transformOrigin: "top center",
          }}
        />

        {/* Orange dot — rides the fill tip */}
        <div
          ref={dotRef}
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 7,
            height: 7,
            marginLeft: -3.5,
            marginTop: -3.5,
            background: "var(--kp-orange)",
            borderRadius: "50%",
            boxShadow: "0 0 6px var(--kp-orange-glow)",
          }}
        />

        {/* Latitude readout */}
        <span
          ref={readRef}
          style={{
            position: "absolute",
            left: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            writingMode: "vertical-rl",
            fontFamily: "var(--kp-font-mono, monospace)",
            fontSize: "0.58rem",
            letterSpacing: "0.22em",
            color: "#fff",
            textShadow: "0 0 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {LAT_TOP.toFixed(2)}°N
        </span>
      </div>

      {/* S cap */}
      <span style={capStyle}>S</span>
    </div>
  );
}
