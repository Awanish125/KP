"use client";

import { useCallback, useEffect, useState } from "react";

interface UseFullscreenOptions {
  enableKeyboard?: boolean;
}

/**
 * Open/close state for the lightbox only. Slide-to-slide navigation (arrow
 * keys, swipe, wheel) is owned entirely by Swiper inside GalleryViewer —
 * duplicating that here as a parent-level `next`/`prev` would just be dead
 * code, since changing this hook's index after mount can't reach back into
 * an already-mounted Swiper instance.
 */
export function useFullscreen({ enableKeyboard = true }: UseFullscreenOptions) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null;

  const open = useCallback((index: number) => setActiveIndex(index), []);
  const close = useCallback(() => setActiveIndex(null), []);

  // Lock body scroll while the lightbox is open.
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ESC to close — Swiper doesn't handle this, so it stays here.
  useEffect(() => {
    if (!isOpen || !enableKeyboard) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, enableKeyboard, close]);

  return { activeIndex, isOpen, open, close };
}
