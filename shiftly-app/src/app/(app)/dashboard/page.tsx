'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar                from '@/components/layout/Topbar'
import HeroService           from '@/components/dashboard/HeroService'
import KPIGrid               from '@/components/dashboard/KPIGrid'
import IncidentsList         from '@/components/dashboard/IncidentsList'
import StaffRanking          from '@/components/dashboard/StaffRanking'
import ModalIncidentDetail   from '@/components/dashboard/ModalIncidentDetail'
import ModalIncidentEdit     from '@/components/dashboard/ModalIncidentEdit'
import { useDashboard }          from '@/hooks/useDashboard'
import { useServiceToday }       from '@/hooks/useService'
import { useUpdateIncidentFull } from '@/hooks/useIncidents'
import { useZones }              from '@/hooks/useZones'
import { useCurrentUser }        from '@/hooks/useCurrentUser'
import { useIncidentReporter }   from '@/hooks/useIncidentReporter'
import type { DashboardAlerte }  from '@/types/dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useCurrentUser()

  useEffect(() => {
    if (!loading && user && user.role !== 'MANAGER') {
      router.replace('/service')
    }
  }, [user, loading, router])

  const { data, isLoading, isError } = useDashboard()
  const { data: serviceData }        = useServiceToday()
  const { data: zonesData = [] }     = useZones()
  const updateIncident               = useUpdateIncidentFull()
  const { canReport, openReportIncident, IncidentModalElement } = useIncidentReporter()

  // ── État modales ──────────────────────────────────────────────────────────
  const [selectedIncident,   setSelectedIncident]   = useState<DashboardAlerte | null>(null)
  const [detailOpen,         setDetailOpen]         = useState(false)
  const [editOpen,           setEditOpen]           = useState(false)

  const allZones = useMemo(
    () => zonesData
      .filter(z => !z.archivee)
      .map(z => ({ id: z.id, nom: z.nom, couleur: z.couleur ?? '#6b7280', ordre: z.ordre })),
    [zonesData]
  )

  // Staff du service du jour pour les modales incident
  const serviceStaff = useMemo(
    () => (serviceData?.staff ?? []).map(m => ({ id: m.id, nom: m.nom, avatarColor: m.avatarColor })),
    [serviceData]
  )

  const handleView = useCallback((inc: DashboardAlerte) => {
    setSelectedIncident(inc)
    setDetailOpen(true)
  }, [])

  const handleEdit = useCallback((inc: DashboardAlerte) => {
    setSelectedIncident(inc)
    setEditOpen(true)
  }, [])

  const handleClose = useCallback((id: number) => {
    updateIncident.mutate({ id, statut: 'RESOLU' })
  }, [updateIncident])

  const handleEditSubmit = useCallback(async (payload: {
    titre: string; severite: 'haute' | 'moyenne' | 'basse'
    statut: 'OUVERT' | 'EN_COURS' | 'RESOLU'; zoneId: number | null; staffIds: number[]
  }) => {
    if (!selectedIncident) return
    await updateIncident.mutateAsync({ id: selectedIncident.id, ...payload })
  }, [selectedIncident, updateIncident])

  if (loading || !user || user.role !== 'MANAGER') return null

  // Les modales sont rendues HORS du div animate-fadeUp :
  // transform: translateY(0) crée un nouveau containing block qui brise position:fixed
  return (
    <>
      <div className="min-h-full animate-fadeUp">
        <Topbar
          title="Dashboard"
          subtitle={
            data?.service?.today
              ? `Service en cours — ${user.centre?.nom ?? ''}`
              : (user.centre?.nom ?? '')
          }
          onReportIncident={canReport ? openReportIncident : undefined}
        />

        <div className="pt-5 px-5 pb-8 lg:px-7 space-y-4">

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

          {data && (
            <>
              <HeroService data={data.service} />

              <KPIGrid
                data={{
                  service:   data.service,
                  staff:     data.staff,
                  incidents: data.incidents,
                  tutoriels: data.tutoriels,
                  stats:     data.stats,
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <IncidentsList
                  data={data.incidents}
                  userRole="MANAGER"
                  onView={handleView}
                  onEdit={handleEdit}
                  onClose={handleClose}
                />
                <StaffRanking topStaff={data.topStaff} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modales — hors du div animé pour que position:fixed fonctionne */}
      {IncidentModalElement}

      <ModalIncidentDetail
        open={detailOpen}
        incident={selectedIncident}
        onClose={() => setDetailOpen(false)}
        onEdit={() => { setDetailOpen(false); setEditOpen(true) }}
      />

      <ModalIncidentEdit
        open={editOpen}
        incident={selectedIncident}
        zones={allZones}
        staff={serviceStaff}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </>
  )
}
