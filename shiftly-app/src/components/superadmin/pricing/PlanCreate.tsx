'use client'

import { useState } from 'react'
import { useCreatePlan } from '@/hooks/useSuperAdminPlans'

const cleErreur = (e: unknown): string =>
  (e as { response?: { status?: number } })?.response?.status === 422
    ? 'Vérifie les champs (clé en minuscules/underscores, unique).'
    : 'Création impossible.'

/** Formulaire de création d'un plan (super-admin). */
export default function PlanCreate() {
  const [nom, setNom] = useState('')
  const [cle, setCle] = useState('')
  const [prix, setPrix] = useState('')
  const create = useCreatePlan()

  const ajouter = () => {
    const prixMensuelCents = Math.max(0, Math.round((parseFloat(prix.replace(',', '.')) || 0) * 100))
    create.mutate(
      { nom: nom.trim(), cle: cle.trim(), prixMensuelCents, actif: true },
      { onSuccess: () => { setNom(''); setCle(''); setPrix('') } },
    )
  }

  const prete = nom.trim() !== '' && /^[a-z0-9_]+$/.test(cle.trim())

  return (
    <div className="flex flex-col gap-2 rounded-card border border-dashed border-border bg-surface/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom (ex. Pack Web)" className="min-w-0 flex-1 rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent" />
        <input value={cle} onChange={(e) => setCle(e.target.value)} placeholder="cle_technique" className="w-40 rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent" />
        <input type="number" min={0} step="0.01" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Prix €" className="w-24 rounded-input border border-border bg-surface2 px-3 py-2 text-right text-sm text-text outline-none focus:border-accent" aria-label="Prix mensuel (€)" />
        <button onClick={ajouter} disabled={!prete || create.isPending} className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-accent-on disabled:opacity-40">
          {create.isPending ? 'Ajout…' : '+ Ajouter'}
        </button>
      </div>
      {create.isError && <p className="text-xs text-red">{cleErreur(create.error)}</p>}
    </div>
  )
}
