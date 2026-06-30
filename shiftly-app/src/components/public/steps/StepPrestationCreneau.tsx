'use client'

import type { PublicPrestation } from '@/features/public/types'
import type { ReservationDraft } from '@/features/public/reservation'
import { CRENEAUX } from '@/features/public/reservation'
import { formatCents } from '@/features/public/money'

/** Étape 1/3 — choix de la prestation, de la date et du créneau. */
export default function StepPrestationCreneau({
  prestations,
  draft,
  onChange,
  onNext,
}: {
  prestations: PublicPrestation[]
  draft: ReservationDraft
  onChange: (patch: Partial<ReservationDraft>) => void
  onNext: () => void
}) {
  const ready = draft.prestationId !== null && draft.date !== '' && draft.heure !== ''

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="font-sans text-sm font-medium text-text-soft">Prestation</span>
        <div className="flex flex-col gap-2">
          {prestations.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ prestationId: p.id })}
              className={`flex items-center justify-between rounded-card border px-4 py-3 text-left transition-colors ${
                draft.prestationId === p.id
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <span className="font-sans font-medium text-text">{p.nom}</span>
              <span className="font-sans text-sm text-accent">
                {p.prixCents > 0 ? `${formatCents(p.prixCents)} / pers.` : 'Gratuit'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-sm font-medium text-text-soft">Date</span>
        <input
          type="date"
          value={draft.date}
          onChange={(e) => onChange({ date: e.target.value })}
          className="rounded-input border border-border bg-surface2 px-3 py-2.5 font-sans text-text outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="font-sans text-sm font-medium text-text-soft">Créneau</span>
        <div className="flex flex-wrap gap-2">
          {CRENEAUX.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ heure: c })}
              className={`rounded-pill border px-4 py-2 font-sans text-sm transition-colors ${
                draft.heure === c
                  ? 'border-accent bg-accent text-accent-on'
                  : 'border-border bg-surface text-text-soft hover:border-accent'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!ready}
        className="mt-2 rounded-pill bg-accent px-6 py-3 font-sans font-semibold text-accent-on transition-opacity disabled:opacity-40"
      >
        Continuer
      </button>
    </div>
  )
}
