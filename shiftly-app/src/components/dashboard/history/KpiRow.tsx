'use client'

import { ty } from '@/lib/typography'

interface Props {
  totalChecks: number
  totalUnchecks: number
  tauxMoyen: number          // 0-100
  servicesCount: number
}

/** Ligne 4 KPI au-dessus des widgets. */
export default function KpiRow({ totalChecks, totalUnchecks, tauxMoyen, servicesCount }: Props) {
  const totalActions = totalChecks + totalUnchecks
  const pctUnchecks = totalActions > 0
    ? Math.round((totalUnchecks / totalActions) * 1000) / 10
    : 0

  return (
    <div className="grid grid-cols-2 desktop:grid-cols-4 gap-3">
      <KpiCard label="Missions cochées" value={totalChecks.toLocaleString('fr-FR')} />
      <KpiCard
        label="Décochages"
        value={totalUnchecks.toLocaleString('fr-FR')}
        sub={totalActions > 0 ? `${pctUnchecks}% des actions` : '—'}
      />
      <KpiCard
        label="Services tracés"
        value={servicesCount.toLocaleString('fr-FR')}
      />
      <KpiCard
        label="Taux moyen"
        value={`${tauxMoyen.toFixed(1)}%`}
        accent={tauxMoyen >= 90 ? 'green' : tauxMoyen >= 70 ? 'yellow' : 'red'}
      />
    </div>
  )
}

function KpiCard({ label, value, sub, accent }: {
  label: string
  value: string
  sub?: string
  accent?: 'green' | 'yellow' | 'red'
}) {
  const valueColor = accent === 'green' ? 'text-green'
    : accent === 'yellow' ? 'text-yellow'
    : accent === 'red'    ? 'text-red'
    : 'text-text'

  return (
    <div className="bg-surface border border-border rounded-[12px] px-4 py-3">
      <div className={`${ty.sectionLabelMd} mb-1.5`}>{label}</div>
      <div className={`font-syne font-extrabold text-[24px] leading-none ${valueColor}`}>{value}</div>
      {sub && <div className={`${ty.metaSm} mt-1`}>{sub}</div>}
    </div>
  )
}
