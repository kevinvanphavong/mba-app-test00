'use client'

import type { EmployeeLegalAlert } from '@/types/planning'

interface EmployeeAlertBadgeProps {
  alertes: EmployeeLegalAlert[]
}

/**
 * Badge ⚖️ affiché sur la ligne employé quand son planning enfreint une règle
 * de durée légale / repos (P3). Le détail s'affiche au survol (tooltip natif).
 */
export default function EmployeeAlertBadge({ alertes }: EmployeeAlertBadgeProps) {
  if (!alertes.length) return null

  const haute = alertes.some(a => a.severite === 'haute')
  const tooltip = alertes
    .map(a => `⚖️ ${a.message}${a.baseLegale ? ` (${a.baseLegale})` : ''}`)
    .join('\n')

  return (
    <span
      title={tooltip}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
      style={{
        color:           haute ? 'var(--red)' : 'var(--yellow)',
        backgroundColor: haute ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)',
      }}
    >
      ⚖️ {alertes.length}
    </span>
  )
}
