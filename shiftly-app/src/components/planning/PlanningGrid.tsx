'use client'

import { useState, useEffect } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { PlanningAbsence, PlanningShift, PlanningWeekData, AbsenceType } from '@/types/planning'
import { useCopyShift, useCreateAbsence, useDeleteAbsence } from '@/hooks/usePlanning'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { isAxiosError } from 'axios'
import { hexAlpha } from '@/lib/colors'
import DayHeader from './DayHeader'
import PlanningRow from './PlanningRow'
import AbsenceModal from './AbsenceModal'

/** Fusionne l'ordre sauvegardé avec les employés actuels (garde l'ordre, ajoute les nouveaux) */
function resolveRowOrder(currentIds: number[], storageKey: string): number[] {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return currentIds
    const savedIds: number[] = JSON.parse(saved)
    const currentSet = new Set(currentIds)
    const kept  = savedIds.filter(id => currentSet.has(id))
    const added = currentIds.filter(id => !new Set(savedIds).has(id))
    return kept.length > 0 ? [...kept, ...added] : currentIds
  } catch {
    return currentIds
  }
}

interface PlanningGridProps {
  data:        PlanningWeekData
  onAddShift:  (date: string, employeeId: number) => void
  onEditShift: (shift: PlanningShift) => void
}

/** Aperçu du shift pendant le drag */
function ShiftPreview({ shift }: { shift: PlanningShift }) {
  const heures = shift.heureDebut && shift.heureFin ? `${shift.heureDebut} – ${shift.heureFin}` : '—'
  return (
    <div className="w-[120px] rounded-md px-2 py-1.5 text-xs shadow-xl"
      style={{ backgroundColor: hexAlpha(shift.zoneCouleur, 0.15), borderLeft: `3px solid ${shift.zoneCouleur}`, color: shift.zoneCouleur }}>
      <p className="truncate font-bold">{heures}</p>
      <p className="mt-0.5 truncate text-[10px] opacity-80">{shift.zoneNom}</p>
    </div>
  )
}

