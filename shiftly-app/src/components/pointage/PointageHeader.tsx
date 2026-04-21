'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUpVariants } from '@/lib/animations'
import type { PointageServiceData } from '@/types/pointage'

interface Props {
  data:              PointageServiceData
  onCloturerClick:   () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function labelService(heureDebut: string | null): string {
  if (!heureDebut) return 'Service'
  const h = parseInt(heureDebut.split(':')[0], 10)
  if (h < 12) return 'Service du matin'
  if (h < 17) return 'Service de l\'après-midi'
  return 'Service du soir'
}

export default function PointageHeader({ data, onCloturerClick }: Props) {
  const [heure, setHeure] = useState('')

  useEffect(() => {
    const tick = () => {
      setHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const { service } = data
  const enCours     = service.statut === 'EN_COURS'

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="show"
      className="flex items-start justify-between gap-4 p-4 md:p-6"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-syne text-[var(--text)]">
            Pointage
          </span>
          {enCours && (
            <span className="pointage-live-badge flex items-center gap-1.5 px-2 py-0.5">
              <span className="pointage-live-dot" />
              EN DIRECT
            </span>
          )}
        </div>

        <p className="text-xs text-[var(--muted)]">
          {labelService(service.heureDebut)} — {formatDate(service.date)}
          {service.heureDebut && service.heureFin && (
            <span className="ml-1 opacity-70">
              ({service.heureDebut} – {service.heureFin})
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="pointage-clock">{heure}</span>

        {enCours && (
          <button
            onClick={onCloturerClick}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            Clôturer
          </button>
        )}
      </div>
    </motion.div>
  )
}
