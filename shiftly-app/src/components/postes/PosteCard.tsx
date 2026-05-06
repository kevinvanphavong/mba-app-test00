'use client'

import { useRouter } from 'next/navigation'
import { ty } from '@/lib/typography'
import { useEditeurMissions, useEditeurCompetences } from '@/hooks/useEditeur'
import MissionRow    from './MissionRow'
import CompetenceRow from './CompetenceRow'
import type { Zone } from '@/types/index'
import type { EditorMission, EditorCompetence, MissionCategorie } from '@/types/editeur'

// ─── Fiche de poste d'une zone — vue mobile/tablette ──────────────────────────
// Manager : callbacks fournis → boutons + Mission, + Compétence et menu ⋯
// Employé : callbacks absents → lecture seule

interface Props {
  zone:    Zone
  manager: boolean
  onAddMission?:      (cat?: MissionCategorie) => void
  onEditMission?:     (m: EditorMission) => void
  onDeleteMission?:   (m: EditorMission) => void
  onAddCompetence?:    () => void
  onEditCompetence?:   (c: EditorCompetence) => void
  onDeleteCompetence?: (c: EditorCompetence) => void
}

export default function PosteCard({
  zone, manager,
  onAddMission, onEditMission, onDeleteMission,
  onAddCompetence, onEditCompetence, onDeleteCompetence,
}: Props) {
  const router = useRouter()

  const { data: missions    = [], isLoading: lm, isError: em } = useEditeurMissions(zone.id)
  const { data: competences = [], isLoading: lc, isError: ec } = useEditeurCompetences(zone.id)

  // ─── Section générique avec états loading / error / empty ─────────────────
  function Section({
    label, action, loading, error, empty, children,
  }: {
    label:    string
    action?:  React.ReactNode
    loading:  boolean
    error:    boolean
    empty:    boolean
    children: React.ReactNode
  }) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className={ty.sectionLabel}>{label}</div>
          {action}
        </div>
        {loading && (
          <div className="flex gap-1.5 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-3 rounded bg-surface2 animate-pulse flex-1" />
            ))}
          </div>
        )}
        {!loading && error && <p className={`${ty.meta} text-red py-2`}>Erreur de chargement.</p>}
        {!loading && !error && empty && <p className={`${ty.meta} py-2`}>Aucun élément.</p>}
        {!loading && !error && !empty && children}
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-[18px] overflow-hidden">

      {/* En-tête zone */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{
          background:   `${zone.couleur}14`,
          borderBottom: `1px solid ${zone.couleur}22`,
        }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: zone.couleur ?? 'var(--muted)' }} />
        <span className={ty.kpiSm} style={{ color: zone.couleur ?? 'var(--text)' }}>
          {zone.nom}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-5">

        {/* Compétences */}
        <Section
          label="Compétences requises"
          action={manager && (
            <button
              onClick={onAddCompetence}
              className="text-[11px] font-semibold text-accent hover:underline"
            >
              + Compétence
            </button>
          )}
          loading={lc}
          error={ec}
          empty={competences.length === 0}
        >
          <div className="flex flex-col gap-2">
            {competences.map(c => (
              <CompetenceRow
                key={c.id}
                competence={c}
                onEdit={manager ? onEditCompetence : undefined}
                onDelete={manager ? onDeleteCompetence : undefined}
              />
            ))}
          </div>
        </Section>

        {/* Missions */}
        <Section
          label="Missions"
          action={manager && (
            <button
              onClick={() => onAddMission?.()}
              className="text-[11px] font-semibold text-accent hover:underline"
            >
              + Mission
            </button>
          )}
          loading={lm}
          error={em}
          empty={missions.length === 0}
        >
          <div className="flex flex-col">
            {missions.map(m => (
              <MissionRow
                key={m.id}
                mission={m}
                onEdit={manager ? onEditMission : undefined}
                onDelete={manager ? onDeleteMission : undefined}
              />
            ))}
          </div>
        </Section>

        {/* Lien tutoriels */}
        <button
          onClick={() => router.push(`/tutoriels?zone=${encodeURIComponent(zone.nom)}`)}
          className="w-full py-2.5 rounded-xl border border-border text-[12px] font-semibold text-muted
                     hover:text-text hover:border-text transition-colors text-center"
        >
          Voir les tutoriels de cette zone →
        </button>

      </div>
    </div>
  )
}
