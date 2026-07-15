"use client";

/**
 * CredentialsStrip — statutory registrations (GSTIN / CIN / MSME) as a
 * slim trust band. The detail that sells to govt and corporate clients.
 * Values reveal with a decrypt-style scramble when scrolled into view —
 * a one-shot tween per item, no per-frame residue.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { observeOnce, prefersReducedMotion } from "@/lib/motion";
import { CREDENTIALS_STRIP_DEFAULTS } from "./credentialsStripConfig";
import type { CredentialsStripProps } from "./credentialsStripTypes";

const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function CredentialsStrip({
  credentials = CREDENTIALS_STRIP_DEFAULTS,
  className,
}: CredentialsStripProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-cred-value]"));
    const tweens: gsap.core.Tween[] = [];

    const cancel = observeOnce(root, () => {
      targets.forEach((el, i) => {
        const finalText = el.dataset.credValue ?? "";
        const state = { p: 0 };
        tweens.push(
          gsap.to(state, {
            p: 1,
            duration: 1.1,
            delay: i * 0.12,
            ease: "power2.out",
            onUpdate: () => {
              const settled = Math.floor(state.p * finalText.length);
              let out = finalText.slice(0, settled);
              for (let c = settled; c < finalText.length; c++) {
                const ch = finalText[c];
                out += ch === " " ? " " : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
              }
              el.textContent = out;
            },
            onComplete: () => {
              el.textContent = finalText;
            },
          }),
        );
      });
    });

    return () => {
      cancel();
      tweens.forEach((t) => t.kill());
      targets.forEach((el) => {
        el.textContent = el.dataset.credValue ?? "";
      });
    };
  }, [credentials]);

  return (
    <div
      ref={rootRef}
      className={`flex flex-wrap gap-x-10 gap-y-4 ${className ?? ""}`}
    >
      {credentials.map((cred) => (
        <div key={cred.label} className="flex items-baseline gap-3">
          <span
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--kp-orange-text)",
            }}
          >
            {cred.label}
          </span>
          <span
            data-cred-value={cred.value}
            style={{
              fontFamily: "var(--kp-font-mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              color: "var(--footer-text-muted)",
            }}
          >
            {cred.value}
          </span>
        </div>
      ))}
    </div>
  );
}
