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
import { HERO_STATS_PARTICLE_DEFAULTS } from "./stats/heroStatsData";
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

const REPEAT_COUNT = 4;
const LAYER_ROW_DEPTHS = [160, 72, 0] as const;
const HERO_PUSH_END = 0.35;
const MARQUEE_REVEAL_START = 0.4;
const MARQUEE_REVEAL_END = 0.5;
const MARQUEE_MOTION_START = 0.5;
const MARQUEE_HOLD_END = 0.82;
const PARTICLE_START = 0.86;
const STATS_START = 0.9;
const DEFAULT_GLASS = {
  color: "rgba(255,255,255,0.08)",
  opacityStart: 0,
  opacityMid: 0.16,
  opacityMax: 0.16,
  blurStart: 0,
  blurMid: 22,
  blurMax: 22,
};

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function organicProgress(progress: number, layerIndex: number) {
  const offset = layerIndex * 0.035;
  const p = clamp((progress - offset) / (1 - offset), 0, 1);

  if (p < 0.16) return p * 0.55;
  if (p < 0.38) return 0.088 + (p - 0.16) * 1.15;
  if (p < 0.56) return 0.341 + (p - 0.38) * 0.12;
  return 0.362 + (p - 0.56) * 1.18;
}

function getParticleConfig(config?: HeroMarqueeConfig | null) {
  return {
    ...HERO_STATS_PARTICLE_DEFAULTS,
    ...(config?.particleEffect ?? {}),
  };
}

function createParticleEl(
  color: string,
  size: number,
  glow: number,
  opacity: number,
) {
  const particle = document.createElement("span");
  particle.style.position = "absolute";
  particle.style.left = "0";
  particle.style.top = "0";
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.borderRadius = "9999px";
  particle.style.background = color;
  particle.style.boxShadow = glow > 0 ? `0 0 ${Math.max(size * 2, 6)}px ${Math.max(glow * 10, 2)}px ${color}` : "none";
  particle.style.pointerEvents = "none";
  particle.style.opacity = `${opacity}`;
  particle.style.willChange = "transform, opacity";
  return particle;
}

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
        transform: token.rotation !== undefined ? `rotate(${token.rotation}deg)` : undefined,
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
  if (token.type === "image") return <span key={key}>{resolveImage(token)}</span>;
  return (
    <span key={key} className={token.customClass}>
      {token.value}
    </span>
  );
}

