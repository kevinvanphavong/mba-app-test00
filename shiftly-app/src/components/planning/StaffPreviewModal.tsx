'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import { usePublishedSnapshot } from '@/hooks/usePlanning'
import { formatHours } from '@/lib/formatHours'
import { hexAlpha } from '@/lib/colors'
import type { PlanningEmployee, PlanningShift, PlanningAbsence } from '@/types/planning'
import { useEffect } from 'react'

interface Props {
  open:      boolean
  onClose:   () => void
  weekStart: string
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const ABSENCE_LABELS: Record<string, string> = {
  CP:                'CP',
  RTT:               'RTT',
  MALADIE:           'Maladie',
  REPOS:             'Repos',
  EVENEMENT_FAMILLE: 'Événement',
  AUTRE:             'Absence',
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function buildWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

/**
 * Aperçu de ce que le staff voit actuellement (= dernier snapshot publié).
 * Read-only, permet au manager de comparer avec son live avant de republier.
 */
export default function StaffPreviewModal({ open, onClose, weekStart }: Props) {
  const { data, isLoading, isError, error } = usePublishedSnapshot(weekStart, open)

  // Escape pour fermer
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 404 = jamais publié → message explicite
  const notPublished = isError &&
    (error as { response?: { status?: number } } | undefined)?.response?.status === 404

  const weekDates = data ? buildWeekDates(data.data.weekStart) : []

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
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[920px] rounded-t-[24px] border-t border-x border-[var(--border)] bg-[var(--surface)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pb-1 pt-3 md:hidden">
              <div className="h-1 w-9 rounded-full bg-[var(--border)]" />
            </div>

            {/* En-tête */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-3">
              <div className="min-w-0">
                <h2 className="font-syne text-[15px] font-bold text-[var(--text)]">
                  👀 Aperçu staff — version actuellement publiée
                </h2>
                {data && (
                  <p className="mt-0.5 text-[11px] text-[var(--muted)] leading-snug">
                    Publié le <span className="font-semibold text-[var(--text)]">{formatDateLong(data.publishedAt)}</span> par {data.publishedByNom}.
                    C'est ce que vos employés voient en ce moment dans leur application.
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 text-[22px] leading-none text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {/* Contenu scrollable (vertical + horizontal pour la grille) */}
            <div className="max-h-[75vh] overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                </div>
              )}

              {notPublished && (
                <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                  <span className="text-[28px]">📋</span>
                  <p className="text-[13px] font-semibold text-[var(--text)]">
                    Cette semaine n'a jamais été publiée
                  </p>
                  <p className="text-[12px] text-[var(--muted)] max-w-[320px]">
                    Le staff ne voit donc rien pour l'instant. Publie le planning depuis le bouton
                    ✓ Publier pour rendre la version actuelle visible à l'équipe.
                  </p>
                </div>
              )}

              {isError && !notPublished && (
                <p className="px-5 py-6 text-[12px] text-[var(--muted)]">
                  Impossible de charger l'aperçu staff.
                </p>
              )}

              {data && data.data.employees.length === 0 && (
                <p className="px-5 py-12 text-center text-[12px] text-[var(--muted)]">
                  Aucun employé dans le planning publié.
                </p>
              )}

              {data && data.data.employees.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface2)]">
                        <th className="sticky left-0 z-10 bg-[var(--surface2)] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                          Employé
                        </th>
                        {weekDates.map((d, i) => {
                          const dt = new Date(d + 'T12:00:00')
                          return (
                            <th key={d} className="border-l border-[var(--border)] px-2 py-2 text-center">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
                                {JOURS[i]}{' '}
                                <span className="text-[var(--text)]">{dt.getDate()}</span>
                              </span>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.employees.map((emp: PlanningEmployee) => {
                        const shiftsByDate = emp.shifts.reduce<Record<string, PlanningShift[]>>(
                          (acc, s) => { acc[s.date] = acc[s.date] ? [...acc[s.date], s] : [s]; return acc },
                          {}
                        )
                        const absenceByDate = (emp.absences ?? []).reduce<Record<string, PlanningAbsence>>(
                          (acc, a) => { acc[a.date] = a; return acc },
                          {}
                        )

                        return (
                          <tr key={emp.id} className="border-b border-[var(--border)]">
                            <td className="sticky left-0 z-10 bg-[var(--surface)] px-3 py-2 text-left">
                              <div className="text-[12px] font-semibold text-[var(--text)]">
                                {emp.prenom ?? emp.nom}
                              </div>
                              <div className="text-[10px] text-[var(--muted)]">
                                {formatHours(emp.totalHeures)}
                              </div>
                            </td>
                            {weekDates.map(date => {
                              const absence = absenceByDate[date]
                              const shifts  = shiftsByDate[date] ?? []

                              return (
                                <td key={date} className="border-l border-[var(--border)] px-1.5 py-1.5 align-top">
                                  {absence ? (
                                    <div className="rounded-[6px] bg-[var(--surface2)] px-1.5 py-1 text-center text-[10px] text-[var(--muted)]">
                                      {ABSENCE_LABELS[absence.type] ?? 'Absence'}
                                    </div>
                                  ) : shifts.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                      {shifts.map(s => (
                                        <div
                                          key={s.posteId}
                                          className="rounded-[5px] px-1.5 py-1 text-[10px]"
                                          style={{
                                            background:    hexAlpha(s.zoneCouleur, 0.12),
                                            borderLeft:    `2px solid ${s.zoneCouleur}`,
                                            color:         s.zoneCouleur,
                                          }}
                                        >
                                          <div className="font-semibold leading-tight">
                                            {s.heureDebut ?? '?'}–{s.heureFin ?? '?'}
                                          </div>
                                          <div className="text-[9px] opacity-80 leading-tight">
                                            {s.zoneNom}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="block text-center text-[10px] text-[var(--muted)] opacity-50">
                                      —
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pied : rappel + fermer */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-3">
              <p className="text-[10px] text-[var(--muted)] leading-snug">
                Vue read-only — les modifications se font dans le planning principal.
              </p>
              <button
                onClick={onClose}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-4 py-2 text-[12px] font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent)]"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
