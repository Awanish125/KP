"use client";

/**
 * Root template — remounts on every route change, replaying the
 * PageTransition sweep for each navigation. Layout (Providers, Lenis,
 * cursor, scrollbar) persists; only the page content re-enters.
 */

import type { ReactNode } from "react";
import { PageTransition } from "@/components/PageTransition";

export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
