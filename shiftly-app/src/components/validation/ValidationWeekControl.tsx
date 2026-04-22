'use client'

/**
 * ValidationWeekControl — Barre de navigation entre les semaines.
 * Affiche numéro ISO de semaine, plage de dates et badge statut.
 */

import { motion } from 'framer-motion'
import { format, addWeeks, subWeeks, getISOWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ValidationSemaine } from '@/types/validation'

interface Props {
  currentLundi: Date
  onChange: (newLundi: Date) => void
  statut?: ValidationSemaine['statutSemaine']
  nbValides?: number
  nbTotal?: number
}

const STATUT_LABELS = {
  en_attente: 'En attente',
  validee:    'Validée',
  en_cours:   'En cours',
} as const

export default function ValidationWeekControl({
  currentLundi,
  onChange,
  statut = 'en_attente',
  nbValides,
  nbTotal,
}: Props) {
  const dimanche  = addWeeks(currentLundi, 1)
  const numSemaine = getISOWeek(currentLundi)

  const labelDebut = format(currentLundi, 'd MMM', { locale: fr })
  const labelFin   = format(addWeeks(currentLundi, 1).setDate(addWeeks(currentLundi, 1).getDate() - 1), 'd MMM yyyy', { locale: fr })

  const badgeLabel = nbValides !== undefined && nbTotal !== undefined
    ? `${nbValides}/${nbTotal} validés`
    : STATUT_LABELS[statut]

  return (
    <motion.div
      className="validation-week-control flex items-center justify-between px-5 py-4"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(subWeeks(currentLundi, 1))}
          className="validation-week-arrow"
          aria-label="Semaine précédente"
        >
          ←
        </button>

        <div>
          <div className="validation-week-label">Semaine {numSemaine}</div>
          <div className="validation-week-dates">{labelDebut} – {labelFin}</div>
        </div>

        <button
          onClick={() => onChange(addWeeks(currentLundi, 1))}
          className="validation-week-arrow"
          aria-label="Semaine suivante"
        >
          →
        </button>
      </div>

      <div
        className="validation-status-badge"
        data-status={statut}
      >
        {badgeLabel}
      </div>
    </motion.div>
  )
}
