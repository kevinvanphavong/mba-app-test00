'use client'

import { useMemo, useState } from 'react'
import { getEffectiveToday } from '@/lib/serviceUtils'
import {
  getTabBuckets,
  filterByPeriod,
  computeClotureRate,
  getPeriodShortcut,
  type TabKey,
} from '@/lib/serviceFilters'
import ServicesHero from '@/components/services/ServicesHero'
import ServicesTabs from '@/components/services/ServicesTabs'
import ServicesPeriodFilter from '@/components/services/ServicesPeriodFilter'
import ServicesTable from '@/components/services/ServicesTable'
import ModalAssignerPoste from '@/components/services/ModalAssignerPoste'
import type { ServiceListItem } from '@/types/index'

interface ServicesDesktopViewProps {
  services:     ServiceListItem[]
  centreName:   string
  isManager:    boolean
  isLoading:    boolean
  isError:      boolean
  onSaveNote:   (id: number, note: string) => void
  onOpenCreate: () => void
  onRetry:      () => void
}

/**
 * Vue desktop /services :
 *  Hero + onglets + filtre période + tableau (+ modale d'assignation).
 *  Loading/error/empty gérés ici. Filtres entièrement front (pas d'appel API).
 */
export default function ServicesDesktopView({
  services, centreName, isManager, isLoading, isError, onSaveNote, onOpenCreate, onRetry,
}: ServicesDesktopViewProps) {
  const today = getEffectiveToday()

  // ── États locaux ─────────────────────────────────────────────────────────
  const [tab,        setTab]        = useState<TabKey>('encours')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [assignTarget, setAssignTarget] = useState<{ service: ServiceListItem; zoneId: number } | null>(null)

  // ── Onglets + filtrage ───────────────────────────────────────────────────
  const buckets = useMemo(() => getTabBuckets(services, today), [services, today])
  const counts  = useMemo(() => ({
    encours:    buckets.encours.length,
    avenir:     buckets.avenir.length,
    historique: buckets.historique.length,
  }), [buckets])

  const visible = useMemo(
    () => filterByPeriod(buckets[tab], dateFrom, dateTo),
    [buckets, tab, dateFrom, dateTo],
  )

  // ── KPI Tx clôture ───────────────────────────────────────────────────────
  const tauxCloture = useMemo(
    () => computeClotureRate(services, today, dateFrom, dateTo),
    [services, today, dateFrom, dateTo],
  )

  function handleTabChange(next: TabKey) {
    setTab(next)
    setExpandedId(null)  // reset ligne ouverte au changement d'onglet
  }

  function handleShortcut(kind: '7j' | '30j' | 'tout') {
    const { from, to } = getPeriodShortcut(today, kind)
    setDateFrom(from)
    setDateTo(to)
  }

  function handleToggleRow(id: number) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  function handleAssign(service: ServiceListItem, zoneId: number) {
    setAssignTarget({ service, zoneId })
  }

  // ── États bord ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-6 py-6 flex flex-col gap-4">
        <div className="h-[120px] bg-surface border border-border rounded-[18px] animate-pulse" />
        <div className="h-[40px] w-[300px] bg-surface border border-border rounded-[10px] animate-pulse" />
        <div className="bg-surface border border-border rounded-[14px] overflow-hidden">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-[60px] border-b border-border last:border-b-0 bg-surface2/40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-10 flex justify-center">
        <div className="bg-surface border border-red/20 rounded-[18px] p-8 text-center max-w-md">
          <p className="text-[28px] mb-2">⚠️</p>
          <p className="font-bold text-red text-[14px]">Erreur de chargement</p>
          <p className="text-[12px] text-muted mt-1 mb-4">Impossible de récupérer les services.</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-surface2 border border-border rounded-[10px] hover:border-accent text-[13px] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 flex flex-col gap-3.5 pb-12">
      <ServicesHero
        centreName={centreName}
        hasLive={buckets.encours.length > 0}
        nbEnCours={buckets.encours.length}
        nbAVenir={buckets.avenir.length}
        nbHistorique={buckets.historique.length}
        tauxCloture={tauxCloture}
        onCreate={onOpenCreate}
      />

      <div className="flex items-center gap-2.5 flex-wrap">
        <ServicesTabs active={tab} onChange={handleTabChange} counts={counts} />
        <ServicesPeriodFilter
          today={today}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onFromChange={v => { setDateFrom(v); setExpandedId(null) }}
          onToChange={v => { setDateTo(v); setExpandedId(null) }}
          onShortcut={handleShortcut}
          resultCount={visible.length}
        />
      </div>

      <ServicesTable
        services={visible}
        tab={tab}
        isManager={isManager}
        expandedId={expandedId}
        onToggle={handleToggleRow}
        onSaveNote={onSaveNote}
        onAssign={handleAssign}
      />

      {assignTarget && (
        <ModalAssignerPoste
          open
          service={assignTarget.service}
          zoneId={assignTarget.zoneId}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  )
}
