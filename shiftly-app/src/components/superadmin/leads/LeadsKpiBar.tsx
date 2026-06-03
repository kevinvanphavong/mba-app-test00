'use client'

import { useLeadsStats } from '@/hooks/useLeads'

export default function LeadsKpiBar() {
  const { data, isLoading } = useLeadsStats()

  const items = [
    {
      label:   'Nouveaux ce mois',
      value:   isLoading ? '—' : data?.nouveauxCeMois ?? 0,
      color:   'text-text',
      caption: data && data.nouveaux > 0 ? `${data.nouveaux} non traités` : 'aucun en attente',
    },
    {
      label:   'Taux de conversion',
      value:   isLoading ? '—' : `${data?.tauxConversion ?? 0}%`,
      color:   'text-green',
      caption: 'leads → centres signés',
    },
    {
      label:   'Leads >48h non traités',
      value:   isLoading ? '—' : data?.leadsNonTraitesVieux ?? 0,
      color:   data && data.leadsNonTraitesVieux > 0 ? 'text-yellow' : 'text-text',
      caption: 'à relancer en priorité',
    },
    {
      label:   'MRR potentiel',
      value:   isLoading ? '—' : `${data?.mrrPotentielEur ?? 0} €`,
      color:   'text-accent',
      caption: 'plans choisis · prospects actifs',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {items.map((it) => (
        <div key={it.label} className="bg-surface border border-border rounded-[10px] p-3 px-3.5">
          <div className="text-[10px] text-muted uppercase tracking-[0.8px] font-bold">{it.label}</div>
          <div className={`font-syne font-extrabold text-[20px] mt-1 ${it.color}`}>{it.value}</div>
          <div className="text-[11px] text-muted mt-0.5">{it.caption}</div>
        </div>
      ))}
    </div>
  )
}
