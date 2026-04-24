'use client'

/**
 * ValidationWeekSummary — Card résumé de la semaine.
 * Total heures, sup, retards, absences, pauses conformes.
 */

import { motion } from 'framer-motion'
import { fadeUpVariants as fadeUp } from '@/lib/animations'
import type { ValidationEmploye } from '@/types/validation'

interface Props {
  employes: ValidationEmploye[]
}

function minToHHMM(minutes: number): string {
  const h   = Math.floor(minutes / 60)
  const min = minutes % 60
  return `${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}

export default function ValidationWeekSummary({ employes }: Props) {
  const totalTravaille = employes.reduce((s, e) => s + e.totalTravaille, 0)
  const totalSup       = employes.reduce((s, e) => s + e.heuresSup, 0)
  const totalRetards   = employes.reduce((s, e) => s + e.nbRetards, 0)
  const totalAbsences  = employes.reduce((s, e) => s + e.nbAbsences, 0)

  const employesAvecSup = employes.filter(e => e.heuresSup > 0)
  const employesAvecRetard = employes.filter(e => e.nbRetards > 0)
  const employesAvecAbsence = employes.filter(e => e.nbAbsences > 0)

  // Calcul pauses conformes (20 min minimum) — estimation
  const totalJoursTravailes = employes.reduce((s, e) =>
    s + e.jours.filter(j => j.statut === 'travaille' || j.statut === 'en_cours').length, 0)
  const joursAvecPauseConforme = employes.reduce((s, e) =>
    s + e.jours.filter(j =>
      (j.statut === 'travaille' || j.statut === 'en_cours') &&
      j.pauses.some(p => p.dureeMinutes >= 20)
    ).length, 0)
  const tauxPausesConformes = totalJoursTravailes > 0
    ? Math.round((joursAvecPauseConforme / totalJoursTravailes) * 100)
    : 100

  const stats = [
    {
      label: 'Total heures équipe',
      value: minToHHMM(totalTravaille),
      cls: 'blue',
    },
    {
      label: 'Heures supplémentaires',
      value: totalSup > 0 ? minToHHMM(totalSup) : '0h',
      cls: totalSup > 0 ? 'accent' : '',
      sub: employesAvecSup.map(e => `${e.prenom} ${e.nom.charAt(0)}. +${minToHHMM(e.heuresSup)}`).join(' · '),
    },
    {
      label: 'Retards détectés',
      value: `${totalRetards} incident${totalRetards > 1 ? 's' : ''}`,
      cls: totalRetards > 0 ? 'red' : '',
      sub: employesAvecRetard.map(e => `${e.prenom} ${e.nom.charAt(0)}. ${e.nbRetards}`).join(' · '),
    },
    {
      label: 'Absences',
      value: String(totalAbsences),
      cls: totalAbsences > 0 ? 'red' : '',
      sub: employesAvecAbsence.map(e => `${e.prenom} ${e.nom.charAt(0)}.`).join(', '),
    },
    {
      label: 'Pauses conformes',
      value: `${tauxPausesConformes}%`,
      cls: tauxPausesConformes >= 90 ? 'green' : tauxPausesConformes >= 70 ? '' : 'red',
    },
  ]

  return (
    <motion.div
      className="flex flex-col gap-0"
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat) => (
        <div key={stat.label}>
          <div className="validation-summary-stat py-3">
            <span className="validation-summary-stat-label">{stat.label}</span>
            <span className={`validation-summary-stat-value ${stat.cls}`}>{stat.value}</span>
          </div>
          {stat.sub && (
            <div className="validation-summary-sub pb-2">{stat.sub}</div>
          )}
        </div>
      ))}
    </motion.div>
  )
}
