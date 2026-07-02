'use client'

import type { ActivityItem as Item } from '@/hooks/useSuperAdminActivity'

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Une entrée du journal. Champs libres rendus via JSX (échappés). */
export default function ActivityItem({ item }: { item: Item }) {
  const audit = item.source === 'audit'

  return (
    <div className="flex items-start justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 hover:border-accent/30">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase ${audit ? 'bg-accent/15 text-accent' : 'bg-blue/15 text-blue'}`}>
          {audit ? 'SuperAdmin' : 'Centre'}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{item.resume}</p>
          <p className="truncate text-xs text-muted">
            {item.acteur}
            {item.centreNom ? ` · ${item.centreNom}` : ''}
          </p>
        </div>
      </div>
      <time className="shrink-0 text-xs text-text-soft">{fmt(item.date)}</time>
    </div>
  )
}
