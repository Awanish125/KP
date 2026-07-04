"use client";

/**
 * MapEmbed — stylized Maharashtra SVG map with clickable site pins.
 *
 * The outline and every pin go through the same lat/lng → viewBox
 * projection, so geography stays consistent. Selection is controlled by
 * the parent (selectedIndex / onSelect). The only animation is a CSS
 * pulse on the selected pin — compositor-only, no JS per frame.
 */

import { useMemo } from "react";
import { MAHARASHTRA_BOUNDARY, MAP_EMBED_DEFAULTS } from "./mapEmbedConfig";
import type { MapEmbedProps } from "./mapEmbedTypes";

export function MapEmbed({
  sites,
  selectedIndex,
  onSelect,
  className,
  bounds = MAP_EMBED_DEFAULTS.bounds,
  width = MAP_EMBED_DEFAULTS.width,
  height = MAP_EMBED_DEFAULTS.height,
  typeColors = MAP_EMBED_DEFAULTS.typeColors,
}: MapEmbedProps) {
  const project = useMemo(() => {
    return (lat: number, lng: number): [number, number] => [
      ((lng - bounds.west) / (bounds.east - bounds.west)) * width,
      ((bounds.north - lat) / (bounds.north - bounds.south)) * height,
    ];
  }, [bounds, width, height]);

  const outlinePath = useMemo(() => {
    return (
      MAHARASHTRA_BOUNDARY.map(([lat, lng], i) => {
        const [x, y] = project(lat, lng);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ") + " Z"
    );
  }, [project]);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="Map of Kiran Publicity sites across Maharashtra"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* State fill + outline */}
        <path
          d={outlinePath}
          fill="var(--surface-2)"
          stroke="var(--border-strong)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Site pins */}
        {sites.map((site, i) => {
          const [x, y] = project(site.lat, site.lng);
          const color = typeColors[site.type] ?? "var(--kp-orange)";
          const selected = i === selectedIndex;
          return (
            <g
              key={`${site.city}-${site.name}`}
              transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
              onClick={() => onSelect(i)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`${site.city} — ${site.name}`}
              aria-pressed={selected}
            >
              {/* Generous invisible hit area */}
              <circle r="22" fill="transparent" />
              {selected && (
                <circle r="11" fill="none" stroke={color} strokeWidth="2" opacity="0.7">
                  <animate
                    attributeName="r"
                    values="11;20"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.7;0"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                r={selected ? 9 : 6.5}
                fill={color}
                stroke="var(--bg)"
                strokeWidth="2.5"
                style={{ transition: "r 200ms ease" }}
              />
              {/* City label */}
              <text
                y="-16"
                textAnchor="middle"
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  fill: selected ? "var(--text)" : "var(--text-muted)",
                  fontWeight: selected ? 700 : 400,
                  textTransform: "uppercase",
                  pointerEvents: "none",
                }}
              >
                {site.city}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
