'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import PageContainer from '@/components/layout/PageContainer'
import { useAvis } from '@/features/crm/useCrm'
import AvisCard from '@/components/crm/AvisCard'

/**
 * Cockpit gérant — Avis. Liste des avis du centre ; réponse rédigée par l'IA (brouillon)
 * puis publiée manuellement. React Query, 3 états, champs libres échappés (JSX).
 */
export default function AvisPage() {
  const { data, isLoading, isError, refetch } = useAvis()
  const [filtre, setFiltre] = useState<'tous' | 'NOUVEAU' | 'REPONDU'>('tous')

  const liste = (data ?? []).filter((a) => filtre === 'tous' || a.statut === filtre)

  return (
    <>
      <Topbar title="Avis" subtitle="Avis clients & réponses" />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {(['tous', 'NOUVEAU', 'REPONDU'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFiltre(s)}
                className={`rounded-pill border px-4 py-1.5 text-sm transition-colors ${
                  filtre === s ? 'border-accent bg-accent text-accent-on' : 'border-border bg-surface text-text-soft hover:border-accent'
                }`}
              >
                {s === 'tous' ? 'Tous' : s === 'NOUVEAU' ? 'Nouveaux' : 'Répondus'}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-sm text-muted">Chargement des avis…</p>}
          {isError && (
            <div className="text-sm">
              <p className="text-red">Erreur de chargement.</p>
              <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">
                Réessayer
              </button>
            </div>
          )}

          {!isLoading && !isError && (liste.length === 0 ? (
            <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">Aucun avis dans cette vue.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 desktop:grid-cols-2">
              {liste.map((a) => (
                <AvisCard key={`${a.id}-${a.statut}-${a.reponse ?? ''}`} avis={a} />
              ))}
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  )
}
