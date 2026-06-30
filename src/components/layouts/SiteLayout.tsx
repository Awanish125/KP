import type { ReactNode } from 'react';
import { Navbar } from '@components/navbar';

type SiteLayoutProps = { children: ReactNode };

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', transition: 'background 500ms ease, color 500ms ease' }}>
      <Navbar />
      {/* Push content below the fixed navbar (~80px) */}
      <main style={{ paddingTop: '96px' }}>
        {children}
      </main>
    </div>
  );
}
