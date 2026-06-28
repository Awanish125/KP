"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "@components/ui";
import { useElementHeight } from "@/app/utils";

type HomeLayoutProps = {
  children: ReactNode;
};

export function HomeLayout({ children }: HomeLayoutProps) {
  const headerRef = useRef<HTMLElement>(null);
  const headerHeight = useElementHeight(headerRef);

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.18),_transparent_34%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.16),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] dark:text-slate-50"
      style={
        {
          "--nav-height": `${headerHeight}px`,
        } as CSSProperties
      }
    >
      <div className="mx-auto flex min-h-screen w-full max-w-full flex-col">
        <header
          ref={headerRef}
          className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 dark:border-white/10"
        >
          <Link href="/" className="text-sm font-semibold tracking-[0.28em] uppercase text-slate-950 dark:text-white">
            Kiran Publicity
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
            >
              About
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col items-stretch">{children}</main>
      </div>
    </section>
  );
}
