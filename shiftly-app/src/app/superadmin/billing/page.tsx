'use client'

import { useInvoices } from '@/hooks/useSuperAdminBilling'

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

/**
 * Facturation : factures d'abonnement reflétées depuis Stripe (super-admin, lecture
 * seule). Enregistrées par le webhook signé. React Query, 3 états, thème Shiftly.
 */
export default function BillingPage() {
  const { data, isLoading, isError, refetch } = useInvoices()

  return (
    <>
      <div className="mb-5">
        <h1 className="font-syne text-2xl font-extrabold text-text">Facturation</h1>
        <p className="mt-0.5 text-[13px] text-muted">Factures d’abonnement (Stripe) · lecture seule</p>
      </div>

      {isLoading && <p className="text-sm text-muted">Chargement des factures…</p>}
      {isError && (
        <div className="text-sm">
          <p className="text-red">Erreur de chargement.</p>
          <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">Réessayer</button>
        </div>
      )}

      {!isLoading && !isError && data && (data.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
          Aucune facture pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{inv.centreNom ?? 'Client'}</p>
                <p className="truncate text-xs text-muted">{fmt(inv.createdAt)} · {inv.stripeInvoiceId}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-soft">{euros(inv.montantCents)}</span>
                <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${inv.statut === 'paid' ? 'bg-green/15 text-green' : 'bg-red/15 text-red'}`}>
                  {inv.statut === 'paid' ? 'Payée' : 'Échec'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}
