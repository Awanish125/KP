'use client';

import { useEffect } from 'react';

/**
 * Dev-only overlay — mounts two profiling tools side by side:
 *
 *  Left panel  — stats.js FPS/MS counter (green = 60fps, yellow = 30fps, red = <15fps)
 *                Panel 0 = FPS, click it to switch to MS per frame, click again for MB heap.
 *
 *  Right side  — react-scan highlights every React component that re-renders.
 *                A yellow flash = rendered once. Red flash = rendering too often.
 *                If something flashes on every scroll tick, that component is the culprit.
 *
 * How to read the output:
 *  - If FPS drops when scrolling a specific section → a ticker/scroll handler in that
 *    section is doing too much work per frame.
 *  - If react-scan shows many components flashing on scroll → a parent is re-rendering
 *    on state/context change triggered by the scroll event.
 *  - Switch stats.js to MS panel (click it) to see exact frame budget usage.
 *    At 60fps you have 16.6ms per frame. Long tasks show as tall bars.
 */
export function PerformanceOverlay() {
  useEffect(() => {
    let rafId = 0;
    let statsEl: HTMLElement | null = null;

    // stats.js — FPS / MS / MB panel
    import('stats.js').then(({ default: Stats }) => {
      const stats = new Stats();
      stats.showPanel(0); // 0=FPS (default). Click to cycle: FPS → MS → MB.
      stats.dom.style.cssText =
        'position:fixed;top:0;left:0;z-index:99999;opacity:0.9;';
      document.body.appendChild(stats.dom);
      statsEl = stats.dom;

      const loop = () => {
        stats.update();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    });

    // react-scan — highlights re-rendering components
    import('react-scan').then(({ scan }) => {
      scan({
        enabled:    true,
        log:        false,   // set true to get console output with component names + render counts
        showToolbar: true,   // floating toolbar lets you toggle it on/off without code change
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      statsEl?.remove();
    };
  }, []);

  return null;
}
