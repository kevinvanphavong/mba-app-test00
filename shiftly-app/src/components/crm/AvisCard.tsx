'use client'

import { useState } from 'react'
import type { Avis } from '@/features/crm/types'
import { usePatchAvis, useRedigerReponse } from '@/features/crm/useCrm'

const statusOf = (e: unknown): number | undefined => (e as { response?: { status?: number } })?.response?.status
const etoiles = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

/**
 * Carte d'avis : note + commentaire (échappé), réponse rédigée par l'IA (brouillon).
 * L'IA propose ; le gérant édite et PUBLIE manuellement (statut REPONDU) — jamais auto.
 * Montée avec une `key` liée à l'avis → repart de l'état serveur après action.
 */
export default function AvisCard({ avis }: { avis: Avis }) {
  const [texte, setTexte] = useState(avis.reponse ?? '')
  const rediger = useRedigerReponse()
  const patch = usePatchAvis()

  const iaErreur = statusOf(rediger.error) === 429 ? 'Quota IA atteint' : rediger.isError ? 'IA indisponible' : null

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-yellow" aria-label={`Note ${avis.note} sur 5`}>{etoiles(avis.note)}</span>
          {avis.contactNom && <span className="ml-2 text-sm text-muted">· {avis.contactNom}</span>}
        </div>
        <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${avis.statut === 'REPONDU' ? 'bg-green/15 text-green' : 'bg-border text-text-soft'}`}>
          {avis.statut === 'REPONDU' ? 'Répondu' : 'Nouveau'}
        </span>
      </div>

      {avis.commentaire && <p className="whitespace-pre-wrap text-sm text-text-soft">{avis.commentaire}</p>}

      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Réponse au client (rédigée par l'IA ou à la main)…"
        rows={3}
        className="rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => rediger.mutate(avis.id)} disabled={rediger.isPending} className="rounded-pill border border-border px-4 py-1.5 text-sm text-text-soft hover:border-accent disabled:opacity-40">
          {rediger.isPending ? 'Rédaction…' : '✨ Répondre (IA)'}
        </button>
        <button onClick={() => patch.mutate({ id: avis.id, patch: { reponse: texte } })} disabled={patch.isPending} className="rounded-pill border border-border px-4 py-1.5 text-sm text-text-soft hover:border-accent disabled:opacity-40">
          Enregistrer le brouillon
        </button>
        <button onClick={() => patch.mutate({ id: avis.id, patch: { reponse: texte, statut: 'REPONDU' } })} disabled={patch.isPending || texte.trim() === ''} className="rounded-pill bg-accent px-4 py-1.5 text-sm font-semibold text-accent-on disabled:opacity-40">
          Publier la réponse
        </button>
      </div>
      {iaErreur && <p className="text-sm text-red">{iaErreur} — réessaie plus tard (le brouillon reste éditable).</p>}
    </div>
  )
}
