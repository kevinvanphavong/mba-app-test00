'use client'

import type { TicketStatut } from '@/types/support'

const META: Record<TicketStatut, { label: string; className: string }> = {
  OUVERT:   { label: 'Ouvert',   className: 'bg-blue/15 text-blue'       },
  EN_COURS: { label: 'En cours', className: 'bg-yellow/15 text-yellow'   },
  RESOLU:   { label: 'Résolu',   className: 'bg-green/15 text-green'     },
  FERME:    { label: 'Fermé',    className: 'bg-muted/15 text-muted'     },
}

export default function TicketStatusBadge({ statut }: { statut: TicketStatut }) {
  const m = META[statut]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-[10px] font-bold ${m.className}`}>
      {m.label}
    </span>
  )
}
