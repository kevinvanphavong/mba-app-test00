'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useStaff } from '@/hooks/useStaff'
import { useCreateShift, useUpdateShift, useDeleteShift } from '@/hooks/usePlanning'
import type { PlanningShift, PlanningZone } from '@/types/planning'
import ZoneSelector from './ZoneSelector'
import TimeRangePicker from './TimeRangePicker'

const schema = z.object({
  userId:       z.number().min(0),
  zoneId:       z.number().min(1, 'Zone requise'),
  heureDebut:   z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm requis'),
  heureFin:     z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm requis'),
  pauseMinutes: z.number().min(0).max(120),
})

export type ShiftFormValues = z.infer<typeof schema>

interface ShiftModalProps {
  open:              boolean
  onClose:           () => void
  zones:             PlanningZone[]
  date:              string               // 'YYYY-MM-DD'
  shift?:            PlanningShift | null // null = création, défini = édition
  defaultEmployeeId?: number              // pré-sélectionne l'employé en création
}

/** Modal bottom-sheet création / édition d'un shift */
export default function ShiftModal({
  open, onClose, zones, date, shift, defaultEmployeeId,
}: ShiftModalProps) {
  const { data: staffData } = useStaff()
  const createShift  = useCreateShift()
  const updateShift  = useUpdateShift()
  const deleteShift  = useDeleteShift()
  const isEdit       = !!shift

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<ShiftFormValues>({
      resolver: zodResolver(schema),
      defaultValues: { userId: 0, zoneId: 0, heureDebut: '09:00', heureFin: '17:00', pauseMinutes: 0 },
    })

  const zoneId       = watch('zoneId')
  const userId       = watch('userId')
  const heureDebut   = watch('heureDebut')
  const heureFin     = watch('heureFin')
  const pauseMinutes = watch('pauseMinutes')

  const durationLabel = (() => {
    if (!heureDebut || !heureFin) return null
    const [dh, dm] = heureDebut.split(':').map(Number)
    const [fh, fm] = heureFin.split(':').map(Number)
    let mins = (fh * 60 + fm) - (dh * 60 + dm)
    const crossesMidnight = mins < 0
    if (crossesMidnight) mins += 1440
    mins -= (pauseMinutes ?? 0)
    if (mins <= 0) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const label = m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
    return { label, crossesMidnight }
  })()

  useEffect(() => {
    if (open) {
      reset(isEdit
        ? {
            userId:       shift.userId,
            zoneId:       shift.zoneId,
            heureDebut:   shift.heureDebut ?? '09:00',
            heureFin:     shift.heureFin   ?? '17:00',
            pauseMinutes: shift.pauseMinutes,
          }
        : {
            userId:       defaultEmployeeId ?? 0,
            zoneId:       0,
            heureDebut:   '09:00',
            heureFin:     '17:00',
            pauseMinutes: 0,
          }
      )
    }
  }, [open, isEdit, shift, reset, defaultEmployeeId])

  async function onSubmit(values: ShiftFormValues) {
    if (isEdit && shift) {
      await updateShift.mutateAsync({
        posteId:      shift.posteId,
        zone:         `/api/zones/${values.zoneId}`,
        heureDebut:   values.heureDebut,
        heureFin:     values.heureFin,
        pauseMinutes: values.pauseMinutes,
      })
    } else {
      if (!values.userId) return // sécurité : employé requis en création
      await createShift.mutateAsync({
        date,
        userId:       values.userId,
        zoneId:       values.zoneId,
        heureDebut:   values.heureDebut,
        heureFin:     values.heureFin,
        pauseMinutes: values.pauseMinutes,
      })
    }
    onClose()
  }

  async function handleDelete() {
    if (shift) {
      await deleteShift.mutateAsync(shift.posteId)
      onClose()
    }
  }

  const members = staffData?.members ?? []
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div variants={backdropVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm" onClick={onClose} />

          <motion.div variants={sheetVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-[24px] border border-[var(--border)] bg-[var(--surface)] px-4 pt-5"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>

            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border)]" />
            <h2 className="font-syne text-[18px] font-extrabold text-[var(--text)]">
              {isEdit ? 'Modifier le shift' : 'Nouveau shift'}
            </h2>
            <p className="mb-4 text-[12px] text-[var(--muted)]">{fmt(date)}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Employé — affiché en création et en édition (lecture seule si édition) */}
              <div>
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--muted)]">
                  Employé
                </label>
                {isEdit ? (
                  <p className="rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] px-3 py-[10px] text-[13px] text-[var(--muted)]">
                    {members.find(m => m.id === shift?.userId)
                      ? (() => { const m = members.find(m => m.id === shift?.userId)!; return m.prenom ? `${m.prenom} ${m.nom}` : m.nom })()
                      : 'Employé'}
                  </p>
                ) : (
                  <select value={userId} onChange={e => setValue('userId', +e.target.value)}
                    className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] px-3 py-[10px] text-[13px] text-[var(--text)] outline-none focus:border-[var(--accent)]">
                    <option value={0}>Choisir un employé…</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.prenom ? `${m.prenom} ${m.nom}` : m.nom}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Zone */}
              <div>
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--muted)]">Zone</label>
                <ZoneSelector zones={zones} value={zoneId} onChange={id => setValue('zoneId', id)} />
                {errors.zoneId && <p className="mt-1 text-[10px] text-[var(--red)]">{errors.zoneId.message}</p>}
              </div>

              {/* Horaires */}
              <TimeRangePicker register={register} errors={errors} />
              {/* Durée calculée — gestion passage minuit */}
              {durationLabel && (
                <p className="-mt-2 text-[12px] text-[var(--muted)]">
                  {durationLabel.crossesMidnight && '🌙 '}
                  Durée : <span className="font-semibold text-[var(--text)]">{durationLabel.label}</span>
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {isEdit && (
                  <button type="button" onClick={handleDelete}
                    className="rounded-[12px] bg-[var(--red)] px-4 py-3 font-syne text-[13px] font-extrabold text-white">
                    Supprimer
                  </button>
                )}
                <button type="button" onClick={onClose}
                  className="flex-1 rounded-[12px] border border-[var(--border)] py-3 font-syne text-[13px] font-bold text-[var(--muted)]">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-[2] rounded-[12px] bg-[var(--accent)] py-3 font-syne text-[13px] font-extrabold text-white disabled:opacity-50">
                  {isSubmitting ? '…' : isEdit ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
