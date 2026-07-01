'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import PageContainer from '@/components/layout/PageContainer'
import { useRelances } from '@/features/crm/useCrm'
import RelanceCard from '@/components/crm/RelanceCard'

/**
 * Cockpit gérant — Relances no-show. Liste des relances (brouillon) ; le gérant édite
 * le texte et déclenche l'envoi (action humaine). React Query, 3 états, champs échappés.
 */
export default function RelancesPage() {
  const { data, isLoading, isError, refetch } = useRelances()
  const [filtre, setFiltre] = useState<'a_traiter' | 'envoyees'>('a_traiter')

  const liste = (data ?? []).filter((r) => (filtre === 'envoyees' ? r.statut === 'ENVOYEE' : r.statut !== 'ENVOYEE'))

  return (
    <>
      <Topbar title="Relances" subtitle="Relances des réservations non honorées" />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {([
              ['a_traiter', 'À traiter'],
              ['envoyees', 'Envoyées'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFiltre(id)}
                className={`rounded-pill border px-4 py-1.5 text-sm transition-colors ${
                  filtre === id ? 'border-accent bg-accent text-accent-on' : 'border-border bg-surface text-text-soft hover:border-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-sm text-muted">Chargement des relances…</p>}
          {isError && (
            <div className="text-sm">
              <p className="text-red">Erreur de chargement.</p>
              <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">
                Réessayer
              </button>
            </div>
          )}

          {!isLoading && !isError && (liste.length === 0 ? (
            <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">Aucune relance dans cette vue.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 desktop:grid-cols-2">
              {liste.map((r) => (
                <RelanceCard key={`${r.id}-${r.statut}-${r.texte ?? ''}`} relance={r} />
              ))}
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  )
}
