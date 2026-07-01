'use client'

import { useMemo, useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import PageContainer from '@/components/layout/PageContainer'
import { useContacts } from '@/features/crm/useCrm'
import ContactRow from '@/components/crm/ContactRow'
import ContactDetail from '@/components/crm/ContactDetail'

const SEGMENTS = ['b2c', 'b2b', 'no_show'] as const

/**
 * Cockpit gérant — Clients (contacts CRM). Liste du centre + détail, PII déchiffrées
 * pour le gérant autorisé. Recherche + filtre segment côté client. React Query, 3 états.
 */
export default function ContactsPage() {
  const { data, isLoading, isError, refetch } = useContacts()
  const [q, setQ] = useState('')
  const [segment, setSegment] = useState<string>('tous')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const liste = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data ?? []).filter(
      (c) =>
        (segment === 'tous' || c.segments.includes(segment)) &&
        (needle === '' || c.nom.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle)),
    )
  }, [data, q, segment])

  const selected = liste.find((c) => c.id === selectedId) ?? null

  return (
    <>
      <Topbar title="Clients" subtitle="Contacts de votre établissement" />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, email)…"
              className="flex-1 rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
            {['tous', ...SEGMENTS].map((s) => (
              <button
                key={s}
                onClick={() => setSegment(s)}
                className={`rounded-pill border px-3 py-1.5 text-sm transition-colors ${
                  segment === s ? 'border-accent bg-accent text-accent-on' : 'border-border bg-surface text-text-soft hover:border-accent'
                }`}
              >
                {s === 'tous' ? 'Tous' : s}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-sm text-muted">Chargement des clients…</p>}
          {isError && (
            <div className="text-sm">
              <p className="text-red">Erreur de chargement.</p>
              <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">
                Réessayer
              </button>
            </div>
          )}

          {!isLoading && !isError && (liste.length === 0 ? (
            <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">Aucun client dans cette vue.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 desktop:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex flex-col gap-2">
                {liste.map((c) => (
                  <ContactRow key={c.id} contact={c} actif={c.id === selectedId} onSelect={() => setSelectedId(c.id)} />
                ))}
              </div>
              <div className="desktop:sticky desktop:top-4 desktop:self-start">
                {selected ? (
                  <ContactDetail contact={selected} />
                ) : (
                  <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
                    Sélectionne un client pour voir le détail.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  )
}
