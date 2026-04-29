'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import { usePlanningSnapshots } from '@/hooks/usePlanning'

interface SnapshotPanelProps {
  weekStart: string
  open:      boolean
  onClose:   () => void
}

const PREVIEW = 4

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Historique des publications immuables d'une semaine (archivage légal IDCC 1790).
 * Affiché en overlay (bottom-sheet sur mobile, modal centrée sur desktop) — pattern
 * identique aux autres formulaires du module (TemplatesModal, PublishModal).
 */
export default function SnapshotPanel({ weekStart, open, onClose }: SnapshotPanelProps) {
  const { data: snapshots, isLoading, isError } = usePlanningSnapshots(weekStart)
  const [expanded, setExpanded] = useState(false)

  // Reset l'état "voir tout" à chaque ouverture
  useEffect(() => {
    if (open) setExpanded(false)
  }, [open])

  // Escape pour fermer
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const visible = snapshots
    ? (expanded ? snapshots : snapshots.slice(0, PREVIEW))
    : []
  const hasMore = !!snapshots && snapshots.length > PREVIEW
  const hidden  = snapshots ? snapshots.length - PREVIEW : 0

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="closed" animate="open" exit="exit"
            className="fixed inset-0 z-[55] bg-black/60"
            onClick={onClose}
          />

          <motion.div
            variants={sheetVariants}
            initial="closed" animate="open" exit="exit"
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[560px] rounded-t-[24px] border-t border-[var(--border)] bg-[var(--surface)] md:inset-x-auto md:left-1/2 md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle mobile */}
            <div className="flex justify-center pb-1 pt-3 md:hidden">
              <div className="h-1 w-9 rounded-full bg-[var(--border)]" />
            </div>

            {/* En-tête */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-3 md:py-4">
              <div className="min-w-0">
                <h2 className="font-syne text-[15px] font-bold text-[var(--text)]">
                  🗄️ Historique des publications
                </h2>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  Archivage légal — Conservation 3 ans (prescription prud'homale)
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 text-[22px] leading-none text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="max-h-[70vh] overflow-y-auto md:max-h-[60vh]">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                </div>
              )}

              {isError && (
                <p className="px-5 py-4 text-[12px] text-[var(--muted)]">
                  Impossible de charger l'historique.
                </p>
              )}

              {!isLoading && !isError && (!snapshots || snapshots.length === 0) && (
                <div className="flex items-center gap-2 px-5 py-6 text-sm text-[var(--muted)]">
                  <span>📋</span>
                  <span>Aucune publication pour cette semaine</span>
                </div>
              )}

              {snapshots && snapshots.length > 0 && (
                <div className="relative">
                  <ul className="divide-y divide-[var(--border)]">
                    {visible.map(s => (
                      <li key={s.id} className="flex items-start gap-3 px-5 py-4">
                        <div className="mt-0.5 shrink-0 pt-0.5">
                          {s.delaiRespect ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(34,197,94,0.15)] text-[11px] font-bold text-[var(--green)]">✓</span>
                          ) : (
                            <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--red)]">
                              Hors délai
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-[var(--text)]">
                            {formatDate(s.publishedAt)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                            Par {s.publishedByNom}
                          </p>
                          {s.motifModification && (
                            <p className="mt-2 rounded-md bg-[var(--surface2)] px-3 py-1.5 text-[11px] italic text-[var(--muted)]">
                              « {s.motifModification} »
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {hasMore && !expanded && (
                    <button
                      onClick={() => setExpanded(true)}
                      className="flex w-full items-center justify-center gap-1.5 border-t border-[var(--border)] py-2.5 text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      {hidden} de plus · Voir tout ↓
                    </button>
                  )}

                  {hasMore && expanded && (
                    <button
                      onClick={() => setExpanded(false)}
                      className="flex w-full items-center justify-center gap-1.5 border-t border-[var(--border)] py-2.5 text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      Réduire ↑
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
