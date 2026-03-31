'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar          from '@/components/layout/Topbar'
import HeroService     from '@/components/dashboard/HeroService'
import KPIGrid         from '@/components/dashboard/KPIGrid'
import IncidentsList   from '@/components/dashboard/IncidentsList'
import StaffRanking    from '@/components/dashboard/StaffRanking'
import AlertsFeed      from '@/components/dashboard/AlertsFeed'
import ModalIncident   from '@/components/service/ModalIncident'
import { useDashboard }    from '@/hooks/useDashboard'
import { useServiceToday } from '@/hooks/useService'
import { useCreateIncident } from '@/hooks/useIncidents'
import { useZones }        from '@/hooks/useZones'
import { useAuthStore }    from '@/store/authStore'
import { useCurrentUser }  from '@/hooks/useCurrentUser'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useCurrentUser()

  // Redirige les EMPLOYE vers /service — dashboard réservé aux managers
  useEffect(() => {
    if (!loading && user && user.role !== 'MANAGER') {
      router.replace('/service')
    }
  }, [user, loading, router])

  const { data, isLoading, isError } = useDashboard()
  const { data: serviceData }        = useServiceToday()
  const { data: zonesData = [] }     = useZones()
  const centreId                     = useAuthStore(s => s.centreId)
  const createIncident               = useCreateIncident()

  const [incidentOpen, setIncidentOpen] = useState(false)

  // Toutes les zones actives du centre (pour la modale incident)
  const allZones = useMemo(
    () => zonesData
      .filter(z => !z.archivee)
      .map(z => ({ id: z.id, nom: z.nom, couleur: z.couleur ?? '#6b7280', ordre: z.ordre })),
    [zonesData]
  )

  const handleIncidentSubmit = useCallback(async (payload: {
    titre:    string
    severite: 'haute' | 'moyenne' | 'basse'
    zoneId:   number | null
    staffIds: number[]
  }) => {
    if (!serviceData || !centreId) return
    await createIncident.mutateAsync({
      titre:     payload.titre,
      severite:  payload.severite,
      serviceId: serviceData.service.id,
      centreId,
      zoneId:   payload.zoneId,
      staffIds: payload.staffIds,
    })
  }, [serviceData, centreId, createIncident])

  if (loading || !user || user.role !== 'MANAGER') return null

  return (
    <div className="min-h-full animate-fadeUp">
      <Topbar />

      <div className="px-5 pb-8 lg:px-7 space-y-4">

        {/* ── États loading / erreur ── */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-[130px] bg-surface rounded-[18px] border border-border" />
            <div className="grid grid-cols-2 gap-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="h-20 bg-surface rounded-[14px] border border-border" />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <p className="text-red text-[13px] px-1">Impossible de charger le dashboard.</p>
        )}

        {/* ── Données réelles ── */}
        {data && (
          <>
            <HeroService data={data.service} onReportIncident={serviceData?.service ? () => setIncidentOpen(true) : undefined} />

            <KPIGrid
              data={{
                service:   data.service,
                staff:     data.staff,
                incidents: data.incidents,
                tutoriels: data.tutoriels,
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <IncidentsList data={data.incidents} onReport={serviceData?.service ? () => setIncidentOpen(true) : undefined} />
              <StaffRanking  topStaff={data.topStaff} />
              <AlertsFeed    alertes={data.incidents.alertes} />
            </div>
          </>
        )}

      </div>

      {/* Modale incident */}
      <ModalIncident
        open={incidentOpen}
        onClose={() => setIncidentOpen(false)}
        onSubmit={handleIncidentSubmit}
        zones={allZones}
        staff={serviceData?.staff ?? []}
      />
    </div>
  )
}
