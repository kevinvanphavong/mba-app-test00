'use client'

import { cn } from '@/lib/cn'
import type { TabKey } from '@/lib/serviceFilters'

interface ServicesTabsProps {
  active:    TabKey
  onChange:  (k: TabKey) => void
  counts:    Record<TabKey, number>
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'encours',    label: 'En cours'   },
  { key: 'avenir',     label: 'À venir'    },
  { key: 'historique', label: 'Historique' },
]

/**
 * Onglets desktop /services avec compteurs intégrés.
 * Tab actif : `bg-surface2 text-text` + compteur orange ; inactif : `text-muted`.
 */
export default function ServicesTabs({ active, onChange, counts }: ServicesTabsProps) {
  return (
    <div className="flex gap-1.5 bg-surface border border-border rounded-[10px] p-1 w-fit">
      {TABS.map(t => {
        const isActive = active === t.key
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold transition-colors',
              isActive
                ? 'bg-surface2 text-text'
                : 'text-muted hover:text-text',
            )}
          >
            {t.label}
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-px rounded-[5px] leading-tight',
                isActive
                  ? 'bg-accent text-white border-0'
                  : 'bg-bg border border-border text-muted',
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
