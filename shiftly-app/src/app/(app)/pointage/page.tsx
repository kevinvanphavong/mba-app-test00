'use client'

import { useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion }        from 'framer-motion'
import { listVariants }                  from '@/lib/animations'
import { useManagerGuard }                from '@/hooks/useManagerGuard'
import { useServiceToday }                from '@/hooks/useService'
import {
  usePointageService, usePointageArrivee, usePointageDepart,
  usePointagePauseStart, usePointagePauseEnd,
  usePointageAbsence, usePointageCloturerService,
} from '@/hooks/usePointage'
import Topbar                  from '@/components/layout/Topbar'
import PointageHeader          from '@/components/pointage/PointageHeader'
import PointageKpiRow          from '@/components/pointage/PointageKpiRow'
import PointageStaffCard       from '@/components/pointage/PointageStaffCard'
import PointagePinPad          from '@/components/pointage/PointagePinPad'
import PointageActionModal     from '@/components/pointage/PointageActionModal'
import PointageTimeline        from '@/components/pointage/PointageTimeline'
import PointageAlertPanel      from '@/components/pointage/PointageAlertPanel'
import PointageCloturerModal   from '@/components/pointage/PointageCloturerModal'
import type { PointageEntry } from '@/types/pointage'

type ActionType    = 'arrivee' | 'depart' | 'pause_start' | 'pause_end' | 'absence'
type PinActionType = Exclude<ActionType, 'absence'>

const TRI_STATUT: Record<string, number> = {
  en_pause: 0, prevu_retard: 1, en_cours: 2, prevu: 3, termine: 4, absent: 5,
}

function triStatut(p: PointageEntry): number {
  if (p.statut === 'PREVU' && p.minutesRetard > 0) return TRI_STATUT.prevu_retard
  return TRI_STATUT[p.statut.toLowerCase().replace('_', '_')] ?? 99
}

export default function PointagePage() {
  const { isManager, loading: authLoading } = useManagerGuard()
  const { data: serviceToday, isLoading: serviceLoading } = useServiceToday()

  const serviceId = serviceToday?.service?.id ?? null
  const { data, isLoading: pointageLoading } = usePointageService(serviceId)

  const [selected,        setSelected]        = useState<{ pointage: PointageEntry; action: PinActionType } | null>(null)
  const [showAction,      setShowAction]       = useState(false)
  const [showCloturer,    setShowCloturer]     = useState(false)
  const [pinError,        setPinError]         = useState<string | null>(null)
  const [now]                                  = useState(() => new Date())

  const arrivee    = usePointageArrivee(serviceId!)
  const depart     = usePointageDepart(serviceId!)
  const pauseStart = usePointagePauseStart(serviceId!)
  const pauseEnd   = usePointagePauseEnd(serviceId!)
  const absence    = usePointageAbsence(serviceId!)
  const cloturer   = usePointageCloturerService()

  const sortedPointages = useMemo(
    () => [...(data?.pointages ?? [])].sort((a, b) => triStatut(a) - triStatut(b)),
    [data?.pointages]
  )

  const openPinPad = useCallback((pointage: PointageEntry, action: ActionType) => {
    if (action === 'absence') {
      absence.mutate({ id: pointage.id })
      return
    }
    setPinError(null)
    setSelected({ pointage, action })
  }, [absence])

  const handlePin = useCallback((pin: string | null, managerBypass: boolean) => {
    if (!selected) return
    const { pointage, action } = selected
    const payload = { codePin: pin ?? undefined, managerBypass }

    const onSuccess = () => { setShowAction(true) }
    const onError   = (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? 'Code PIN incorrect.'
      setPinError(msg)
    }

    if (action === 'arrivee')     arrivee.mutate({ id: pointage.id, payload }, { onSuccess, onError })
    if (action === 'depart')      depart.mutate({ id: pointage.id, payload }, { onSuccess, onError })
    if (action === 'pause_start') pauseStart.mutate({ id: pointage.id, payload }, { onSuccess, onError })
    if (action === 'pause_end')   pauseEnd.mutate({ id: pointage.id, payload }, { onSuccess, onError })
  }, [selected, arrivee, depart, pauseStart, pauseEnd])

  const closeFlow = useCallback(() => {
    setSelected(null)
    setShowAction(false)
    setPinError(null)
  }, [])

  // ── États loading / error / vide ──────────────────────────────────────────

  if (authLoading || serviceLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Chargement…</p>
      </div>
    )
  }

  if (!isManager) return null

  if (!serviceToday?.service || serviceToday.service.statut === 'PLANIFIE') {
    return (
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-2 px-6 text-center">
          <p className="text-3xl">📋</p>
          <p className="font-semibold font-syne" style={{ color: 'var(--text)' }}>Aucun service aujourd'hui</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Le pointage sera disponible dès qu'un service est créé pour aujourd'hui.
          </p>
        </div>
      </div>
    )
  }

  // ── PinPad (écran intermédiaire) ──────────────────────────────────────────

  if (selected && !showAction) {
    const isLoading = arrivee.isPending || depart.isPending || pauseStart.isPending || pauseEnd.isPending
    return (
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <PointagePinPad
            pointage={selected.pointage}
            action={selected.action}
            onValidate={handlePin}
            onCancel={closeFlow}
            isLoading={isLoading}
            errorMessage={pinError}
          />
        </div>
      </div>
    )
  }

  // ── Vue principale ────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <Topbar />

      {data && (
        <>
          <PointageHeader data={data} onCloturerClick={() => setShowCloturer(true)} />
          <div className="flex flex-col gap-4 pb-24">
            <PointageKpiRow stats={data.stats} pointages={data.pointages} />

            {/* Liste des cartes staff */}
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-2 px-4 md:px-6"
            >
              {pointageLoading
                ? <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>Chargement…</p>
                : sortedPointages.length === 0
                  ? <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>Aucun pointage généré</p>
                  : sortedPointages.map(p => (
                      <PointageStaffCard key={p.id} pointage={p} now={now} onAction={openPinPad} />
                    ))
              }
            </motion.div>

            <PointageAlertPanel pointages={data.pointages} now={now} />
            <PointageTimeline   pointages={data.pointages} />
          </div>
        </>
      )}

      {/* ActionModal post-PIN */}
      <AnimatePresence>
        {selected && showAction && (
          <PointageActionModal
            pointage={selected.pointage}
            action={selected.action}
            onConfirm={closeFlow}
            onCancel={closeFlow}
          />
        )}
      </AnimatePresence>

      {/* Modale clôture */}
      <AnimatePresence>
        {showCloturer && data && (
          <PointageCloturerModal
            stats={data.stats}
            onConfirm={() => { cloturer.mutate(serviceId!); setShowCloturer(false) }}
            onCancel={() => setShowCloturer(false)}
            isLoading={cloturer.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
