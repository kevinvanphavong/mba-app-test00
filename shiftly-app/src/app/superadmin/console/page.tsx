'use client'

import { useConsoleKpis } from '@/hooks/useConsoleAgence'
import KpiGlobalCards from '@/components/superadmin/console/KpiGlobalCards'
import CentreRow from '@/components/superadmin/console/CentreRow'

/**
 * Console agence (super-admin) : KPI globaux + par centre, en LECTURE SEULE (seule
 * exception : l'abonnement mensuel, réglé par le super-admin). Données via React
 * Query, 3 états. L'accès est déjà borné à ROLE_SUPERADMIN côté API.
 */
export default function ConsoleAgencePage() {
  const { data, isLoading, isError, refetch } = useConsoleKpis()

  if (isLoading) return <p className="text-sm text-muted">Chargement de la console…</p>
  if (isError || !data) {
    return (
      <div className="text-sm">
        <p className="text-red">Erreur de chargement des KPI.</p>
        <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="font-syne text-2xl font-extrabold text-text">Console agence</h1>
        <p className="mt-0.5 text-[13px] text-muted">Vue multi-clients · KPI, MRR et résumés IA · lecture seule</p>
      </div>

      <KpiGlobalCards g={data.global} />

      <h2 className="mb-3 mt-6 font-syne text-lg font-bold text-text">Par client</h2>
      {data.centres.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
          Aucun centre pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.centres.map((c) => (
            <CentreRow key={c.id} centre={c} />
          ))}
        </div>
      )}
    </>
  )
}
