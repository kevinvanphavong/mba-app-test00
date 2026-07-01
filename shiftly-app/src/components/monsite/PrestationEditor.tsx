'use client'

import { useState } from 'react'
import type { Prestation } from '@/features/monsite/types'
import { useDeletePrestation, useUpdatePrestation } from '@/features/monsite/useMonSite'

/**
 * Ligne de prestation éditable (nom, prix en €, actif) + suppression. Le prix est
 * saisi en euros et converti en centimes (jamais de négatif ; le back revalide ≥ 0).
 * Montée avec une `key` liée à la prestation → repart de l'état serveur après action.
 */
export default function PrestationEditor({ prestation }: { prestation: Prestation }) {
  const [nom, setNom] = useState(prestation.nom)
  const [prix, setPrix] = useState((prestation.prixCents / 100).toString())
  const update = useUpdatePrestation()
  const remove = useDeletePrestation()

  const enregistrer = () => {
    const prixCents = Math.max(0, Math.round((parseFloat(prix.replace(',', '.')) || 0) * 100))
    update.mutate({ id: prestation.id, patch: { nom: nom.trim(), prixCents } })
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-card border px-3 py-2 ${prestation.actif ? 'border-border bg-surface' : 'border-dashed border-border bg-surface/50'}`}>
      <input value={nom} onChange={(e) => setNom(e.target.value)} className="min-w-0 flex-1 rounded-input border border-border bg-surface2 px-2 py-1 text-sm text-text outline-none focus:border-accent" aria-label="Nom de la prestation" />
      <input type="number" min={0} step="0.01" value={prix} onChange={(e) => setPrix(e.target.value)} className="w-24 rounded-input border border-border bg-surface2 px-2 py-1 text-right text-sm text-text outline-none focus:border-accent" aria-label="Prix (€)" />
      <span className="text-xs text-muted">€/pers.</span>

      <button
        onClick={() => update.mutate({ id: prestation.id, patch: { actif: !prestation.actif } })}
        className={`rounded-pill px-3 py-1 text-xs font-medium ${prestation.actif ? 'bg-green/15 text-green' : 'bg-border text-text-soft'}`}
      >
        {prestation.actif ? 'Visible' : 'Masquée'}
      </button>
      <button onClick={enregistrer} disabled={update.isPending} className="rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-accent-on disabled:opacity-40">
        Enregistrer
      </button>
      <button onClick={() => remove.mutate(prestation.id)} disabled={remove.isPending} className="text-muted hover:text-red" aria-label="Supprimer">
        ✕
      </button>
    </div>
  )
}
