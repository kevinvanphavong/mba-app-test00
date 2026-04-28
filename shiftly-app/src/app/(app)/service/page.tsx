'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Topbar                   from '@/components/layout/Topbar'
import HeroServiceCard          from '@/components/service/HeroServiceCard'
import ZoneCard                 from '@/components/service/ZoneCard'
import ModalMissionPonctuelle   from '@/components/service/ModalMissionPonctuelle'
import ModalAssignerStaff       from '@/components/service/ModalAssignerStaff'
import ModalIncident            from '@/components/service/ModalIncident'
import MissionPhotoCaptureModal from '@/components/service/MissionPhotoCaptureModal'
import PhotoLightbox            from '@/components/shared/PhotoLightbox'
import { useServiceToday }      from '@/hooks/useService'
import { useDeletePoste }       from '@/hooks/useService'
import { useToggleCompletion }  from '@/hooks/useMissions'
import { useCreateIncident }    from '@/hooks/useIncidents'
import { useZones }             from '@/hooks/useZones'
import { useCurrentUser }       from '@/hooks/useCurrentUser'
import { useAuthStore }         from '@/store/authStore'
import type { ServiceZoneData, ServiceMission } from '@/types/service'

export default function ServicePage() {
  // Déclenche le chargement du user et popule centreId dans le store
  const { loading: userLoading } = useCurrentUser()
  const centreId = useAuthStore(s => s.centreId)
  const userId   = useAuthStore(s => s.userId)
  const userRole = useAuthStore(s => s.user?.role)

  const { data, isLoading, isError } = useServiceToday()
  const { data: allZones = [] }      = useZones()
  const loading = userLoading || isLoading || (!centreId && !isError)

  // ── Completions optimistes ─────────────────────────────────────────────────
  const [completions,     setCompletions]    = useState<Record<number, boolean>>({})
  const [completionIds,   setCompletionIds]  = useState<Record<number, number>>({})
  const [loadingMissions, setLoadingMissions] = useState<Set<number>>(new Set())

  // ── Modales ────────────────────────────────────────────────────────────────
  const [ponctuellZone,  setPonctuellZone]  = useState<ServiceZoneData | null>(null)
  const [assignZone,     setAssignZone]     = useState<ServiceZoneData | null>(null)
  const [incidentOpen,   setIncidentOpen]   = useState(false)
  // Capture photo : on stocke la mission + le posteId à utiliser pour la completion
  const [photoTarget,    setPhotoTarget]    = useState<{ mission: ServiceMission; posteId: number } | null>(null)
  // Lightbox : src de la photo (path API relative) en cours de visualisation
  const [lightboxSrc,    setLightboxSrc]    = useState<string | null>(null)

  // ── Mutations ──────────────────────────────────────────────────────────────
  const toggleCompletion = useToggleCompletion()
  const deletePoste      = useDeletePoste()
  const createIncident   = useCreateIncident()

  // ── Handler incident ───────────────────────────────────────────────────────
  const handleIncidentSubmit = useCallback(async (payload: {
    titre:    string
    severite: 'haute' | 'moyenne' | 'basse'
    zoneId:   number | null
    staffIds: number[]
  }) => {
    if (!data?.service || !centreId) return
    await createIncident.mutateAsync({
      titre:     payload.titre,
      severite:  payload.severite,
      serviceId: data.service.id,
      centreId,
      zoneId:   payload.zoneId,
      staffIds: payload.staffIds,
    })
  }, [data, centreId, createIncident])

  // ── Synchronisation des completions depuis les données serveur ─────────────
  useEffect(() => {
    if (!data) return
    const comps: Record<number, boolean> = {}
    const ids:   Record<number, number>  = {}
    for (const zone of data.zones) {
      for (const mission of zone.missions) {
        comps[mission.id] = mission.completionId !== null
        if (mission.completionId !== null) ids[mission.id] = mission.completionId
      }
    }
    setCompletions(comps)
    setCompletionIds(ids)
  }, [data])

  // ── Stats par zone ─────────────────────────────────────────────────────────
  const zoneStats = useMemo(() => {
    if (!data) return []
    return data.zones.map(zone => ({
      nom:     zone.nom,
      couleur: zone.couleur,
      done:    zone.missions.filter(m => completions[m.id]).length,
      total:   zone.missions.length,
    }))
  }, [data, completions])

  const totalDone = useMemo(() => zoneStats.reduce((s, z) => s + z.done,  0), [zoneStats])
  const totalAll  = useMemo(() => zoneStats.reduce((s, z) => s + z.total, 0), [zoneStats])
  const globalPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  // ── Toggle mission ─────────────────────────────────────────────────────────
  const handleToggle = useCallback((
    missionId:          number,
    currentlyCompleted: boolean,
    zoneId:             number
  ) => {
    // Trouver le posteId du user courant dans cette zone, ou prendre le premier
    const zone   = data?.zones.find(z => z.id === zoneId)
    const posteId = zone?.postes.find(p => p.user?.id === userId)?.id
                    ?? zone?.postes[0]?.id
    if (!posteId) return

    // Mise à jour optimiste
    setCompletions(prev => ({ ...prev, [missionId]: !currentlyCompleted }))
    setLoadingMissions(prev => new Set(prev).add(missionId))

    toggleCompletion.mutate(
      {
        missionId,
        posteId,
        completionId: currentlyCompleted ? (completionIds[missionId] ?? null) : null,
      },
      {
        onSuccess: (result) => {
          if (!currentlyCompleted && result) {
            setCompletionIds(prev => ({ ...prev, [missionId]: result.id }))
          } else {
            setCompletionIds(prev => { const n = { ...prev }; delete n[missionId]; return n })
          }
        },
        onError: () => {
          setCompletions(prev => ({ ...prev, [missionId]: currentlyCompleted }))
        },
        onSettled: () => {
          setLoadingMissions(prev => { const n = new Set(prev); n.delete(missionId); return n })
        },
      }
    )
  }, [data, userId, completionIds, toggleCompletion])

  // ── État chargement ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full animate-fadeUp">
        <Topbar />
        <div className="px-4 pb-28 space-y-3">
          <div className="h-[180px] bg-surface rounded-[18px] border border-border animate-pulse" />
          <div className="h-[80px]  bg-surface rounded-[18px] border border-border animate-pulse" />
          {[0, 1, 2].map(i => (
            <div key={i} className="h-[200px] bg-surface rounded-[18px] border border-border animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── État vide / erreur ─────────────────────────────────────────────────────
  if (isError || !data || !data.service) {
    return (
      <div className="min-h-full animate-fadeUp">
        <Topbar />
        <div className="px-4 py-16 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">📋</span>
          <p className="font-syne font-extrabold text-[15px] text-text">
            Aucun service aujourd'hui
          </p>
          <p className="text-[13px] text-muted max-w-[260px]">
            Aucun service n'est planifié pour ce centre. Crée-en un depuis le planning.
          </p>
        </div>
      </div>
    )
  }

  // ── Rendu principal ────────────────────────────────────────────────────────
  // Les modales sont rendues HORS du div animate-fadeUp :
  // transform: translateY(0) (fill-mode forwards) crée un nouveau containing block
  // ce qui brise position:fixed des bottom sheets.
  return (
    <>
      <div className="min-h-full animate-fadeUp">
        <Topbar />

        <div className="px-4 pb-28 lg:px-7 lg:pb-12 space-y-3 lg:mx-auto">

          {/* Hero service */}
          <HeroServiceCard
            service={data.service}
            globalPct={globalPct}
            stats={zoneStats}
            totalDone={totalDone}
            totalAll={totalAll}
            onReportIncident={() => setIncidentOpen(true)}
          />

          {/* Zone cards */}
          {data.zones.map(zone => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              completions={completions}
              loadingMissions={loadingMissions}
              onToggle={handleToggle}
              onAddPonctuelle={userRole === 'MANAGER' ? z => setPonctuellZone(z as ServiceZoneData) : undefined}
              onAssign={userRole === 'MANAGER' ? z => setAssignZone(z as ServiceZoneData) : undefined}
              onRemoveStaff={userRole === 'MANAGER' ? posteId => deletePoste.mutate(posteId) : undefined}
              onCapturePhoto={(mission, posteId) => setPhotoTarget({ mission, posteId })}
              onOpenPhoto={(completionId) => setLightboxSrc(`/completions/${completionId}/photo`)}
            />
          ))}

        </div>
      </div>

      {/* Modales — en dehors du div animé pour que position:fixed fonctionne */}
      <ModalIncident
        open={incidentOpen}
        onClose={() => setIncidentOpen(false)}
        onSubmit={handleIncidentSubmit}
        zones={allZones
          .filter(z => !z.archivee)
          .map(z => ({ id: z.id, nom: z.nom, couleur: z.couleur ?? '#6b7280', ordre: z.ordre }))}
        staff={data.staff}
      />

      {ponctuellZone && (
        <ModalMissionPonctuelle
          open
          zone={ponctuellZone}
          serviceId={data.service.id}
          onClose={() => setPonctuellZone(null)}
        />
      )}

      {assignZone && (
        <ModalAssignerStaff
          open
          zone={assignZone}
          serviceId={data.service.id}
          staff={data.staff}
          assignedUserIds={assignZone.postes
            .filter(p => p.user !== null)
            .map(p => p.user!.id)
          }
          onClose={() => setAssignZone(null)}
        />
      )}

      <MissionPhotoCaptureModal
        open={photoTarget !== null}
        mission={photoTarget?.mission ?? null}
        posteId={photoTarget?.posteId ?? 0}
        onClose={() => setPhotoTarget(null)}
      />

      <PhotoLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </>
  )
}
