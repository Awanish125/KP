"use client";

/**
 * FooterWordmark — giant outline "KIRAN PUBLICITY" behind footer content.
 *
 * Look: outline-only glyphs (text-stroke, no fill). "KIRAN" in brand
 * blue #0065B1, "PUBLICITY" in brand orange #F58420. Very low opacity
 * so the chars read as part of the footer background, not on top of it.
 *
 * Size: JS auto-fits font-size to fill the footer WIDTH, then applies
 * scaleY to fill the footer HEIGHT — both dimensions always covered.
 *
 * Motion:
 *  - Scroll-scrubbed reveal: letters slide up (translateY 104 to 0),
 *    staggered left-right, lerped from scroll progress.
 *  - Always starts from 0 so the animation plays whether the user
 *    scrolled slowly or jumped directly to the footer.
 *  - Gated by IntersectionObserver via tickWhileVisible — zero per-frame
 *    cost when the footer is off-screen.
 *  - Geometry refreshed on IO enter and ResizeObserver; never in tick.
 *  - Once fully revealed, random letters glitch-cycle via setTimeout.
 *  - Reduced motion: static, fully visible.
 */

import { useEffect, useRef } from "react";
import { prefersReducedMotion, tickWhileVisible } from "@/lib/motion";
import { SCRAMBLE_GLYPHS } from "@/lib/scramble";

const WORD_A = "KIRAN";
const WORD_B = "PUBLICITY";
const CHARS_A = WORD_A.split("");
const CHARS_B = WORD_B.split("");
const LERP = 0.16;
const STAGGER = 0.45;
const MAX_OPACITY = 0.10;

const charStroke = (word: "A" | "B"): string =>
  word === "A" ? "#0065B1" : "#F58420";

/** Auto-fit a line element's font-size to fill `availW` pixels wide. */
function fitLine(line: HTMLSpanElement, availW: number) {
  line.style.fontSize = "";
  const naturalW = line.scrollWidth;
  if (naturalW > 0 && availW > 0) {
    const cs = parseFloat(getComputedStyle(line).fontSize);
    line.style.fontSize = (cs * availW / naturalW) + "px";
  }
}


/** Lock per-char widths so glyph swaps never reflow. */
function lockWidths(chars: HTMLElement[]) {
  chars.forEach((c) => {
    c.style.width = Math.ceil(c.getBoundingClientRect().width * 100) / 100 + "px";
  });
}

