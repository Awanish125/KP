"use client";

import type { CSSProperties } from "react";
import type { EditorialMarqueeConfig } from "./cinematicTypes";

interface HeroEditorialMarqueeProps {
  config: EditorialMarqueeConfig;
}

export function HeroEditorialMarquee({ config }: HeroEditorialMarqueeProps) {
  return (
    <div data-hero-marquee className="hero-editorial-marquee">
      <div className="hero-editorial-sweep" aria-hidden />
      <div data-marquee-track className="hero-editorial-track" style={{ gap: config.gap ?? 48 }}>
        {config.items.map((item, index) => {
          const style = {
            "--item-color": item.color ?? "rgba(255,255,255,0.92)",
            "--item-outline": item.outlineColor ?? "rgba(255,255,255,0.72)",
            opacity: item.opacity ?? 1,
            fontWeight: item.fontWeight ?? 600,
            fontSize: item.fontSize ?? "clamp(1.5rem, 4vw, 5rem)",
            letterSpacing: item.letterSpacing ?? "0.08em",
            fontStyle: item.italic ? "italic" : "normal",
            backgroundImage: item.gradient
              ? `linear-gradient(100deg, ${item.gradient.join(", ")})`
              : undefined,
            paddingRight: item.spacing ?? undefined,
          } as CSSProperties;

          return (
            <span
              key={`${item.text}-${index}`}
              data-marquee-word
              className={`hero-editorial-word${item.outline ? " is-outline" : ""}${item.gradient ? " is-gradient" : ""}`}
              style={style}
            >
              {item.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
