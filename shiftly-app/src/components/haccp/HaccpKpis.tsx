'use client'

import { ty } from '@/lib/typography'
import type { HaccpRegistreData } from '@/types/haccp'

interface Props { data: HaccpRegistreData['kpis'] }

export default function HaccpKpis({ data }: Props) {
  const taux = data.tauxConformite
  const tauxColor = taux === null ? 'text-muted'
    : taux >= 95 ? 'text-green'
    : taux >= 80 ? 'text-yellow'
    : 'text-red'

  return (
    <div className="grid grid-cols-2 desktop:grid-cols-4 gap-3">
      <Card label="Relevés"        value={data.total.toLocaleString('fr-FR')} />
      <Card label="Conformes"      value={data.conformes.toLocaleString('fr-FR')} color="text-green" />
      <Card label="Non conformes"  value={data.nonConformes.toLocaleString('fr-FR')} color="text-red" />
      <Card label="Taux conformité" value={taux === null ? '—' : `${taux.toFixed(1)}%`} color={tauxColor} />
    </div>
  )
}

function Card({ label, value, color = 'text-text' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-[12px] px-4 py-3">
      <div className={`${ty.sectionLabelMd} mb-1.5`}>{label}</div>
      <div className={`font-syne font-extrabold text-[22px] leading-none ${color}`}>{value}</div>
    </div>
  )
}
