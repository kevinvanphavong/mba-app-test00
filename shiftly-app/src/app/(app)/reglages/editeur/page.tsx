'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type {
  EditorTab,
  EditorZone,
  EditorMission,
  EditorCompetence,
  ZoneFormData,
  MissionFormData,
  CompetenceFormData,
} from '@/types/editeur'
import api from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'

import EditorTabs         from '@/components/editeur/EditorTabs'
import ZoneList           from '@/components/editeur/ZoneList'
import MissionList        from '@/components/editeur/MissionList'
import CompetenceList     from '@/components/editeur/CompetenceList'
import ModalAddZone       from '@/components/editeur/ModalAddZone'
import ModalAddMission    from '@/components/editeur/ModalAddMission'
import ModalAddCompetence from '@/components/editeur/ModalAddCompetence'
import ModalConfirmDelete from '@/components/editeur/ModalConfirmDelete'
import ModalMoveZone      from '@/components/editeur/ModalMoveZone'

export default function EditeurPage() {
  const router = useRouter()
  const { user } = useCurrentUser()

  // ── Données ────────────────────────────────────────────────────────────────
  const [zones,       setZones]       = useState<EditorZone[]>([])
  const [missions,    setMissions]    = useState<EditorMission[]>([])
  const [competences, setCompetences] = useState<EditorCompetence[]>([])

  // ── Chargement ─────────────────────────────────────────────────────────────
  const [loadingZones,  setLoadingZones]  = useState(true)
  const [loadingData,   setLoadingData]   = useState(false)
  const [apiError,      setApiError]      = useState<string | null>(null)

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState<EditorTab>('zones')
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null)

  // ── Modaux ─────────────────────────────────────────────────────────────────
  const [showAddZone,   setShowAddZone]   = useState(false)
  const [editZone,      setEditZone]      = useState<EditorZone | null>(null)
  const [showAddMission,  setShowAddMission]  = useState(false)
  const [editMission,     setEditMission]     = useState<EditorMission | null>(null)
  const [showAddComp,   setShowAddComp]   = useState(false)
  const [editComp,      setEditComp]      = useState<EditorCompetence | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'zone' | 'mission' | 'competence'
    item: EditorZone | EditorMission | EditorCompetence
  } | null>(null)
  const [moveMission, setMoveMission] = useState<EditorMission | null>(null)

  // ── Chargement initial des zones ───────────────────────────────────────────
  const fetchZones = useCallback(async () => {
    setLoadingZones(true)
    setApiError(null)
    try {
      const res = await api.get('/editeur/zones')
      setZones(res.data)
    } catch {
      setApiError('Impossible de charger les zones.')
    } finally {
      setLoadingZones(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchZones()
  }, [user, fetchZones])

  // ── Chargement missions + compétences quand une zone est sélectionnée ──────
  const fetchZoneData = useCallback(async (zoneId: number) => {
    setLoadingData(true)
    setApiError(null)
    try {
      const [mRes, cRes] = await Promise.all([
        api.get(`/editeur/zones/${zoneId}/missions`),
        api.get(`/editeur/zones/${zoneId}/competences`),
      ])
      setMissions(prev => {
        const others = prev.filter(m => m.zoneId !== zoneId)
        return [...others, ...mRes.data]
      })
      setCompetences(prev => {
        const others = prev.filter(c => c.zoneId !== zoneId)
        return [...others, ...cRes.data]
      })
    } catch {
      setApiError('Impossible de charger les données de cette zone.')
    } finally {
      setLoadingData(false)
    }
  }, [])

  // ── Sélection de zone sans changer d'onglet (chips dans Missions / Compétences)
  const handleZoneFilter = useCallback((zoneId: number) => {
    setSelectedZoneId(zoneId)
    fetchZoneData(zoneId)
  }, [fetchZoneData])

  // Auto-sélectionne la première zone quand on arrive sur Missions ou Compétences sans zone choisie
  useEffect(() => {
    if ((activeTab === 'missions' || activeTab === 'competences') && selectedZoneId === null && zones.length > 0) {
      handleZoneFilter(zones[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, zones])

  // ── Dérivé ─────────────────────────────────────────────────────────────────
  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  )

  const zoneMissions = useMemo(
    () => selectedZoneId ? missions.filter((m) => m.zoneId === selectedZoneId) : missions,
    [missions, selectedZoneId]
  )

  const zoneCompetences = useMemo(
    () => selectedZoneId ? competences.filter((c) => c.zoneId === selectedZoneId) : competences,
    [competences, selectedZoneId]
  )

  // ── Sélection de zone → charge les données + bascule vers l'onglet missions
  function handleZoneSelect(id: number) {
    setSelectedZoneId(id)
    setActiveTab('missions')
    fetchZoneData(id)
  }

  // ── CRUD Zones ─────────────────────────────────────────────────────────────
  async function handleSaveZone(data: ZoneFormData) {
    try {
      if (editZone) {
        const res = await api.put(`/editeur/zones/${editZone.id}`, data)
        setZones(prev => prev.map(z => z.id === editZone.id ? res.data : z))
      } else {
        const res = await api.post('/editeur/zones', { ...data, ordre: zones.length })
        setZones(prev => [...prev, res.data])
      }
    } catch {
      setApiError('Impossible de sauvegarder la zone.')
    }
    setShowAddZone(false)
    setEditZone(null)
  }

  // ── CRUD Missions ──────────────────────────────────────────────────────────
  async function handleSaveMission(data: MissionFormData) {
    try {
      if (editMission) {
        const res = await api.put(`/editeur/missions/${editMission.id}`, data)
        setMissions(prev => prev.map(m => m.id === editMission.id ? res.data : m))
      } else {
        const res = await api.post('/editeur/missions', {
          ...data,
          ordre: missions.filter(m => m.zoneId === data.zoneId).length,
        })
        setMissions(prev => [...prev, res.data])
        // Mettre à jour le compteur de la zone
        setZones(prev => prev.map(z =>
          z.id === data.zoneId ? { ...z, missionCount: (z.missionCount ?? 0) + 1 } : z
        ))
      }
    } catch {
      setApiError('Impossible de sauvegarder la mission.')
    }
    setShowAddMission(false)
    setEditMission(null)
  }

  async function handleMoveMission(targetZoneId: number) {
    if (!moveMission) return
    try {
      const res = await api.put(`/editeur/missions/${moveMission.id}`, { zoneId: targetZoneId })
      setMissions(prev => prev.map(m => m.id === moveMission.id ? res.data : m))
      // Rafraîchir les deux zones concernées
      await fetchZoneData(moveMission.zoneId)
      await fetchZoneData(targetZoneId)
    } catch {
      setApiError('Impossible de déplacer la mission.')
    }
    setMoveMission(null)
  }

  // ── CRUD Compétences ───────────────────────────────────────────────────────
  async function handleSaveCompetence(data: CompetenceFormData) {
    try {
      if (editComp) {
        const res = await api.put(`/editeur/competences/${editComp.id}`, data)
        setCompetences(prev => prev.map(c => c.id === editComp.id ? res.data : c))
      } else {
        const res = await api.post('/editeur/competences', data)
        setCompetences(prev => [...prev, res.data])
      }
    } catch {
      setApiError('Impossible de sauvegarder la compétence.')
    }
    setShowAddComp(false)
    setEditComp(null)
  }

  // ── Suppression ────────────────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!confirmDelete) return
    const { type, item } = confirmDelete
    try {
      if (type === 'zone') {
        await api.delete(`/editeur/zones/${item.id}`)
        setZones(prev => prev.filter(z => z.id !== item.id))
        setMissions(prev => prev.filter(m => m.zoneId !== item.id))
        setCompetences(prev => prev.filter(c => c.zoneId !== item.id))
        if (selectedZoneId === item.id) setSelectedZoneId(null)
      } else if (type === 'mission') {
        await api.delete(`/editeur/missions/${item.id}`)
        setMissions(prev => prev.filter(m => m.id !== item.id))
        const zId = (item as EditorMission).zoneId
        setZones(prev => prev.map(z =>
          z.id === zId ? { ...z, missionCount: Math.max(0, (z.missionCount ?? 1) - 1) } : z
        ))
      } else {
        await api.delete(`/editeur/competences/${item.id}`)
        setCompetences(prev => prev.filter(c => c.id !== item.id))
      }
    } catch {
      setApiError('Impossible de supprimer cet élément.')
    }
    setConfirmDelete(null)
  }

  const confirmItem = confirmDelete?.item as (EditorZone & EditorMission & EditorCompetence) | undefined

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[390px] mx-auto px-4 pb-24 lg:max-w-2xl">
      {/* Header */}
      <div className="py-4 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-accent text-[13px] font-semibold"
        >
          ← Réglages
        </button>
        <button
          onClick={() => {
            if (activeTab === 'zones')       { setEditZone(null);    setShowAddZone(true)     }
            if (activeTab === 'missions')    { setEditMission(null); setShowAddMission(true)  }
            if (activeTab === 'competences') { setEditComp(null);    setShowAddComp(true)     }
          }}
          className="w-7 h-7 rounded-[8px] border border-border bg-transparent flex items-center justify-center text-[13px] text-muted hover:border-accent hover:text-accent transition-all"
        >
          ＋
        </button>
      </div>

      <h1 className="font-syne font-extrabold text-[20px] text-text mb-0.5">Éditeur de contenu</h1>
      <p className="text-[12px] text-muted mb-4">Gérez vos zones, missions et compétences</p>

      {apiError && (
        <p className="text-[12px] text-red font-medium mb-3 px-1">{apiError}</p>
      )}

      {/* ── Onglet Zones ──────────────────────────────────────────────────── */}
      {activeTab === 'zones' && (
        <>
          <EditorTabs active="zones" onChange={setActiveTab} />
          {loadingZones ? (
            <div className="space-y-2 animate-pulse">
              {[0,1,2].map(i => (
                <div key={i} className="h-14 bg-surface rounded-[12px] border border-border" />
              ))}
            </div>
          ) : (
            <ZoneList
              zones={zones}
              selectedId={selectedZoneId}
              onSelect={handleZoneSelect}
              onEdit={(z) => { setEditZone(z); setShowAddZone(true) }}
              onDelete={(z) => setConfirmDelete({ type: 'zone', item: z })}
              onReorder={setZones}
              onAdd={() => { setEditZone(null); setShowAddZone(true) }}
            />
          )}
        </>
      )}

      {/* ── Onglet Missions ───────────────────────────────────────────────── */}
      {activeTab === 'missions' && (
        <>
          <EditorTabs active="missions" onChange={setActiveTab} />

          {/* Chips de filtrage par zone */}
          {zones.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
              {zones.map(z => (
                <button
                  key={z.id}
                  onClick={() => handleZoneFilter(z.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                    selectedZoneId === z.id
                      ? 'border-transparent text-white'
                      : 'border-border text-muted hover:border-accent/40'
                  }`}
                  style={selectedZoneId === z.id ? { backgroundColor: z.couleur } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedZoneId === z.id ? 'rgba(255,255,255,0.7)' : z.couleur }}
                  />
                  {z.nom}
                </button>
              ))}
            </div>
          )}

          {/* Liste de missions */}
          {loadingData || loadingZones ? (
            <div className="space-y-2 animate-pulse">
              {[0,1,2].map(i => (
                <div key={i} className="h-12 bg-surface rounded-[12px] border border-border" />
              ))}
            </div>
          ) : selectedZone ? (
            <MissionList
              missions={zoneMissions}
              zoneName={selectedZone.nom}
              zoneColor={selectedZone.couleur}
              onEdit={(m) => { setEditMission(m); setShowAddMission(true) }}
              onMove={(m) => setMoveMission(m)}
              onReorder={(reordered) =>
                setMissions(prev => {
                  const others = prev.filter(m => m.zoneId !== selectedZoneId)
                  return [...others, ...reordered]
                })
              }
              onAdd={() => { setEditMission(null); setShowAddMission(true) }}
              onBack={() => setActiveTab('zones')}
            />
          ) : (
            <div className="text-center py-12 text-muted text-[13px]">
              Aucune zone disponible — créez-en une depuis l'onglet Zones.
            </div>
          )}
        </>
      )}

      {/* ── Onglet Compétences ────────────────────────────────────────────── */}
      {activeTab === 'competences' && (
        <>
          <EditorTabs active="competences" onChange={setActiveTab} />

          {/* Chips de filtrage par zone */}
          {zones.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
              {zones.map(z => (
                <button
                  key={z.id}
                  onClick={() => handleZoneFilter(z.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                    selectedZoneId === z.id
                      ? 'border-transparent text-white'
                      : 'border-border text-muted hover:border-accent/40'
                  }`}
                  style={selectedZoneId === z.id ? { backgroundColor: z.couleur } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedZoneId === z.id ? 'rgba(255,255,255,0.7)' : z.couleur }}
                  />
                  {z.nom}
                </button>
              ))}
            </div>
          )}

          {/* Liste de compétences */}
          {loadingData || loadingZones ? (
            <div className="space-y-2 animate-pulse">
              {[0,1,2].map(i => (
                <div key={i} className="h-12 bg-surface rounded-[12px] border border-border" />
              ))}
            </div>
          ) : selectedZone ? (
            <CompetenceList
              competences={zoneCompetences}
              zone={selectedZone}
              onEdit={(c) => { setEditComp(c); setShowAddComp(true) }}
              onDelete={(c) => setConfirmDelete({ type: 'competence', item: c })}
              onAdd={() => { setEditComp(null); setShowAddComp(true) }}
            />
          ) : (
            <div className="text-center py-12 text-muted text-[13px]">
              Aucune zone disponible — créez-en une depuis l'onglet Zones.
            </div>
          )}
        </>
      )}

      {/* ── Modaux ────────────────────────────────────────────────────────── */}
      <ModalAddZone
        open={showAddZone}
        editZone={editZone}
        zones={zones}
        onClose={() => { setShowAddZone(false); setEditZone(null) }}
        onSave={handleSaveZone}
      />

      <ModalAddMission
        open={showAddMission}
        editMission={editMission}
        zone={selectedZone ?? zones[0]}
        onClose={() => { setShowAddMission(false); setEditMission(null) }}
        onSave={handleSaveMission}
      />

      <ModalAddCompetence
        open={showAddComp}
        editCompetence={editComp}
        zone={selectedZone ?? zones[0]}
        onClose={() => { setShowAddComp(false); setEditComp(null) }}
        onSave={handleSaveCompetence}
      />

      <ModalConfirmDelete
        open={confirmDelete !== null}
        type={confirmDelete?.type ?? 'zone'}
        nom={confirmItem?.nom ?? confirmItem?.texte ?? ''}
        missionCount={
          confirmDelete?.type === 'zone'
            ? missions.filter(m => m.zoneId === confirmItem?.id).length
            : undefined
        }
        competenceCount={
          confirmDelete?.type === 'zone'
            ? competences.filter(c => c.zoneId === confirmItem?.id).length
            : undefined
        }
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <ModalMoveZone
        open={moveMission !== null}
        mission={moveMission}
        zones={zones}
        onClose={() => setMoveMission(null)}
        onMove={handleMoveMission}
      />
    </div>
  )
}
