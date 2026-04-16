'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter }               from 'next/navigation'
import { formatDistanceToNow }     from 'date-fns'
import { fr }                      from 'date-fns/locale'
import { cn }                      from '@/lib/cn'
import { ty }                      from '@/lib/typography'
import ModalIncidentDetail         from '@/components/dashboard/ModalIncidentDetail'
import ModalIncidentEdit           from '@/components/dashboard/ModalIncidentEdit'
import { useIncidentsFull, useUpdateIncidentFull } from '@/hooks/useIncidents'
import { useZones }                from '@/hooks/useZones'
import { useStaff }                from '@/hooks/useStaff'
import { useCurrentUser }          from '@/hooks/useCurrentUser'
import type { IncidentFull }       from '@/types/incident'

const SEV_DOT: Record<string, string>   = { haute: 'bg-red', moyenne: 'bg-yellow', basse: 'bg-muted' }
const SEV_BADGE: Record<string, string> = {
  haute:   'text-red    bg-red/10',
  moyenne: 'text-yellow bg-yellow/10',
  basse:   'text-muted  bg-surface2',
}
const SEV_LABEL: Record<string, string>    = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' }
const STATUT_BADGE: Record<string, string> = {
  OUVERT:   'text-red    bg-red/10',
  EN_COURS: 'text-yellow bg-yellow/10',
  RESOLU:   'text-green  bg-green/10',
}
const STATUT_LABEL: Record<string, string> = { OUVERT: 'Ouvert', EN_COURS: 'En cours', RESOLU: 'Résolu' }

type StatutFilter = 'TOUS' | 'OUVERT' | 'EN_COURS' | 'RESOLU'

