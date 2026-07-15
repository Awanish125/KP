"use client";

/**
 * /locations — the KP network "command center".
 *
 * Premium layer on top of the interactive dotted globe:
 *  - Uplink boot sequence: scramble-decoded status lines + progress bar +
 *    radar sweep that wipes away once the network is "online".
 *  - HUD chrome: corner ticks, scanlines, live badge, coordinates readout
 *    that scramble-decodes on every pin change.
 *  - Animated stat counters (structures / cities / states / media types).
 *  - Site dossier panel: image crossfade + Ken Burns, staggered detail
 *    swap, prev/next cycling, and an indexed city list.
 *
 * Perf contract (memory: feedback-scroll-performance):
 *  - No ScrollTrigger / scroll listeners — IntersectionObserver only.
 *  - Tweens fire once on view or on click; no per-frame React state.
 *  - will-change never set permanently; reduced-motion skips everything.
 *
 * Content lives in src/data/locations.json — add a pin there and the
 * globe, index, and counters all update automatically.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { DottedGlobe } from "@/components/DottedGlobe";
import { CTABanner } from "@/components/CTABanner";
import { observeOnce, prefersReducedMotion } from "@/lib/motion";
import { scrambleDecode } from "@/lib/scramble";
import data from "@/data/locations.json";

const TYPE_COLORS: Record<string, string> = {
  Billboard: "var(--kp-orange)",
  "Digital LED": "var(--kp-blue)",
  Transit: "var(--kp-purple)",
};

const TOTAL_STRUCTURES = data.sites.reduce((n, s) => n + (s.count ?? 0), 0);
const STATS = [
  { value: TOTAL_STRUCTURES, suffix: "+", label: "Media Structures" },
  { value: data.sites.length, suffix: "", label: "Cities Live" },
  { value: 5, suffix: "", label: "States & UTs" },
  { value: 3, suffix: "", label: "Media Formats" },
];

const MONO: React.CSSProperties = {
  fontFamily: "var(--kp-font-mono)",
  textTransform: "uppercase",
};

/* ── animated stat counter ────────────────────────────────────────────── */

function StatCounter({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = numRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = `${value}${suffix}`;
      return;
    }
    el.textContent = `0${suffix}`;
    const state = { v: 0 };
    let tween: gsap.core.Tween | null = null;
    const cancel = observeOnce(el, () => {
      tween = gsap.to(state, {
        v: value,
        duration: 1.8,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = `${Math.round(state.v)}${suffix}`;
        },
      });
    });
    return () => {
      cancel();
      tween?.kill();
    };
  }, [value, suffix]);

  return (
    <div className="flex flex-col gap-1.5">
      <span
        ref={numRef}
        style={{
          fontFamily: "var(--kp-font-display)",
          fontSize: "clamp(2rem, 4vw, 2.9rem)",
          lineHeight: 1,
          color: "var(--text)",
        }}
      />
      <span
        style={{
          ...MONO,
          fontSize: "0.62rem",
          letterSpacing: "0.28em",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── uplink boot overlay (plays once over the globe stage) ────────────── */

const BOOT_LINES = [
  "KP NETWORK UPLINK",
  `TRIANGULATING ${data.sites.length} SITES`,
  "BIHAR · JHARKHAND · METROS — ONLINE",
];

function UplinkBoot() {
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) {
      setDone(true);
      return;
    }
    let tl: gsap.core.Timeline | null = null;
    const scrambles: gsap.core.Tween[] = [];
    const cancel = observeOnce(root, () => {
      tl = gsap.timeline({ onComplete: () => setDone(true) });
      BOOT_LINES.forEach((text, i) => {
        tl!.add(() => {
          const el = lineRefs.current[i];
          if (el) scrambles.push(scrambleDecode(el, text, 0.65));
        }, i * 0.45);
      });
      const p = { v: 0 };
      tl.to(
        p,
        {
          v: 100,
          duration: 1.7,
          ease: "power2.inOut",
          onUpdate: () => {
            if (barRef.current)
              barRef.current.style.transform = `scaleX(${p.v / 100})`;
            if (pctRef.current)
              pctRef.current.textContent = `${String(Math.round(p.v)).padStart(3, "0")}%`;
          },
        },
        0.2,
      );
      tl.to(
        root,
        { clipPath: "inset(0% 0% 100% 0%)", duration: 0.75, ease: "power4.inOut" },
        ">-0.05",
      );
    });
    return () => {
      cancel();
      tl?.kill();
      scrambles.forEach((t) => t.kill());
    };
  }, []);

  if (done) return null;
  return (
    <div
      ref={rootRef}
      aria-hidden
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6"
      style={{
        background: "var(--gs-bg)",
        clipPath: "inset(0% 0% 0% 0%)",
      }}
    >
      {/* radar sweep */}
      <div className="relative h-28 w-28">
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(244,122,32,0.25)" }}
        />
        <div
          className="absolute inset-4 rounded-full"
          style={{ border: "1px solid rgba(244,122,32,0.15)" }}
        />
        <div
          className="absolute inset-0 rounded-full kp-radar-sweep"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(244,122,32,0.5), transparent 70deg)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "var(--kp-orange)" }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        {BOOT_LINES.map((line, i) => (
          <span
            key={line}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            style={{
              ...MONO,
              fontSize: i === 0 ? "0.8rem" : "0.62rem",
              letterSpacing: "0.3em",
              color: i === 0 ? "var(--stage-text)" : "var(--gs-ink)",
            }}
          />
        ))}
      </div>

      <div className="flex w-56 flex-col gap-2">
        <div
          className="h-px w-full overflow-hidden"
          style={{ background: "var(--gs-track)" }}
        >
          <div
            ref={barRef}
            className="h-full w-full origin-left"
            style={{ background: "var(--kp-gradient-cta)", transform: "scaleX(0)" }}
          />
        </div>
        <span
          ref={pctRef}
          className="self-end"
          style={{
            ...MONO,
            fontSize: "0.6rem",
            letterSpacing: "0.25em",
            color: "var(--gs-accent-text)",
          }}
        >
          000%
        </span>
      </div>
    </div>
  );
}

