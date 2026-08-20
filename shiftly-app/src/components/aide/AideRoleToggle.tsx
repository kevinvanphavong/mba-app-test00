'use client'

import type { AideRole } from '@/types/aide'

type Props = {
  value:    AideRole
  onChange: (role: AideRole) => void
}

const OPTIONS: { role: AideRole; label: string }[] = [
  { role: 'manager', label: 'Je suis gérant' },
  { role: 'employe', label: 'Je suis équipier' },
]

/**
 * Bascule d'affichage « gérant / équipier ». Purement cosmétique : elle filtre les
 * rubriques montrées, elle ne remplace pas l'autorisation (route ouverte aux deux).
 */
export default function AideRoleToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-input border border-border bg-surface p-[3px]" role="tablist">
      {OPTIONS.map(({ role, label }) => {
        const active = value === role
        return (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(role)}
            className={`rounded-badge px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
              active ? 'bg-accent text-accent-on' : 'text-muted hover:text-text-soft'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
