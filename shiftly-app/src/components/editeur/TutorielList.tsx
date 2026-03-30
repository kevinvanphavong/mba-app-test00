'use client'

import TutorielItem        from './TutorielItem'
import type { EditorTutoriel } from '@/types/editeur'

interface Props {
  tutoriels: EditorTutoriel[]
  onEdit:    (t: EditorTutoriel) => void
  onDelete:  (t: EditorTutoriel) => void
  onAdd:     () => void
}

export default function TutorielList({ tutoriels, onEdit, onDelete, onAdd }: Props) {
  if (tutoriels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <span className="text-4xl mb-3">📚</span>
        <p className="text-[14px] font-bold text-text mb-1">Aucun tutoriel</p>
        <p className="text-[12px] text-muted mb-4">Créez votre premier tutoriel pour l'équipe.</p>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-[10px] bg-accent/10 border border-accent/30 text-accent text-[12px] font-semibold"
        >
          + Nouveau tutoriel
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tutoriels.map(t => (
        <TutorielItem key={t.id} tutoriel={t} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
