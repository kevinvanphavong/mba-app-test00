'use client'

import { useState }                     from 'react'
import { AnimatePresence, motion }       from 'framer-motion'
import { useForm }                       from 'react-hook-form'
import { zodResolver }                   from '@hookform/resolvers/zod'
import { z }                             from 'zod'
import { format }                        from 'date-fns'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useCreateService }              from '@/hooks/useService'
import { useStaff }                      from '@/hooks/useStaff'
import { cn }                            from '@/lib/cn'

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = z.object({
  date:       z.string().min(1, 'Date requise'),
  heureDebut: z.string().min(1, 'Heure de début requise'),
  heureFin:   z.string().min(1, 'Heure de fin requise'),
})

type FormValues = z.infer<typeof schema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean
  onClose: () => void
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ModalCreateService({ open, onClose }: Props) {
  const { mutate, isPending } = useCreateService()
  const { data: staff = [] }  = useStaff()

  // Managers uniquement pour le sélecteur responsable
  const managers = staff.filter(m => m.role === 'MANAGER')

  const [apiError, setApiError] = useState<string | null>(null)

  // Date min = aujourd'hui
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date:       '',
      heureDebut: '10:00',
      heureFin:   '22:00',
    },
  })

  function handleClose() {
    reset()
    setApiError(null)
    onClose()
  }

  function onSubmit(values: FormValues) {
    setApiError(null)

    mutate(values, {
      onSuccess: () => handleClose(),

      onError: (err: unknown) => {
        // Extraire le message d'erreur retourné par Symfony (409 ou 400)
        const msg =
          (err as { response?: { data?: { error?: string; 'hydra:description'?: string } } })
            ?.response?.data?.error
          ?? (err as { response?: { data?: { 'hydra:description'?: string } } })
            ?.response?.data?.['hydra:description']
          ?? 'Une erreur est survenue.'
        setApiError(msg)
      },
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="exit"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-[24px] border-t border-border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            variants={sheetVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 pb-2">
              {/* En-tête */}
              <div className="flex items-center justify-between py-3 mb-1">
                <h2 className="font-syne font-bold text-[16px] text-text">
                  Nouveau service
                </h2>
                <button
                  onClick={handleClose}
                  className="text-muted hover:text-text transition-colors text-[22px] leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-4">

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-muted uppercase tracking-wide">
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    {...register('date')}
                    className={cn(
                      'w-full bg-surface2 border rounded-[12px] px-4 py-3 text-[14px] text-text',
                      'focus:outline-none focus:border-accent transition-colors',
                      errors.date ? 'border-red' : 'border-border',
                    )}
                  />
                  {errors.date && (
                    <p className="text-[11px] text-red">{errors.date.message}</p>
                  )}
                </div>

                {/* Heures */}
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-muted uppercase tracking-wide">
                      Ouverture
                    </label>
                    <input
                      type="time"
                      {...register('heureDebut')}
                      className={cn(
                        'w-full bg-surface2 border rounded-[12px] px-4 py-3 text-[14px] text-text',
                        'focus:outline-none focus:border-accent transition-colors',
                        errors.heureDebut ? 'border-red' : 'border-border',
                      )}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-muted uppercase tracking-wide">
                      Fermeture
                    </label>
                    <input
                      type="time"
                      {...register('heureFin')}
                      className={cn(
                        'w-full bg-surface2 border rounded-[12px] px-4 py-3 text-[14px] text-text',
                        'focus:outline-none focus:border-accent transition-colors',
                        errors.heureFin ? 'border-red' : 'border-border',
                      )}
                    />
                  </div>
                </div>

                {/* Manager responsable */}
                {managers.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-muted uppercase tracking-wide">
                      Manager responsable
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {managers.map(m => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 bg-surface2 border border-border rounded-[10px] px-3 py-2"
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, #f97316, #fb923c)` }}
                          >
                            {m.nom.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[12px] text-text">{m.nom}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted">
                      Tous les managers du centre sont responsables du service.
                    </p>
                  </div>
                )}

                {/* Erreur API (doublon date, etc.) */}
                {apiError && (
                  <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-[10px] px-4 py-3">
                    <p className="text-[12px] text-red">{apiError}</p>
                  </div>
                )}

                {/* Boutons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3.5 rounded-[14px] bg-surface2 text-muted text-[14px] font-semibold hover:text-text transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                      'flex-1 py-3.5 rounded-[14px] font-syne font-bold text-[14px] transition-all',
                      isPending
                        ? 'bg-surface2 text-muted cursor-not-allowed'
                        : 'bg-accent text-white hover:bg-accent/90 active:scale-[0.98]',
                    )}
                  >
                    {isPending ? 'Création…' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