/* ── HUD corner ticks ─────────────────────────────────────────────────── */

function CornerTicks() {
  const base: React.CSSProperties = {
    position: "absolute",
    width: "1.25rem",
    height: "1.25rem",
    pointerEvents: "none",
  };
  const edge = "1px solid var(--gs-tick)";
  return (
    <>
      <span aria-hidden style={{ ...base, top: 14, left: 14, borderTop: edge, borderLeft: edge }} />
      <span aria-hidden style={{ ...base, top: 14, right: 14, borderTop: edge, borderRight: edge }} />
      <span aria-hidden style={{ ...base, bottom: 14, left: 14, borderBottom: edge, borderLeft: edge }} />
      <span aria-hidden style={{ ...base, bottom: 14, right: 14, borderBottom: edge, borderRight: edge }} />
    </>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default function LocationsPage() {
  const [selected, setSelected] = useState(0);
  const site = data.sites[selected];

  // previous selection stays mounted under the incoming image → crossfade
  const prevIndexRef = useRef(selected);
  useEffect(() => {
    prevIndexRef.current = selected;
  }, [selected]);
  const prevSite = data.sites[prevIndexRef.current];

  /* coordinates readout scramble-decodes on every pin change */
  const coordRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = coordRef.current;
    if (!el) return;
    const txt = `${site.lat.toFixed(3)}°N / ${site.lng.toFixed(3)}°E — ${site.city.toUpperCase()}`;
    if (prefersReducedMotion()) {
      el.textContent = txt;
      return;
    }
    const t = scrambleDecode(el, txt, 0.5);
    return () => {
      t.kill();
    };
  }, [selected, site.lat, site.lng, site.city]);

  /* dossier details stagger in on every pin change */
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = detailRef.current;
    if (!el || prefersReducedMotion()) return;
    const kids = Array.from(el.children);
    gsap.fromTo(
      kids,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.05, overwrite: "auto" },
    );
  }, [selected]);

  const cycle = (dir: 1 | -1) =>
    setSelected((s) => (s + dir + data.sites.length) % data.sites.length);

  return (
    <div style={{ background: "transparent" }}>
      {/* page-scoped keyframes (one-shot / tiny loops only).
          Stage theme vars (--gs-*) live in globals.css (.kp-globe-stage) —
          shared with every page that mounts the globe. */}
      <style>{`
        @keyframes kpRadarSweep { to { transform: rotate(360deg); } }
        .kp-radar-sweep { animation: kpRadarSweep 1.4s linear infinite; }
        @keyframes kpLivePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(244,122,32,0.5); }
          50% { opacity: 0.6; box-shadow: 0 0 0 5px rgba(244,122,32,0); }
        }
        .kp-live-dot { animation: kpLivePulse 2.2s ease-in-out infinite; }
        @keyframes kpImgIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes kpKenburns { from { transform: scale(1.12); } to { transform: scale(1.02); } }
        .kp-site-img { animation: kpImgIn 0.65s ease both, kpKenburns 9s ease-out both; }
        .kp-city-row { transition: border-color 0.25s, background 0.25s; }
        .kp-city-row:hover { border-color: rgba(244,122,32,0.45) !important; }
        .kp-cycle-btn { transition: border-color 0.25s, color 0.25s, transform 0.2s; }
        .kp-cycle-btn:hover { border-color: var(--kp-orange) !important; color: var(--kp-orange) !important; transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) {
          .kp-radar-sweep, .kp-live-dot, .kp-site-img { animation: none; }
        }
      `}</style>

      <PageHero
        label={data.hero.label}
        line1={data.hero.line1}
        line2={data.hero.line2}
        sub={data.hero.sub}
      />

      {/* network stats */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <SectionReveal
          as="div"
          className="grid grid-cols-2 gap-x-6 gap-y-8 border-y py-8 md:grid-cols-4"
          style={{ borderColor: "var(--border-soft)" }}
        >
          {STATS.map((s) => (
            <StatCounter key={s.label} {...s} />
          ))}
        </SectionReveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <SectionReveal as="div" className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-stretch">
          {/* ── Globe stage — dark command-center chrome, both themes ──── */}
          <div
            className="kp-globe-stage relative overflow-hidden rounded-2xl"
            style={{
              background: "var(--gs-bg)",
              border: "1px solid var(--border-soft)",
              minHeight: "34rem",
            }}
          >
            <DottedGlobe
              sites={data.sites}
              selectedIndex={selected}
              onSelect={setSelected}
              height="100%"
            />

            {/* scanlines */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(0deg, var(--gs-scanline) 0 1px, transparent 1px 4px)",
              }}
            />
            <CornerTicks />

            {/* live badge */}
            <div className="pointer-events-none absolute right-6 top-5 flex items-center gap-2">
              <span
                className="kp-live-dot inline-block h-2 w-2 rounded-full"
                style={{ background: "var(--kp-orange)" }}
              />
              <span
                style={{
                  ...MONO,
                  fontSize: "0.6rem",
                  letterSpacing: "0.3em",
                  color: "var(--gs-ink)",
                }}
              >
                Network Live
              </span>
            </div>

            {/* coordinates readout */}
            <div className="pointer-events-none absolute left-6 top-5">
              <span
                ref={coordRef}
                style={{
                  ...MONO,
                  fontSize: "0.62rem",
                  letterSpacing: "0.18em",
                  color: "var(--gs-ink)",
                }}
              />
            </div>

            {/* legend */}
            <div className="pointer-events-none absolute bottom-5 left-6 flex flex-wrap gap-x-7 gap-y-2">
              {data.legend.map((l) => (
                <span key={l.type} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: TYPE_COLORS[l.type] ?? "var(--kp-orange)" }}
                  />
                  <span
                    style={{
                      ...MONO,
                      fontSize: "0.65rem",
                      letterSpacing: "0.14em",
                      color: "var(--gs-ink)",
                    }}
                  >
                    {l.label}
                  </span>
                </span>
              ))}
            </div>

            {/* site position indicator */}
            <div className="pointer-events-none absolute bottom-5 right-6">
              <span
                style={{
                  ...MONO,
                  fontSize: "0.62rem",
                  letterSpacing: "0.22em",
                  color: "var(--gs-ink-soft)",
                }}
              >
                Site {String(selected + 1).padStart(2, "0")} / {String(data.sites.length).padStart(2, "0")}
              </span>
            </div>

            <UplinkBoot />
          </div>

          {/* ── Site dossier panel ───────────────────────────────────────── */}
          <aside
            className="flex flex-col overflow-hidden rounded-2xl"
            style={{ background: "var(--kp-card-bg)", border: "1px solid var(--border-soft)" }}
            aria-live="polite"
          >
            <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
              {/* outgoing image stays under the incoming one → crossfade */}
              {prevSite.image !== site.image && (
                <Image
                  src={prevSite.image}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
              )}
              <div key={site.image} className="kp-site-img absolute inset-0">
                <Image
                  src={site.image}
                  alt={`${site.name}, ${site.city}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              {/* readability gradient + type chip */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(10,12,16,0.55), transparent 45%)",
                }}
              />
              <span
                className="absolute bottom-3 left-4 rounded-full px-3 py-1"
                style={{
                  ...MONO,
                  fontSize: "0.58rem",
                  letterSpacing: "0.2em",
                  color: "#fff",
                  background: "rgba(10,12,16,0.55)",
                  border: `1px solid ${TYPE_COLORS[site.type] ?? "var(--kp-orange)"}`,
                  backdropFilter: "blur(6px)",
                }}
              >
                {site.type}
              </span>
              {/* prev / next */}
              <div className="absolute bottom-3 right-3 flex gap-2">
                {([-1, 1] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    aria-label={dir === 1 ? "Next site" : "Previous site"}
                    onClick={() => cycle(dir)}
                    className="kp-cycle-btn flex h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      background: "rgba(10,12,16,0.55)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(6px)",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    {dir === 1 ? "→" : "←"}
                  </button>
                ))}
              </div>
            </div>

            <div ref={detailRef} className="flex flex-1 flex-col p-7">
              <div
                style={{
                  ...MONO,
                  fontSize: "0.72rem",
                  letterSpacing: "0.3em",
                  color: "var(--kp-orange)",
                }}
              >
                {site.type} · {site.city}
                {"tag" in site && site.tag ? ` · ${site.tag}` : ""}
              </div>
              <h2
                className="mt-3"
                style={{
                  fontFamily: "var(--kp-font-display)",
                  fontSize: "1.7rem",
                  lineHeight: 1.1,
                  textTransform: "uppercase",
                  color: "var(--text)",
                }}
              >
                {site.name}
              </h2>
              <p
                className="mt-4"
                style={{
                  fontFamily: "var(--kp-font-body)",
                  fontSize: "0.95rem",
                  color: "var(--text-muted)",
                }}
              >
                <strong style={{ color: "var(--text)" }}>{site.count}</strong>{" "}
                media structures in this cluster.
              </p>

              {/* indexed city list */}
              <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
                {data.sites.map((s, i) => {
                  const active = i === selected;
                  return (
                    <button
                      key={`${s.city}-${s.name}`}
                      type="button"
                      onClick={() => setSelected(i)}
                      className="kp-city-row flex items-center justify-between rounded-lg px-3 py-2 text-left"
                      style={{
                        cursor: "pointer",
                        background: active ? "rgba(244,122,32,0.10)" : "transparent",
                        border: `1px solid ${active ? "rgba(244,122,32,0.55)" : "var(--border-soft)"}`,
                      }}
                    >
                      <span className="flex items-center gap-2 overflow-hidden">
                        <span
                          style={{
                            ...MONO,
                            fontSize: "0.55rem",
                            letterSpacing: "0.08em",
                            color: active ? "var(--kp-orange)" : "var(--text-muted)",
                            opacity: active ? 1 : 0.55,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="truncate"
                          style={{
                            ...MONO,
                            fontSize: "0.64rem",
                            letterSpacing: "0.1em",
                            color: active ? "var(--text)" : "var(--text-muted)",
                          }}
                        >
                          {s.city}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="ml-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background: TYPE_COLORS[s.type] ?? "var(--kp-orange)",
                          opacity: active ? 1 : 0.45,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </SectionReveal>
      </section>

      <CTABanner
        heading="Want a pin with your name on it?"
        sub="Tell us your target cities — availability and rates within a day."
        button={{ label: "Check Availability", href: "/contact" }}
      />
    </div>
  );
}
