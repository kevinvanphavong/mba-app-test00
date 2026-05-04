'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import {
  usePlanningTemplates,
  useCreatePlanningTemplate,
  useDeletePlanningTemplate,
  useApplyPlanningTemplate,
} from '@/hooks/usePlanningTemplates'
import { useToastStore } from '@/store/toastStore'
import { isAxiosError } from 'axios'

interface TemplatesModalProps {
  open:               boolean
  onClose:            () => void
  currentWeekStart:   string  // utilisé comme source par défaut pour "Sauvegarder"
}

/** Modal unique pour gérer les templates : créer / lister / appliquer / supprimer. */
export default function TemplatesModal({ open, onClose, currentWeekStart }: TemplatesModalProps) {
  const toast    = useToastStore(s => s.show)
  const list     = usePlanningTemplates()
  const create   = useCreatePlanningTemplate()
  const remove   = useDeletePlanningTemplate()
  const apply    = useApplyPlanningTemplate()

  const [nom, setNom]                       = useState('')
  const [applyTargetId, setApplyTargetId]   = useState<number | null>(null)
  const [applyDate, setApplyDate]           = useState(currentWeekStart)

  function handleCreate() {
    const trimmed = nom.trim()
    if (!trimmed) { toast('Donne un nom au template', 'error'); return }

    create.mutate({ nom: trimmed, weekStart: currentWeekStart }, {
      onSuccess: (t) => {
        const parts = [`${t.shiftCount} shift${t.shiftCount > 1 ? 's' : ''}`]
        if (t.absenceCount > 0) {
          parts.push(`${t.absenceCount} absence${t.absenceCount > 1 ? 's' : ''}`)
        }
        toast(`Template "${t.nom}" sauvegardé (${parts.join(' · ')})`, 'success')
        setNom('')
      },
      onError: (err) => {
        const status = isAxiosError(err) ? err.response?.status : null
        toast(status === 409 ? 'Un template porte déjà ce nom' : 'Erreur à la sauvegarde', 'error')
      },
    })
  }

  function handleApply(id: number, nomT: string) {
    if (!confirm(
      `Appliquer le template "${nomT}" ?\nToutes les assignations existantes de la semaine cible seront remplacées (sauf celles des jours déjà passés).`,
    )) return

    apply.mutate({ id, weekStart: applyDate }, {
      onSuccess: (r) => {
        const totalApplied = r.created + r.absencesCreated
        const totalSkipped =
          r.skippedOrphan + r.skippedPast + r.skippedDuplicate
          + r.absencesSkippedOrphan + r.absencesSkippedPast + r.absencesSkippedDuplicate
        const detail = r.absencesCreated > 0
          ? ` (${r.created} shift(s) + ${r.absencesCreated} absence(s))`
          : ''
        const replaced = r.replacedExisting > 0
          ? ` — ${r.replacedExisting} ancien${r.replacedExisting > 1 ? 's' : ''} poste${r.replacedExisting > 1 ? 's' : ''} remplacé${r.replacedExisting > 1 ? 's' : ''}`
          : ''
        toast(
          `${totalApplied} entrée(s) appliquée(s)${detail}${totalSkipped > 0 ? ` — ${totalSkipped} ignorée(s)` : ''}${replaced}`,
          'success'
        )
        setApplyTargetId(null)
        onClose()
      },
      onError: () => toast('Erreur lors de l\'application du template', 'error'),
    })
  }

  function handleDelete(id: number, nomT: string) {
    if (!confirm(`Supprimer le template "${nomT}" ?`)) return
    remove.mutate(id, {
      onSuccess: () => toast('Template supprimé', 'success'),
      onError:   () => toast('Erreur à la suppression', 'error'),
    })
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center"
          onClick={onClose}
        >
          <motion.div
            variants={sheetVariants} initial="hidden" animate="visible" exit="hidden"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl bg-[var(--surface)] p-5 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-syne text-lg font-bold text-[var(--text)]">Templates de planning</h2>
            <p className="mt-1 text-[12px] text-[var(--muted)]">Sauvegarde la semaine courante comme modèle réutilisable, puis applique-le à n'importe quelle semaine future.</p>
            <p className="mt-2 rounded-lg border border-[var(--yellow)]/40 bg-[rgba(234,179,8,0.08)] px-3 py-2 text-[11px] text-[var(--yellow)]">
              ⚠ Appliquer un template <strong>remplace</strong> les assignations de postes existantes de la semaine cible (les jours déjà passés sont préservés).
            </p>

            {/* Sauvegarder la semaine en cours */}
            <div className="mt-5 flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Sauvegarder la semaine actuelle</label>
              <div className="flex gap-2">
                <input
                  type="text" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100}
                  placeholder="Nom du template (ex: Semaine standard)"
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  onClick={handleCreate} disabled={create.isPending}
                  className="rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {create.isPending ? '…' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {/* Liste des templates */}
            <div className="mt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Templates enregistrés</h3>
              {list.isLoading && <p className="mt-3 text-[12px] text-[var(--muted)]">Chargement…</p>}
              {list.isError   && <p className="mt-3 text-[12px] text-[var(--red)]">Erreur de chargement</p>}
              {list.data && list.data.length === 0 && (
                <p className="mt-3 text-[12px] text-[var(--muted)]">Aucun template pour l'instant.</p>
              )}

              <ul className="mt-2 flex flex-col gap-2">
                {list.data?.map((t) => (
                  <li key={t.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-[var(--text)]">{t.nom}</p>
                        <p className="text-[11px] text-[var(--muted)]">
                          {t.shiftCount} shift{t.shiftCount > 1 ? 's' : ''}
                          {t.absenceCount > 0 && ` · ${t.absenceCount} absence${t.absenceCount > 1 ? 's' : ''}`}
                          {' · créé par '}{t.createdBy.nom || '—'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setApplyTargetId(applyTargetId === t.id ? null : t.id)}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[12px] text-[var(--text)] hover:border-[var(--accent)]"
                        >
                          📅 Appliquer
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.nom)}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--red)] hover:border-[var(--red)]"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {applyTargetId === t.id && (
                      <div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-3">
                        <input
                          type="date" value={applyDate} min={todayStr}
                          onChange={(e) => setApplyDate(e.target.value)}
                          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                        />
                        <button
                          onClick={() => handleApply(t.id, t.nom)} disabled={apply.isPending}
                          className="rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                        >
                          {apply.isPending ? '…' : 'Confirmer'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] py-2 text-[13px] text-[var(--text)] hover:border-[var(--accent)]"
            >
              Fermer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
