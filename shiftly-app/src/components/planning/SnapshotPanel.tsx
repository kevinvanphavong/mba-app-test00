'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { expandVariants } from '@/lib/animations'
import { usePlanningSnapshots } from '@/hooks/usePlanning'

interface SnapshotPanelProps {
  weekStart: string
  show:      boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Historique des publications immuables d'une semaine (archivage légal IDCC 1790) */
export default function SnapshotPanel({ weekStart, show }: SnapshotPanelProps) {
  const { data: snapshots, isLoading, isError } = usePlanningSnapshots(weekStart)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="snapshot-panel"
          variants={expandVariants}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-5 py-3">
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
              <ul className="divide-y divide-[var(--border)]">
                {snapshots.map(s => (
                  <li key={s.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="mt-0.5 shrink-0">
                      {s.delaiRespect ? (
                        <span className="text-[11px] font-bold text-[var(--green)]">✓</span>
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
                      <p className="text-[11px] text-[var(--muted)]">
                        Par {s.publishedByNom}
                      </p>
                      {s.motifModification && (
                        <p className="mt-1 rounded-md bg-[var(--surface2)] px-2 py-1 text-[11px] italic text-[var(--muted)]">
                          « {s.motifModification} »
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
