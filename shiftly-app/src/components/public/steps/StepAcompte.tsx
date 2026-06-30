'use client'

import type { PublicPrestation } from '@/features/public/types'
import type { ReservationDraft } from '@/features/public/reservation'
import { isEmail } from '@/features/public/reservation'
import { acompteCents, formatCents } from '@/features/public/money'
import PublicField from '../PublicField'

/** Étape 3/3 — coordonnées invité + acompte à régler. Déclenche le POST (sans paiement). */
export default function StepAcompte({
  prestation,
  draft,
  onChange,
  onBack,
  onSubmit,
  isPending,
  isError,
}: {
  prestation: PublicPrestation
  draft: ReservationDraft
  onChange: (patch: Partial<ReservationDraft>) => void
  onBack: () => void
  onSubmit: () => void
  isPending: boolean
  isError: boolean
}) {
  const total = prestation.prixCents * draft.nbPersonnes
  const acompte = acompteCents(total)
  const ready =
    draft.nom.trim() !== '' && isEmail(draft.email) && draft.telephone.trim() !== ''

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
        <PublicField label="Nom" value={draft.nom} onChange={(v) => onChange({ nom: v })} autoComplete="name" />
        <PublicField label="Téléphone" type="tel" value={draft.telephone} onChange={(v) => onChange({ telephone: v })} autoComplete="tel" />
        <div className="tablet:col-span-2">
          <PublicField label="Email" type="email" value={draft.email} onChange={(v) => onChange({ email: v })} autoComplete="email" placeholder="vous@exemple.fr" />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-accent/40 bg-accent/5 p-4">
        <p className="font-sans text-sm text-text-soft">
          Un acompte de 20 % confirme votre réservation. Le solde se règle sur place.
        </p>
        <div className="flex items-center justify-between font-sans text-text-soft">
          <span>Total réservation</span>
          <span className="text-text">{formatCents(total)}</span>
        </div>
        <div className="flex items-center justify-between font-sans">
          <span className="font-semibold text-text">Acompte (20 %)</span>
          <span className="font-syne text-xl font-bold text-accent">{formatCents(acompte)}</span>
        </div>
        <div className="flex items-center justify-between font-sans text-sm text-muted">
          <span>Reste sur place</span>
          <span>{formatCents(total - acompte)}</span>
        </div>
      </div>

      {isError && (
        <p className="font-sans text-sm text-red" role="alert">
          La réservation n’a pas pu être enregistrée. Vérifie tes informations et réessaie.
        </p>
      )}

      <div className="mt-1 flex gap-3">
        <button onClick={onBack} disabled={isPending} className="rounded-pill border border-border px-5 py-3 font-sans font-medium text-text-soft disabled:opacity-40">
          Retour
        </button>
        <button
          onClick={onSubmit}
          disabled={!ready || isPending}
          className="flex-1 rounded-pill bg-accent px-6 py-3 font-sans font-semibold text-accent-on transition-opacity disabled:opacity-40"
        >
          {isPending ? 'Redirection vers le paiement…' : `Payer l’acompte · ${formatCents(acompte)}`}
        </button>
      </div>
    </div>
  )
}
