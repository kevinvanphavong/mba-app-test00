'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { EditorMission } from '@/types/editeur'

// ─── Tile mission (colonne par catégorie, vue desktop) ────────────────────────

const PRIO_LABEL: Record<EditorMission['priorite'], { label: string; cls: string }> = {
  vitale:         { label: 'Vitale',  cls: 'border-red/30 text-red bg-red/10'             },
  important:      { label: 'Import.', cls: 'border-accent/30 text-accent bg-accent/10'    },
  ne_pas_oublier: { label: 'À retenir', cls: 'border-border text-muted bg-surface'        },
}

interface Props {
  mission:     EditorMission
  index:       number
  reorderMode: boolean
  onEdit:      (m: EditorMission) => void
  onDelete:    (m: EditorMission) => void
}

export default function MissionTile({ mission, index, reorderMode, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // ─── Click outside pour fermer le menu ─────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // ─── DnD-Kit sortable (actif uniquement en mode réordonnancement) ─────────
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mission.id,
    disabled: !reorderMode,
  })

  const style: React.CSSProperties = {
    transform:  CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity:    isDragging ? 0.4 : 1,
    cursor:     reorderMode ? 'grab' : 'default',
  }

  const prio = PRIO_LABEL[mission.priorite]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(reorderMode ? attributes : {})}
      {...(reorderMode ? listeners : {})}
      className="flex items-center gap-2.5 px-3 py-2.5 bg-surface2 border border-border rounded-[9px]"
    >
      <span className="font-syne font-bold text-[10px] text-muted w-[18px] flex-shrink-0">{index + 1}.</span>

      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-text leading-snug">{mission.texte}</div>
        {(mission.frequence === 'PONCTUELLE' || mission.requiresPhoto) && (
          <div className="flex gap-1 mt-1">
            {mission.frequence === 'PONCTUELLE' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] text-accent bg-accent/10">
                Ponctuelle
              </span>
            )}
            {mission.requiresPhoto && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] text-accent bg-accent/10">
                📷 Photo
              </span>
            )}
          </div>
        )}
      </div>

      <span className={`text-[10px] font-bold uppercase tracking-[0.3px] px-2 py-0.5 rounded-[6px] border ${prio.cls} flex-shrink-0`}>
        {prio.label}
      </span>

      {!reorderMode && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            className="text-muted hover:text-text text-[14px] px-1 leading-none"
            aria-label="Actions"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-[10px] shadow-card overflow-hidden min-w-[140px]">
              <button
                onClick={() => { setMenuOpen(false); onEdit(mission) }}
                className="block w-full text-left px-3 py-2 text-[12px] text-text hover:bg-surface2"
              >
                Modifier
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(mission) }}
                className="block w-full text-left px-3 py-2 text-[12px] text-red hover:bg-red/10"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
