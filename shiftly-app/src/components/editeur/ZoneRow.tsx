'use client'

import type { EditorZone } from '@/types/editeur'

interface Props {
  zone:         EditorZone
  isActive:     boolean
  isDragOver:   boolean
  onSelect:     () => void
  onEdit:       () => void
  onDelete:     () => void
  onDragStart:  () => void
  onDragEnter:  () => void
  onDragEnd:    () => void
  onDrop:       () => void
  missionCount: number
  competenceCount: number
}

export default function ZoneRow({
  zone,
  isActive,
  isDragOver,
  onSelect,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  missionCount,
  competenceCount,
}: Props) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(e) => { e.preventDefault(); onDrop() }}
      onClick={onSelect}
      className={`flex items-center gap-[10px] px-[14px] py-3 rounded-[14px] border cursor-pointer transition-all duration-150 ${
        isDragOver  ? 'border-accent/40 bg-accent/5 scale-[1.01]' :
        isActive    ? 'border-accent bg-accent/5' :
                      'bg-surface border-border hover:border-accent/20'
      }`}
    >
      {/* drag handle */}
      <span className="text-border text-[14px] cursor-grab select-none flex-shrink-0">⠿</span>

      {/* color dot */}
      <span
        className="w-3 h-3 rounded-[4px] flex-shrink-0"
        style={{ background: zone.couleur }}
      />

      {/* name */}
      <span className="font-syne text-[14px] font-semibold flex-1">{zone.nom}</span>

      {/* counts */}
      <span className="text-[11px] text-muted mr-1">
        {missionCount} missions · {competenceCount} comp.
      </span>

      {/* actions */}
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-[8px] border border-border bg-transparent flex items-center justify-center text-[13px] text-muted hover:border-accent hover:text-accent transition-all"
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-[8px] border border-border bg-transparent flex items-center justify-center text-[13px] text-muted hover:border-red hover:text-red transition-all"
        >
          🗄️
        </button>
      </div>
    </div>
  )
}
