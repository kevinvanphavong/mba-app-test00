'use client'

import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PlanningAbsence, PlanningEmployee, PlanningShift } from '@/types/planning'
import ShiftBlock from './ShiftBlock'
import AbsenceBlock from './AbsenceBlock'

interface PlanningRowProps {
  employee:      PlanningEmployee
  weekDates:     string[]
  today:         string
  isDraggingRow: boolean
  onAddShift:    (date: string, employeeId: number) => void
  onEditShift:   (shift: PlanningShift) => void
  onAddAbsence:  (date: string, employeeId: number) => void
  onDelAbsence:  (absence: PlanningAbsence) => void
}

/** Cellule droppable pour un jour */
function DayCell({
  date, employeeId, shifts, absence, isToday, isDraggingRow, onAdd, onEdit, onAddAbsence, onDelAbsence,
}: {
  date: string; employeeId: number; shifts: PlanningShift[]; absence: PlanningAbsence | null
  isToday: boolean; isDraggingRow: boolean
  onAdd: () => void; onEdit: (s: PlanningShift) => void
  onAddAbsence: () => void; onDelAbsence: (a: PlanningAbsence) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `drop-${employeeId}-${date}`, data: { date, employeeId } })

  // Clic sur cellule vide → absence si aucun shift, sinon shift
  const handleCellClick = () => {
    if (absence) return
    if (!shifts.length) onAdd()
  }

  return (
    <div
      ref={setNodeRef}
      onClick={handleCellClick}
      className="group relative flex-1 border-l border-[var(--border)] px-1.5 py-1.5 transition-colors"
      style={{
        minWidth:        120,
        minHeight:       70,
        backgroundColor: isOver
          ? 'rgba(249,115,22,0.08)'
          : isToday
            ? 'rgba(249,115,22,0.04)'
            : 'var(--bg)',
        cursor:          absence ? 'default' : (!shifts.length ? 'pointer' : 'default'),
      }}
    >
      {absence ? (
        <AbsenceBlock
          absence={absence}
          onDelete={() => onDelAbsence(absence)}
        />
      ) : (
        <>
          {shifts.map(s => (
            <ShiftBlock key={s.posteId} shift={s} onClick={onEdit} />
          ))}
          {!shifts.length && !isDraggingRow && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xl text-[var(--muted)] opacity-40">+</span>
              <button
                onClick={e => { e.stopPropagation(); onAddAbsence() }}
                className="text-[9px] text-[var(--muted)] hover:text-[var(--text)] transition-colors px-1.5 py-0.5 rounded bg-[var(--surface2)] border border-[var(--border)]"
              >
                Absence
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Ligne d'un employé dans la grille planning — sortable + droppable */
export default function PlanningRow({
  employee, weekDates, today, isDraggingRow, onAddShift, onEditShift, onAddAbsence, onDelAbsence,
}: PlanningRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id:   `row-${employee.id}`,
    data: { type: 'row', employeeId: employee.id },
  })

  const shiftsByDate = employee.shifts.reduce<Record<string, PlanningShift[]>>(
    (acc, s) => { acc[s.date] = acc[s.date] ? [...acc[s.date], s] : [s]; return acc },
    {}
  )

  const absenceByDate = (employee.absences ?? []).reduce<Record<string, PlanningAbsence>>(
    (acc, a) => { acc[a.date] = a; return acc },
    {}
  )

  const ecartColor =
    employee.ecartContrat > 2   ? 'var(--red)'
    : employee.ecartContrat < -4  ? 'var(--yellow)'
    : 'var(--green)'

  const pct = employee.heuresHebdo
    ? Math.min(100, (employee.totalHeures / employee.heuresHebdo) * 100)
    : 0

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="group flex border-b border-[var(--border)]"
    >
      {/* Colonne employé — sticky */}
      <div
        className="flex w-[200px] shrink-0 items-center gap-2 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-2"
        style={{ position: 'sticky', left: 0, zIndex: 4 }}
      >
        {/* Poignée de tri */}
        <span
          {...listeners}
          {...attributes}
          className="mr-1 cursor-grab text-[var(--muted)] opacity-30 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          title="Réordonner"
        >
          ⠿
        </span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: employee.avatarColor
            ? `linear-gradient(135deg, ${employee.avatarColor}, ${employee.avatarColor}cc)`
            : 'linear-gradient(135deg, #6b7280, #9ca3af)' }}
        >
          {(employee.prenom ?? employee.nom).charAt(0).toUpperCase()}
          {employee.nom.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[var(--text)]">
            {employee.prenom ?? employee.nom}
          </p>
          {employee.typeContrat && (
            <p className="truncate text-[11px] text-[var(--muted)]">{employee.typeContrat}</p>
          )}
        </div>
        {employee.heuresHebdo !== null && employee.heuresHebdo > 0 && (
          <div className="flex shrink-0 flex-col items-end">
            <span className="font-syne text-[14px] font-bold" style={{ color: ecartColor }}>
              {employee.totalHeures}h
            </span>
            <span className="text-[10px] text-[var(--muted)]">/ {employee.heuresHebdo}h</span>
            <div className="mt-1 h-1 w-12 overflow-hidden rounded-full bg-[var(--surface2)]">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ecartColor }} />
            </div>
          </div>
        )}
      </div>

      {/* 7 cellules jours */}
      {weekDates.map(date => (
        <DayCell
          key={date}
          date={date}
          employeeId={employee.id}
          shifts={shiftsByDate[date] ?? []}
          absence={absenceByDate[date] ?? null}
          isToday={date === today}
          isDraggingRow={isDraggingRow}
          onAdd={() => onAddShift(date, employee.id)}
          onEdit={onEditShift}
          onAddAbsence={() => onAddAbsence(date, employee.id)}
          onDelAbsence={onDelAbsence}
        />
      ))}
    </div>
  )
}
