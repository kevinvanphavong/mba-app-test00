'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useServiceTimeline } from '@/hooks/useCompletionHistory'
import { ty } from '@/lib/typography'
import { cn } from '@/lib/cn'
import type { EventLogTimelineRow } from '@/types/eventlog'

interface Props {
  open: boolean
  serviceId: number | null
  onClose: () => void
}

/** Modale drill-down — timeline brute des CHECK/UNCHECK d'un service. */
export default function ServiceDrillDownModal({ open, serviceId, onClose }: Props) {
  const { data, isLoading, isError } = useServiceTimeline(open ? serviceId : null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Filtre zones — toutes activées par défaut
  const allZones = useMemo(() => {
    if (!data?.events) return [] as { nom: string; couleur: string }[]
    const seen = new Map<string, string>()
    data.events.forEach(e => {
      const nom = e.payload.zoneNom
      const col = e.payload.zoneCouleur ?? '#6b7280'
      if (nom && !seen.has(nom)) seen.set(nom, col)
    })
    return Array.from(seen, ([nom, couleur]) => ({ nom, couleur }))
  }, [data])

  const [activeZones, setActiveZones] = useState<Set<string>>(new Set())
  useEffect(() => {
    setActiveZones(new Set(allZones.map(z => z.nom)))
  }, [allZones])

  const visibleEvents = useMemo(() => {
    if (!data?.events) return [] as EventLogTimelineRow[]
    return data.events.filter(e => {
      const nom = e.payload.zoneNom
      return nom == null || activeZones.has(nom)
    })
  }, [data, activeZones])

  const headerTitre = (() => {
    if (!data?.events?.length) return 'Service'
    const first = data.events[0]
    const dateStr = first.payload.serviceDate
    if (!dateStr) return 'Service'
    try {
      return format(new Date(dateStr), "EEEE d MMMM", { locale: fr })
    } catch { return dateStr }
  })()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            variants={backdropVariants}
            initial="closed" animate="open" exit="exit"
          />
          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-[60] bg-surface rounded-t-[24px] shadow-2xl max-h-[92dvh] flex flex-col"
            variants={sheetVariants}
            initial="closed" animate="open" exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-syne font-extrabold text-[16px] capitalize truncate">{headerTitre}</h3>
                {data && (
                  <div className={`${ty.metaSm} mt-0.5`}>
                    {data.events.length} événement{data.events.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-[8px] bg-surface2 text-text text-[18px] hover:bg-surface3 transition-colors"
                aria-label="Fermer"
              >×</button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              {isLoading && <SkeletonTimeline />}
              {isError   && <p className="text-red text-[13px]">Impossible de charger la timeline.</p>}
              {data && !isLoading && data.events.length === 0 && (
                <p className={`${ty.metaLg} text-center py-8`}>Pas encore d&apos;événement pour ce service.</p>
              )}
              {data && data.events.length > 0 && (
                <>
                  {/* Filtre zones */}
                  {allZones.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-4">
                      {allZones.map(z => {
                        const active = activeZones.has(z.nom)
                        return (
                          <button
                            key={z.nom}
                            type="button"
                            onClick={() => {
                              setActiveZones(prev => {
                                const next = new Set(prev)
                                if (next.has(z.nom)) next.delete(z.nom)
                                else next.add(z.nom)
                                return next
                              })
                            }}
                            className={cn(
                              'px-2.5 py-1 text-[12px] font-semibold rounded-full border transition-colors',
                              active ? 'border-transparent text-text' : 'bg-surface2 border-border text-muted'
                            )}
                            style={active ? { background: z.couleur + '26', borderColor: z.couleur, color: z.couleur } : undefined}
                          >
                            {z.nom}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <Timeline events={visibleEvents} />
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Timeline({ events }: { events: EventLogTimelineRow[] }) {
  if (events.length === 0) {
    return <p className={`${ty.metaLg} text-center py-6`}>Aucun événement pour ces zones.</p>
  }
  return (
    <div className="relative pl-8">
      <div className="absolute left-[11px] top-1.5 bottom-1.5 w-0.5 bg-border" />
      <ul className="flex flex-col">
        {events.map(ev => {
          const isCheck = ev.action === 'CHECK'
          const time = (() => {
            try { return format(new Date(ev.occurredAt), 'HH:mm') } catch { return '' }
          })()
          return (
            <li key={ev.id} className="relative py-2 pl-1">
              <span
                className={cn(
                  'absolute left-[-27px] top-[14px] w-2.5 h-2.5 rounded-full border-2 border-bg',
                  isCheck ? 'bg-green' : 'bg-red'
                )}
              />
              <div className="flex items-center gap-2.5 text-[13px]">
                <span className="font-syne font-bold text-[12px] text-muted w-[44px] flex-shrink-0">{time}</span>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px]',
                    isCheck ? 'bg-green/15 text-green' : 'bg-red/15 text-red'
                  )}
                >
                  {isCheck ? 'Check' : 'Décoche'}
                </span>
                <span className="font-semibold flex-1 min-w-0 truncate">
                  {ev.payload.missionNom ?? '—'}
                </span>
              </div>
              <div className={`${ty.metaSm} pl-[54px]`}>
                {(ev.payload.userNom ?? 'Utilisateur inconnu')}
                {ev.payload.zoneNom ? ` · ${ev.payload.zoneNom}` : ''}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SkeletonTimeline() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-10 rounded-[8px] bg-surface2 border border-border" />
      ))}
    </div>
  )
}
