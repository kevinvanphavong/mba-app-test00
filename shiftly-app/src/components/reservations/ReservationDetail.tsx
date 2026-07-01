'use client'

import type { Reservation } from '@/features/reservations/types'
import { creneau, euros, statutBadge } from '@/features/reservations/format'

/**
 * Détail d'une réservation (lecture seule). Tous les champs libres passent par JSX
 * → échappement automatique par React (#5). Aucune donnée carte/Stripe (absente de l'API).
 */
export default function ReservationDetail({ reservation }: { reservation: Reservation }) {
  const badge = statutBadge(reservation.statut)
  const resteSurPlace = reservation.montantTotalCents - reservation.acompteCents

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-syne text-lg font-bold text-text">{reservation.prestationNom ?? 'Prestation'}</h2>
        <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm tablet:grid-cols-2">
        <Field label="Créneau" value={creneau(reservation.dateCreneau)} />
        <Field label="Personnes" value={String(reservation.nbPersonnes)} />
        <Field label="Invité" value={reservation.nomInvite} />
        <Field label="Email" value={reservation.emailInvite} />
        <Field label="Téléphone" value={reservation.telephoneInvite} />
        <Field label="Réservé le" value={creneau(reservation.createdAt)} />
      </dl>

      <div className="flex flex-col gap-2 rounded-card border border-border bg-surface2 p-4 text-sm">
        <Row label="Montant total" value={euros(reservation.montantTotalCents)} />
        <Row label="Acompte" value={euros(reservation.acompteCents)} strong />
        <Row label="Reste sur place" value={euros(resteSurPlace)} muted />
        {reservation.paidAt && <Row label="Acompte réglé le" value={creneau(reservation.paidAt)} muted />}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-medium text-text">{value}</dd>
    </div>
  )
}

function Row({ label, value, strong = false, muted = false }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-muted' : 'text-text-soft'}>{label}</span>
      <span className={strong ? 'font-syne font-bold text-accent' : muted ? 'text-muted' : 'text-text'}>{value}</span>
    </div>
  )
}
