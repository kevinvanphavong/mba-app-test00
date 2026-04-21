'use client'

import { motion } from 'framer-motion'
import { listVariants, listItemVariants } from '@/lib/animations'
import type { PointageEntry } from '@/types/pointage'

interface Alert {
  type:    'critical' | 'warning' | 'info' | 'success'
  message: string
}

interface Props {
  pointages: PointageEntry[]
  now:       Date
}

function buildAlerts(pointages: PointageEntry[], now: Date): Alert[] {
  const alerts: Alert[] = []

  for (const p of pointages) {
    const nom = p.user.prenom ? `${p.user.prenom} ${p.user.nom}` : p.user.nom

    // Employé non pointé avec retard
    if (p.statut === 'PREVU' && p.minutesRetard > 0) {
      alerts.push({
        type:    'critical',
        message: `🔴 ${nom} non pointé·e depuis ${p.minutesRetard} min`,
      })
    }

    // Pause trop longue (> 30 min)
    if (p.statut === 'EN_PAUSE') {
      const pauseOuverte = p.pauses.find(pause => !pause.heureFin)
      if (pauseOuverte) {
        const duree = Math.round((now.getTime() - new Date(pauseOuverte.heureDebut).getTime()) / 60000)
        if (duree > 30) {
          alerts.push({
            type:    'warning',
            message: `⚠️ ${nom} en pause depuis ${duree} min`,
          })
        }
      }
    }

    // Approche 6h continues sans pause
    if (p.statut === 'EN_COURS' && p.dureeEffective > 330 && p.pauses.length === 0) {
      alerts.push({
        type:    'warning',
        message: `⚠️ ${nom} approche 6h continues sans pause`,
      })
    }
  }

  if (!alerts.length) {
    alerts.push({
      type:    'success',
      message: '✅ Repos et temps de travail conformes',
    })
  }

  return alerts
}

export default function PointageAlertPanel({ pointages, now }: Props) {
  const alerts = buildAlerts(pointages, now)

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2 px-4 md:px-6"
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
        Alertes
      </p>
      {alerts.map((a, i) => (
        <motion.div
          key={i}
          variants={listItemVariants}
          className={`pointage-alert-item ${a.type} px-3 py-2.5`}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{a.message}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
