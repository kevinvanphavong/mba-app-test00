'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { buildHorairesSummary, type OpeningHours } from '@/types/centre'

/**
 * Section "Centre" de la page Réglages.
 * Charge les horaires pour afficher un sous-titre dynamique (jours ouverts).
 */
export default function CentreSettingsSection() {
  const { user } = useCurrentUser()
  const [summary, setSummary] = useState<string>('…')

  useEffect(() => {
    if (!user?.centre?.id) return
    api.get(`/centres/${user.centre.id}/horaires`)
      .then(res => setSummary(buildHorairesSummary(res.data as OpeningHours)))
      .catch(() => setSummary('Horaires non configurés'))
  }, [user?.centre?.id])

  const items = [
    {
      label: "Horaires d'ouverture",
      sub:   summary,
      href:  '/reglages/horaires',
    },
  ]

  return (
    <div className="bg-surface border border-border rounded-[18px] overflow-hidden divide-y divide-border">
      {items.map(item => (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface2 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-text font-medium">{item.label}</div>
            <div className="text-[11px] text-muted">{item.sub}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted flex-shrink-0">
            <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ))}
    </div>
  )
}
