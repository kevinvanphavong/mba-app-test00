import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import Providers from './Providers'
import './globals.css'

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

/**
 * Script inline anti-FOUC — applique le thème stocké AVANT le premier paint.
 * Évite un flash visuel dark → light pour les utilisateurs en thème clair/sand
 * lors d'un reload. S'exécute en synchrone, bloque le rendu < 1ms.
 *
 * try/catch pour les contextes sans localStorage (mode privé Safari, quotas).
 */
const themeBootstrap = `
(function(){try{
  var t = localStorage.getItem('shiftly-theme');
  if (t === 'light' || t === 'dark' || t === 'sand') {
    document.documentElement.setAttribute('data-theme', t);
  }
} catch(e) {}})();
`.trim()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
