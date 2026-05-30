'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ty } from '@/lib/typography'
import { cn } from '@/lib/cn'
import type { HistoryServiceRow } from '@/types/eventlog'

interface Props {
  rows: HistoryServiceRow[]
  onSelect: (serviceId: number) => void
}

const CRENEAU_LABEL: Record<NonNullable<HistoryServiceRow['serviceCreneau']>, string> = {
  matin:     'Matin',
  apresmidi: 'Après-midi',
  soir:      'Soir',
}

function formatJour(date: string | null): { jour: string; mois: string } {
  if (!date) return { jour: '—', mois: '' }
  try {
    const d = new Date(date)
    return {
      jour: format(d, 'd', { locale: fr }),
      mois: format(d, 'MMM', { locale: fr }),
    }
  } catch {
    return { jour: '—', mois: '' }
  }
}

function tauxPillClass(taux: number): string {
  if (taux >= 90) return 'bg-green/10 text-green'
  if (taux >= 75) return 'bg-yellow/10 text-yellow'
  return 'bg-red/10 text-red'
}

/** Liste des services récents (drill-down au clic). */
export default function RecentServicesList({ rows, onSelect }: Props) {
  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className={`${ty.metaLg}`}>Aucun service tracé sur la période.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((s, idx) => {
        const { jour, mois } = formatJour(s.serviceDate)
        const total = s.checks + s.unchecks
        const taux  = total > 0 ? (s.checks / total) * 100 : 0
        const creneauLabel = s.serviceCreneau ? CRENEAU_LABEL[s.serviceCreneau] : null
        const titre = creneauLabel ? `Service ${creneauLabel.toLowerCase()}` : 'Service'

        return (
          <li key={s.serviceId ?? idx}>
            <button
              type="button"
              onClick={() => s.serviceId != null && onSelect(s.serviceId)}
              className="w-full text-left bg-surface2 border border-border rounded-[10px] px-3.5 py-3 grid grid-cols-[auto_1fr_auto] tablet:grid-cols-[auto_1fr_auto_auto] gap-3.5 items-center hover:border-accent transition-colors"
            >
              <div className="font-syne font-extrabold text-[13px] w-[54px] text-center leading-tight">
                {jour}
                <span className={`${ty.sectionLabelMd} block`}>{mois}</span>
              </div>
              <div className="min-w-0">
                <div className={`${ty.cardTitle} truncate`}>{titre}</div>
                <div className={`${ty.metaSm} mt-0.5`}>
                  {s.checks} check{s.checks > 1 ? 's' : ''} · {s.unchecks} décoche{s.unchecks > 1 ? 's' : ''}
                </div>
              </div>
              {creneauLabel && (
                <span className="hidden tablet:inline-block text-[10px] font-bold uppercase tracking-[0.5px] px-2 py-1 rounded-[6px] bg-surface3 text-muted">
                  {creneauLabel}
                </span>
              )}
              <span className={cn('font-syne font-extrabold text-[14px] px-2.5 py-1 rounded-[8px]', tauxPillClass(taux))}>
                {taux.toFixed(0)}%
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
