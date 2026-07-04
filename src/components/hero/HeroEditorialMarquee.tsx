"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { EditorialMarqueeConfig } from "./cinematicTypes";

interface HeroEditorialMarqueeProps {
  config: EditorialMarqueeConfig;
}

function MarqueeGroup({ config, hidden = false }: HeroEditorialMarqueeProps & { hidden?: boolean }) {
  return (
    <div
      data-marquee-group
      className="hero-editorial-group"
      aria-hidden={hidden || undefined}
      style={{ gap: config.gap }}
    >
      {config.items.map((item, index) => {
        const style = {
          "--item-color": item.color ?? "rgba(255,255,255,0.92)",
          "--item-outline": item.outlineColor ?? "rgba(255,255,255,0.72)",
          opacity: item.opacity ?? 1,
          fontWeight: item.fontWeight ?? 600,
          fontSize: item.fontSize ?? "clamp(1.3rem, 3.2vw, 3.5rem)",
          letterSpacing: item.letterSpacing ?? "0.08em",
          fontStyle: item.italic ? "italic" : "normal",
          backgroundImage: item.gradient
            ? `linear-gradient(100deg, ${item.gradient.join(", ")})`
            : undefined,
        } as CSSProperties;

        return (
          <span className="hero-editorial-pair" key={`${item.text}-${index}`}>
            <span
              className={`hero-editorial-word${item.outline ? " is-outline" : ""}${item.gradient ? " is-gradient" : ""}`}
              style={style}
            >
              {item.text}
            </span>
            <span className="hero-editorial-separator" style={{ color: config.separatorColor }} aria-hidden>
              {config.separator}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function HeroEditorialMarquee({ config }: HeroEditorialMarqueeProps) {
  const cssVars = useMemo(
    () => ({ "--hero-marquee-hover-factor": config.hoverSpeedFactor }) as CSSProperties,
    [config.hoverSpeedFactor],
  );

  return (
    <div data-hero-marquee className="hero-editorial-marquee" style={cssVars}>
      <div className="hero-editorial-sweep" aria-hidden />
      <div data-marquee-track className="hero-editorial-track">
        <MarqueeGroup config={config} />
        <MarqueeGroup config={config} hidden />
      </div>
    </div>
  );
}
