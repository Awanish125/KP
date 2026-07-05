"use client";

/**
 * MediaKitButton — magnetic download pill for the company profile PDF.
 * The arrow dips into the tray on hover (pure CSS transforms), the pill
 * itself is magnetic via MagneticButton. No backend — static file.
 */

import { ArrowDown } from "lucide-react";
import { MagneticButton } from "@/components/MagneticButton";
import { MEDIA_KIT_BUTTON_DEFAULTS } from "./mediaKitButtonConfig";
import type { MediaKitButtonProps } from "./mediaKitButtonTypes";

export function MediaKitButton({
  className,
  label = MEDIA_KIT_BUTTON_DEFAULTS.label,
  file = MEDIA_KIT_BUTTON_DEFAULTS.file,
  note = MEDIA_KIT_BUTTON_DEFAULTS.note,
}: MediaKitButtonProps) {
  return (
    <div className={className}>
      <MagneticButton>
        <a
          href={file}
          download
          className="group inline-flex items-center gap-4 rounded-full py-4 pr-8 pl-5 no-underline"
          style={{
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--text)",
            transition: "border-color 300ms ease, box-shadow 300ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--kp-orange)";
            e.currentTarget.style.boxShadow = "0 8px 32px var(--kp-orange-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-strong)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Arrow tray */}
          <span
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
            style={{ background: "var(--kp-orange-soft)", color: "var(--kp-orange)" }}
          >
            {/* Two arrows swap through the tray on hover */}
            <ArrowDown
              size={17}
              className="absolute transition-transform duration-300 ease-out group-hover:translate-y-6"
            />
            <ArrowDown
              size={17}
              className="absolute -translate-y-6 transition-transform duration-300 ease-out group-hover:translate-y-0"
            />
          </span>
          <span>
            <span
              className="block"
              style={{
                fontFamily: "var(--kp-font-body)",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              {label}
            </span>
            {note ? (
              <span
                className="mt-0.5 block"
                style={{
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                {note}
              </span>
            ) : null}
          </span>
        </a>
      </MagneticButton>
    </div>
  );
}
