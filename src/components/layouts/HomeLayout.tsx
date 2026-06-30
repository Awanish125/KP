"use client";

import type { ReactNode } from "react";
import { Navbar } from "@components/navbar";

type HomeLayoutProps = { children: ReactNode };

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
