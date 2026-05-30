'use client'

import { cn } from '@/lib/cn'
import type { HistoryPeriod } from '@/types/eventlog'

interface Props {
  value: HistoryPeriod
  onChange: (p: HistoryPeriod) => void
}

const OPTIONS: { value: HistoryPeriod; label: string }[] = [
  { value: '7d',  label: '7 jours'  },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
]

/** Toggle pill de période — pattern UI Shiftly (cf. maquette dashboard-history). */
export default function PeriodToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex bg-surface border border-border rounded-[10px] p-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-[13px] font-semibold rounded-[7px] transition-colors',
            value === opt.value
              ? 'bg-accent text-white'
              : 'text-muted hover:text-text'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
