'use client'

import { useSubscriptions } from '@/hooks/useSuperAdminBilling'

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

const badge = (statut: string): string => {
  if (statut === 'active') return 'bg-green/15 text-green'
  if (statut === 'past_due') return 'bg-red/15 text-red'
  return 'bg-border text-text-soft'
}

/**
 * Abonnements par client (super-admin, lecture seule). Facturation récurrente agence
 * via Stripe Billing. React Query, 3 états, thème Shiftly.
 */
export default function SubscriptionsPage() {
  const { data, isLoading, isError, refetch } = useSubscriptions()

  return (
    <>
      <div className="mb-5">
        <h1 className="font-syne text-2xl font-extrabold text-text">Abonnements</h1>
        <p className="mt-0.5 text-[13px] text-muted">Statut de facturation récurrente par client · lecture seule</p>
      </div>

      {isLoading && <p className="text-sm text-muted">Chargement des abonnements…</p>}
      {isError && (
        <div className="text-sm">
          <p className="text-red">Erreur de chargement.</p>
          <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">Réessayer</button>
        </div>
      )}

      {!isLoading && !isError && data && (data.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
          Aucun abonnement. Assigne un plan à un client depuis la console.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{s.centreNom ?? 'Client'}</p>
                <p className="truncate text-xs text-muted">{s.planNom ?? '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-soft">{euros(s.montantCents)}/mois</span>
                <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${badge(s.statut)}`}>{s.statut}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}
