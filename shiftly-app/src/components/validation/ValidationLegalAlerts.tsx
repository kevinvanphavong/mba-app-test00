'use client'

/**
 * ValidationLegalAlerts — Card des alertes légales IDCC 1790.
 * Calculées à la volée côté API, jamais stockées en base.
 */

import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import type { AlerteLegale } from '@/types/validation'

interface Props {
  alertes: AlerteLegale[]
}

const ALERT_ICONS: Record<string, string> = {
  depassement_hebdo:      '⏱️',
  majoration_25:          '⏱️',
  majoration_50:          '🔴',
  absence_non_justifiee:  '🔴',
  repos_quotidien:        '🛌',
  repos_hebdo:            '🛌',
  pause_6h:               '☕',
  max_journalier:         '⚠️',
  max_hebdo:              '⚠️',
}

export default function ValidationLegalAlerts({ alertes }: Props) {
  if (alertes.length === 0) {
    return (
      <motion.div
        className="py-6 text-center"
        style={{ color: 'var(--green)' }}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="text-2xl mb-2">✅</div>
        <div className="text-sm font-semibold">Aucune alerte légale cette semaine</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex flex-col"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      {alertes.map((alerte, i) => (
        <div key={`${alerte.type}-${alerte.employe.id}-${i}`} className="validation-alert-item py-3">
          <div
            className="validation-alert-icon flex-shrink-0"
            data-severity={alerte.severite === 'warning' ? 'warn' : alerte.severite}
          >
            {ALERT_ICONS[alerte.type] ?? '⚠️'}
          </div>
          <div>
            <div className="validation-alert-title">
              {alerte.employe.nom ? `${alerte.employe.nom} — ` : ''}{alerte.titre}
            </div>
            <div className="validation-alert-detail">{alerte.detail}</div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}
