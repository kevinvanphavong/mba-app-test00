'use client'

import { useState } from 'react'
import type { Devis, DevisLigne } from '@/features/b2b/types'
import { euros, devisBadge } from '@/features/b2b/format'
import { usePatchDevis, useRegenererDevis } from '@/features/b2b/useB2b'
import DevisLigneRow from './DevisLigneRow'

const statusOf = (e: unknown): number | undefined =>
  (e as { response?: { status?: number } })?.response?.status

const LIGNE_VIDE: DevisLigne = { designation: '', quantite: 1, prixUnitaireCents: 0, montantCents: 0 }

/**
 * Édition du devis brouillon d'une demande. Les lignes sont éditables ; le total réel
 * est recalculé CÔTÉ SERVEUR à l'enregistrement (l'aperçu ici est indicatif). Le devis
 * n'est jamais envoyé automatiquement : le gérant le valide/envoie manuellement.
 * Monté avec une `key` liée au devis → l'état repart de l'état serveur après sauvegarde.
 */
export default function DevisEditor({ devis, demandeId }: { devis: Devis | null; demandeId: number }) {
  const [lignes, setLignes] = useState<DevisLigne[]>(() => devis?.lignes ?? [])
  const patch = usePatchDevis()
  const regen = useRegenererDevis()

  const apercuTotal = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireCents, 0)
  const regenLabel = statusOf(regen.error) === 429 ? 'Quota IA atteint' : regen.isError ? 'IA indisponible' : null

  if (!devis) {
    return (
      <div className="rounded-card border border-dashed border-border bg-surface/50 p-6 text-center text-sm">
        <p className="text-muted">Aucun devis pour cette demande.</p>
        <button onClick={() => regen.mutate(demandeId)} disabled={regen.isPending} className="mt-3 rounded-pill bg-accent px-4 py-1.5 font-semibold text-accent-on disabled:opacity-40">
          {regen.isPending ? 'Génération…' : '✨ Générer le devis'}
        </button>
        {regenLabel && <p className="mt-2 text-red">{regenLabel} — réessaie plus tard.</p>}
      </div>
    )
  }

  const badge = devisBadge(devis.statut)

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-syne font-bold text-text">Devis</h3>
        <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
      </div>

      <div className="flex flex-col gap-2">
        {lignes.map((l, i) => (
          <DevisLigneRow
            key={i}
            ligne={l}
            onChange={(nl) => setLignes(lignes.map((x, j) => (j === i ? nl : x)))}
            onRemove={() => setLignes(lignes.filter((_, j) => j !== i))}
          />
        ))}
        <button onClick={() => setLignes([...lignes, { ...LIGNE_VIDE }])} className="self-start text-sm text-accent hover:underline">
          + Ajouter une ligne
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted">Total (recalculé au serveur)</span>
        <span className="font-syne text-lg font-bold text-accent">{euros(apercuTotal)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => patch.mutate({ id: devis.id, patch: { lignes } })} disabled={patch.isPending} className="rounded-pill bg-accent px-4 py-1.5 text-sm font-semibold text-accent-on disabled:opacity-40">
          {patch.isPending ? 'Enregistrement…' : 'Enregistrer les lignes'}
        </button>
        <button onClick={() => regen.mutate(demandeId)} disabled={regen.isPending} className="rounded-pill border border-border px-4 py-1.5 text-sm text-text-soft hover:border-accent disabled:opacity-40">
          {regen.isPending ? 'Régénération…' : '↻ Régénérer'}
        </button>
        <button onClick={() => patch.mutate({ id: devis.id, patch: { statut: 'VALIDE' } })} className="rounded-pill border border-border px-4 py-1.5 text-sm text-text-soft hover:border-blue">
          Marquer validé
        </button>
        <button onClick={() => patch.mutate({ id: devis.id, patch: { statut: 'ENVOYE' } })} className="rounded-pill border border-border px-4 py-1.5 text-sm text-text-soft hover:border-accent">
          Marquer envoyé
        </button>
      </div>
      {regenLabel && <p className="text-sm text-red">{regenLabel} — le devis n’a pas été régénéré.</p>}
    </div>
  )
}
