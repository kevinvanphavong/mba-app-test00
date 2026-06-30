import type { Metadata } from 'next'
import Link from 'next/link'

// Route group public (Branche 1) : site client résolu par domaine côté API.
// Thème sombre Shiftly forcé localement (data-theme="dark") sans toucher au
// thème utilisateur de l'app. Le front consomme uniquement l'API publique ;
// la résolution centre ↔ host reste l'affaire du back (fail-closed).
export const metadata: Metadata = {
  title: 'Réserver en ligne',
  robots: { index: false }, // vitrine de démo : pas d'indexation tant que le domaine n'est pas câblé
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen bg-bg font-sans text-text">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/site" className="font-syne text-lg font-extrabold text-text">
            <span className="text-accent">●</span> Réservation
          </Link>
          <Link
            href="/site/reserver"
            className="rounded-pill border border-border px-4 py-1.5 text-sm font-medium text-text-soft transition-colors hover:border-accent hover:text-text"
          >
            Réserver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 tablet:py-12">{children}</main>
    </div>
  )
}
