'use client'

import type { EditorTutoriel } from '@/types/editeur'

const NIVEAU_LABELS = {
  debutant:      'Débutant',
  intermediaire: 'Intermédiaire',
  avance:        'Avancé',
}

interface Props {
  tutoriel: EditorTutoriel
  onEdit:   (t: EditorTutoriel) => void
  onDelete: (t: EditorTutoriel) => void
}

export default function TutorielItem({ tutoriel, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-surface rounded-[12px] border border-border">
      {/* Dot zone */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: tutoriel.zoneCouleur ?? '#6b7280' }}
      />

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text truncate">{tutoriel.titre}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted">{NIVEAU_LABELS[tutoriel.niveau]}</span>
          {tutoriel.dureMin && (
            <span className="text-[10px] text-muted">· {tutoriel.dureMin} min</span>
          )}
          {tutoriel.zoneName && (
            <span className="text-[10px] text-muted">· {tutoriel.zoneName}</span>
          )}
          {!tutoriel.zoneName && (
            <span className="text-[10px] text-muted">· Général</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onEdit(tutoriel)}
        className="text-[11px] text-muted hover:text-text transition-colors px-1.5"
      >
        ✏️
      </button>
      <button
        onClick={() => onDelete(tutoriel)}
        className="text-[11px] text-muted hover:text-red transition-colors px-1.5"
      >
        🗑
      </button>
    </div>
  )
}
