'use client'

import type { KpiCentre } from '@/hooks/useConsoleAgence'
import { useAssignerPlan } from '@/hooks/useConsoleAgence'
import { usePlans } from '@/hooks/useSuperAdminPlans'

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

/**
 * Sélecteur du plan d'un centre (super-admin). Liste les plans ACTIFS + « Aucun »
 * (détache). L'abonnement est dérivé du plan côté serveur ; les KPI sont rafraîchis.
 */
export default function PlanSelector({ centre }: { centre: KpiCentre }) {
  const plans = usePlans()
  const assigner = useAssignerPlan()

  const onChange = (value: string) => {
    const planId = value === '' ? null : Number(value)
    assigner.mutate({ id: centre.id, planId })
  }

  return (
    <section className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-wide text-muted">Plan</span>

      {plans.isLoading && <p className="text-muted">Chargement des plans…</p>}
      {plans.isError && <p className="text-red">Plans indisponibles.</p>}

      {!plans.isLoading && !plans.isError && plans.data && (
        plans.data.filter((p) => p.actif).length === 0 ? (
          <p className="text-muted">Aucun plan actif. Crée-en un dans « Plans tarifaires ».</p>
        ) : (
          <select
            value={centre.planId ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={assigner.isPending}
            className="rounded-input border border-border bg-surface2 px-3 py-2 text-text outline-none focus:border-accent disabled:opacity-40"
            aria-label={`Plan de ${centre.nom}`}
          >
            <option value="">Aucun (détacher)</option>
            {plans.data.filter((p) => p.actif).map((p) => (
              <option key={p.id} value={p.id}>{p.nom} · {euros(p.prixMensuelCents)}/mois</option>
            ))}
          </select>
        )
      )}

      {assigner.isError && <p className="text-red">Assignation impossible.</p>}
      {assigner.isSuccess && <p className="text-green">Plan mis à jour · abonnement dérivé.</p>}
    </section>
  )
}