function TokenContent({
  token,
  index,
}: {
  token: HeroMarqueeTextToken;
  index: number;
}) {
  const style: CSSProperties = {
    color: token.gradient?.length ? "transparent" : token.color ?? "#fff",
    fontWeight: token.fontWeight ?? 700,
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    letterSpacing: token.tracking,
    opacity: token.opacity ?? 1,
    textTransform: token.uppercase ? "uppercase" : undefined,
    fontStyle: token.italic ? "italic" : undefined,
    margin: 0,
    transform:
      token.animation === "lift"
        ? "translate3d(0, -2px, 0)"
        : token.animation === "scale"
          ? "scale(1.02)"
          : "translate3d(0, 0, 0)",
    filter: token.animation === "blur" ? "blur(0.35px)" : undefined,
    WebkitTextStroke: token.outline ? `${token.outlineWidth ?? "1px"} ${token.outlineColor ?? token.color ?? "#fff"}` : undefined,
    WebkitTextFillColor: token.gradient?.length || token.outline ? "transparent" : undefined,
    backgroundImage: token.gradient?.length ? `linear-gradient(90deg, ${token.gradient.join(", ")})` : undefined,
    backgroundClip: token.gradient?.length ? "text" : undefined,
    WebkitBackgroundClip: token.gradient?.length ? "text" : undefined,
  };

  return (
    <span
      data-marquee-word={token.value}
      className={joinClasses(
        "inline-flex items-center gap-2 whitespace-nowrap transition-[opacity,transform,filter] duration-700",
        token.customClass,
      )}
      style={style}
    >
      {token.iconBefore && renderToken(token.iconBefore, `${token.value}-before-${index}`)}
      <span className={joinClasses(token.animation === "sweep" && "pm-text-sweep")}>{token.value}</span>
      {token.iconAfter && renderToken(token.iconAfter, `${token.value}-after-${index}`)}
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

function renderLayerItem(item: HeroMarqueeTextToken, layer: HeroMarqueeLayer, copyIndex: number, index: number) {
  return (
    <span
      key={`${item.value}-${copyIndex}-${index}`}
      className={joinClasses(
        "inline-flex items-center",
        item.customClass,
      )}
      style={{ marginRight: `${layer.gap ?? 40}px` }}
    >
      <TokenContent token={item} index={index} />
      {item.separator ? (
        <span className="inline-flex items-center justify-center" style={{ marginLeft: `${Math.max((layer.gap ?? 40) * 0.55, 10)}px` }}>
          {renderSeparator(item.separator, `${item.value}-sep-${copyIndex}-${index}`)}
        </span>
      ) : layer.separator ? (
        <span className="inline-flex items-center justify-center" style={{ marginLeft: `${Math.max((layer.gap ?? 40) * 0.55, 10)}px` }}>
          {renderSeparator(layer.separator, `${item.value}-sep-${copyIndex}-${index}`)}
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
  const rowDepth = LAYER_ROW_DEPTHS[index] ?? 0;
  const repeatCopies = layer.repeat ?? REPEAT_COUNT;

  return (
    <div
      className={joinClasses(
        "absolute inset-x-0 flex items-center overflow-hidden",
        layer.className,
      )}
      style={{
        opacity: 1,
        zIndex: 30 - index * 10,
        transform: `translate3d(0, ${layer.y ?? 0}px, 0) translateZ(${rowDepth}px) scale(${layer.scale ?? 1})`,
        willChange: "transform, opacity",
      }}
    >
      <div
        ref={trackRef}
        className="flex w-max items-center"
        style={{
          gap: `${layer.gap ?? 40}px`,
          maxWidth: "100%",
          paddingInline: "clamp(1rem, 2.4vw, 2rem)",
          maskImage: "linear-gradient(90deg, transparent 0%, black 11%, black 89%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 11%, black 89%, transparent 100%)",
        }}
      >
        {Array.from({ length: repeatCopies }).map((_, copyIndex) => (
          <div key={copyIndex} className="flex items-center" style={{ gap: `${layer.gap ?? 40}px` }}>
            {layer.items.map((item, itemIndex) =>
              renderLayerItem(item, layer, copyIndex, itemIndex),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PinnedHeroMarquee({ marquee, stats, children }: PinnedHeroMarqueeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const heroStageRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const marqueeStageRef = useRef<HTMLDivElement>(null);
  const particleLayerRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dissolveTriggeredRef = useRef(false);

  const config: HeroMarqueeConfig | null = marquee ?? null;
  const hasLayers = Boolean(config?.layers?.length);

  const layers = useMemo(() => config?.layers ?? [], [config]);
  const textBandY = config?.textBandY ?? "58%";
  const glass = config?.glass;
  const particleConfig = useMemo(() => getParticleConfig(config), [config]);
  const glassValues = useMemo(
    () => ({ ...DEFAULT_GLASS, ...(glass ?? {}) }),
    [glass],
  );
  const {
    color: glassColor = DEFAULT_GLASS.color,
    opacityStart: glassOpacityStart = DEFAULT_GLASS.opacityStart,
    opacityMid: glassOpacityMid = DEFAULT_GLASS.opacityMid,
    opacityMax: glassOpacityMax = DEFAULT_GLASS.opacityMax,
    blurStart: glassBlurStart = DEFAULT_GLASS.blurStart,
    blurMid: glassBlurMid = DEFAULT_GLASS.blurMid,
    blurMax: glassBlurMax = DEFAULT_GLASS.blurMax,
  } = glassValues;

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !hasLayers) return;
    const particleLayerEl = particleLayerRef.current;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const getTravel = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      return Math.round(window.innerHeight * (config?.travelFactor ?? (mobile ? 1.55 : 1.85)));
    };

    wrap.style.height = `${window.innerHeight + getTravel()}px`;

    const spawnParticleDissolve = () => {
      if (dissolveTriggeredRef.current) return;
      if (!particleConfig.enableSnapEffect) return;
      const stage = marqueeStageRef.current;
      const layer = particleLayerEl;
      if (!stage || !layer) return;

      const wordNodes = stage.querySelectorAll<HTMLElement>("[data-marquee-word]");
      if (!wordNodes.length) return;

      dissolveTriggeredRef.current = true;
      layer.replaceChildren();

      const stageRect = layer.getBoundingClientRect();
      wordNodes.forEach((wordNode, wordIndex) => {
        const rect = wordNode.getBoundingClientRect();
        const originX = rect.left - stageRect.left + rect.width / 2;
        const originY = rect.top - stageRect.top + rect.height / 2;
        const particleCount = particleConfig.particleCount ?? HERO_STATS_PARTICLE_DEFAULTS.particleCount;
        for (let i = 0; i < particleCount; i += 1) {
          const particle = createParticleEl(
            particleConfig.particleColor ?? HERO_STATS_PARTICLE_DEFAULTS.particleColor,
            particleConfig.particleSize ?? HERO_STATS_PARTICLE_DEFAULTS.particleSize,
            particleConfig.particleGlow ?? HERO_STATS_PARTICLE_DEFAULTS.particleGlow,
            particleConfig.particleOpacity ?? HERO_STATS_PARTICLE_DEFAULTS.particleOpacity,
          );
          particle.style.left = `${originX}px`;
          particle.style.top = `${originY}px`;
          layer.appendChild(particle);

          const spread = particleConfig.particleSpread ?? HERO_STATS_PARTICLE_DEFAULTS.particleSpread;
          const duration = particleConfig.particleDuration ?? HERO_STATS_PARTICLE_DEFAULTS.particleDuration;
          const speed = particleConfig.particleSpeed ?? HERO_STATS_PARTICLE_DEFAULTS.particleSpeed;
          const angle = (wordIndex * 0.8 + i * 0.6) % (Math.PI * 2);
          const distance = spread * (0.55 + Math.random() * 0.8) * speed;

          gsap.fromTo(
            particle,
            { x: 0, y: 0, scale: 1 },
            {
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance - spread * 0.12,
              scale: 0.2,
              opacity: 0,
              duration,
              ease: "power2.out",
              delay: i * 0.005 + wordIndex * 0.01,
              onComplete: () => {
                particle.remove();
              },
            },
          );
        }
      });
    };

    const apply = (progress: number) => {
      const p = clamp(progress, 0, 1);
      wrap.style.setProperty("--hero-story-progress", `${p}`);

      const glassOpacity = p < 0.2
        ? lerp(glassOpacityStart, glassOpacityMid, smoothstep(0.0, 0.2, p))
        : p < 0.4
          ? lerp(glassOpacityMid, glassOpacityMax, smoothstep(0.2, 0.4, p))
          : glassOpacityMax;
      const glassBlur = p < 0.2
        ? lerp(glassBlurStart, glassBlurMid, smoothstep(0.0, 0.2, p))
        : p < 0.4
          ? lerp(glassBlurMid, glassBlurMax, smoothstep(0.2, 0.4, p))
          : glassBlurMax;

      if (glassRef.current) {
        glassRef.current.style.opacity = `${glassOpacity}`;
        glassRef.current.style.backdropFilter = `blur(${glassBlur}px)`;
      }

      if (glowRef.current) {
        const glowOpacity = lerp(0.02, 0.34, smoothstep(0.0, 0.4, p));
        glowRef.current.style.opacity = `${glowOpacity}`;
      }

      if (heroStageRef.current) {
        const heroPush = smoothstep(0.0, HERO_PUSH_END, p);
        const scale = lerp(1, 1.025, heroPush);
        const y = lerp(0, -6, heroPush);
        heroStageRef.current.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
      }

      if (marqueeStageRef.current) {
        const reveal = smoothstep(MARQUEE_REVEAL_START, MARQUEE_REVEAL_END, p);
        const hold = 1 - smoothstep(PARTICLE_START, STATS_START, p);
        marqueeStageRef.current.style.visibility = p < MARQUEE_REVEAL_START ? "hidden" : "visible";
        marqueeStageRef.current.style.opacity = `${reveal * hold}`;
        marqueeStageRef.current.style.transform = `translate3d(0, ${(1 - reveal) * 20}px, 0)`;
        marqueeStageRef.current.style.filter = `blur(${lerp(6, 0, reveal)}px)`;
      }

      layers.forEach((layer, i) => {
        const track = trackRefs.current[i];
        if (!track) return;

        const cycleWidth = track.scrollWidth / (layer.repeat ?? REPEAT_COUNT);
        const motionPhase = clamp((p - MARQUEE_MOTION_START) / Math.max(MARQUEE_HOLD_END - MARQUEE_MOTION_START, 0.0001), 0, 1);
        const motion = organicProgress(motionPhase, i) * (layer.speed ?? 1);
        const direction = layer.direction ?? "left";
        const offset = (layer.delay ?? i * 0.08) * cycleWidth;
        const x = direction === "right" ? motion * cycleWidth + offset : -motion * cycleWidth + offset;
        const readable = 1 - smoothstep(PARTICLE_START, STATS_START, p);
        const visible = (layer.opacity ?? 1) * smoothstep(MARQUEE_REVEAL_START, MARQUEE_REVEAL_END, p) * readable;

        track.style.transform = `translate3d(${x}px, 0, 0)`;
        track.style.opacity = `${visible}`;
      });

      if (marqueeStageRef.current) {
        const wordDissolve = smoothstep(PARTICLE_START, STATS_START, p);
        const wordNodes = marqueeStageRef.current.querySelectorAll<HTMLElement>("[data-marquee-word]");
        wordNodes.forEach((wordNode) => {
          wordNode.style.opacity = `${1 - wordDissolve}`;
          wordNode.style.filter = `blur(${wordDissolve * 6}px)`;
        });
      }

      if (p >= PARTICLE_START && p < STATS_START) {
        spawnParticleDissolve();
      }
    };

    if (reduced) {
      apply(1);
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: () => `+=${getTravel()}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        apply(self.progress);
      },
      onRefresh: (self) => {
        apply(self.progress);
      },
    });

    const onResize = () => {
      wrap.style.height = `${window.innerHeight + getTravel()}px`;
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", onResize);
    apply(0);

    return () => {
      trigger.kill();
      window.removeEventListener("resize", onResize);
      dissolveTriggeredRef.current = false;
      particleLayerEl?.replaceChildren();
    };
  }, [
    config,
    hasLayers,
    layers,
    particleConfig,
    glassBlurMax,
    glassBlurMid,
    glassBlurStart,
    glassOpacityMax,
    glassOpacityMid,
    glassOpacityStart,
  ]);

  if (!hasLayers) {
    return (
      <section id="s1" className="relative h-screen">
        {children}
      </section>
    );
  }

  return (
    <div ref={wrapRef} className="relative" style={{ height: "100vh" }}>
      <section id="s1" className="sticky top-0 h-screen overflow-hidden">
        <div
          ref={heroStageRef}
          className="absolute inset-0 z-10"
          style={{
            transform: "translate3d(0, 0, 0) scale(1)",
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          {children}
        </div>

        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            opacity: 0,
            mixBlendMode: "screen",
            background: `radial-gradient(42% 34% at ${config?.billboardGlow?.x ?? "72%"} ${config?.billboardGlow?.y ?? "42%"}, ${config?.billboardGlow?.color ?? "rgba(245,131,32,0.45)"} 0%, rgba(245,131,32,0.18) 42%, transparent 74%)`,
          }}
        />

        <div
          ref={glassRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            opacity: 0,
            backdropFilter: "blur(0px)",
            background: `linear-gradient(180deg, ${glassColor} 0%, rgba(255,255,255,0.02) 42%, rgba(255,255,255,0.05) 100%)`,
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 z-30 px-6 md:px-10 lg:px-16"
          style={{ top: textBandY, height: "clamp(260px, 29vw, 360px)" }}
          aria-hidden="true"
        >
          <div
            className="relative mx-auto h-full w-full max-w-[min(1440px,96vw)]"
            style={{
              opacity: 0,
              filter: "blur(6px)",
              perspective: "1200px",
              transform: "translate3d(0, 20px, 0)",
              transformStyle: "preserve-3d",
            }}
            ref={marqueeStageRef}
          >
            {layers.map((layer, index) => (
              <HeroMarqueeRow
                key={`layer-${index}`}
                layer={layer}
                index={index}
                trackRef={(el) => {
                  trackRefs.current[index] = el;
                  if (el) el.dataset.repeat = String(layer.repeat ?? REPEAT_COUNT);
                }}
              />
            ))}
          </div>
        </div>

        <div
          ref={particleLayerRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
          style={{
            mixBlendMode: "screen",
          }}
        />

        {stats?.length ? (
          <HeroStats heroStats={stats} progress={0} />
        ) : null}
      </section>
    </div>
  );
}
