'use client'

import type { Contact } from '@/features/crm/types'

/** Détail d'un contact. PII déchiffrées (gérant autorisé), rendues via JSX (échappé). */
export default function ContactDetail({ contact }: { contact: Contact }) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <h2 className="font-syne text-lg font-bold text-text">{contact.nom}</h2>

      <dl className="grid grid-cols-1 gap-3 text-sm tablet:grid-cols-2">
        <Field label="Email" value={contact.email} />
        <Field label="Téléphone" value={contact.telephone ?? '—'} />
      </dl>

      <div>
        <dt className="text-[11px] uppercase tracking-wide text-muted">Segments</dt>
        <dd className="mt-1 flex flex-wrap gap-1.5">
          {contact.segments.length === 0 ? (
            <span className="text-sm text-muted">—</span>
          ) : (
            contact.segments.map((s) => (
              <span key={s} className="rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                {s}
              </span>
            ))
          )}
        </dd>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-medium text-text">{value}</dd>
    </div>
  )
}
