'use client'

import { motion } from 'framer-motion'
import { listItemVariants } from '@/lib/animations'
import type { EmployeeWeek, PlanningAbsence } from '@/types/planning'
import { formatHours } from '@/lib/formatHours'
import EmployeeShiftRow from './EmployeeShiftRow'

interface WeekCardProps {
  week: EmployeeWeek
}

/** Carte d'une semaine publiée dans la vue employé */
export default function WeekCard({ week }: WeekCardProps) {
  // Génère les 7 dates lundi → dimanche
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week.weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  // Indexe les shifts par date
  const shiftsByDate = week.shifts.reduce<Record<string, typeof week.shifts>>(
    (acc, s) => {
      acc[s.date] = acc[s.date] ? [...acc[s.date], s] : [s]
      return acc
    },
    {}
  )

  // Indexe les absences par date
  const absenceByDate = (week.absences ?? []).reduce<Record<string, PlanningAbsence>>(
    (acc, a) => { acc[a.date] = a; return acc },
    {}
  )

  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  return (
    <motion.div
      variants={listItemVariants}
      className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface2)] px-4 py-3">
        <div>
          <p className="text-xs text-[var(--muted)]">Semaine publiée</p>
          <p className="text-sm font-semibold text-[var(--text)]">
            {fmt(week.weekStart)} — {fmt(week.weekEnd)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[var(--accent)]">{formatHours(week.totalHeures)}</p>
          <p className="text-[10px] text-[var(--muted)]">cette semaine</p>
        </div>
      </div>

      {/* Lignes jours */}
      <div className="divide-y divide-[var(--border)]">
        {dates.map(date => (
          <EmployeeShiftRow
            key={date}
            date={date}
            shifts={shiftsByDate[date] ?? []}
            absence={absenceByDate[date] ?? null}
          />
        ))}
      </div>
    </motion.div>
  )
}
