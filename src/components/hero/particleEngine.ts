/**
 * particleEngine.ts
 *
 * GSAP-driven, one-shot word-scatter effect for the hero marquee dissolve.
 * Visual concept ported from particle-disintegrate.js — pixels / particles
 * fly outward from each word origin, fade, and shrink.
 *
 * Guarantees:
 * - play() is one-shot: subsequent calls (including backwards scrub) are no-ops.
 * - destroy() kills all running tweens and removes every spawned canvas/element.
 * - No replay on backwards scrub.
 * - Falls back to a simple opacity + blur fade when enableSnapEffect is false.
 *
 * Configuration is injected at creation time — all params are exposed via
 * ParticleEngineConfig and driven from heroConfig / home.json.
 */

import { gsap } from "gsap";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ParticleEngineConfig {
  /** Master switch. When false the engine fades words instead of scattering. */
  enableSnapEffect: boolean;
  /** Particles spawned per word node. */
  particleCount: number;
  /** Diameter in px of each particle dot. */
  particleSize: number;
  /** Duration in seconds of each particle's fly-out tween. */
  particleDuration: number;
  /** CSS color string for particle fill and glow. */
  particleColor: string;
  /** Multiplier on the scatter distance. 1 = default spread. */
  particleSpeed: number;
  /** Maximum scatter radius in px before speed is applied. */
  particleSpread: number;
  /** Starting opacity of each particle (0–1). */
  particleOpacity: number;
  /** Glow intensity (0 = no glow; higher = larger box-shadow). */
  particleGlow: number;
}

export interface ParticleEngine {
  /**
   * Fire the dissolve.  One-shot — ignores every call after the first,
   * including backwards-scrub re-entry.
   *
   * @param container  Positioned parent element that receives the particles.
   * @param wordNodes  The [data-marquee-word] elements to dissolve from.
   */
  play(
    container: HTMLElement,
    wordNodes: NodeListOf<HTMLElement> | HTMLElement[],
  ): void;

  /** Kill running tweens and remove all spawned elements. */
  destroy(): void;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

export const PARTICLE_ENGINE_DEFAULTS: ParticleEngineConfig = {
  enableSnapEffect: true,
  particleCount: 10,
  particleSize: 4,
  particleDuration: 0.85,
  particleColor: "rgba(255,255,255,0.7)",
  particleSpeed: 1,
  particleSpread: 30,
  particleOpacity: 0.75,
  particleGlow: 0.16,
};

// ── Internal helpers ───────────────────────────────────────────────────────────

function buildDot(
  color: string,
  size: number,
  glow: number,
  opacity: number,
): HTMLSpanElement {
  const el = document.createElement("span");
  const shadow =
    glow > 0
      ? `0 0 ${Math.max(size * 2, 6)}px ${Math.max(glow * 10, 2)}px ${color}`
      : "none";
  // cssText is faster than individual property assignments for short-lived nodes.
  el.style.cssText = `
    position:absolute;
    left:0;top:0;
    width:${size}px;height:${size}px;
    border-radius:9999px;
    background:${color};
    box-shadow:${shadow};
    pointer-events:none;
    opacity:${opacity};
  `;
  return el;
}

// ── Factory ────────────────────────────────────────────────────────────────────

export function createParticleEngine(
  config: Partial<ParticleEngineConfig> = {},
): ParticleEngine {
  const cfg: ParticleEngineConfig = { ...PARTICLE_ENGINE_DEFAULTS, ...config };

  let played = false;
  const activeTweens: gsap.core.Tween[] = [];
  const spawnedEls: HTMLElement[] = [];

  function evict(el: HTMLElement) {
    el.remove();
    const i = spawnedEls.indexOf(el);
    if (i !== -1) spawnedEls.splice(i, 1);
  }

  function play(
    container: HTMLElement,
    wordNodes: NodeListOf<HTMLElement> | HTMLElement[],
  ) {
    // One-shot guard — survives backwards scrub.
    if (played) return;
    played = true;

    const nodes = Array.from(wordNodes);

    // ── Fallback: plain fade ────────────────────────────────────────────
    if (!cfg.enableSnapEffect) {
      nodes.forEach((node, i) => {
        activeTweens.push(
          gsap.to(node, {
            opacity: 0,
            filter: "blur(4px)",
            duration: cfg.particleDuration * 0.9,
            ease: "power2.out",
            delay: i * 0.04,
          }),
        );
      });
      return;
    }

    // ── Particle scatter — mirrors the visual concept of particle-disintegrate.js ──
    const containerRect = container.getBoundingClientRect();

    nodes.forEach((wordNode, wordIndex) => {
      const rect = wordNode.getBoundingClientRect();
      const originX = rect.left - containerRect.left + rect.width / 2;
      const originY = rect.top - containerRect.top + rect.height / 2;

      for (let i = 0; i < cfg.particleCount; i++) {
        const dot = buildDot(
          cfg.particleColor,
          cfg.particleSize,
          cfg.particleGlow,
          cfg.particleOpacity,
        );
        dot.style.left = `${originX}px`;
        dot.style.top = `${originY}px`;
        container.appendChild(dot);
        spawnedEls.push(dot);

        // Deterministic angle spread across words + particles.
        const angle = (wordIndex * 0.8 + i * 0.6) % (Math.PI * 2);
        const distance =
          cfg.particleSpread *
          (0.55 + Math.random() * 0.8) *
          cfg.particleSpeed;

        activeTweens.push(
          gsap.fromTo(
            dot,
            { x: 0, y: 0, scale: 1 },
            {
              x: Math.cos(angle) * distance,
              // Slight upward bias mirrors the disintegrate.js direction.
              y: Math.sin(angle) * distance - cfg.particleSpread * 0.12,
              scale: 0.2,
              opacity: 0,
              duration: cfg.particleDuration,
              ease: "power2.out",
              delay: i * 0.005 + wordIndex * 0.01,
              onComplete: () => evict(dot),
            },
          ),
        );
      }
    });
  }

  function destroy() {
    for (const t of activeTweens) t.kill();
    activeTweens.length = 0;
    // Copy before mutating — evict() splices the array.
    for (const el of [...spawnedEls]) el.remove();
    spawnedEls.length = 0;
  }

  return { play, destroy };
}
