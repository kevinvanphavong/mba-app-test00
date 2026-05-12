'use client'

import { useMissionCategories } from '@/hooks/useMissionCategories'
import type { EditorMission } from '@/types/editeur'

const PRIORITY_DOT: Record<string, string> = {
  vitale:         'bg-red',
  important:      'bg-yellow',
  ne_pas_oublier: 'bg-muted',
}

interface Props {
  mission:     EditorMission
  isDragOver:  boolean
  onEdit:      () => void
  onMove:      () => void
  onDragStart: () => void
  onDragEnter: () => void
  onDragOver:  (e: React.DragEvent) => void
  onDrop:      (e: React.DragEvent) => void
  onDragEnd:   () => void
}

export default function MissionItem({
  mission,
  isDragOver,
  onEdit,
  onMove,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const { data: categories = [] } = useMissionCategories()
  const cat = categories.find(c => c.nom === mission.categorie)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 px-3 py-[10px] rounded-[12px] border mb-1.5 transition-all duration-150 ${
        isDragOver
          ? 'border-accent/40 bg-accent/5 scale-[1.01]'
          : 'bg-surface border-border'
      }`}
    >
      {/* poignée de déplacement */}
      <span className="text-border text-[14px] cursor-grab select-none flex-shrink-0">⠿</span>

      {/* point de priorité */}
      <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${PRIORITY_DOT[mission.priorite] ?? 'bg-muted'}`}></span>

      {/* texte */}
      <span className="flex-1 text-[12px] font-medium">{mission.texte}</span>

      {/* badge de catégorie — couleur dynamique depuis MissionCategorie */}
      {cat ? (
        <span
          className="text-[9px] font-bold px-1.5 py-[2px] rounded-[5px] flex-shrink-0 inline-flex items-center gap-1"
          style={{ color: cat.couleur, background: `${cat.couleur}1a` }}
        >
          {cat.icone && <span>{cat.icone}</span>}
          {cat.nom}
        </span>
      ) : (
        <span className="text-[9px] font-bold px-1.5 py-[2px] rounded-[5px] flex-shrink-0 bg-surface2 text-muted">
          {mission.categorie}
        </span>
      )}

      {/* actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-[8px] border border-border bg-transparent flex items-center justify-center text-[13px] text-muted hover:border-accent hover:text-accent transition-all"
        >
          ✏️
        </button>
        <button
          onClick={onMove}
          className="w-7 h-7 rounded-[8px] border border-border bg-transparent flex items-center justify-center text-[12px] text-muted hover:border-accent hover:text-accent transition-all"
        >
          ↔️
        </button>
      </div>
    </div>
  )
}
