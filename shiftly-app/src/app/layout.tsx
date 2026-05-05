import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import Providers from './Providers'
import ThemeSync from '@/components/layout/ThemeSync'
import './globals.css'

// Anti-FOUC : pose data-theme sur <html> avant que React n'hydrate, en
// lisant le state Zustand sérialisé sous la clé 'shiftly-theme' (persist middleware).
const themeInitScript = `
(function () {
  try {
    var raw = localStorage.getItem('shiftly-theme');
    var theme = 'dark';
    if (raw) {
      var parsed = JSON.parse(raw);
      var stored = parsed && parsed.state && parsed.state.theme;
      if (stored === 'dark' || stored === 'light' || stored === 'sand') theme = stored;
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Shiftly — Management opérationnel',
  description: 'Système de management opérationnel pour parcs de loisirs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>
          <ThemeSync />
          {children}
        </Providers>
      </body>
    </html>
  )
}
