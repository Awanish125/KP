import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@components/ui";

type SiteLayoutProps = {
  children: ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <section className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 lg:px-10">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5 dark:border-white/10">
          <Link href="/" className="text-sm font-semibold tracking-[0.28em] uppercase text-slate-950 dark:text-white">
            Kiran Publicity
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <Link href="/" className="transition hover:text-slate-950 dark:hover:text-white">
              Home
            </Link>
            <Link href="/about" className="transition hover:text-slate-950 dark:hover:text-white">
              About
            </Link>
            <ThemeToggle />
          </nav>
        </header>
        <main className="flex flex-1 items-center py-14">{children}</main>
        <footer className="border-t border-slate-200 py-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          Different page shell for informational routes.
        </footer>
      </div>
    </section>
  );
}
