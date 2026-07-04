import type { Metadata } from 'next';
import { Archivo, Manrope, Oswald, Space_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

/* ── KP Design System fonts ─────────────────────────────────────────────── */
const archivo = Archivo({
  variable:  '--font-archivo',
  subsets:   ['latin'],
  weight:    ['400', '500', '600', '700', '800', '900'],
  display:   'swap',
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800'],
  display:  'swap',
});

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets:  ['latin'],
  weight:   ['400', '700'],
  display:  'swap',
});

/* Display face for inner pages — condensed billboard energy (tokens.css → --kp-font-display) */
const oswald = Oswald({
  variable: '--font-oswald',
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  display:  'swap',
});

export const metadata: Metadata = {
  title: 'Kiran Publicity',
  description: 'Outdoor advertising solutions for modern brands.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${manrope.variable} ${spaceMono.variable} ${oswald.variable} h-full antialiased`}
    >
      {/* bg and color come from CSS vars in globals.css — no Tailwind hardcoding */}
      <body className="min-h-full overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
