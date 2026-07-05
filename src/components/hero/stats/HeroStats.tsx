"use client";

import type { HeroStatsPresentation } from "../cinematicTypes";
import type { HeroStat } from "./types";

interface HeroStatsProps {
  heroStats: HeroStat[];
  presentation: HeroStatsPresentation;
}

export function HeroStats({ heroStats, presentation }: HeroStatsProps) {
  return (
    <div data-hero-stats className="hero-stats-wrap">
      <div className="hero-stats-panel">
        <div className="hero-stats-highlight" aria-hidden />
        <div className="hero-stats-inner">
          <div data-stat-reveal className="hero-stats-heading-row">
            <div>
              <p className="hero-stats-eyebrow">{presentation.eyebrow}</p>
              <h2 className="hero-stats-heading">{presentation.heading}</h2>
            </div>
            <span className="hero-stats-location">
              {presentation.location}
              <span aria-hidden>↗</span>
            </span>
          </div>
          <div data-stat-reveal className="hero-stats-rule" aria-hidden />
          <div className="hero-stats-grid">
            {heroStats.map((stat) => (
              <div data-stat-item className="hero-stat" key={stat.label}>
                <span className="hero-stat-value">
                  <span data-stat-value data-value={stat.value}>0</span>
                  <span>{stat.suffix}</span>
                </span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroStats;
