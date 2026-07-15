"use client";

import type { ReactNode } from "react";
import { Navbar } from "@components/navbar";
import { MeridianRail } from "@/components/MeridianRail";

type HomeLayoutProps = { children: ReactNode };

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      <MeridianRail />
      <Navbar />
      <main>{children}</main>
    </>
  );
}
