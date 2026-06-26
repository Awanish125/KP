'use client';

import type { ReactNode } from "react";
import { SmoothScroll } from "@components/layouts";
import { ThemeProvider } from "@components/theme";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SmoothScroll />
      {children}
    </ThemeProvider>
  );
}