/** Grille planning complète avec DnD shifts + tri des lignes */
export default function PlanningGrid({ data, onAddShift, onEditShift }: PlanningGridProps) {
  const today         = new Date().toISOString().split('T')[0]
  const copyShift     = useCopyShift()
  const createAbsence = useCreateAbsence()
  const deleteAbsence = useDeleteAbsence()
  const centreId      = useAuthStore(s => s.centreId)
  const toast         = useToastStore(s => s.show)
  const storageKey    = `shiftly_row_order_${centreId}`

  // État modal absence
  const [absenceTarget, setAbsenceTarget] = useState<{ date: string; employeeId: number } | null>(null)
  const absenceEmployee = absenceTarget
    ? data.employees.find(e => e.id === absenceTarget.employeeId)
    : null

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(data.weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  // Ordre local des lignes — initialisé depuis localStorage si disponible
  const [rowOrder, setRowOrder] = useState<number[]>(() =>
    resolveRowOrder(data.employees.map(e => e.id), storageKey)
  )

  // Resync au changement de semaine en respectant l'ordre sauvegardé
  useEffect(() => {
    setRowOrder(resolveRowOrder(data.employees.map(e => e.id), storageKey))
  }, [data.weekStart, storageKey])

  // Persiste l'ordre dans localStorage à chaque modification
  useEffect(() => {
    if (rowOrder.length === 0) return
    localStorage.setItem(storageKey, JSON.stringify(rowOrder))
  }, [rowOrder, storageKey])
  const orderedEmployees = rowOrder
    .map(id => data.employees.find(e => e.id === id))
    .filter(Boolean) as typeof data.employees

  // État DnD actif
  const [activeShift, setActiveShift]   = useState<PlanningShift | null>(null)
  const [isDraggingRow, setIsDraggingRow] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(event: DragStartEvent) {
    const { type, shift } = event.active.data.current ?? {}
    if (type === 'shift') { setActiveShift(shift); setIsDraggingRow(false) }
    if (type === 'row')   { setIsDraggingRow(true); setActiveShift(null) }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveShift(null)
    setIsDraggingRow(false)

    if (!over) return

    const activeType = active.data.current?.type
    const overId     = String(over.id)

    // ── Shift copié vers une nouvelle cellule ──
    // Drag = COPY (jamais MOVE) : préserve la donnée d'origine pour que le
    // manager prépare des jours futurs depuis le service du jour sans risque.
    if (activeType === 'shift') {
      const shift: PlanningShift = active.data.current?.shift
      if (overId.startsWith('drop-') && shift) {
        const newDate = overId.split('-').slice(2, 5).join('-') // drop-{empId}-{YYYY-MM-DD}
        if (newDate === shift.date) return

        // Bloque le drop sur une date antérieure au jour courant (le back
        // rejette aussi via PlanningGuardService, mais on évite l'aller-retour).
        if (newDate < today) {
          toast('Impossible : date antérieure au service du jour', 'error')
          return
        }

        copyShift.mutate({ shift, newDate }, {
          onError: (err) => {
            if (isAxiosError(err) && (err.response?.status === 409 || err.response?.status === 422)) {
              toast('Cette assignation existe déjà sur cette date', 'error')
            } else if (isAxiosError(err) && err.response?.status === 400) {
              toast(err.response.data?.detail ?? 'Date non autorisée', 'error')
            } else {
              toast('Erreur lors de la copie du shift', 'error')
            }
          },
        })
      }
      return
    }

    // ── Ligne réordonnée ──
    if (activeType === 'row') {
      const activeRowId = active.data.current?.employeeId as number
      const overRowId   = over.data.current?.employeeId as number
      if (activeRowId && overRowId && activeRowId !== overRowId) {
        setRowOrder(prev => {
          const oldIdx = prev.indexOf(activeRowId)
          const newIdx = prev.indexOf(overRowId)
          return arrayMove(prev, oldIdx, newIdx)
        })
      }
    }
  }

  if (data.employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
        <p className="text-3xl">📋</p>
        <p className="mt-2 text-sm">Aucun employé planifié cette semaine</p>
      </div>
    )
  }

  const rowIds = rowOrder.map(id => `row-${id}`)

  return (
    <>
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        {/* En-tête sticky — top calculé pour rester sous les deux headers externes */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface)]" style={{ minWidth: 1040, position: 'sticky', top: 0, zIndex: 5 }}>
          <div className="flex w-[200px] shrink-0 items-center border-r border-[var(--border)] px-4 py-3">
            <span className="text-[13px] font-bold text-[var(--text)]">Employés</span>
          </div>
          {weekDates.map(date => (
            <div key={date} className="flex-1 border-l border-[var(--border)]" style={{ minWidth: 120 }}>
              <DayHeader date={date} isToday={date === today} />
            </div>
          ))}
        </div>

        {/* Lignes employés */}
        <div style={{ minWidth: 1040 }}>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            {orderedEmployees.map(emp => (
              <PlanningRow
                key={emp.id}
                employee={emp}
                weekDates={weekDates}
                today={today}
                isDraggingRow={isDraggingRow}
                onAddShift={onAddShift}
                onEditShift={onEditShift}
                onAddAbsence={(date, employeeId) => setAbsenceTarget({ date, employeeId })}
                onDelAbsence={(absence: PlanningAbsence) => deleteAbsence.mutate(absence.id)}
              />
            ))}
          </SortableContext>
        </div>
      </div>

      {/* Aperçu drag shift */}
      <DragOverlay dropAnimation={null}>
        {activeShift && <ShiftPreview shift={activeShift} />}
      </DragOverlay>
    </DndContext>

    {/* Modal absence */}
    {absenceTarget && absenceEmployee && (
      <AbsenceModal
        employeNom={`${absenceEmployee.prenom ?? ''} ${absenceEmployee.nom}`.trim()}
        date={absenceTarget.date}
        loading={createAbsence.isPending}
        onClose={() => setAbsenceTarget(null)}
        onConfirm={async (type: AbsenceType, motif?: string) => {
          await createAbsence.mutateAsync({
            userId: absenceTarget.employeeId,
            date:   absenceTarget.date,
            type,
            motif,
          })
          setAbsenceTarget(null)
        }}
      />
    )}
    </>
  )
}
