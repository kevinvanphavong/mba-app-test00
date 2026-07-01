'use client'

import { useMemo, useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import PageContainer from '@/components/layout/PageContainer'
import { useDemandes, useDevis } from '@/features/b2b/useB2b'
import type { Devis } from '@/features/b2b/types'
import DemandeRow from '@/components/demandes/DemandeRow'
import DemandeDetail from '@/components/demandes/DemandeDetail'

const STATUTS = ['NOUVELLE', 'EN_COURS', 'DEVIS_ENVOYE', 'CLOTUREE'] as const

/**
 * Cockpit gérant — Demandes B2B. Liste des demandes du centre + détail avec l'éditeur
 * de devis. Isolation par le centre du JWT côté API. React Query, 3 états.
 */
export default function DemandesPage() {
  const demandes = useDemandes()
  const devisQuery = useDevis()
  const [statut, setStatut] = useState<string>('TOUTES')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const devisParDemande = useMemo(() => {
    const map = new Map<number, Devis>()
    for (const d of devisQuery.data ?? []) if (d.demandeId !== null) map.set(d.demandeId, d)
    return map
  }, [devisQuery.data])

  return (
    <>
      <Topbar title="Demandes B2B" subtitle="Demandes de devis reçues" />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {['TOUTES', ...STATUTS].map((s) => (
              <button
                key={s}
                onClick={() => setStatut(s)}
                className={`rounded-pill border px-4 py-1.5 text-sm transition-colors ${
                  statut === s ? 'border-accent bg-accent text-accent-on' : 'border-border bg-surface text-text-soft hover:border-accent'
                }`}
              >
                {s === 'TOUTES' ? 'Toutes' : s.replace('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>

          {demandes.isLoading && <p className="text-sm text-muted">Chargement des demandes…</p>}
          {demandes.isError && (
            <div className="text-sm">
              <p className="text-red">Erreur de chargement.</p>
              <button onClick={() => void demandes.refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">
                Réessayer
              </button>
            </div>
          )}

          {!demandes.isLoading && !demandes.isError && demandes.data && (
            <Contenu
              demandes={demandes.data.filter((d) => statut === 'TOUTES' || d.statut === statut)}
              devisParDemande={devisParDemande}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </PageContainer>
    </>
  )
}

function Contenu({
  demandes,
  devisParDemande,
  selectedId,
  onSelect,
}: {
  demandes: import('@/features/b2b/types').DemandeB2B[]
  devisParDemande: Map<number, import('@/features/b2b/types').Devis>
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  const selected = demandes.find((d) => d.id === selectedId) ?? null

  if (demandes.length === 0) {
    return <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">Aucune demande dans cette vue.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col gap-2">
        {demandes.map((d) => (
          <DemandeRow key={d.id} demande={d} actif={d.id === selectedId} onSelect={() => onSelect(d.id)} />
        ))}
      </div>
      <div>
        {selected ? (
          <DemandeDetail demande={selected} devis={devisParDemande.get(selected.id) ?? null} />
        ) : (
          <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
            Sélectionne une demande pour voir le détail et le devis.
          </p>
        )}
      </div>
    </div>
  )
}
