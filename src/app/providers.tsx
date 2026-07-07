'use client';

import type { ReactNode } from 'react';
import { SmoothScroll } from '@components/layouts';
import { ThemeProvider } from '@components/theme';
import { CustomCursor } from '@/components/CustomCursor';
import { CustomScrollbar } from '@/components/CustomScrollbar';
import { FirstVisitLoader } from '@/components/FirstVisitLoader';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { BackToTop } from '@/components/BackToTop';
import { AnnouncementBar } from '@/components/AnnouncementBar';

type ProvidersProps = { children: ReactNode };

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      /* disableTransitionOnChange removed — CSS variable transitions handle theme changes smoothly */
    >
      <SmoothScroll />
      {/* Covers every hard load from the first paint — full cinematic on
          first visit, quick brand wipe on refreshes. */}
      <FirstVisitLoader />
      <CustomCursor />
      <CustomScrollbar />
      <AnnouncementBar />
      <WhatsAppFab />
      <BackToTop />
{children}
    </ThemeProvider>
  );
}
