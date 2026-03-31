'use client'

import { useState }                       from 'react'
import { AnimatePresence, motion }         from 'framer-motion'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useCreatePoste }                  from '@/hooks/useService'
import { useZones }                        from '@/hooks/useZones'
import { useStaff }                        from '@/hooks/useStaff'
import { cn }                              from '@/lib/cn'
import type { ServiceListItem }            from '@/types/index'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open:      boolean
  service:   ServiceListItem
  /** Si fourni → zone pré-sélectionnée (mode "ajouter staff à une zone") */
  zoneId?:   number | null
  onClose:   () => void
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ModalAssignerPoste({ open, service, zoneId, onClose }: Props) {
  const { data: allZones = [] } = useZones()
  const { data: staffData }              = useStaff()
  const allStaff                         = staffData?.members ?? []
  const { mutate, isPending }   = useCreatePoste()

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(zoneId ?? null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [apiError,       setApiError]       = useState<string | null>(null)

  // IDs des users déjà assignés à la zone sélectionnée
  const assignedUserIds = selectedZoneId
    ? (service.zones.find(z => z.id === selectedZoneId)?.postes ?? []).map(p => p.userId)
    : []

  function handleClose() {
    setSelectedZoneId(zoneId ?? null)
    setSelectedUserId(null)
    setApiError(null)
    onClose()
  }

  function handleAssigner() {
    if (!selectedZoneId || !selectedUserId) return
    setApiError(null)

    mutate(
      { serviceId: service.id, zoneId: selectedZoneId, userId: selectedUserId },
      {
        onSuccess: () => handleClose(),
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'Une erreur est survenue.'
          setApiError(msg)
        },
      }
    )
  }

  // Zone sélectionnée (entity complète depuis allZones)
  const selectedZone = allZones.find(z => z.id === selectedZoneId)

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
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <div>
                <h2 className="font-syne font-bold text-[16px] text-text">
                  Assigner un membre
                </h2>
                <p className="text-[11px] text-muted mt-0.5">
                  {selectedZone
                    ? <>Zone : <span className="font-semibold" style={{ color: selectedZone.couleur ?? 'var(--color-accent)' }}>{selectedZone.nom}</span></>
                    : 'Choisissez une zone puis un membre'
                  }
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-muted hover:text-text transition-colors text-[22px] leading-none"
              >
                ×
              </button>
            </div>

            {/* Corps scrollable */}
            <div className="overflow-y-auto flex-1 px-5 pb-2">

              {/* ── Étape 1 : Sélection de la zone (si non pré-sélectionnée) ── */}
              {!zoneId && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
                    Zone
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {allZones.map(zone => {
                      const alreadyInService = service.zones.some(z => z.id === zone.id)
                      const isSelected       = selectedZoneId === zone.id

                      return (
                        <button
                          key={zone.id}
                          onClick={() => { setSelectedZoneId(zone.id); setSelectedUserId(null) }}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-[12px] border transition-all text-left',
                            isSelected
                              ? 'border-accent bg-accent/10'
                              : 'border-border bg-surface2 hover:border-border/60',
                          )}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: zone.couleur ?? '#6b7280' }}
                          />
                          <span className="flex-1 text-[13px] text-text font-medium">
                            {zone.nom}
                          </span>
                          {!alreadyInService && (
                            <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
                              nouvelle
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-accent text-[14px]">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Étape 2 : Sélection du membre ── */}
              {selectedZoneId && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
                    Membre
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {allStaff.map(member => {
                      const alreadyAssigned = assignedUserIds.includes(member.id)
                      const isSelected      = selectedUserId === member.id

                      return (
                        <button
                          key={member.id}
                          disabled={alreadyAssigned}
                          onClick={() => !alreadyAssigned && setSelectedUserId(member.id)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-[12px] border transition-all text-left',
                            alreadyAssigned
                              ? 'border-border bg-surface2 opacity-40 cursor-not-allowed'
                              : isSelected
                                ? 'border-accent bg-accent/10'
                                : 'border-border bg-surface2 hover:border-border/60',
                          )}
                        >
                          {/* Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, #f97316, #fb923c)` }}
                          >
                            {member.nom.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-text leading-tight truncate">
                              {member.nom}
                            </div>
                            <div className="text-[11px] text-muted leading-tight">
                              {member.role === 'MANAGER' ? 'Manager' : 'Employé'}
                            </div>
                          </div>

                          {alreadyAssigned && (
                            <span className="text-[10px] text-muted">Déjà assigné</span>
                          )}
                          {isSelected && (
                            <span className="text-accent text-[14px]">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

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
                disabled={!selectedZoneId || !selectedUserId || isPending}
                className={cn(
                  'w-full py-3.5 rounded-[14px] font-syne font-bold text-[14px] transition-all',
                  !selectedZoneId || !selectedUserId || isPending
                    ? 'bg-surface2 text-muted cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent/90 active:scale-[0.98]',
                )}
              >
                {isPending ? 'Assignation…' : 'Assigner'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
