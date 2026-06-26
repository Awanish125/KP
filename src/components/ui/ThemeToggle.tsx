'use client';

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@components/theme";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, mounted } = useTheme();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      disabled={!mounted}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-wait disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/30 dark:hover:text-white"
    >
      {mounted ? (
        isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />
      ) : (
        <span className="h-5 w-5" />
      )}
    </button>
  );
}
