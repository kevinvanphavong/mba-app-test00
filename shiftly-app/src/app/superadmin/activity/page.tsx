'use client'

import { useState } from 'react'
import { useActivity, type ActivityFilters } from '@/hooks/useSuperAdminActivity'
import { useConsoleKpis } from '@/hooks/useConsoleAgence'
import ActivityItem from '@/components/superadmin/activity/ActivityItem'

const VIDE: ActivityFilters = { centre: null, from: '', to: '', type: '', page: 1 }
const input = 'rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent'

/**
 * Journal d'activité (super-admin) : timeline agrégée AuditLog + EventLog, filtrable
 * par client / période / type, paginée. Lecture seule. React Query, 3 états.
 */
export default function ActivityPage() {
  const [filters, setFilters] = useState<ActivityFilters>(VIDE)
  const { data, isLoading, isError, refetch } = useActivity(filters)
  const kpis = useConsoleKpis()

  const set = (patch: Partial<ActivityFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }))
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1

  return (
    <>
      <div className="mb-5">
        <h1 className="font-syne text-2xl font-extrabold text-text">Journal d’activité</h1>
        <p className="mt-0.5 text-[13px] text-muted">Actions super-admin + événements clients · lecture seule</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={filters.centre ?? ''} onChange={(e) => set({ centre: e.target.value === '' ? null : Number(e.target.value) })} className={input} aria-label="Client">
          <option value="">Tous les clients</option>
          {(kpis.data?.centres ?? []).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => set({ type: e.target.value })} className={input} aria-label="Type">
          <option value="">Tous les types</option>
          {(data?.types ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} className={input} aria-label="Depuis" />
        <input type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} className={input} aria-label="Jusqu’à" />
      </div>

      {isLoading && <p className="text-sm text-muted">Chargement du journal…</p>}
      {isError && (
        <div className="text-sm">
          <p className="text-red">Erreur de chargement.</p>
          <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">Réessayer</button>
        </div>
      )}

      {!isLoading && !isError && data && (data.items.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">Aucune activité pour ces filtres.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {data.items.map((it, i) => <ActivityItem key={`${it.source}-${it.date}-${i}`} item={it} />)}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <button onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} disabled={filters.page <= 1} className="rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent disabled:opacity-40">← Précédent</button>
            <span className="text-muted">Page {data.page} / {pages} · {data.total} entrées</span>
            <button onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} disabled={filters.page >= pages} className="rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent disabled:opacity-40">Suivant →</button>
          </div>
        </>
      ))}
    </>
  )
}
