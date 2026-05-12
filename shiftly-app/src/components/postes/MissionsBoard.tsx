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
import { useMissionCategories } from '@/hooks/useMissionCategories'
import type { EditorMission, MissionCategorie } from '@/types/editeur'

// ─── Plateau missions : colonnes par catégorie ────────────────────────────────
// Colonnes dérivées dynamiquement des MissionCategorie du centre.
// L'ordre suit le champ `ordre` administrable ; les "missions orphelines"
// (slug `categorie` qui n'existe plus dans le catalogue) tombent dans une
// colonne "Sans catégorie" en fin de plateau.

interface Props {
  missions:     EditorMission[]
  /** Si false : pas de menu ⋯ ni bouton « + Mission » (vue employé). */
  manager:      boolean
  reorderMode:  boolean
  onEdit?:      (m: EditorMission) => void
  onDelete?:    (m: EditorMission) => void
  onAddInCat?:  (cat: MissionCategorie) => void
  /** Persiste l'ordre après drop : reçoit la liste complète des missions de la zone réordonnées. */
  onReorder?:   (next: EditorMission[]) => void
}

export default function MissionsBoard({
  missions, manager, reorderMode, onEdit, onDelete, onAddInCat, onReorder,
}: Props) {

  const { data: categories = [] } = useMissionCategories()

  // Construit la liste de colonnes : toutes les catégories triées par `ordre`,
  // + une éventuelle colonne "Sans catégorie" si des missions ont un slug
  // qui n'existe plus dans le catalogue (catégorie supprimée par le manager).
  const columns = useMemo(() => {
    const knownKeys = new Set(categories.map(c => c.nom))
    const orphanKeys = Array.from(new Set(
      missions.map(m => m.categorie).filter(k => !knownKeys.has(k)),
    ))
    const cols: { key: string; label: string; icon: string | null; couleur: string | null }[] =
      categories.map(c => ({
        key:     c.nom,
        label:   c.nom,
        icon:    c.icone,
        couleur: c.couleur,
      }))
    orphanKeys.forEach(k => cols.push({ key: k, label: `${k} (orphelin)`, icon: null, couleur: null }))
    return cols
  }, [categories, missions])

  // Regroupe par catégorie puis trie par `ordre` à l'intérieur de chaque colonne.
  // Important : NE PAS trier globalement avant de grouper, car on remappe
  // `ordre` à 0..n par colonne au drop — un tri global créerait des collisions
  // entre catégories qui feraient sauter l'ordre au refresh.
  const grouped = useMemo(() => {
    const out: Record<string, EditorMission[]> = {}
    columns.forEach(c => { out[c.key] = [] })
    missions.forEach(m => {
      if (!out[m.categorie]) out[m.categorie] = []
      out[m.categorie].push(m)
    })
    Object.values(out).forEach(list => list.sort((a, b) => a.ordre - b.ordre))
    return out
  }, [missions, columns])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  // ─── Drop : reorder intra-colonne uniquement ───────────────────────────────
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return

    // Trouve la colonne où active et over se trouvent
    const cat = Object.keys(grouped).find(k =>
      grouped[k].some(m => m.id === active.id) && grouped[k].some(m => m.id === over.id)
    )
    if (!cat) return // drag inter-colonne ignoré

    const list   = grouped[cat]
    const oldIdx = list.findIndex(m => m.id === active.id)
    const newIdx = list.findIndex(m => m.id === over.id)
    const moved  = arrayMove(list, oldIdx, newIdx).map((m, i) => ({ ...m, ordre: i }))

    // Reconstruit la liste complète : autres catégories + colonne modifiée
    const others = missions.filter(m => m.categorie !== cat)
    onReorder?.([...others, ...moved])
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {/* Grille catégories : 2 cols jusqu'à 1400px (grid 2×2), 4 cols ≥ 1400px (1 ligne).
          Le breakpoint custom `wide` (1400px) est défini dans tailwind.config.ts —
          en-dessous, 4 colonnes côte-à-côte sont trop serrées pour rester lisibles.
          Bordures via arbitrary selectors Tailwind :
            - < wide (4 items en grid 2×2) : border-r partout sauf cols pairs (right edge),
              border-b partout sauf les 2 derniers (bottom row)
            - ≥ wide (1 ligne) : reset border-b, restaure border-r sur col 2, retire sur le 4e */}
      {/* Grille : 2 cols < 1400px, 4 cols ≥ 1400px. Si > 4 catégories le wide:
          wrap sur 2 lignes. Bordures simplifiées : right border partout sauf
          dernier child de ligne, bottom border supprimé sur dernière ligne. */}
      <div className="grid grid-cols-2 wide:grid-cols-4 gap-0">
        {columns.map((col) => {
          const items = grouped[col.key] ?? []
          return (
            <div
              key={col.key}
              className="p-4 flex flex-col gap-2 border-r border-b border-border
                         [&:nth-child(2n)]:border-r-0
                         wide:[&:nth-child(2n)]:border-r
                         wide:[&:nth-child(4n)]:border-r-0"
            >
              <div className="font-syne text-[11px] font-bold uppercase tracking-[1.2px] text-muted mb-1 flex items-center gap-1.5 truncate">
                {col.icon && <span style={{ color: col.couleur ?? 'var(--muted)' }}>{col.icon}</span>}
                <span style={{ color: col.couleur ?? undefined }}>{col.label}</span>
                <span className="text-muted">· {items.length}</span>
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
                    manager={manager}
                    reorderMode={reorderMode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>

              {manager && (
                <button
                  onClick={() => onAddInCat?.(col.key as MissionCategorie)}
                  className="mt-1 py-2 rounded-[9px] border border-dashed border-border bg-transparent text-muted text-[11px] font-semibold hover:border-accent hover:text-accent transition-colors"
                >
                  + Mission
                </button>
              )}
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}
