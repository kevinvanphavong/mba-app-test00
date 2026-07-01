'use client'

import type { Contact } from '@/features/crm/types'

const SEGMENT_LABEL: Record<string, string> = { b2c: 'B2C', b2b: 'B2B', no_show: 'No-show' }

/** Ligne de contact (cliquable). PII déchiffrées, rendues via JSX (échappé). */
export default function ContactRow({
  contact,
  actif = false,
  onSelect,
}: {
  contact: Contact
  actif?: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-card border px-4 py-3 text-left transition-colors ${
        actif ? 'border-accent bg-surface2' : 'border-border bg-surface hover:border-border-strong'
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-text">{contact.nom}</p>
        <p className="truncate text-sm text-muted">{contact.email}</p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        {contact.segments.map((s) => (
          <span key={s} className="rounded-pill bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
            {SEGMENT_LABEL[s] ?? s}
          </span>
        ))}
      </div>
    </button>
  )
}
