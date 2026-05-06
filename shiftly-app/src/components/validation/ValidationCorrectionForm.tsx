'use client'

/**
 * ValidationCorrectionForm — Formulaire de correction d'un pointage.
 * Permet au manager de modifier heureArrivee ou heureDepart.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { CorrectionPayload } from '@/types/validation'

type ChampCorrection = 'heureArrivee' | 'heureDepart' | 'pauseDebut' | 'pauseFin'

interface Props {
  pointageId: number
  date: string
  /** Si défini, le formulaire propose aussi "Début/Fin de pause" et cible cette pause. */
  pauseId?: number
  onSubmit: (payload: CorrectionPayload) => void
  onCancel: () => void
  isLoading?: boolean
}

const CHAMPS_BASE = [
  { value: 'heureArrivee', label: "Heure d'arrivée" },
  { value: 'heureDepart',  label: 'Heure de départ' },
] as const

const CHAMPS_PAUSE = [
  { value: 'pauseDebut', label: 'Début de pause' },
  { value: 'pauseFin',   label: 'Fin de pause'   },
] as const

export default function ValidationCorrectionForm({
  pointageId,
  date,
  pauseId,
  onSubmit,
  onCancel,
  isLoading = false,
}: Props) {
  // Si pauseId est défini, on pré-sélectionne pauseDebut (clic sur ✏️ pause).
  const [champ, setChamp] = useState<ChampCorrection>(pauseId !== undefined ? 'pauseDebut' : 'heureArrivee')
  const [heure, setHeure] = useState('')
  const [motif, setMotif] = useState('')

  const champs = pauseId !== undefined ? [...CHAMPS_BASE, ...CHAMPS_PAUSE] : CHAMPS_BASE

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!heure) return

    // Saisie en local (Europe/Paris) → ISO UTC pour stockage uniforme côté back.
    const [year, month, day] = date.split('-').map(Number)
    const [hh, mm]           = heure.split(':').map(Number)
    const nouvelleValeur     = new Date(year, month - 1, day, hh, mm, 0).toISOString()
    const isPauseChamp       = champ === 'pauseDebut' || champ === 'pauseFin'

    onSubmit({
      pointageId,
      champModifie:   champ,
      nouvelleValeur,
      motif:          motif || undefined,
      pauseId:        isPauseChamp ? pauseId : undefined,
    })
  }

  return (
    <motion.div
      className="validation-correction-form p-4"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>✏️ Corriger un pointage</div>
        <div className="text-[12px] font-medium capitalize" style={{ color: 'var(--muted)' }}>{format(parseISO(date), 'EEEE d MMM', { locale: fr })}</div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Champ à corriger
          </label>
          <select
            className="validation-correction-input px-3 py-2 mt-1"
            value={champ}
            onChange={e => setChamp(e.target.value as ChampCorrection)}
          >
            {champs.map(c => (
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
