'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { expandVariants } from '@/lib/animations'
import { usePlanningSnapshots } from '@/hooks/usePlanning'

interface SnapshotPanelProps {
  weekStart: string
  show:      boolean
}

const PREVIEW = 2

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Historique des publications immuables d'une semaine (archivage légal IDCC 1790) */
export default function SnapshotPanel({ weekStart, show }: SnapshotPanelProps) {
  const { data: snapshots, isLoading, isError } = usePlanningSnapshots(weekStart)
  const [expanded, setExpanded] = useState(false)

  const visible = snapshots
    ? (expanded ? snapshots : snapshots.slice(0, PREVIEW))
    : []
  const hasMore = !!snapshots && snapshots.length > PREVIEW
  const hidden  = snapshots ? snapshots.length - PREVIEW : 0

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="snapshot-panel"
          variants={expandVariants}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface2)]"
        >
          <div>
            <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
              <p className="text-[12px] font-bold text-[var(--text)]">
                🗄️ Historique des publications
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                Archivage légal — Conservation 3 ans (prescription prud'homale)
              </p>
            </div>

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
              <div className="flex items-center gap-2 px-5 py-4 text-sm text-[var(--muted)]">
                <span>📋</span>
                <span>Aucune publication pour cette semaine</span>
              </div>
            )}

            {snapshots && snapshots.length > 0 && (
              <div className="relative">
                <ul className="divide-y divide-[var(--border)]">
                  {visible.map(s => (
                    <li key={s.id} className="flex items-start gap-3 px-4 py-4 md:px-5">
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
                          <p className="mt-2 rounded-md bg-[var(--surface)] px-3 py-1.5 text-[11px] italic text-[var(--muted)]">
                            « {s.motifModification} »
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {hasMore && !expanded && (
                  <div className="relative border-t border-[var(--border)]">
                    {/* dégradé remontant sur le dernier item */}
                    <div className="pointer-events-none absolute bottom-full left-0 right-0 h-14 bg-gradient-to-t from-[var(--surface2)] to-transparent" />
                    <button
                      onClick={() => setExpanded(true)}
                      className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      {hidden} de plus · Voir tout ↓
                    </button>
                  </div>
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
      )}
    </AnimatePresence>
  )
}
