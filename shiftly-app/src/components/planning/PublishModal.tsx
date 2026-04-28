'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import { usePublishWeek } from '@/hooks/usePlanning'
import type { PlanningWeekData, PublishWarningResponse } from '@/types/planning'
import { useToastStore } from '@/store/toastStore'
import { formatHours } from '@/lib/formatHours'
import DelaiWarning from './DelaiWarning'

interface PublishModalProps {
  open:        boolean
  onClose:     () => void
  weekStart:   string
  data:        PlanningWeekData
}

/** Modal de publication avec garde-fou délai de prévenance IDCC 1790 */
export default function PublishModal({ open, onClose, weekStart, data }: PublishModalProps) {
  const publishWeek = usePublishWeek()
  const [warning, setWarning]  = useState<PublishWarningResponse | null>(null)
  const showToast              = useToastStore(s => s.show)
  const isRepublication        = data.statut === 'PUBLIE'

  const alertesLegalesHaute = data.alertes.filter(
    a => (a as { categorie?: string }).categorie === 'legal' && a.severite === 'haute'
  )

  function handlePublish() {
    setWarning(null)
    publishWeek.mutate(
      { weekStart, forcePublication: false },
      {
        onSuccess: () => {
          showToast(
            isRepublication
              ? 'Planning republié — le snapshot a été mis à jour'
              : 'Planning publié — les employés peuvent consulter leur semaine',
            'success'
          )
          onClose()
        },
        onError: (err: unknown) => {
          const resp = (err as { response?: { data?: unknown; status?: number } })?.response
          if (resp?.status === 422) {
            setWarning(resp.data as PublishWarningResponse)
          } else {
            showToast('Erreur lors de la publication, réessaie', 'error')
          }
        },
      }
    )
  }

  function handleForce(motif: string) {
    publishWeek.mutate(
      { weekStart, forcePublication: true, motifModification: motif },
      {
        onSuccess: () => {
          showToast('Planning publié hors délai — motif archivé dans le snapshot légal', 'info')
          setWarning(null)
          onClose()
        },
        onError: () => {
          showToast('Erreur lors de la publication forcée, réessaie', 'error')
        },
      }
    )
  }

  function handleClose() {
    setWarning(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[55] bg-black/60"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="exit"
            onClick={handleClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-[24px] border-t border-[var(--border)] bg-[var(--surface)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            variants={sheetVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1 w-9 rounded-full bg-[var(--border)]" />
            </div>

            <div className="max-h-[85vh] overflow-y-auto px-5 pb-4">
              {/* Titre */}
              <div className="flex items-center justify-between py-3">
                <h2 className="font-syne text-[16px] font-bold text-[var(--text)]">
                  {isRepublication ? 'Republier le planning' : 'Publier le planning'}
                </h2>
                <button onClick={handleClose} className="text-[22px] leading-none text-[var(--muted)] hover:text-[var(--text)]">
                  ×
                </button>
              </div>

              {/* Récapitulatif */}
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4">
                <div>
                  <p className="text-[11px] text-[var(--muted)]">Employés planifiés</p>
                  <p className="text-[20px] font-bold text-[var(--text)]">{data.stats.employesPlanifies}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--muted)]">Total heures</p>
                  <p className="text-[20px] font-bold text-[var(--text)]">{formatHours(data.stats.totalHeures)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--muted)]">Créneaux vides</p>
                  <p className={`text-[20px] font-bold ${data.stats.creneauxVides > 0 ? 'text-[var(--yellow)]' : 'text-[var(--green)]'}`}>
                    {data.stats.creneauxVides}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--muted)]">Alertes totales</p>
                  <p className={`text-[20px] font-bold ${data.alertes.length > 0 ? 'text-[var(--accent)]' : 'text-[var(--green)]'}`}>
                    {data.alertes.length}
                  </p>
                </div>
              </div>

              {/* Alertes légales haute sévérité */}
              {alertesLegalesHaute.length > 0 && !warning && (
                <div className="mb-4 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[var(--red)]">
                    ⚖️ Alertes légales haute sévérité
                  </p>
                  <ul className="space-y-1">
                    {alertesLegalesHaute.map((a, i) => (
                      <li key={i} className="text-[12px] text-[var(--muted)]">
                        🔴 {a.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Avertissement délai de prévenance */}
              {warning ? (
                <DelaiWarning
                  warning={warning}
                  onConfirm={handleForce}
                  onCancel={handleClose}
                  isPending={publishWeek.isPending}
                />
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-[14px] bg-[var(--surface2)] py-3.5 text-[14px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={publishWeek.isPending}
                    onClick={handlePublish}
                    className="flex-1 rounded-[14px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] py-3.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {publishWeek.isPending ? '…' : isRepublication ? '↻ Confirmer la republication' : '✓ Confirmer la publication'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
