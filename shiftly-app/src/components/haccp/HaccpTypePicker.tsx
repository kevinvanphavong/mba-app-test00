'use client'

import { cn } from '@/lib/cn'
import type { HaccpEquipType } from '@/types/haccp'

interface Props {
  value: HaccpEquipType
  onChange: (v: HaccpEquipType) => void
}

const TYPES: { value: HaccpEquipType; label: string; icon: string }[] = [
  { value: 'FRIGO',       label: 'Frigo',       icon: '🧊' },
  { value: 'CONGELATEUR', label: 'Congélateur', icon: '❄️' },
  { value: 'VITRINE',     label: 'Vitrine',     icon: '🥤' },
  { value: 'AUTRE',       label: 'Autre',       icon: '🛠' },
]

export default function HaccpTypePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 tablet:grid-cols-4 gap-2">
      {TYPES.map(t => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            'flex flex-col items-center gap-1 py-3 rounded-[12px] border text-[12px] font-semibold transition-colors',
            value === t.value
              ? 'border-accent bg-accent/10 text-text'
              : 'border-border bg-surface2 text-muted hover:text-text'
          )}
        >
          <span className="text-[20px]">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  )
}
