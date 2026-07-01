'use client'

import type { ReservationFiltre } from '@/features/reservations/types'

const ONGLETS: { id: ReservationFiltre; label: string }[] = [
  { id: 'a_venir', label: 'À venir' },
  { id: 'passees', label: 'Passées' },
  { id: 'confirmees', label: 'Confirmées' },
  { id: 'en_attente', label: 'Acompte à régler' },
]

/** Onglets de filtre de l'écran Réservations. */
export default function ReservationFilters({
  actif,
  onChange,
}: {
  actif: ReservationFiltre
  onChange: (f: ReservationFiltre) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ONGLETS.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-pill border px-4 py-1.5 text-sm transition-colors ${
            actif === o.id
              ? 'border-accent bg-accent text-accent-on'
              : 'border-border bg-surface text-text-soft hover:border-accent'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
