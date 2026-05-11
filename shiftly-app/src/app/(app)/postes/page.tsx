'use client'

import { useState }       from 'react'
import { motion }         from 'framer-motion'
import { fadeUpVariants } from '@/lib/animations'
import { ty }             from '@/lib/typography'
import { useZones }       from '@/hooks/useZones'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  useCreateEditeurMission, useUpdateEditeurMission, useDeleteEditeurMission,
  useCreateCompetence, useUpdateCompetence, useDeleteCompetence,
  useEditeurMissions,
} from '@/hooks/useEditeur'
import Topbar             from '@/components/layout/Topbar'
import PosteCard          from '@/components/postes/PosteCard'
import PostesDesktopView  from '@/components/postes/PostesDesktopView'
import ModalAddMission    from '@/components/editeur/ModalAddMission'
import ModalAddCompetence from '@/components/editeur/ModalAddCompetence'
import ModalConfirmDelete from '@/components/editeur/ModalConfirmDelete'
import type { Zone } from '@/types/index'
import type {
  EditorMission, EditorCompetence,
  MissionFormData, MissionCategorie, CompetenceFormData,
} from '@/types/editeur'

// ─── Page Postes — gestion zones / missions / compétences (manager) ──────────
// Manager : édition complète. Employé : lecture (sans menu actions).

