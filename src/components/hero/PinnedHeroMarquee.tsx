"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  Circle,
  ChevronRight,
  Diamond,
  Dot,
  Minus,
  Sparkles,
  Slash,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { HeroStats } from "./stats/HeroStats";
import { HERO_CONFIG } from "./heroConfig";
import type {
  HeroMarqueeConfig,
  HeroMarqueeIconToken,
  HeroMarqueeImageToken,
  HeroMarqueeLayer,
  HeroMarqueeTextToken,
  HeroMarqueeToken,
  PinnedHeroMarqueeProps,
} from "./marqueeTypes";

gsap.registerPlugin(ScrollTrigger);

// ── Icon registry ──────────────────────────────────────────────────────────────

const ICONS: Record<string, LucideIcon> = {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Circle,
  Diamond,
  Dot,
  Minus,
  Sparkles,
  Slash,
  Star,
  Zap,
};

// ── Math helpers ───────────────────────────────────────────────────────────────

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** power3.out easing. */
function easeOut3(t: number): number {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

// ── Token renderers ────────────────────────────────────────────────────────────

function resolveIcon(token: HeroMarqueeIconToken) {
  const Icon = ICONS[token.icon] ?? Sparkles;
  return (
    <Icon
      size={token.size ?? 16}
      className={joinClasses(
        token.animation === "spin" && "animate-spin",
        token.animation === "pulse" && "animate-pulse",
        token.className,
      )}
      style={{
        color: token.color,
        opacity: token.opacity ?? 1,
        transform:
          token.rotation !== undefined
            ? `rotate(${token.rotation}deg)`
            : undefined,
        margin: token.margin,
      }}
    />
  );
}

function resolveImage(token: HeroMarqueeImageToken) {
  return (
    <Image
      src={token.src}
      alt={token.alt ?? ""}
      width={token.width ?? 18}
      height={token.height ?? 18}
      className={token.className}
      style={{ opacity: token.opacity ?? 1, margin: token.margin }}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  );
}

function renderToken(token: HeroMarqueeToken, key: string): ReactNode {
  if (token.type === "icon") return <span key={key}>{resolveIcon(token)}</span>;
  if (token.type === "image")
    return <span key={key}>{resolveImage(token)}</span>;
  return (
    <span key={key} className={token.customClass}>
      {token.value}
    </span>
  );
}

/**
 * Renders a single text token.
 * Visibility is controlled at the track level by apply() — no per-word JS needed.
 */
function TokenContent({
  token,
  index,
}: {
  token: HeroMarqueeTextToken;
  index: number;
}) {
  const style: CSSProperties = {
    color: token.gradient?.length ? "transparent" : (token.color ?? "#fff"),
    fontWeight: token.fontWeight ?? 700,
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    letterSpacing: token.tracking,
    textTransform: token.uppercase ? "uppercase" : undefined,
    fontStyle: token.italic ? "italic" : undefined,
    WebkitTextStroke:
      token.outline
        ? `${token.outlineWidth ?? "1px"} ${token.outlineColor ?? token.color ?? "#fff"}`
        : undefined,
    WebkitTextFillColor:
      token.gradient?.length || token.outline ? "transparent" : undefined,
    backgroundImage: token.gradient?.length
      ? `linear-gradient(90deg, ${token.gradient.join(", ")})`
      : undefined,
    backgroundClip: token.gradient?.length ? "text" : undefined,
    WebkitBackgroundClip: token.gradient?.length ? "text" : undefined,
    display: "inline-block",
  };

  return (
    <span
      data-marquee-word={token.value}
      className={joinClasses(
        "inline-flex items-center gap-2 whitespace-nowrap",
        token.customClass,
      )}
      style={style}
    >
      {token.iconBefore &&
        renderToken(token.iconBefore, `${token.value}-before-${index}`)}
      {token.value}
      {token.iconAfter &&
        renderToken(token.iconAfter, `${token.value}-after-${index}`)}
    </span>
  );
}

function renderSeparator(token: HeroMarqueeToken, key: string) {
  return (
    <span
      key={key}
      className="inline-flex shrink-0 items-center justify-center select-none"
      aria-hidden="true"
    >
      {renderToken(token, key)}
    </span>
  );
}

function renderLayerItem(
  item: HeroMarqueeTextToken,
  layer: HeroMarqueeLayer,
  copyIndex: number,
  index: number,
) {
  return (
    <span
      key={`${item.value}-${copyIndex}-${index}`}
      className="inline-flex items-center"
      style={{ marginRight: `${layer.gap ?? 40}px` }}
    >
      <TokenContent token={item} index={index} />
      {item.separator ? (
        <span
          className="inline-flex items-center justify-center"
          style={{ marginLeft: `${Math.max((layer.gap ?? 40) * 0.55, 10)}px` }}
        >
          {renderSeparator(
            item.separator,
            `${item.value}-sep-${copyIndex}-${index}`,
          )}
        </span>
      ) : layer.separator ? (
        <span
          className="inline-flex items-center justify-center"
          style={{ marginLeft: `${Math.max((layer.gap ?? 40) * 0.55, 10)}px` }}
        >
          {renderSeparator(
            layer.separator,
            `${item.value}-sep-${copyIndex}-${index}`,
          )}
        </span>
      ) : null}
    </span>
  );
}

function HeroMarqueeRow({
  layer,
  index,
  trackRef,
}: {
  layer: HeroMarqueeLayer;
  index: number;
  trackRef: (el: HTMLDivElement | null) => void;
}) {
  const rowDepth    = HERO_CONFIG.LAYER_ROW_DEPTHS[index] ?? 0;
  const repeatCount = HERO_CONFIG.REPEAT_COUNT;

  return (
    <div
      className={joinClasses(
        "absolute inset-x-0 flex items-center justify-center",
        layer.className,
      )}
      style={{
        zIndex:    30 - index * 10,
        transform: `translate3d(0, ${layer.y ?? 0}px, 0) translateZ(${rowDepth}px) scale(${layer.scale ?? 1})`,
        overflow:  "hidden",
      }}
    >
      {/*
        trackRef is the animated element.
        apply() controls its opacity (appear/fade) and transform (slide exit).
        Starts at opacity:0 — the marquee stage is hidden until heading exits.
      */}
      <div
        ref={trackRef}
        className="inline-flex items-center justify-center"
        style={{ gap: `${layer.gap ?? 40}px`, opacity: 0 }}
      >
        {Array.from({ length: repeatCount }).map((_, copyIndex) => (
          <div
            key={copyIndex}
            className="inline-flex items-center"
            style={{ gap: `${layer.gap ?? 40}px` }}
          >
            {layer.items.map((item, itemIndex) =>
              renderLayerItem(item, layer, copyIndex, itemIndex),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PinnedHeroMarquee({
  marquee,
  stats,
  children,
}: PinnedHeroMarqueeProps) {
  const wrapRef         = useRef<HTMLDivElement>(null);
  const sectionRef      = useRef<HTMLElement>(null);
  const heroStageRef    = useRef<HTMLDivElement>(null);
  const glassRef        = useRef<HTMLDivElement>(null);
  const glowRef         = useRef<HTMLDivElement>(null);
  const marqueeStageRef = useRef<HTMLDivElement>(null);
  const trackRefs       = useRef<(HTMLDivElement | null)[]>([]);

  const config    = marquee ?? null;
  const hasLayers = Boolean(config?.layers?.length);
  const layers    = useMemo(() => config?.layers ?? [], [config]);
  const textBandY = config?.textBandY ?? "calc(50% - 120px)";
  const glass     = config?.glass;

  const glassValues = useMemo(
    () => ({ ...HERO_CONFIG.GLASS_DEFAULT, ...(glass ?? {}) }),
    [glass],
  );

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !hasLayers) return;

    const heroStage    = heroStageRef.current;
    const glassEl      = glassRef.current;
    const glowEl       = glowRef.current;
    const marqueeStage = marqueeStageRef.current;

    // ── will-change: dynamic only — never in JSX ──────────────────────
    if (heroStage)    heroStage.style.willChange    = "transform";
    if (glassEl)      glassEl.style.willChange      = "opacity, backdrop-filter";
    if (glowEl)       glowEl.style.willChange       = "opacity";
    if (marqueeStage) marqueeStage.style.willChange = "visibility";
    trackRefs.current.forEach((t) => {
      if (t) t.style.willChange = "transform, opacity";
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const getTravel = () =>
      Math.round(
        window.innerHeight *
          (config?.travelFactor ??
            (window.matchMedia("(max-width: 767px)").matches ? 2.0 : 2.5)),
      );

    wrap.style.height = `${window.innerHeight + getTravel()}px`;

    const {
      opacityStart: glassOStart = HERO_CONFIG.GLASS_DEFAULT.opacityStart,
      opacityMax:   glassOMax   = HERO_CONFIG.GLASS_DEFAULT.opacityMax,
      blurStart:    glassBStart = HERO_CONFIG.GLASS_DEFAULT.blurStart,
      blurMax:      glassBMax   = HERO_CONFIG.GLASS_DEFAULT.blurMax,
    } = glassValues;

    // Cache viewport width — avoids layout recalc every scroll frame.
    let cachedVW = window.innerWidth;

    // ── Per-frame update ──────────────────────────────────────────────
    const apply = (progress: number) => {
      const p = clamp(progress, 0, 1);

      // Expose progress to child components (HeroSectionContent, HeroStats).
      wrap.style.setProperty("--hero-story-progress", `${p}`);

      // ── Glass morphism ────────────────────────────────────────────
      // Builds to full opacity exactly as the hero heading finishes fading.
      const glassT = smoothstep(0, HERO_CONFIG.HERO_PUSH_END, p);
      if (glassEl) {
        glassEl.style.opacity        = `${lerp(glassOStart, glassOMax, glassT)}`;
        glassEl.style.backdropFilter = `blur(${lerp(glassBStart, glassBMax, glassT)}px)`;
      }

      // ── Billboard glow ────────────────────────────────────────────
      // Soft build-up that persists through the entire scroll.
      if (glowEl) {
        const glow = lerp(0.02, 0.38, smoothstep(0, 0.45, p));
        glowEl.style.opacity = `${glow}`;
      }

      // ── Hero stage: gentle zoom as content fades ──────────────────
      // Billboard NEVER fades — it stays as the backdrop throughout.
      if (heroStage) {
        const push = smoothstep(0, HERO_CONFIG.HERO_PUSH_END, p);
        heroStage.style.transform =
          `translate3d(0, ${lerp(0, -6, push)}px, 0) scale(${lerp(1, 1.025, push)})`;
      }

      // ── Marquee stage visibility ──────────────────────────────────
      // Hidden completely while the heading is still on screen.
      // Becomes visible the moment the heading finishes fading.
      if (marqueeStage) {
        marqueeStage.style.visibility =
          p >= HERO_CONFIG.HERO_PUSH_END ? "visible" : "hidden";
      }

      // ── Marquee row animations ────────────────────────────────────
      //
      // Timeline:
      //   1. HERO_PUSH_END → MARQUEE_ENTER_END   All 3 rows fade in (heading is gone)
      //   2. MARQUEE_ENTER_END → MARQUEE_HOLD_END Hold — fully visible, readable
      //   3. MARQUEE_HOLD_END → ROW_EXIT_END      Rows exit:
      //        Row 0 (top):    slides left off-screen
      //        Row 1 (middle): fades in place
      //        Row 2 (bottom): slides left off-screen (cascade delay)
      //
      const vw = cachedVW;

      // Shared appear progress (0 → 1 as heading finishes)
      const appearT = easeOut3(
        smoothstep(HERO_CONFIG.HERO_PUSH_END, HERO_CONFIG.MARQUEE_ENTER_END, p),
      );

      // Row 0 — top: fade in, then slide left
      const track0 = trackRefs.current[0];
      if (track0) {
        const exitT = easeOut3(
          smoothstep(HERO_CONFIG.MARQUEE_HOLD_END, HERO_CONFIG.ROW_EXIT_END, p),
        );
        track0.style.opacity   = `${appearT}`;
        track0.style.transform = `translateX(${-vw * 1.15 * exitT}px)`;
      }

      // Row 1 — middle: fade in, then fade out in place (no horizontal movement)
      const track1 = trackRefs.current[1];
      if (track1) {
        const exitT = smoothstep(
          HERO_CONFIG.MARQUEE_HOLD_END + 0.02,
          HERO_CONFIG.ROW_EXIT_END,
          p,
        );
        track1.style.opacity   = `${appearT * (1 - exitT)}`;
        track1.style.transform = "";
      }

      // Row 2 — bottom: fade in, then slide left (tiny cascade delay)
      const track2 = trackRefs.current[2];
      if (track2) {
        const exitT = easeOut3(
          smoothstep(
            HERO_CONFIG.MARQUEE_HOLD_END + 0.04,
            HERO_CONFIG.ROW2_EXIT_END,
            p,
          ),
        );
        track2.style.opacity   = `${appearT}`;
        track2.style.transform = `translateX(${-vw * 1.15 * exitT}px)`;
      }
    };

    if (reduced) {
      apply(1);
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start:   "top top",
      end:     () => `+=${getTravel()}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });

    const onResize = () => {
      cachedVW          = window.innerWidth;
      wrap.style.height = `${window.innerHeight + getTravel()}px`;
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    apply(0);

    return () => {
      trigger.kill();
      window.removeEventListener("resize", onResize);

      if (heroStage)    heroStage.style.willChange    = "auto";
      if (glassEl)      glassEl.style.willChange      = "auto";
      if (glowEl)       glowEl.style.willChange       = "auto";
      if (marqueeStage) marqueeStage.style.willChange = "auto";
      trackRefs.current.forEach((t) => {
        if (t) t.style.willChange = "auto";
      });
    };
  }, [config, hasLayers, layers, glassValues]);

  // ── Fallback: no marquee config ────────────────────────────────────────────
  if (!hasLayers) {
    return (
      <section id="s1" className="relative h-screen">
        {children}
      </section>
    );
  }

  // ── Full pinned hero ───────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className="relative" style={{ height: "100vh" }}>
      <section
        id="s1"
        ref={sectionRef}
        className="sticky top-0 h-screen overflow-hidden"
      >
        {/* ── Hero WebGL stage ───────────────────────────────────────── */}
        <div
          ref={heroStageRef}
          className="absolute inset-0 z-10"
          style={{
            transform:       "translate3d(0, 0, 0) scale(1)",
            transformOrigin: "center center",
          }}
        >
          {children}
        </div>

        {/* ── Billboard glow (screen blend) ─────────────────────────── */}
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            opacity:      0,
            mixBlendMode: "screen",
            background: `radial-gradient(42% 34% at ${config?.billboardGlow?.x ?? "72%"} ${config?.billboardGlow?.y ?? "42%"}, ${config?.billboardGlow?.color ?? "rgba(245,131,32,0.45)"} 0%, rgba(245,131,32,0.18) 42%, transparent 74%)`,
          }}
        />

        {/* ── Glass morphism overlay ─────────────────────────────────── */}
        <div
          ref={glassRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            opacity:        0,
            backdropFilter: "blur(0px)",
            background: `linear-gradient(180deg, ${glassValues.color ?? HERO_CONFIG.GLASS_DEFAULT.color} 0%, rgba(255,255,255,0.02) 42%, rgba(255,255,255,0.05) 100%)`,
          }}
        />

        {/*
          ── Marquee text band ────────────────────────────────────────────
          overflow:hidden clips rows at the viewport edges so no word
          bleeds outside the visible area, regardless of font size.
          Rows start at opacity:0 and are revealed by apply() only after
          the hero heading has completely faded.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 z-30 overflow-hidden"
          style={{
            top:    textBandY,
            height: "clamp(260px, 29vw, 360px)",
          }}
          aria-hidden="true"
        >
          <div
            ref={marqueeStageRef}
            className="relative mx-auto h-full w-full max-w-[min(1440px,96vw)] px-6 md:px-10 lg:px-16"
            style={{
              visibility:     "hidden",
              perspective:    "1200px",
              transformStyle: "preserve-3d",
            }}
          >
            {layers.map((layer, index) => (
              <HeroMarqueeRow
                key={`layer-${index}`}
                layer={layer}
                index={index}
                trackRef={(el) => {
                  trackRefs.current[index] = el;
                }}
              />
            ))}
          </div>
        </div>

        {/*
          ── Hero statistics (Scroll 3) ─────────────────────────────────
          No progress prop — HeroStats reads --hero-story-progress from
          the inherited CSS custom property set by apply() on wrapRef.
        */}
        {stats?.length ? <HeroStats heroStats={stats} /> : null}
      </section>
    </div>
  );
}