export function FooterWordmark() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const lineARef = useRef<HTMLSpanElement>(null);
  const lineBRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap  = wrapRef.current;
    const lineA = lineARef.current;
    const lineB = lineBRef.current;
    if (!wrap || !lineA || !lineB) return;

    const charsA = Array.from(lineA.children) as HTMLElement[];
    const charsB = Array.from(lineB.children) as HTMLElement[];
    const allChars = [...charsA, ...charsB];

    // Apply per-word stroke colors
    charsA.forEach((c) => c.style.setProperty("-webkit-text-stroke", "1.5px " + charStroke("A")));
    charsB.forEach((c) => c.style.setProperty("-webkit-text-stroke", "1.5px " + charStroke("B")));

    if (prefersReducedMotion()) return;

    /* ── Scramble loop ─────────────────────────────────────────────── */
    const letterIdxA = CHARS_A.map((_, i) => i);
    const letterIdxB = CHARS_B.map((_, i) => i);
    let glitchTimer: ReturnType<typeof setTimeout> | null = null;
    let restoreTimer: ReturnType<typeof setTimeout> | null = null;

    const restoreAll = () => {
      charsA.forEach((c, i) => { c.textContent = CHARS_A[i]; });
      charsB.forEach((c, i) => { c.textContent = CHARS_B[i]; });
    };
    const stopScramble = () => {
      if (glitchTimer) clearTimeout(glitchTimer);
      if (restoreTimer) clearTimeout(restoreTimer);
      glitchTimer = restoreTimer = null;
      restoreAll();
    };
    const startScramble = () => {
      if (glitchTimer !== null) return;
      const loop = () => {
        glitchTimer = setTimeout(() => {
          const n = 1 + ((Math.random() * 3) | 0);
          const hotA: number[] = [], hotB: number[] = [];
          for (let k = 0; k < n; k++) {
            if (Math.random() < 0.5)
              hotA.push(letterIdxA[(Math.random() * letterIdxA.length) | 0]);
            else
              hotB.push(letterIdxB[(Math.random() * letterIdxB.length) | 0]);
          }
          for (const i of hotA) charsA[i].textContent = SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0];
          for (const i of hotB) charsB[i].textContent = SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0];
          restoreTimer = setTimeout(() => {
            for (const i of hotA) charsA[i].textContent = CHARS_A[i];
            for (const i of hotB) charsB[i].textContent = CHARS_B[i];
          }, 90 + Math.random() * 90);
          loop();
        }, 420 + Math.random() * 640);
      };
      loop();
    };

    /* ── Geometry ──────────────────────────────────────────────────── */
    let wrapTop = 0;
    let denom = 1;
    let vh = window.innerHeight;

    const measure = () => {
      stopScramble();
      vh = window.innerHeight;

      lineA.style.fontSize = "";
      lineB.style.fontSize = "";
      for (const c of allChars) c.style.width = "auto";

      const avail = wrap.clientWidth * 0.97;
      fitLine(lineA, avail);
      fitLine(lineB, avail);

      lockWidths(allChars);

      const rect = wrap.getBoundingClientRect();
      wrapTop = rect.top + window.scrollY;
      denom = Math.max(vh * 0.6, 1);
    };

    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);

    /* ── Scrubbed reveal ───────────────────────────────────────────── */
    const last = allChars.length - 1 || 1;
    const apply = (p: number) => {
      for (let i = 0; i < allChars.length; i++) {
        const start = (i / last) * STAGGER;
        const pi = Math.min(Math.max((p - start) / (1 - STAGGER), 0), 1);
        const e = 1 - (1 - pi) ** 3;
        allChars[i].style.transform = "translateY(" + (1 - e) * 104 + "%)";
        allChars[i].style.opacity = String(e * MAX_OPACITY);
        allChars[i].style.filter = "blur(" + (1 - e) * 10 + "px)";
      }
    };

    let wcOn = false;
    const setWC = (on: boolean) => {
      if (wcOn === on) return;
      wcOn = on;
      for (const c of allChars) c.style.willChange = on ? "transform, opacity, filter" : "auto";
    };

    let current = 0;
    const tick = () => {
      const target = Math.min(Math.max((window.scrollY + vh - wrapTop) / denom, 0), 1);
      let next = current + (target - current) * LERP;
      if (Math.abs(next - target) < 0.001) next = target;
      if (next === current) {
        setWC(false);
        if (current >= 1) startScramble();
        return;
      }
      setWC(true);
      if (current >= 1 && next < 1) stopScramble();
      current = next;
      apply(current);
    };

    const cleanupTicker = tickWhileVisible(wrap, tick, {
      onEnter: () => {
        const r = wrap.getBoundingClientRect();
        wrapTop = r.top + window.scrollY;
      },
      onLeave: () => {
        stopScramble();
        setWC(false);
      },
    });

    return () => {
      cleanupTicker();
      stopScramble();
      ro.disconnect();
      window.removeEventListener("resize", measure);
      setWC(false);
    };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden className="kp-footer-wordmark">
      <span ref={lineARef} className="kp-footer-wordmark-line">
        {CHARS_A.map((ch, i) => (
          <span key={i} className="kp-fw-char">{ch}</span>
        ))}
      </span>
      <span ref={lineBRef} className="kp-footer-wordmark-line">
        {CHARS_B.map((ch, i) => (
          <span key={i} className="kp-fw-char">{ch}</span>
        ))}
      </span>
    </div>
  );
}

