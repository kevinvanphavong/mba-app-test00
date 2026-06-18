'use client'

import type { CompletudeRegistre } from '@/types/staff'

interface Props {
  completude: CompletudeRegistre | null
}

/**
 * Encart d'alerte affiché en tête de la fiche RH quand des informations
 * légalement requises au Registre Unique du Personnel manquent (E1).
 */
export default function CompletudeNudge({ completude }: Props) {
  if (!completude || completude.complet) return null

  return (
    <div className="mx-5 mt-4 rounded-[12px] border border-yellow/30 bg-yellow/10 px-4 py-3">
      <p className="text-[13px] font-bold text-yellow">
        ⚠️ {completude.manquants.length} information(s) manquante(s) pour le Registre Unique du Personnel
      </p>
      <p className="mt-1 text-[11.5px] text-muted">
        À compléter : {completude.manquants.map((m) => m.label).join(', ')}.
      </p>
    </div>
  )
}
