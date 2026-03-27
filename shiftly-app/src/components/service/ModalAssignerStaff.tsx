'use client'

import { useState }                           from 'react'
import { motion, AnimatePresence }            from 'framer-motion'
import { cn }                                 from '@/lib/cn'
import { sheetVariants, backdropVariants }    from '@/lib/animations'
import { useCreatePoste }                     from '@/hooks/useService'
import type { ServiceZone, ServiceStaffMember } from '@/types/service'

interface Props {
  open:            boolean
  zone:            ServiceZone
  serviceId:       number
  staff:           ServiceStaffMember[]   // tous les membres du centre
  assignedUserIds: number[]               // déjà dans cette zone → désactivés
  onClose:         () => void
}

export default function ModalAssignerStaff({
  open,
  zone,
  serviceId,
  staff,
  assignedUserIds,
  onClose,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  const createPoste = useCreatePoste()

  const handleClose = () => {
    setSelectedId(null)
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedId) return
    setError(null)

    try {
      await createPoste.mutateAsync({ serviceId, zoneId: zone.id, userId: selectedId })
      handleClose()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setError('Ce membre est déjà assigné à cette zone.')
      } else {
        setError('Erreur lors de l\'assignation — réessaie.')
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-40"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="exit"
          />

          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-[24px] shadow-2xl max-h-[80dvh] flex flex-col"
            variants={sheetVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <div>
                <h2 className="font-syne font-extrabold text-[16px] text-text">
                  Assigner un membre
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: zone.couleur }}
                  />
                  <span className="text-[11px] font-semibold" style={{ color: zone.couleur }}>
                    {zone.nom}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-muted hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Liste membres */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {staff.length === 0 && (
                <p className="text-[13px] text-muted text-center py-6">
                  Aucun membre dans ce centre.
                </p>
              )}

              {staff.map(member => {
                const alreadyAssigned = assignedUserIds.includes(member.id)
                const isSelected      = selectedId === member.id
                const initials        = member.nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

                return (
                  <button
                    key={member.id}
                    disabled={alreadyAssigned}
                    onClick={() => !alreadyAssigned && setSelectedId(isSelected ? null : member.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] border transition-all duration-150 text-left',
                      alreadyAssigned
                        ? 'border-transparent bg-surface2/40 opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-accent/50 bg-accent/8'
                          : 'border-border bg-surface2/60 hover:bg-surface2'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white font-extrabold text-[11px] flex-shrink-0"
                      style={{ background: member.avatarColor }}
                    >
                      {initials}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[13px] font-semibold truncate',
                        alreadyAssigned ? 'text-muted' : 'text-text'
                      )}>
                        {member.nom}
                      </p>
                      <p className="text-[11px] text-muted">
                        {alreadyAssigned ? 'Déjà assigné à cette zone' : member.role === 'MANAGER' ? 'Manager' : 'Employé'}
                      </p>
                    </div>

                    {/* Checkbox */}
                    {!alreadyAssigned && (
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        isSelected ? 'border-accent bg-accent' : 'border-border bg-surface'
                      )}>
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Erreur */}
            {error && (
              <p className="mx-5 mb-2 text-[12px] text-red bg-red/5 border border-red/20 rounded-[8px] px-3 py-2 flex-shrink-0">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 px-5 py-4 border-t border-border flex-shrink-0">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-[12px] bg-surface2 border border-border text-[13px] font-bold text-muted hover:text-text transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedId || createPoste.isPending}
                className={cn(
                  'flex-[2] py-3 rounded-[12px] text-[13px] font-extrabold text-white transition-all duration-200',
                  'bg-gradient-to-r from-accent to-accent2',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  selectedId && !createPoste.isPending && 'hover:opacity-90 active:scale-[0.98]'
                )}
              >
                {createPoste.isPending ? '⏳ Assignation…' : '+ Assigner'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
