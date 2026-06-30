'use client'

import type { PublicPrestation } from '@/features/public/types'
import PrestationCard from './PrestationCard'
import { PublicEmpty } from './StateBlocks'

/** Grille des prestations publiques d'un centre (état empty géré). */
export default function PrestationsList({ prestations }: { prestations: PublicPrestation[] }) {
  if (prestations.length === 0) {
    return <PublicEmpty message="Aucune prestation disponible pour le moment." />
  }

  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
      {prestations.map((p) => (
        <PrestationCard key={p.id} prestation={p} />
      ))}
    </div>
  )
}
