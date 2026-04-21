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

  const badge = service.statut === 'EN_COURS'
    ? { label: 'En direct',  bg: 'rgba(34,197,94,0.15)',   color: 'var(--green)',  dot: true  }
    : service.statut === 'TERMINE'
    ? { label: 'Clôturé',    bg: 'rgba(107,114,128,0.15)', color: 'var(--muted)', dot: false }
    : { label: 'À venir',    bg: 'rgba(59,130,246,0.15)',  color: 'var(--blue)',  dot: false }

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
          <span
            className="flex items-center gap-1.5 px-2 py-0.5 text-[12px] font-bold rounded-lg"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.dot && <span className="pointage-live-dot" />}
            {badge.label}
          </span>
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

        {service.statut === 'EN_COURS' && (
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
