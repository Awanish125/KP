"use client";

/**
 * IdleWarmup — pre-pays first-scroll costs during browser idle time.
 *
 * Profiling the first top-to-bottom scroll showed scattered 60–170ms
 * frames whose time was almost entirely style/paint: each below-fold
 * section paid image fetch + decode + first raster the moment it entered
 * the viewport. The second traversal was smooth because everything was
 * already in the HTTP + decode caches.
 *
 * This component runs once after window load, on requestIdleCallback:
 *  - upgrades `loading="lazy"` images to eager in small batches and calls
 *    img.decode() so decoding happens off the critical scroll path;
 *  - bumps `preload` to "auto" on any <video data-warm> so the buffer is
 *    filled before the user reaches it (playback stays IO-gated).
 *
 * Batches of 4 keep the network from stampeding; each batch re-queues via
 * requestIdleCallback so a scroll that starts mid-warm-up preempts us.
 */

import { useEffect } from "react";

const BATCH_SIZE = 4;

type IdleHandle = number | ReturnType<typeof setTimeout>;

function requestIdle(cb: () => void, timeout: number): IdleHandle {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(() => cb(), { timeout });
  }
  return setTimeout(cb, Math.min(timeout, 1500));
}

function cancelIdle(handle: IdleHandle) {
  if (typeof window.cancelIdleCallback === "function" && typeof handle === "number") {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  }
}

export function IdleWarmup() {
  useEffect(() => {
    let cancelled = false;
    const handles: IdleHandle[] = [];

    const warmImages = () => {
      if (cancelled) return;
      const imgs = Array.from(document.images).filter(
        (im) => im.loading === "lazy" || !im.complete,
      );
      let i = 0;
      const step = () => {
        if (cancelled) return;
        for (const im of imgs.slice(i, i + BATCH_SIZE)) {
          try {
            if (im.loading === "lazy") im.loading = "eager";
            im.decode().catch(() => {});
          } catch {
            /* decode unsupported / detached img — skip */
          }
        }
        i += BATCH_SIZE;
        if (i < imgs.length) handles.push(requestIdle(step, 1000));
      };
      step();
    };

    const warmVideos = () => {
      if (cancelled) return;
      document.querySelectorAll<HTMLVideoElement>("video[data-warm]").forEach((v) => {
        if (v.preload !== "auto") {
          v.preload = "auto";
          try { v.load(); } catch { /* already loading */ }
        }
      });
    };

    const start = () => {
      handles.push(requestIdle(warmImages, 4000));
      handles.push(requestIdle(warmVideos, 6000));
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      handles.forEach(cancelIdle);
    };
  }, []);

  return null;
}
