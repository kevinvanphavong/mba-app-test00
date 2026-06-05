'use client'

import { ty } from '@/lib/typography'

interface Props {
  centreName:  string | null
  presents:    number
  sortis:      number
  total:       number
  isExporting: boolean
  onExport:    () => void
}

export default function RegistreHero({ centreName, presents, sortis, total, isExporting, onExport }: Props) {
  return (
    <div className="rounded-[14px] border border-border border-t-2 border-t-accent bg-surface px-6 py-5 flex items-center justify-between flex-wrap gap-5">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted">Conformité RH</div>
        <div className="font-syne font-extrabold text-[28px] leading-[1.05]">Registre du personnel</div>
        <div className={`${ty.metaLg} mt-1 max-w-[520px]`}>
          Liste chronologique de tous les salariés de {centreName ?? 'votre centre'}, présents
          ou passés. Conservation 5 ans après la sortie. Exportable au format PDF officiel.
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Stat label="Présents" value={presents} accent="green" />
        <Stat label="Sortis"   value={sortis}   accent="muted" />
        <Stat label="Total"    value={total}    accent="accent" />
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || total === 0}
          className="px-5 py-3.5 rounded-[12px] bg-accent text-white font-bold text-[13px] whitespace-nowrap hover:bg-accent2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Génération…' : '⬇ Exporter PDF'}
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent: 'green' | 'accent' | 'muted' }) {
  const cls = accent === 'green' ? 'text-green' : accent === 'accent' ? 'text-accent' : 'text-muted'
  return (
    <div className="px-[18px] py-3 rounded-[12px] border border-border bg-surface2 text-center min-w-[80px]">
      <div className="text-[9px] font-bold uppercase tracking-[1.4px] text-muted mb-1.5">{label}</div>
      <div className={`font-syne font-extrabold text-[22px] leading-none ${cls}`}>{value}</div>
    </div>
  )
}
