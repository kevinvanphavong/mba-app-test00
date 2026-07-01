'use client'

import { useState } from 'react'
import { useCreatePrestation } from '@/features/monsite/useMonSite'

/** Formulaire d'ajout d'une prestation (centre imposé côté serveur). */
export default function PrestationCreate({ ordreSuivant }: { ordreSuivant: number }) {
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const create = useCreatePrestation()

  const ajouter = () => {
    if (nom.trim() === '') return
    const prixCents = Math.max(0, Math.round((parseFloat(prix.replace(',', '.')) || 0) * 100))
    create.mutate(
      { nom: nom.trim(), description: null, prixCents, ordre: ordreSuivant, actif: true },
      { onSuccess: () => { setNom(''); setPrix('') } },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-dashed border-border bg-surface/50 px-3 py-2">
      <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nouvelle prestation" className="min-w-0 flex-1 rounded-input border border-border bg-surface2 px-2 py-1 text-sm text-text outline-none focus:border-accent" />
      <input type="number" min={0} step="0.01" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Prix €" className="w-24 rounded-input border border-border bg-surface2 px-2 py-1 text-right text-sm text-text outline-none focus:border-accent" aria-label="Prix (€)" />
      <button onClick={ajouter} disabled={create.isPending || nom.trim() === ''} className="rounded-pill bg-accent px-4 py-1.5 text-sm font-semibold text-accent-on disabled:opacity-40">
        {create.isPending ? 'Ajout…' : '+ Ajouter'}
      </button>
    </div>
  )
}
