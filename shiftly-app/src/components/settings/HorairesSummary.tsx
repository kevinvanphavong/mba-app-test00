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
      label:  "Horaires d'ouverture",
      sub:    summary,
      action: 'Modifier',
      href:   '/reglages/horaires',
    },
    {
      label:  'Éditeur de contenu',
      sub:    'Zones, missions et compétences',
      action: 'Ouvrir',
      href:   '/reglages/editeur',
    },
  ]

  return (
    <div className="mb-4">
      <div className="text-[9px] font-syne font-bold uppercase tracking-widest text-muted px-1 mb-2">
        Centre
      </div>
      <div className="bg-surface border border-border rounded-[18px] overflow-hidden divide-y divide-border">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-text font-medium">{item.label}</div>
              <div className="text-[11px] text-muted">{item.sub}</div>
            </div>
            <Link href={item.href} className="text-[11px] text-accent font-semibold flex-shrink-0">
              {item.action} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
