'use client'

import { useState } from 'react'
import type { Relance } from '@/features/crm/types'
import { useEnvoyerRelance, usePatchRelance } from '@/features/crm/useCrm'

const BADGE: Record<string, { label: string; cls: string }> = {
  A_REDIGER: { label: 'À rédiger', cls: 'bg-yellow/15 text-yellow' },
  A_ENVOYER: { label: 'À envoyer', cls: 'bg-blue/15 text-blue' },
  ENVOYEE: { label: 'Envoyée', cls: 'bg-green/15 text-green' },
}

/**
 * Carte de relance no-show (brouillon). L'IA a pu pré-rédiger le texte (vide sinon) ;
 * le gérant l'édite et déclenche l'ENVOI manuellement (action humaine, jamais auto).
 * Montée avec une `key` liée à la relance → repart de l'état serveur après action.
 */
export default function RelanceCard({ relance }: { relance: Relance }) {
  const [texte, setTexte] = useState(relance.texte ?? '')
  const patch = usePatchRelance()
  const envoyer = useEnvoyerRelance()

  const envoyee = relance.statut === 'ENVOYEE'
  const badge = BADGE[relance.statut] ?? BADGE.A_REDIGER

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-text">{relance.contactNom ?? 'Contact'}</span>
        <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
      </div>

      {envoyee ? (
        <p className="whitespace-pre-wrap rounded-card border border-border bg-surface2 p-3 text-sm text-text-soft">{relance.texte}</p>
      ) : (
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Texte de la relance (rédigé par l'IA ou à la main)…"
          rows={3}
          className="rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
      )}

      {!envoyee && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => patch.mutate({ id: relance.id, patch: { texte } })} disabled={patch.isPending} className="rounded-pill border border-border px-4 py-1.5 text-sm text-text-soft hover:border-accent disabled:opacity-40">
            Enregistrer
          </button>
          <button onClick={() => envoyer.mutate(relance.id)} disabled={envoyer.isPending || texte.trim() === ''} className="rounded-pill bg-accent px-4 py-1.5 text-sm font-semibold text-accent-on disabled:opacity-40">
            {envoyer.isPending ? 'Envoi…' : '📨 Envoyer'}
          </button>
        </div>
      )}
      {envoyer.isError && <p className="text-sm text-red">L’envoi a échoué — enregistre d’abord un texte, puis réessaie.</p>}
    </div>
  )
}
