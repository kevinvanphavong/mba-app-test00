'use client'

import Link from 'next/link'
import type { PublicPrestation } from '@/features/public/types'
import { formatCents } from '@/features/public/money'

/** Carte d'une prestation sur la vitrine : nom, description, prix, lien réserver. */
export default function PrestationCard({ prestation }: { prestation: PublicPrestation }) {
  return (
    <Link
      href={{ pathname: '/site/reserver', query: { prestation: prestation.id } }}
      className="group flex flex-col gap-2 rounded-card border border-border bg-surface p-5 transition-colors hover:border-accent"
    >
      <h3 className="font-syne text-lg font-bold text-text">{prestation.nom}</h3>

      {prestation.description && (
        <p className="font-sans text-sm text-muted">{prestation.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="font-sans text-sm font-semibold text-accent">
          {prestation.prixCents > 0 ? `${formatCents(prestation.prixCents)} / pers.` : 'Gratuit'}
        </span>
        <span className="font-sans text-sm text-text-soft group-hover:text-text">Réserver →</span>
      </div>
    </Link>
  )
}
