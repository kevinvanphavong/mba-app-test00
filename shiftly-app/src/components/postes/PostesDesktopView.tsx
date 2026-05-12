'use client'

/**
 * PostesDesktopView — Vue carousel + MissionsBoard 4 cats.
 *
 * Active dès **tablet** (≥ 500px) malgré son nom (conservé pour stabilité des
 * imports). MissionsBoard rend 2 colonnes en tablet (2×2), 4 colonnes en
 * desktop (1 ligne).
 */

import { useMemo, useState } from 'react'
import ZoneTabsCarousel from './ZoneTabsCarousel'
import MissionsBoard    from './MissionsBoard'
import CompetencesPanel from './CompetencesPanel'
import {
  useEditeurMissions, useEditeurCompetences,
  useUpdateEditeurMission, useEditeurZones,
} from '@/hooks/useEditeur'
import type { Zone } from '@/types/index'
import type { EditorMission, EditorCompetence, MissionCategorie } from '@/types/editeur'

// ─── Vue desktop ≥ lg : carousel zones + plateau 4 colonnes + compétences ────

interface Props {
  zones:        Zone[]
  activeZone:   Zone
  /** Si false : vue lecture seule (employé) — pas de boutons CRUD ni menus ⋯ */
  manager:      boolean
  onSelectZone: (z: Zone) => void
  /** Callbacks remontés à la page pour ouvrir les modales unifiées (manager seulement) */
  onAddMission?:    (cat?: MissionCategorie) => void
  onEditMission?:   (m: EditorMission) => void
  onDeleteMission?: (m: EditorMission) => void
  onAddCompetence?:    () => void
  onEditCompetence?:   (c: EditorCompetence) => void
  onDeleteCompetence?: (c: EditorCompetence) => void
}

export default function PostesDesktopView({
  zones, activeZone, manager, onSelectZone,
  onAddMission, onEditMission, onDeleteMission,
  onAddCompetence, onEditCompetence, onDeleteCompetence,
}: Props) {

  const [reorderMode, setReorderMode] = useState(false)

  const { data: missions    = [], isLoading: lm, isError: em } = useEditeurMissions(activeZone.id)
  const { data: competences = [], isLoading: lc, isError: ec } = useEditeurCompetences(activeZone.id)
  const { data: editorZones = [] } = useEditeurZones()
  const updateMission = useUpdateEditeurMission()

  // ─── Compteurs par zone (utilisés par le carousel) ─────────────────────────
  // /api/editeur/zones renvoie déjà missionCount + competenceCount agrégés
  // côté serveur — pas besoin d'un round-trip par zone. La zone active est
  // surchargée avec la longueur réelle des listes pour rester en phase avec
  // les créations/suppressions optimistes.
  const counters = useMemo(() => {
    const out: Record<number, { missions: number; competences: number }> = {}
    zones.forEach(z => {
      const ez = editorZones.find(e => e.id === z.id)
      out[z.id] = z.id === activeZone.id
        ? { missions: missions.length, competences: competences.length }
        : { missions: ez?.missionCount ?? 0, competences: ez?.competenceCount ?? 0 }
    })
    return out
  }, [zones, editorZones, activeZone.id, missions.length, competences.length])

  const totalTasks = missions.length
  const color = activeZone.couleur ?? 'var(--accent)'

  // ─── Persister l'ordre après drop : envoie un PUT par mission qui a bougé ──
  function handleReorder(next: EditorMission[]) {
    const original = new Map(missions.map(m => [m.id, m.ordre]))
    next.forEach(m => {
      if (original.get(m.id) !== m.ordre) {
        updateMission.mutate({ id: m.id, ordre: m.ordre })
      }
    })
  }

  return (
    <div className="hidden tablet:flex flex-col gap-4">
      {/* Carousel zones */}
      <ZoneTabsCarousel
        zones={zones}
        activeZoneId={activeZone.id}
        counters={counters}
        onSelect={onSelectZone}
      />

      {/* Panel missions */}
      <div className="bg-surface border border-border rounded-[14px] overflow-hidden shadow-card">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
          <span className="w-3.5 h-3.5 rounded-[4px]" style={{ background: color }} />
          <div className="flex-1">
            <div className="font-syne font-extrabold text-[16px] text-text">
              {activeZone.nom} · {totalTasks} tâche{totalTasks > 1 ? 's' : ''}
            </div>
            <div className="text-[11px] text-muted">Plateau d'organisation des missions par moment du service</div>
          </div>
          {manager && (
            <>
              <button
                onClick={() => setReorderMode(v => !v)}
                className={`px-3 py-1.5 rounded-[9px] border text-[11px] font-semibold transition-colors ${
                  reorderMode
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface2 text-text hover:border-accent/40'
                }`}
              >
                {reorderMode ? '✓ Terminer' : '↻ Réordonner'}
              </button>
              <button
                onClick={() => onAddMission?.()}
                className="px-3 py-1.5 rounded-[9px] bg-accent text-white text-[11px] font-syne font-bold"
              >
                + Ajouter tâche
              </button>
            </>
          )}
        </div>

        {/* États loading / error / empty */}
        {lm && (
          <div className="p-4 grid grid-cols-4 gap-3">
            {[0,1,2,3].map(i => <div key={i} className="h-24 rounded bg-surface2 animate-pulse" />)}
          </div>
        )}
        {!lm && em && <p className="p-6 text-[13px] text-red text-center">Impossible de charger les missions.</p>}
        {!lm && !em && (
          <MissionsBoard
            missions={missions}
            manager={manager}
            reorderMode={reorderMode && manager}
            onEdit={onEditMission}
            onDelete={onDeleteMission}
            onAddInCat={onAddMission}
            onReorder={handleReorder}
          />
        )}
      </div>

      {/* Panel compétences */}
      <CompetencesPanel
        zone={activeZone}
        competences={competences}
        manager={manager}
        loading={lc}
        error={ec}
        onAdd={onAddCompetence}
        onEdit={onEditCompetence}
        onDelete={onDeleteCompetence}
      />
    </div>
  )
}
