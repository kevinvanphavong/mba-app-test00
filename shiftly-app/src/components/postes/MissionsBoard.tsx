'use client'

import { useMemo } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import MissionTile from './MissionTile'
import type { EditorMission, MissionCategorie } from '@/types/editeur'

// ─── Plateau missions desktop : 4 colonnes par catégorie ──────────────────────

const COLUMNS: { key: MissionCategorie; label: string; icon: string }[] = [
  { key: 'OUVERTURE', label: 'Ouverture',          icon: '🔓' },
  { key: 'PENDANT',   label: 'Pendant le service', icon: '⚡' },
  { key: 'MENAGE',    label: 'Ménage',             icon: '🧽' },
  { key: 'FERMETURE', label: 'Fermeture',          icon: '🔒' },
]

interface Props {
  missions:     EditorMission[]
  reorderMode:  boolean
  onEdit:       (m: EditorMission) => void
  onDelete:     (m: EditorMission) => void
  onAddInCat:   (cat: MissionCategorie) => void
  /** Persiste l'ordre après drop : reçoit la liste complète des missions de la zone réordonnées. */
  onReorder:    (next: EditorMission[]) => void
}

export default function MissionsBoard({
  missions, reorderMode, onEdit, onDelete, onAddInCat, onReorder,
}: Props) {

  // Regroupe par catégorie en respectant l'ordre `ordre` croissant
  const grouped = useMemo(() => {
    const out = {} as Record<MissionCategorie, EditorMission[]>
    COLUMNS.forEach(c => { out[c.key] = [] })
    missions
      .slice()
      .sort((a, b) => a.ordre - b.ordre)
      .forEach(m => { out[m.categorie]?.push(m) })
    return out
  }, [missions])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  // ─── Drop : reorder intra-colonne uniquement ───────────────────────────────
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return

    // Trouve la colonne où active et over se trouvent
    const cat = (Object.keys(grouped) as MissionCategorie[]).find(k =>
      grouped[k].some(m => m.id === active.id) && grouped[k].some(m => m.id === over.id)
    )
    if (!cat) return // drag inter-colonne ignoré

    const list   = grouped[cat]
    const oldIdx = list.findIndex(m => m.id === active.id)
    const newIdx = list.findIndex(m => m.id === over.id)
    const moved  = arrayMove(list, oldIdx, newIdx).map((m, i) => ({ ...m, ordre: i }))

    // Reconstruit la liste complète : autres catégories + colonne modifiée
    const others = missions.filter(m => m.categorie !== cat)
    onReorder([...others, ...moved])
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-0">
        {COLUMNS.map((col, i) => {
          const items = grouped[col.key]
          return (
            <div
              key={col.key}
              className="p-4 flex flex-col gap-2"
              style={{ borderRight: i < COLUMNS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="font-syne text-[11px] font-bold uppercase tracking-[1.2px] text-muted mb-1">
                {col.icon} {col.label} · {items.length}
              </div>

              {items.length === 0 && (
                <p className="text-[11px] text-muted italic py-1">Aucune mission.</p>
              )}

              <SortableContext items={items.map(m => m.id)} strategy={verticalListSortingStrategy}>
                {items.map((m, idx) => (
                  <MissionTile
                    key={m.id}
                    mission={m}
                    index={idx}
                    reorderMode={reorderMode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>

              <button
                onClick={() => onAddInCat(col.key)}
                className="mt-1 py-2 rounded-[9px] border border-dashed border-border bg-transparent text-muted text-[11px] font-semibold hover:border-accent hover:text-accent transition-colors"
              >
                + Mission
              </button>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}
