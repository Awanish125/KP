'use client';
import { useEffect, useRef } from "react";
import gsap from "gsap";

const FINAL_TEXT = "KIRAN";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default function Loading() {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const lineRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const title    = titleRef.current;
    const overlay  = overlayRef.current;
    const subtitle = subtitleRef.current;
    const line     = lineRef.current;

    if (!title || !overlay) return;

    document.body.style.overflow = "hidden";

    /* ── Smart gate: exit only when BOTH conditions are true ────────────────
       1. Minimum 1 000 ms has passed (so the loader is never jarring-fast)
       2. The 3-D WebGL scene has fired kp:sceneReady
       Fallback cap: exit after 3 000 ms no matter what (slow connections).
    ─────────────────────────────────────────────────────────────────────── */
    let sceneReady   = false;
    let minTimerDone = false;
    let exitCalled   = false;

    const tryExit = () => {
      if (exitCalled) return;
      if (sceneReady && minTimerDone) {
        exitCalled = true;
        exitSequence();
      }
    };

    const onSceneReady = () => { sceneReady = true;   tryExit(); };
    const minTimer     = setTimeout(() => { minTimerDone = true; tryExit(); }, 1000);
    const capTimer     = setTimeout(() => {
      if (!exitCalled) { exitCalled = true; exitSequence(); }
    }, 3000);

    window.addEventListener('kp:sceneReady', onSceneReady, { once: true });

    /* ── Scramble text reveal ───────────────────────────────────────────── */
    let frame = 0;
    let reveal = 0;
    let animationId = 0;

    const scramble = () => {
      let output = "";
      for (let i = 0; i < FINAL_TEXT.length; i++) {
        output += i < reveal
          ? FINAL_TEXT[i]
          : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      title.textContent = output;
      frame++;

      // Reveal one character every 3 frames (~50ms at 60fps)
      if (frame % 3 === 0) reveal++;

      if (reveal <= FINAL_TEXT.length) {
        animationId = requestAnimationFrame(scramble);
      } else {
        title.textContent = FINAL_TEXT;
        // Scramble done — now wait for the smart gate
      }
    };

    /* ── Exit sequence ──────────────────────────────────────────────────── */
    const exitSequence = () => {
      const tl = gsap.timeline({
        delay: 0.12,
        onComplete: () => {
          document.body.style.overflow = "";
          document.documentElement.classList.add("page-revealed");
        },
      });

      // Accent line sweeps out
      tl.to(line, {
        scaleX: 0,
        transformOrigin: "center",
        duration: 0.28,
        ease: "power3.in",
      });

      // Title letterspace expands + fades simultaneously
      tl.to(
        title,
        { letterSpacing: "0.65em", opacity: 0, y: -18, duration: 0.38, ease: "power2.in" },
        "<0.05"
      );
      tl.to(
        subtitle,
        { opacity: 0, y: -10, duration: 0.28, ease: "power2.in" },
        "<"
      );

      // Overlay splits and slides up — buttery power4.inOut
      tl.to(overlay, {
        yPercent: -100,
        duration: 0.82,
        ease: "power4.inOut",
      }, "-=0.05");
    };

    /* ── Entrance — total budget: ~0.55s ────────────────────────────────── */
    const tl = gsap.timeline({ onComplete: scramble });

    tl.from(title, {
      opacity: 0,
      y: 22,
      duration: 0.38,
      ease: "power3.out",
    });

    tl.from(
      [subtitle, line],
      { opacity: 0, y: 10, duration: 0.30, ease: "power2.out", stagger: 0.06 },
      "-=0.1"
    );

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(minTimer);
      clearTimeout(capTimer);
      window.removeEventListener('kp:sceneReady', onSceneReady);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ background: "linear-gradient(160deg, #09090f 0%, #111120 60%, #0c0c18 100%)" }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Radial centre vignette / glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 52%, rgba(255,120,30,0.07) 0%, transparent 62%)",
        }}
      />

      {/* Content */}
      <div className="flex h-full flex-col items-center justify-center gap-0">
        <h1
          ref={titleRef}
          className="font-mono text-7xl font-extralight select-none text-white"
          style={{ letterSpacing: "0.45em", paddingLeft: "0.45em" }}
        />

        {/* Accent underline */}
        <div
          ref={lineRef}
          style={{
            width: 48,
            height: 2,
            marginTop: 16,
            marginBottom: 14,
            borderRadius: 9999,
            background: "linear-gradient(90deg, transparent, #FF8A00, transparent)",
            boxShadow: "0 0 12px rgba(255,138,0,0.6)",
          }}
        />

        <p
          ref={subtitleRef}
          className="text-[10px] uppercase select-none"
          style={{ letterSpacing: "0.75em", paddingLeft: "0.75em", color: "rgba(255,255,255,0.38)" }}
        >
          OUTDOOR PUBLICITY
        </p>
      </div>

      {/* Scanline texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)",
        }}
      />
    </div>
  );
}
