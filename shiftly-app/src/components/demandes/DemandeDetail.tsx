'use client'

import type { DemandeB2B, Devis } from '@/features/b2b/types'
import DevisEditor from './DevisEditor'

/**
 * Détail d'une demande B2B + éditeur de son devis. Tous les champs libres (message,
 * société…) passent par JSX → échappement automatique par React (#5).
 * L'éditeur est monté avec une `key` liée au devis pour repartir de l'état serveur.
 */
export default function DemandeDetail({ demande, devis }: { demande: DemandeB2B; devis: Devis | null }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="font-syne text-lg font-bold text-text">{demande.typeEvenement}</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm tablet:grid-cols-2">
          <Field label="Contact" value={demande.nomContact} />
          <Field label="Société" value={demande.societe ?? '—'} />
          <Field label="Email" value={demande.email} />
          <Field label="Téléphone" value={demande.telephone} />
          <Field label="Personnes" value={demande.nbPersonnes !== null ? String(demande.nbPersonnes) : '—'} />
          <Field label="Date souhaitée" value={demande.dateSouhaitee ?? '—'} />
        </dl>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted">Message</dt>
          <dd className="mt-1 whitespace-pre-wrap rounded-card border border-border bg-surface2 p-3 text-sm text-text-soft">
            {demande.message}
          </dd>
        </div>
      </div>

      <DevisEditor key={`${devis?.id ?? 'none'}-${devis?.statut ?? ''}-${devis?.totalCents ?? 0}`} devis={devis} demandeId={demande.id} />
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
