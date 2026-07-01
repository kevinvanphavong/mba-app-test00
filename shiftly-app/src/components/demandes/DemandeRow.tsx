'use client'

import type { DemandeB2B } from '@/features/b2b/types'

/** Ligne d'une demande B2B (cliquable → détail). Champs libres échappés via JSX. */
export default function DemandeRow({
  demande,
  actif = false,
  onSelect,
}: {
  demande: DemandeB2B
  actif?: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full flex-col gap-0.5 rounded-card border px-4 py-3 text-left transition-colors ${
        actif ? 'border-accent bg-surface2' : 'border-border bg-surface hover:border-border-strong'
      }`}
    >
      <span className="truncate font-medium text-text">{demande.typeEvenement}</span>
      <span className="truncate text-sm text-muted">
        {demande.nomContact}
        {demande.societe ? ` · ${demande.societe}` : ''} · {demande.nbPersonnes ?? '?'} pers.
      </span>
    </button>
  )
}
