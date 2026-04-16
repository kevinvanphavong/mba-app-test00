'use client'

import { motion } from 'framer-motion'
import { listVariants, listItemVariants } from '@/lib/animations'
import type { PlanningStats } from '@/types/planning'

interface StatsBarProps {
  stats:       PlanningStats
  alertCount:  number
  onToggleAlerts: () => void
  showAlerts:  boolean
}

interface StatItemProps {
  label:  string
  value:  string | number
  color?: string
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    <motion.div
      variants={listItemVariants}
      className="flex flex-col items-center gap-0.5"
    >
      <span
        className="text-xl font-bold tabular-nums"
        style={{ color: color ?? 'var(--text)' }}
      >
        {value}
      </span>
      <span className="text-[11px] text-[var(--muted)]">{label}</span>
    </motion.div>
  )
}

/** Barre de métriques hebdomadaires sous la grille planning */
export default function StatsBar({
  stats,
  alertCount,
  onToggleAlerts,
  showAlerts,
}: StatsBarProps) {
  const creneauxColor = stats.creneauxVides > 0 ? 'var(--red)'    : 'var(--green)'
  const sousPlanColor = stats.sousPlanifies  > 0 ? 'var(--yellow)' : 'var(--green)'

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3"
    >
      <div className="flex flex-wrap items-center gap-6">
        <StatItem
          label="Employés planifiés"
          value={stats.employesPlanifies}
          color="var(--text)"
        />
        <StatItem
          label="Total heures"
          value={`${stats.totalHeures}h`}
          color="var(--accent)"
        />
        <StatItem
          label="Créneaux vides"
          value={stats.creneauxVides}
          color={creneauxColor}
        />
        <StatItem
          label="Sous-planifiés"
          value={stats.sousPlanifies}
          color={sousPlanColor}
        />
      </div>

      {/* Bouton alertes */}
      <button
        onClick={onToggleAlerts}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          showAlerts
            ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }`}
      >
        {alertCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--red)] text-[10px] font-bold text-white">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
        Alertes
        <span className="opacity-60">{showAlerts ? '▲' : '▼'}</span>
      </button>
    </motion.div>
  )
}
