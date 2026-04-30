'use client'

import { useMemo, useState, type ReactElement } from 'react'
import { useCurrentUser }    from '@/hooks/useCurrentUser'
import { useServiceToday }   from '@/hooks/useService'
import { useCreateIncident } from '@/hooks/useIncidents'
import { useZones }          from '@/hooks/useZones'
import { useAuthStore }      from '@/store/authStore'
import ModalIncident         from '@/components/service/ModalIncident'
import type { IncidentSeverite } from '@/types/service'

interface IncidentReporter {
  /** true ssi l'utilisateur courant est manager ET un service du jour existe */
  canReport:            boolean
  /** Ouvre la modale de signalement */
  openReportIncident:   () => void
  /** Élément JSX à rendre dans la page (modale + plomberie) */
  IncidentModalElement: ReactElement | null
}

/**
 * Mutualise la mécanique « Signaler un incident » du Topbar.
 * À utiliser sur les pages d'action manager (Dashboard, Planning, Service, Pointage).
 */
export function useIncidentReporter(): IncidentReporter {
  const { user }                = useCurrentUser()
  const { data: serviceData }   = useServiceToday()
  const { data: zonesAll = [] } = useZones()
  const centreId                = useAuthStore(s => s.centreId)
  const createIncident          = useCreateIncident()

  const [open, setOpen] = useState(false)

  const canReport = user?.role === 'MANAGER' && Boolean(serviceData?.service)

  const incidentZones = useMemo(
    () => zonesAll
      .filter(z => !z.archivee)
      .map(z => ({ id: z.id, nom: z.nom, couleur: z.couleur ?? '#6b7280', ordre: z.ordre })),
    [zonesAll],
  )

  async function handleSubmit(payload: {
    titre:    string
    severite: IncidentSeverite
    zoneId:   number | null
    staffIds: number[]
  }) {
    if (!serviceData || !centreId) return
    await createIncident.mutateAsync({
      titre:     payload.titre,
      severite:  payload.severite,
      serviceId: serviceData.service.id,
      centreId,
      zoneId:    payload.zoneId,
      staffIds:  payload.staffIds,
    })
  }

  // Modale rendue uniquement si l'utilisateur peut signaler — évite les hooks inutiles côté employé
  const IncidentModalElement = canReport ? (
    <ModalIncident
      open={open}
      onClose={() => setOpen(false)}
      onSubmit={handleSubmit}
      zones={incidentZones}
      staff={serviceData?.staff ?? []}
    />
  ) : null

  return {
    canReport,
    openReportIncident: () => setOpen(true),
    IncidentModalElement,
  }
}
