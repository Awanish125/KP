"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type HomeLayoutProps = {
  children: ReactNode;
};

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      {/*
        Fixed transparent header — floats above the 3D canvas and section content.
        No background so the billboard scene shows through on scroll.
        Lenis smooth scroll is set up in page.tsx (not here) so there is only
        one Lenis instance for the whole home page.
      */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-xs font-semibold tracking-[0.35em] uppercase text-white/80 hover:text-white transition-colors duration-200"
        >
          Kiran Publicity
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="#section-services"
            className="text-[11px] uppercase tracking-[0.25em] text-white/40 hover:text-white/80 transition-colors duration-200"
          >
            Services
          </Link>
          <Link
            href="#section-about"
            className="text-[11px] uppercase tracking-[0.25em] text-white/40 hover:text-white/80 transition-colors duration-200"
          >
            About
          </Link>
          <Link
            href="/about"
            className="text-[11px] uppercase tracking-[0.25em] text-white/40 hover:text-white/80 transition-colors duration-200"
          >
            Contact
          </Link>
        </nav>
      </header>

      <main>{children}</main>
    </>
  );
}
