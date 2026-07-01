'use client'

import type { Reservation } from '@/features/reservations/types'
import { creneau, euros, statutBadge } from '@/features/reservations/format'

/**
 * Ligne de réservation (cliquable → détail). Les champs libres (nom invité,
 * prestation) sont rendus via JSX → échappés automatiquement par React (#5).
 */
export default function ReservationRow({
  reservation,
  onSelect,
  actif = false,
}: {
  reservation: Reservation
  onSelect: () => void
  actif?: boolean
}) {
  const badge = statutBadge(reservation.statut)

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-card border px-4 py-3 text-left transition-colors ${
        actif ? 'border-accent bg-surface2' : 'border-border bg-surface hover:border-border-strong'
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-text">{reservation.prestationNom ?? 'Prestation'}</p>
        <p className="truncate text-sm text-muted">
          {reservation.nomInvite} · {reservation.nbPersonnes} pers. · {creneau(reservation.dateCreneau)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
        <span className="text-sm text-text-soft">{euros(reservation.acompteCents)}</span>
      </div>
    </button>
  )
}
