'use client'

import type { EditorCompetence, EditorZone } from '@/types/editeur'
import CompetenceItem from './CompetenceItem'

interface Props {
  competences: EditorCompetence[]
  zone:        EditorZone
  onEdit:      (c: EditorCompetence) => void
  onDelete:    (c: EditorCompetence) => void
  onAdd:       () => void
}

export default function CompetenceList({
  competences,
  zone,
  onEdit,
  onDelete,
  onAdd,
}: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className="w-[14px] h-[14px] rounded-[5px] flex-shrink-0"
          style={{ background: zone.couleur }}
        />
        <h2 className="font-syne font-extrabold text-[18px]">{zone.nom} — Compétences</h2>
      </div>
      <p className="text-[12px] text-muted mb-4">
        {competences.length} compétence{competences.length > 1 ? 's' : ''}
      </p>

      {competences.length === 0 ? (
        <div className="text-center py-8 text-muted text-[13px]">Aucune compétence dans cette zone</div>
      ) : (
        competences.map((c) => (
          <CompetenceItem
            key={c.id}
            competence={c}
            onEdit={() => onEdit(c)}
            onDelete={() => onDelete(c)}
          />
        ))
      )}

      <button
        onClick={onAdd}
        className="w-full py-[11px] rounded-[12px] border border-dashed border-border bg-transparent text-muted text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:border-accent hover:text-accent transition-all mt-1"
      >
        + Ajouter une compétence
      </button>
    </div>
  )
}
