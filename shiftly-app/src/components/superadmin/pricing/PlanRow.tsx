'use client'

import { useState } from 'react'
import type { Plan } from '@/hooks/useSuperAdminPlans'
import { useUpdatePlan } from '@/hooks/useSuperAdminPlans'

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

/** Ligne de plan éditable : nom, prix (€ → centimes), actif. Prix borné ≥ 0 au serveur. */
export default function PlanRow({ plan }: { plan: Plan }) {
  const [nom, setNom] = useState(plan.nom)
  const [prix, setPrix] = useState((plan.prixMensuelCents / 100).toString())
  const update = useUpdatePlan()

  const enregistrer = () => {
    const prixMensuelCents = Math.max(0, Math.round((parseFloat(prix.replace(',', '.')) || 0) * 100))
    update.mutate({ id: plan.id, patch: { nom: nom.trim(), prixMensuelCents } })
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-card border px-4 py-3 ${plan.actif ? 'border-border bg-surface' : 'border-dashed border-border bg-surface/50'}`}>
      <input value={nom} onChange={(e) => setNom(e.target.value)} className="min-w-0 flex-1 rounded-input border border-border bg-surface2 px-2 py-1 text-sm text-text outline-none focus:border-accent" aria-label="Nom du plan" />
      <code className="rounded bg-surface2 px-2 py-1 text-xs text-muted">{plan.cle}</code>
      <div className="flex items-center gap-1">
        <input type="number" min={0} step="0.01" value={prix} onChange={(e) => setPrix(e.target.value)} className="w-24 rounded-input border border-border bg-surface2 px-2 py-1 text-right text-sm text-text outline-none focus:border-accent" aria-label="Prix mensuel (€)" />
        <span className="text-xs text-muted">€/mois</span>
      </div>

      <button
        onClick={() => update.mutate({ id: plan.id, patch: { actif: !plan.actif } })}
        className={`rounded-pill px-3 py-1 text-xs font-medium ${plan.actif ? 'bg-green/15 text-green' : 'bg-border text-text-soft'}`}
      >
        {plan.actif ? 'Actif' : 'Inactif'}
      </button>
      <button onClick={enregistrer} disabled={update.isPending} className="rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-accent-on disabled:opacity-40">
        Enregistrer
      </button>
      {update.isError && <span className="w-full text-xs text-red">Enregistrement impossible.</span>}
    </div>
  )
}
