'use client'

import { useState } from 'react'
import type { KpiCentre } from '@/hooks/useConsoleAgence'
import { useAssignerPlan } from '@/hooks/useConsoleAgence'
import { usePlans } from '@/hooks/useSuperAdminPlans'

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

/** Statut réel de l'abonnement Stripe (reflété par les webhooks). */
const STATUT_ABO: Record<string, { label: string; cls: string }> = {
  incomplete: { label: 'En attente de paiement', cls: 'bg-surface2 text-text-soft' },
  trialing:   { label: 'Essai en cours',         cls: 'bg-green/15 text-green' },
  active:     { label: 'Actif',                  cls: 'bg-green/15 text-green' },
  past_due:   { label: 'Impayé',                 cls: 'bg-red/15 text-red' },
  canceled:   { label: 'Résilié',                cls: 'bg-red/15 text-red' },
}

/**
 * Sélecteur du plan d'un centre (super-admin). Liste les plans ACTIFS + « Aucun »
 * (détache). Assigner génère un lien Stripe Checkout à envoyer au client (vente pilotée).
 */
export default function PlanSelector({ centre }: { centre: KpiCentre }) {
  const plans = usePlans()
  const assigner = useAssignerPlan()
  const [copie, setCopie] = useState(false)

  const onChange = (value: string) => {
    const planId = value === '' ? null : Number(value)
    setCopie(false)
    assigner.mutate({ id: centre.id, planId })
  }

  const copier = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide text-muted">Plan</span>
        {centre.abonnementStatut && (
          <span className={`rounded-pill px-2 py-0.5 text-[11px] font-medium ${STATUT_ABO[centre.abonnementStatut]?.cls ?? 'bg-surface2 text-text-soft'}`}>
            {STATUT_ABO[centre.abonnementStatut]?.label ?? centre.abonnementStatut}
          </span>
        )}
      </div>

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
      {assigner.isSuccess && !assigner.data?.checkoutUrl && (
        <p className="text-green">Plan détaché · abonnement résilié en fin de période.</p>
      )}

      {assigner.isSuccess && assigner.data?.checkoutUrl && (
        <div className="flex flex-col gap-1 rounded-input border border-border bg-surface2 p-2">
          <span className="text-[11px] text-green">Lien de paiement généré — à envoyer au client :</span>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={assigner.data.checkoutUrl}
              className="min-w-0 flex-1 truncate rounded-input bg-surface px-2 py-1 text-xs text-text-soft"
              aria-label="Lien de paiement Stripe"
            />
            <button
              type="button"
              onClick={() => copier(assigner.data!.checkoutUrl!)}
              className="shrink-0 rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-accent-on"
            >
              {copie ? 'Copié ✓' : 'Copier'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