export default function IncidentsReglagesPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useCurrentUser()

  useEffect(() => {
    if (!userLoading && user && user.role !== 'MANAGER') {
      router.replace('/reglages')
    }
  }, [user, userLoading, router])

  const { data: incidents = [], isLoading } = useIncidentsFull()
  const { data: zonesData = [] }            = useZones()
  const { data: staffData }                 = useStaff()
  const updateIncident                      = useUpdateIncidentFull()

  const [filter,           setFilter]           = useState<StatutFilter>('TOUS')
  const [selectedIncident, setSelectedIncident] = useState<IncidentFull | null>(null)
  const [detailOpen,       setDetailOpen]       = useState(false)
  const [editOpen,         setEditOpen]         = useState(false)

  const allZones = useMemo(
    () => zonesData.filter(z => !z.archivee).map(z => ({
      id: z.id, nom: z.nom, couleur: z.couleur ?? '#6b7280', ordre: z.ordre,
    })),
    [zonesData]
  )

  const allStaff = useMemo(
    () => (staffData?.members ?? []).map(m => ({ id: m.id, nom: m.nom, avatarColor: m.avatarColor })),
    [staffData]
  )

  const filtered = useMemo(
    () => filter === 'TOUS' ? incidents : incidents.filter(i => i.statut === filter),
    [incidents, filter]
  )

  const handleView = useCallback((inc: IncidentFull) => {
    setSelectedIncident(inc)
    setDetailOpen(true)
  }, [])

  const handleEdit = useCallback((inc: IncidentFull) => {
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
    // Mettre à jour l'incident sélectionné localement pour la modale de détail
    setSelectedIncident(prev => prev ? { ...prev, ...payload, zone: allZones.find(z => z.id === payload.zoneId) ?? null } : null)
  }, [selectedIncident, updateIncident, allZones])

  if (userLoading || !user || user.role !== 'MANAGER') return null

  return (
    <>
      <div className="mx-auto px-4 pb-24 lg:max-w-2xl">

        {/* Header */}
        <div className="py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-accent text-[13px] font-semibold"
          >
            ← Réglages
          </button>
        </div>

        <h1 className="font-syne font-extrabold text-[20px] text-text mb-0.5">Incidents</h1>
        <p className="text-[12px] text-muted mb-4">{incidents.length} au total</p>

        {/* Filtre par statut */}
        <div className="flex items-center gap-1.5 bg-surface2 rounded-[10px] p-1 w-fit mb-4">
            {(['TOUS', 'OUVERT', 'EN_COURS', 'RESOLU'] as StatutFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'text-[11px] font-semibold px-3 py-1 rounded-[8px] transition-all',
                  filter === s ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                )}
              >
                {s === 'TOUS' ? 'Tous' : STATUT_LABEL[s]}
              </button>
            ))}
          </div>

          {/* État chargement */}
          {isLoading && (
            <div className="space-y-2">
              {[0,1,2].map(i => (
                <div key={i} className="h-[80px] bg-surface rounded-[14px] border border-border animate-pulse" />
              ))}
            </div>
          )}

          {/* État vide */}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-3xl">✅</span>
              <p className="text-[13px] font-semibold text-text">Aucun incident</p>
              <p className={`${ty.meta} max-w-[220px]`}>Aucun incident trouvé pour ce filtre.</p>
            </div>
          )}

          {/* Liste */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-col gap-2">
              {filtered.map(inc => {
                const timeAgo = (() => {
                  try { return formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true, locale: fr }) }
                  catch { return '' }
                })()

                return (
                  <div key={inc.id} className="bg-surface border border-border rounded-[14px] p-3.5">
                    <div className="flex items-start gap-2.5">
                      <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', SEV_DOT[inc.severite] ?? 'bg-muted')} />
                      <div className="flex-1 min-w-0">
                        <p className={`${ty.bodyLg} leading-snug mb-1`}>{inc.titre}</p>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className={cn(`${ty.badge} uppercase px-1.5 py-0.5 rounded-[4px]`, SEV_BADGE[inc.severite])}>
                            {SEV_LABEL[inc.severite]}
                          </span>
                          <span className={cn(`${ty.badge} uppercase px-1.5 py-0.5 rounded-[4px]`, STATUT_BADGE[inc.statut] ?? 'text-muted bg-surface2')}>
                            {STATUT_LABEL[inc.statut] ?? inc.statut}
                          </span>
                          {inc.zone && (
                            <span
                              className={`${ty.badge} font-semibold px-1.5 py-0.5 rounded-[4px]`}
                              style={{ color: inc.zone.couleur, backgroundColor: `${inc.zone.couleur}18` }}
                            >
                              {inc.zone.nom}
                            </span>
                          )}
                        </div>

                        {/* Staff impliqués */}
                        {inc.staffImpliques.length > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            {inc.staffImpliques.slice(0, 4).map(m => {
                              const initials = m.nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                              return (
                                <div
                                  key={m.id}
                                  className="w-5 h-5 rounded-[5px] flex items-center justify-center text-white font-extrabold text-[8px]"
                                  style={{ background: m.avatarColor }}
                                  title={m.nom}
                                >
                                  {initials}
                                </div>
                              )
                            })}
                            {inc.staffImpliques.length > 4 && (
                              <span className={ty.metaSm}>+{inc.staffImpliques.length - 4}</span>
                            )}
                          </div>
                        )}

                        {/* Meta */}
                        {inc.creePar && (
                          <p className={ty.metaSm}>
                            Signalé par {inc.creePar.nom} {timeAgo}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/50">
                      <button
                        onClick={() => handleView(inc)}
                        className="flex-1 py-1.5 rounded-[8px] bg-surface2 text-[11px] font-semibold text-muted hover:text-text transition-colors border border-border"
                      >
                        👁 Voir
                      </button>
                      <button
                        onClick={() => handleEdit(inc)}
                        className="flex-1 py-1.5 rounded-[8px] bg-surface2 text-[11px] font-semibold text-muted hover:text-text transition-colors border border-border"
                      >
                        ✏️ Modifier
                      </button>
                      {inc.statut !== 'RESOLU' && (
                        <button
                          onClick={() => handleClose(inc.id)}
                          className="flex-1 py-1.5 rounded-[8px] bg-green/10 text-[11px] font-semibold text-green hover:bg-green/20 transition-colors border border-green/20"
                        >
                          ✓ Clôturer
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {/* Modales */}
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
        staff={allStaff}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </>
  )
}
