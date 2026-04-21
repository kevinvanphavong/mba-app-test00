'use client'

import { motion } from 'framer-motion'
import type { PlanningAbsence, AbsenceType } from '@/types/planning'

// ─── Palette par type d'absence ───────────────────────────────────────────────

const ABSENCE_CONFIG: Record<AbsenceType, { bg: string; border: string; label: string; icon: string }> = {
  CP:                { bg: 'rgba(99,102,241,0.10)',  border: '#6366f1', label: 'CP',      icon: '🏖️' },
  RTT:               { bg: 'rgba(14,165,233,0.10)',  border: '#0ea5e9', label: 'RTT',     icon: '📅' },
  MALADIE:           { bg: 'rgba(239,68,68,0.10)',   border: '#ef4444', label: 'Maladie', icon: '🤒' },
  REPOS:             { bg: 'rgba(107,114,128,0.10)', border: '#6b7280', label: 'Repos',   icon: '😴' },
  EVENEMENT_FAMILLE: { bg: 'rgba(168,85,247,0.10)',  border: '#a855f7', label: 'Famille', icon: '👨‍👩‍👧' },
  AUTRE:             { bg: 'rgba(107,114,128,0.10)', border: '#6b7280', label: 'Absent',  icon: '📌' },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AbsenceBlockProps {
  absence:   PlanningAbsence
  onDelete?: () => void
  readonly?: boolean
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AbsenceBlock({ absence, onDelete, readonly = false }: AbsenceBlockProps) {
  const config = ABSENCE_CONFIG[absence.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      title={absence.motif ?? config.label}
      onClick={readonly ? undefined : onDelete}
      style={{
        background:   config.bg,
        borderLeft:   `3px solid ${config.border}`,
        cursor:       readonly ? 'default' : 'pointer',
      }}
      className="rounded-r-md px-2 py-1 flex items-center gap-1.5 text-xs select-none w-full min-h-[28px]"
    >
      <span className="text-sm leading-none">{config.icon}</span>
      <span className="font-medium truncate" style={{ color: config.border }}>
        {config.label}
      </span>
      {!readonly && (
        <span className="ml-auto text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
          ✕
        </span>
      )}
    </motion.div>
  )
}
