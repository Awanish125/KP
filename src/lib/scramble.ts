/**
 * scrambleDecode — Atlas Brut-style left→right character reveal.
 * Characters cycle through survey glyphs while unresolved, then lock
 * in from the left as a GSAP tween scrubs 0→1.
 *
 * Used by: PremiumLoader, ServicesStrip, ScrambleText component.
 */
import gsap from "gsap";

export const SCRAMBLE_GLYPHS = "█▓▒░ABCDEFGHIKLMNOPRSTUVXZ0123456789°./—";

export function scrambleDecode(
  el: HTMLElement,
  finalText: string,
  duration = 0.75,
  delay    = 0,
): gsap.core.Tween {
  const state = { p: 0 };
  // Seed with scrambled placeholder so the element is never blank
  el.textContent = finalText
    .split("")
    .map((ch) =>
      ch === " " ? " " : SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0],
    )
    .join("");

  return gsap.to(state, {
    p: 1,
    duration,
    delay,
    ease: "none",
    onUpdate() {
      const reveal = Math.floor(state.p * finalText.length);
      let out = "";
      for (let i = 0; i < finalText.length; i++) {
        const ch = finalText[i];
        out +=
          ch === " " || i < reveal
            ? ch
            : SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete() {
      el.textContent = finalText;
    },
  });
}
