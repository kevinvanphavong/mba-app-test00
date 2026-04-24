'use client'

import type { TicketCategorie } from '@/types/support'

const META: Record<TicketCategorie, { label: string; icon: string; className: string }> = {
  bug:             { label: 'Bug',                icon: '🐛', className: 'bg-red/10 text-red'       },
  question:        { label: 'Question',           icon: '❓', className: 'bg-blue/10 text-blue'     },
  feature_request: { label: 'Suggestion',         icon: '💡', className: 'bg-purple/10 text-purple' },
  facturation:     { label: 'Facturation',        icon: '💶', className: 'bg-green/10 text-green'   },
  autre:           { label: 'Autre',              icon: '📎', className: 'bg-muted/15 text-muted'   },
}

export default function TicketCategoryBadge({ categorie }: { categorie: TicketCategorie }) {
  const m = META[categorie]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${m.className}`}>
      <span>{m.icon}</span> {m.label}
    </span>
  )
}

export const CATEGORIE_OPTIONS: Array<{ value: TicketCategorie; label: string }> = [
  { value: 'bug',             label: '🐛 Bug — quelque chose ne fonctionne pas' },
  { value: 'question',        label: '❓ Question — comment utiliser…'          },
  { value: 'feature_request', label: '💡 Suggestion — nouvelle fonctionnalité' },
  { value: 'facturation',     label: '💶 Facturation — paiement, facture'      },
  { value: 'autre',           label: '📎 Autre'                                 },
]
