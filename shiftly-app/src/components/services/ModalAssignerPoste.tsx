'use client'

import { useState, useEffect }            from 'react'
import { AnimatePresence, motion }         from 'framer-motion'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useCreatePoste }                  from '@/hooks/useService'
import { useZones }                        from '@/hooks/useZones'
import { useStaff }                        from '@/hooks/useStaff'
import { cn }                              from '@/lib/cn'
import type { ServiceListItem }            from '@/types/index'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean
  service: ServiceListItem
  /** Zone cible — toujours pré-sélectionnée depuis la carte zone */
  zoneId:  number | null
  onClose: () => void
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ModalAssignerPoste({ open, service, zoneId, onClose }: Props) {
  const { data: allZones = [] }   = useZones()
  const { data: staffData }       = useStaff()
  const allStaff                  = staffData?.members ?? []
  const { mutateAsync, isPending } = useCreatePoste()

  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [apiError,        setApiError]        = useState<string | null>(null)

  // Réinitialise la sélection quand la modale s'ouvre ou quand la zone change
  useEffect(() => {
    if (open) {
      setSelectedUserIds(new Set())
      setApiError(null)
    }
  }, [open, zoneId])

  const zone           = allZones.find(z => z.id === zoneId)
  const zoneColor      = zone?.couleur ?? '#6b7280'
  // Membres déjà assignés à cette zone pour ce service
  const assignedUserIds = zoneId
    ? (service.zones.find(z => z.id === zoneId)?.postes ?? []).map(p => p.userId)
    : []

  function toggleUser(id: number) {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleClose() {
    setSelectedUserIds(new Set())
    setApiError(null)
    onClose()
  }

  async function handleAssigner() {
    if (!zoneId || selectedUserIds.size === 0) return
    setApiError(null)

    try {
      await Promise.all(
        Array.from(selectedUserIds).map(userId =>
          mutateAsync({ serviceId: service.id, zoneId, userId })
        )
      )
      handleClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Une erreur est survenue.'
      setApiError(msg)
    }
  }

  const count = selectedUserIds.size

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
            className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-[24px] border-t border-border max-h-[85dvh] flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            variants={sheetVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: zoneColor }}
                  />
                  <h2 className="font-syne font-bold text-[16px] text-text truncate">
                    Ajouter à {zone?.nom ?? 'la zone'}
                  </h2>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Sélectionnez un ou plusieurs membres
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-muted hover:text-text transition-colors text-[22px] leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {/* Corps scrollable */}
            <div className="overflow-y-auto flex-1 px-5 pb-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Membres
                </p>
                {count > 0 && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${zoneColor}20`,
                      color:           zoneColor,
                      border:          `1px solid ${zoneColor}40`,
                    }}
                  >
                    {count} sélectionné{count > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                {allStaff.map(member => {
                  const alreadyAssigned = assignedUserIds.includes(member.id)
                  const isSelected      = selectedUserIds.has(member.id)
                  const displayName     = member.prenom ?? member.nom

                  return (
                    <button
                      key={member.id}
                      disabled={alreadyAssigned}
                      onClick={() => !alreadyAssigned && toggleUser(member.id)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-[12px] border transition-all text-left',
                        alreadyAssigned
                          ? 'border-border bg-surface2 opacity-40 cursor-not-allowed'
                          : isSelected
                            ? 'bg-surface2'
                            : 'border-border bg-surface2 hover:border-border/60',
                      )}
                      style={isSelected && !alreadyAssigned ? {
                        borderColor:     zoneColor,
                        backgroundColor: `${zoneColor}14`,
                      } : undefined}
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, #f97316, #fb923c)` }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-text leading-tight truncate">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-muted leading-tight">
                          {member.role === 'MANAGER' ? 'Manager' : 'Employé'}
                        </div>
                      </div>

                      {alreadyAssigned ? (
                        <span className="text-[10px] text-muted">Déjà assigné</span>
                      ) : (
                        <span
                          className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center text-[12px] font-bold transition-all',
                            isSelected ? 'text-white' : 'border-border text-transparent',
                          )}
                          style={isSelected ? {
                            backgroundColor: zoneColor,
                            borderColor:     zoneColor,
                          } : undefined}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Erreur API */}
              {apiError && (
                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-[10px] px-4 py-3 mb-4">
                  <p className="text-[12px] text-red">{apiError}</p>
                </div>
              )}
            </div>

            {/* Footer fixe */}
            <div className="px-5 pt-3 pb-2 shrink-0 border-t border-border">
              <button
                onClick={handleAssigner}
                disabled={count === 0 || isPending}
                className={cn(
                  'w-full py-3.5 rounded-[14px] font-syne font-bold text-[14px] transition-all',
                  count === 0 || isPending
                    ? 'bg-surface2 text-muted cursor-not-allowed'
                    : 'text-white hover:opacity-90 active:scale-[0.98]',
                )}
                style={count > 0 && !isPending ? { backgroundColor: zoneColor } : undefined}
              >
                {isPending
                  ? 'Assignation…'
                  : count === 0
                    ? 'Sélectionnez un membre'
                    : `Ajouter ${count} membre${count > 1 ? 's' : ''}`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
