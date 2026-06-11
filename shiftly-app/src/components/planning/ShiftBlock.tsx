'use client'

import { useDraggable } from '@dnd-kit/core'
import type { PlanningShift } from '@/types/planning'
import { hexAlpha } from '@/lib/colors'

interface ShiftBlockProps {
  shift:   PlanningShift
  onClick: (shift: PlanningShift) => void
}

/** Bloc coloré représentant un shift — draggable */
export default function ShiftBlock({ shift, onClick }: ShiftBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   `shift-${shift.posteId}`,
    data: { type: 'shift', shift },
  })

  const couleur = shift.zoneCouleur
  const heures  = shift.heureDebut && shift.heureFin
    ? `${shift.heureDebut} – ${shift.heureFin}`
    : '—'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={e => { e.stopPropagation(); onClick(shift) }}
      onKeyDown={e => e.key === 'Enter' && onClick(shift)}
      className="relative mb-1 cursor-grab rounded-md px-2 py-1.5 text-xs transition-all active:cursor-grabbing focus:outline-none"
      style={{
        backgroundColor: hexAlpha(couleur, 0.12),
        borderLeft:      `3px solid ${couleur}`,
        color:           couleur,
        opacity:         isDragging ? 0.35 : 1,
        transform:       isDragging ? 'none' : undefined,
      }}
    >
      <p className="truncate font-bold leading-tight">{heures}</p>
      <p className="mt-0.5 truncate text-[10px] leading-tight opacity-80">{shift.zoneNom}</p>
      {shift.pauseMinutes > 0 && (
        <p className="mt-0.5 text-[9px] opacity-60">{shift.pauseMinutes}min pause</p>
      )}
      {shift.note && (
        <span className="absolute top-1 right-1 text-[10px] opacity-70" title={shift.note}>📝</span>
      )}
    </div>
  )
}
