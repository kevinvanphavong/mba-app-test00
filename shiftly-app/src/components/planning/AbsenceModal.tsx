'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sheetVariants } from '@/lib/animations'
import type { AbsenceType } from '@/types/planning'

// ─── Config types d'absence ───────────────────────────────────────────────────

const ABSENCE_TYPES: { type: AbsenceType; label: string; icon: string; color: string }[] = [
  { type: 'CP',                label: 'Congés payés',       icon: '🏖️', color: '#6366f1' },
  { type: 'RTT',               label: 'RTT',                icon: '📅', color: '#0ea5e9' },
  { type: 'MALADIE',           label: 'Arrêt maladie',      icon: '🤒', color: '#ef4444' },
  { type: 'REPOS',             label: 'Repos planifié',     icon: '😴', color: '#6b7280' },
  { type: 'EVENEMENT_FAMILLE', label: 'Événement familial', icon: '👨‍👩‍👧', color: '#a855f7' },
  { type: 'AUTRE',             label: 'Autre',              icon: '📌', color: '#6b7280' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface AbsenceModalProps {
  employeNom: string
  date:       string   // 'YYYY-MM-DD'
  onConfirm:  (type: AbsenceType, motif?: string) => void
  onClose:    () => void
  loading?:   boolean
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AbsenceModal({ employeNom, date, onConfirm, onClose, loading = false }: AbsenceModalProps) {
  const [selected, setSelected] = useState<AbsenceType | null>(null)
  const [motif,    setMotif]    = useState('')

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60" />

        <motion.div
          key="sheet"
          variants={sheetVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-t-2xl p-5 pb-8 flex flex-col gap-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* En-tête */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[var(--muted)] capitalize">{dateLabel}</p>
              <h3 className="font-semibold text-[var(--text)] mt-0.5">
                Absence — {employeNom}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--text)] transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Grille des types */}
          <div className="grid grid-cols-2 gap-3">
            {ABSENCE_TYPES.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => setSelected(type)}
                className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all text-left"
                style={{
                  background:   selected === type ? `${color}22` : 'var(--surface2)',
                  border:       `1px solid ${selected === type ? color : 'var(--border)'}`,
                  color:        selected === type ? color : 'var(--text)',
                }}
              >
                <span className="text-base">{icon}</span>
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          {/* Motif facultatif */}
          <textarea
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Motif (facultatif)"
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-colors"
            style={{
              background: 'var(--surface2)',
              border:     '1px solid var(--border)',
              color:      'var(--text)',
            }}
          />

          {/* Bouton confirmer */}
          <button
            onClick={() => selected && onConfirm(selected, motif.trim() || undefined)}
            disabled={!selected || loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: selected ? 'var(--accent)' : 'var(--surface2)',
              color:      selected ? '#fff' : 'var(--muted)',
              cursor:     selected ? 'pointer' : 'not-allowed',
              opacity:    loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Enregistrement…' : 'Confirmer l\'absence'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
