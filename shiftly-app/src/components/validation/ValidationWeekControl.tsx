'use client'

/**
 * ValidationWeekControl — Barre de navigation entre les semaines.
 * Affiche numéro ISO de semaine, plage de dates et badge statut.
 */

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { format, addDays, addWeeks, subWeeks, getISOWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ValidationSemaine } from '@/types/validation'

interface Props {
  currentLundi: Date
  onChange: (newLundi: Date) => void
  statut?: ValidationSemaine['statutSemaine']
  nbValides?: number
  nbTotal?: number
  // Slot facultatif rendu à droite du badge (boutons d'action en général).
  // En mobile, wrap sous le bloc semaine via justify-end + flex-wrap.
  actions?: ReactNode
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
  actions,
}: Props) {
  const dimanche   = addDays(currentLundi, 6)
  const numSemaine = getISOWeek(currentLundi)

  const labelDebut = format(currentLundi, 'd MMM', { locale: fr })
  const labelFin   = format(dimanche, 'd MMM yyyy', { locale: fr })

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

      <div className="flex items-center gap-3 flex-wrap justify-end">
        <div
          className="validation-status-badge"
          data-status={statut}
        >
          {badgeLabel}
        </div>
        {actions}
      </div>
    </motion.div>
  )
}
