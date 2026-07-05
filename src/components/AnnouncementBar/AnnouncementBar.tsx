"use client";

/**
 * AnnouncementBar — slim dismissible strip pinned above everything.
 * Slides down on load; dismissing it slides it away and remembers the
 * choice for the session. While visible it adds `kp-announce-visible` to
 * <html>, which shifts the floating navbar and scroll-progress line down
 * (see globals.css) so nothing overlaps.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import {
  ANNOUNCEMENT_BAR_DEFAULTS,
  ANNOUNCEMENT_HTML_CLASS,
  ANNOUNCEMENT_STORAGE_KEY,
} from "./announcementBarConfig";
import type { AnnouncementBarProps } from "./announcementBarTypes";

export function AnnouncementBar({
  enabled = ANNOUNCEMENT_BAR_DEFAULTS.enabled,
  text = ANNOUNCEMENT_BAR_DEFAULTS.text,
  linkLabel = ANNOUNCEMENT_BAR_DEFAULTS.linkLabel,
  href = ANNOUNCEMENT_BAR_DEFAULTS.href,
  storageKey = ANNOUNCEMENT_STORAGE_KEY,
}: AnnouncementBarProps) {
  const [show, setShow] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !text) return;
    let dismissed = "1";
    try {
      dismissed = sessionStorage.getItem(storageKey) ?? "";
    } catch {
      /* storage blocked → keep hidden */
    }
    if (!dismissed) setShow(true);
  }, [enabled, text, storageKey]);

  useEffect(() => {
    if (!show) return;
    document.documentElement.classList.add(ANNOUNCEMENT_HTML_CLASS);
    const bar = barRef.current;
    if (bar) {
      // The JSX ships transform: translateY(-100%), which GSAP caches as a
      // pixel `y` — so we animate `y` (not yPercent) to bring it home.
      // No delay: the bar and the navbar shift must move together.
      if (prefersReducedMotion()) {
        gsap.set(bar, { y: 0 });
      } else {
        gsap.to(bar, { y: 0, duration: 0.45, ease: "power3.out" });
      }
    }
    return () => {
      document.documentElement.classList.remove(ANNOUNCEMENT_HTML_CLASS);
    };
  }, [show]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* nothing to persist */
    }
    const bar = barRef.current;
    if (bar && !prefersReducedMotion()) {
      gsap.to(bar, {
        y: -bar.offsetHeight,
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => setShow(false),
      });
    } else {
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Announcement"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 80,
        height: "var(--kp-announce-h, 38px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "0 3rem",
        background: "var(--kp-dark)",
        borderBottom: "1px solid var(--kp-orange-soft)",
        transform: "translateY(-100%)",
      }}
    >
      <span
        aria-hidden
        className="hidden h-1.5 w-1.5 shrink-0 rounded-full sm:block"
        style={{ background: "var(--kp-orange)", boxShadow: "0 0 8px var(--kp-orange-glow)" }}
      />
      <p
        className="truncate"
        style={{
          fontFamily: "var(--kp-font-mono)",
          fontSize: "0.68rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--kp-light)",
          opacity: 0.85,
          margin: 0,
        }}
      >
        {text}
      </p>
      <Link
        href={href}
        className="shrink-0 no-underline transition-opacity duration-200 hover:opacity-80"
        style={{
          fontFamily: "var(--kp-font-mono)",
          fontSize: "0.68rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--kp-orange)",
        }}
      >
        {linkLabel} →
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        style={{
          position: "absolute",
          right: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.6rem",
          height: "1.6rem",
          borderRadius: 999,
          background: "transparent",
          border: "none",
          color: "var(--kp-light)",
          opacity: 0.6,
          cursor: "pointer",
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
