'use client'

import type { PublicPrestation } from '@/features/public/types'
import type { ReservationDraft } from '@/features/public/reservation'
import { formatCents } from '@/features/public/money'

/** Étape 2/3 — nombre de personnes + récapitulatif tarifaire (aperçu). */
export default function StepPersonnesRecap({
  prestation,
  draft,
  onChange,
  onNext,
  onBack,
}: {
  prestation: PublicPrestation
  draft: ReservationDraft
  onChange: (patch: Partial<ReservationDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  const total = prestation.prixCents * draft.nbPersonnes
  const setNb = (n: number) => onChange({ nbPersonnes: Math.min(500, Math.max(1, n)) })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-sm font-medium text-text-soft">Nombre de personnes</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setNb(draft.nbPersonnes - 1)}
            className="h-9 w-9 rounded-pill border border-border font-sans text-lg text-text"
            aria-label="Retirer une personne"
          >
            −
          </button>
          <span className="w-8 text-center font-syne text-xl font-bold text-text">
            {draft.nbPersonnes}
          </span>
          <button
            onClick={() => setNb(draft.nbPersonnes + 1)}
            className="h-9 w-9 rounded-pill border border-border font-sans text-lg text-text"
            aria-label="Ajouter une personne"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <Row label={prestation.nom} value={`${draft.date} · ${draft.heure}`} />
        <Row label={`${draft.nbPersonnes} × ${formatCents(prestation.prixCents)}`} value={`${draft.nbPersonnes} pers.`} />
        <div className="border-t border-border pt-3">
          <Row label="Total estimé" value={formatCents(total)} strong />
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button
          onClick={onBack}
          className="rounded-pill border border-border px-5 py-3 font-sans font-medium text-text-soft"
        >
          Retour
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-pill bg-accent px-6 py-3 font-sans font-semibold text-accent-on"
        >
          Continuer
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between font-sans">
      <span className={strong ? 'font-semibold text-text' : 'text-text-soft'}>{label}</span>
      <span className={strong ? 'font-syne text-lg font-bold text-text' : 'text-text'}>{value}</span>
    </div>
  )
}
