'use client'

import type { Prestation, SiteContenu } from '@/features/monsite/types'

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

/**
 * Aperçu du site public tel que le verra un visiteur. Tout le contenu passe par JSX
 * → échappé automatiquement (#5) : même du texte contenant du HTML s'affiche en clair.
 */
export default function SitePreview({ contenu, prestations }: { contenu: SiteContenu; prestations: Prestation[] }) {
  const actives = prestations.filter((p) => p.actif)

  return (
    <div data-theme="dark" className="overflow-hidden rounded-card border border-border">
      <div className="bg-gradient-to-br from-accent/20 to-transparent bg-bg p-6">
        <p className="text-xs uppercase tracking-wide text-accent">Aperçu du site public</p>
        <h3 className="mt-2 font-syne text-2xl font-extrabold text-text">{contenu.siteHeroTitre || contenu.nom}</h3>
        {contenu.siteHeroSousTitre && <p className="mt-1 text-sm text-text-soft">{contenu.siteHeroSousTitre}</p>}
        {contenu.siteDescription && <p className="mt-3 max-w-xl text-sm text-text-soft">{contenu.siteDescription}</p>}
      </div>

      <div className="flex flex-col gap-2 bg-bg p-6 pt-0">
        {actives.length === 0 ? (
          <p className="text-sm text-muted">Aucune prestation visible.</p>
        ) : (
          actives.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-2">
              <span className="text-sm text-text">{p.nom}</span>
              <span className="text-sm text-accent">{p.prixCents > 0 ? `${euros(p.prixCents)} / pers.` : 'Gratuit'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