export default function PostesPage() {
  const { user } = useCurrentUser()
  const isManager = user?.role === 'MANAGER'

  const { data: zones = [], isLoading, isError } = useZones()

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const activeZone = selectedZone ?? zones[0] ?? null

  // ── Modales ───────────────────────────────────────────────────────────────
  const [showAddMission, setShowAddMission] = useState(false)
  const [editMission,    setEditMission]    = useState<EditorMission | null>(null)
  const [presetCategory, setPresetCategory] = useState<MissionCategorie | null>(null)

  const [showAddComp, setShowAddComp] = useState(false)
  const [editComp,    setEditComp]    = useState<EditorCompetence | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<
    | { type: 'mission';    item: EditorMission }
    | { type: 'competence'; item: EditorCompetence }
    | null
  >(null)

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMission = useCreateEditeurMission()
  const updateMission = useUpdateEditeurMission()
  const deleteMission = useDeleteEditeurMission()
  const createComp    = useCreateCompetence()
  const updateComp    = useUpdateCompetence()
  const deleteComp    = useDeleteCompetence()

  // Liste actuelle des missions de la zone active (pour calculer l'ordre à la création)
  const { data: zoneMissions = [] } = useEditeurMissions(activeZone?.id)

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openAddMission(cat?: MissionCategorie) {
    setEditMission(null)
    setPresetCategory(cat ?? null)
    setShowAddMission(true)
  }
  function openEditMission(m: EditorMission) {
    setEditMission(m)
    setPresetCategory(null)
    setShowAddMission(true)
  }

  function handleSaveMission(data: MissionFormData) {
    if (editMission) {
      updateMission.mutate({ id: editMission.id, ...data })
    } else {
      const sameCat = zoneMissions.filter(m => m.categorie === data.categorie).length
      createMission.mutate({ ...data, ordre: sameCat })
    }
    setShowAddMission(false); setEditMission(null); setPresetCategory(null)
  }

  function handleSaveCompetence(data: CompetenceFormData) {
    if (editComp) updateComp.mutate({ id: editComp.id, ...data })
    else          createComp.mutate(data)
    setShowAddComp(false); setEditComp(null)
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return
    if (confirmDelete.type === 'mission')   deleteMission.mutate(confirmDelete.item.id)
    if (confirmDelete.type === 'competence') deleteComp.mutate(confirmDelete.item.id)
    setConfirmDelete(null)
  }

  // ── Rendus auxiliaires ────────────────────────────────────────────────────
  const subtitle = [
    user?.centre?.nom,
    `${zones.length} zone${zones.length > 1 ? 's' : ''}`,
  ].filter(Boolean).join(' · ')

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar title="Postes" subtitle={subtitle} />

      <div className="pt-6 px-4 pb-28 desktop:px-7 desktop:pb-10 desktop:max-w-[1400px] desktop:mx-auto space-y-4">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-surface animate-pulse" />)}
          </div>
        )}

        {/* Erreur */}
        {isError && (
          <div className="py-10 text-center">
            <p className={`${ty.cardTitleMd} text-red font-semibold`}>Impossible de charger les postes.</p>
            <p className={`${ty.metaLg} mt-1`}>Vérifie ta connexion ou contacte un manager.</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && zones.length === 0 && (
          <div className="py-14 text-center">
            <span className="text-4xl mb-3 block">🗂️</span>
            <p className={`${ty.cardTitleMd} font-bold mb-1`}>Aucun poste configuré</p>
            <p className={ty.metaLg}>Les zones seront ajoutées par un manager.</p>
          </div>
        )}

        {/* Contenu principal */}
        {!isLoading && !isError && activeZone && (
          <>
            {/* ── Vue mobile/tablette : pills + PosteCard empilé ─────────── */}
            <div className="desktop:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-4">
                {zones.map(zone => {
                  const isActive = activeZone.id === zone.id
                  return (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                 text-[12px] font-semibold transition-all border"
                      style={{
                        background:   isActive ? `${zone.couleur}22` : 'transparent',
                        borderColor:  isActive ? zone.couleur ?? 'var(--border)' : 'var(--border)',
                        color:        isActive ? zone.couleur ?? 'var(--text)' : 'var(--muted)',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: zone.couleur ?? 'var(--muted)' }}
                      />
                      {zone.nom}
                    </button>
                  )
                })}
              </div>

              <PosteCard
                zone={activeZone}
                manager={isManager}
                onAddMission={openAddMission}
                onEditMission={openEditMission}
                onDeleteMission={(m) => setConfirmDelete({ type: 'mission', item: m })}
                onAddCompetence={() => { setEditComp(null); setShowAddComp(true) }}
                onEditCompetence={(c) => { setEditComp(c); setShowAddComp(true) }}
                onDeleteCompetence={(c) => setConfirmDelete({ type: 'competence', item: c })}
              />
            </div>

            {/* ── Vue desktop : carousel + plateau 4 colonnes ────────────── */}
            {/* Visible pour tous : manager (CRUD) + employé (lecture seule). */}
            <PostesDesktopView
              zones={zones}
              activeZone={activeZone}
              manager={isManager}
              onSelectZone={setSelectedZone}
              onAddMission={isManager ? openAddMission : undefined}
              onEditMission={isManager ? openEditMission : undefined}
              onDeleteMission={isManager ? (m) => setConfirmDelete({ type: 'mission', item: m }) : undefined}
              onAddCompetence={isManager ? () => { setEditComp(null); setShowAddComp(true) } : undefined}
              onEditCompetence={isManager ? (c) => { setEditComp(c); setShowAddComp(true) } : undefined}
              onDeleteCompetence={isManager ? (c) => setConfirmDelete({ type: 'competence', item: c }) : undefined}
            />
          </>
        )}

        {/* ── Modales ──────────────────────────────────────────────────────── */}
        {activeZone && (
          <>
            <ModalAddMission
              open={showAddMission}
              editMission={editMission}
              defaultCategorie={presetCategory ?? undefined}
              zone={{
                id:       activeZone.id,
                nom:      activeZone.nom,
                couleur:  activeZone.couleur ?? '#6b7280',
                ordre:    activeZone.ordre,
              }}
              onClose={() => { setShowAddMission(false); setEditMission(null); setPresetCategory(null) }}
              onSave={handleSaveMission}
            />

            <ModalAddCompetence
              open={showAddComp}
              editCompetence={editComp}
              zone={{
                id:       activeZone.id,
                nom:      activeZone.nom,
                couleur:  activeZone.couleur ?? '#6b7280',
                ordre:    activeZone.ordre,
              }}
              onClose={() => { setShowAddComp(false); setEditComp(null) }}
              onSave={handleSaveCompetence}
            />

            <ModalConfirmDelete
              open={confirmDelete !== null}
              type={confirmDelete?.type ?? 'mission'}
              nom={
                confirmDelete?.type === 'mission'    ? confirmDelete.item.texte :
                confirmDelete?.type === 'competence' ? confirmDelete.item.nom :
                ''
              }
              onClose={() => setConfirmDelete(null)}
              onConfirm={handleConfirmDelete}
            />
          </>
        )}
      </div>
    </motion.div>
  )
}
