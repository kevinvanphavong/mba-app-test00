'use client'

import type { TicketPriorite } from '@/types/support'

const META: Record<TicketPriorite, { label: string; className: string }> = {
  BASSE:    { label: 'Basse',    className: 'bg-muted/15 text-muted'    },
  MOYENNE:  { label: 'Moyenne',  className: 'bg-blue/15 text-blue'      },
  HAUTE:    { label: 'Haute',    className: 'bg-yellow/15 text-yellow'  },
  URGENTE:  { label: 'Urgente',  className: 'bg-red/15 text-red'        },
}

export default function TicketPriorityBadge({ priorite }: { priorite: TicketPriorite }) {
  const m = META[priorite]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.5px] ${m.className}`}>
      {m.label}
    </span>
  )
}
