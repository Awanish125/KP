"use client";

/**
 * AssetLoader — minimal inline loading state for 3D models / heavy images.
 *
 * Rules (per loading-screen spec):
 *  - No full-screen overlay, no outro animation — the parent unmounts this
 *    the instant the asset is ready.
 *  - KP wordmark + progress bar only.
 *  - Indeterminate mode uses a pure-CSS sweep (no JS per frame).
 */

import { ASSET_LOADER_DEFAULTS } from "./assetLoaderConfig";
import type { AssetLoaderProps } from "./assetLoaderTypes";

export function AssetLoader({
  progress,
  label,
  className,
  style,
  wordmark = ASSET_LOADER_DEFAULTS.wordmark,
  barWidth = ASSET_LOADER_DEFAULTS.barWidth,
}: AssetLoaderProps) {
  const determinate = typeof progress === "number";

  return (
    <div
      className={className}
      role="status"
      aria-label={label ?? "Loading"}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.9rem",
        width: "100%",
        height: "100%",
        minHeight: "8rem",
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: "var(--kp-font-display)",
          fontWeight: 600,
          fontSize: "1.4rem",
          letterSpacing: "0.18em",
          color: "var(--text)",
        }}
      >
        {wordmark}
        <span style={{ color: "var(--kp-orange)" }}>.</span>
      </span>

      <div
        style={{
          width: barWidth,
          height: 2,
          background: "var(--border-soft)",
          borderRadius: 999,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            borderRadius: 999,
            background: "var(--kp-orange)",
            width: determinate ? `${Math.min(Math.max(progress, 0), 100)}%` : "40%",
            transition: determinate ? "width 200ms ease-out" : undefined,
            animation: determinate ? undefined : "kp-asset-sweep 1.1s ease-in-out infinite",
          }}
        />
      </div>

      {label ? (
        <span
          style={{
            fontFamily: "var(--kp-font-mono)",
            fontSize: "var(--text-label)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--text-subtle)",
          }}
        >
          {label}
        </span>
      ) : null}

      <style>{`
        @keyframes kp-asset-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(${barWidth + barWidth * 0.4}px); }
        }
      `}</style>
    </div>
  );
}
