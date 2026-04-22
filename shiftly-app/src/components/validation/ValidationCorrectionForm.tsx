'use client'

/**
 * ValidationCorrectionForm — Formulaire de correction d'un pointage.
 * Permet au manager de modifier heureArrivee ou heureDepart.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { CorrectionPayload } from '@/types/validation'

interface Props {
  pointageId: number
  date: string
  onSubmit: (payload: CorrectionPayload) => void
  onCancel: () => void
  isLoading?: boolean
}

const CHAMPS = [
  { value: 'heureArrivee', label: "Heure d'arrivée" },
  { value: 'heureDepart',  label: 'Heure de départ' },
] as const

export default function ValidationCorrectionForm({
  pointageId,
  date,
  onSubmit,
  onCancel,
  isLoading = false,
}: Props) {
  const [champ, setChamp] = useState<'heureArrivee' | 'heureDepart'>('heureArrivee')
  const [heure, setHeure] = useState('')
  const [motif, setMotif] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!heure) return

    const nouvelleValeur = `${date}T${heure}:00`
    onSubmit({ pointageId, champModifie: champ, nouvelleValeur, motif: motif || undefined })
  }

  return (
    <motion.div
      className="validation-correction-form p-4"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
        ✏️ Corriger un pointage
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Champ à corriger
          </label>
          <select
            className="validation-correction-input px-3 py-2 mt-1"
            value={champ}
            onChange={e => setChamp(e.target.value as typeof champ)}
          >
            {CHAMPS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Nouvelle heure
          </label>
          <input
            type="time"
            className="validation-correction-input px-3 py-2 mt-1"
            value={heure}
            onChange={e => setHeure(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Motif (optionnel)
          </label>
          <input
            type="text"
            className="validation-correction-input px-3 py-2 mt-1"
            placeholder="Ex: erreur de saisie, accord verbal..."
            value={motif}
            onChange={e => setMotif(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-1">
          <button
            type="submit"
            disabled={isLoading || !heure}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'var(--accent)',
              color: 'white',
              opacity: isLoading || !heure ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Correction...' : 'Appliquer'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm font-semibold border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Annuler
          </button>
        </div>
      </form>
    </motion.div>
  )
}
