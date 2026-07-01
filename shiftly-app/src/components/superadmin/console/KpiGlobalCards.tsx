'use client'

import type { KpiGlobal } from '@/hooks/useConsoleAgence'

const euros = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

/** Cartes de KPI globaux de l'agence (lecture seule). */
export default function KpiGlobalCards({ g }: { g: KpiGlobal }) {
  const pct = Math.min(100, g.progressionMrrPct)

  return (
    <div className="grid grid-cols-2 gap-3.5 tablet:grid-cols-4">
      <Card label="MRR" value={euros(g.mrrCents)} accent>
        <div className="mt-2 h-1.5 rounded-pill bg-border">
          <div className="h-full rounded-pill bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {g.progressionMrrPct}% de l’objectif {euros(g.objectifMrrCents)}
        </p>
      </Card>

      <Card label="Centres actifs" value={`${g.nbCentresActifs} / ${g.nbCentres}`} />
      <Card label="Réservations" value={String(g.totalReservations)} />
      <Card label="Appels IA (mois)" value={String(g.iaAppelsMois)} />
    </div>
  )
}

function Card({ label, value, accent = false, children }: { label: string; value: string; accent?: boolean; children?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="text-[12px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-syne text-2xl font-extrabold ${accent ? 'text-accent' : 'text-text'}`}>{value}</p>
      {children}
    </div>
  )
}
