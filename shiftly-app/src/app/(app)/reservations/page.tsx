'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import PageContainer from '@/components/layout/PageContainer'
import { useReservations, filtrer } from '@/features/reservations/useReservations'
import type { ReservationFiltre } from '@/features/reservations/types'
import ReservationFilters from '@/components/reservations/ReservationFilters'
import ReservationRow from '@/components/reservations/ReservationRow'
import ReservationDetail from '@/components/reservations/ReservationDetail'

/**
 * Cockpit gérant — écran Réservations (lecture seule). Les réservations sont isolées
 * par le centre du JWT côté API. React Query, 3 états, filtres à venir/passées/statut.
 */
export default function ReservationsPage() {
  const { data, isLoading, isError, refetch } = useReservations()
  const [filtre, setFiltre] = useState<ReservationFiltre>('a_venir')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <>
      <Topbar title="Réservations" subtitle="Réservations de votre établissement" />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <ReservationFilters actif={filtre} onChange={setFiltre} />

          {isLoading && <p className="text-sm text-muted">Chargement des réservations…</p>}

          {isError && (
            <div className="text-sm">
              <p className="text-red">Erreur de chargement.</p>
              <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">
                Réessayer
              </button>
            </div>
          )}

          {!isLoading && !isError && data && <Liste data={data} filtre={filtre} selectedId={selectedId} onSelect={setSelectedId} />}
        </div>
      </PageContainer>
    </>
  )
}

function Liste({
  data,
  filtre,
  selectedId,
  onSelect,
}: {
  data: import('@/features/reservations/types').Reservation[]
  filtre: ReservationFiltre
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  const liste = filtrer(data, filtre)
  const selected = liste.find((r) => r.id === selectedId) ?? null

  if (liste.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
        Aucune réservation dans cette vue.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        {liste.map((r) => (
          <ReservationRow key={r.id} reservation={r} actif={r.id === selectedId} onSelect={() => onSelect(r.id)} />
        ))}
      </div>
      <div className="desktop:sticky desktop:top-4 desktop:self-start">
        {selected ? (
          <ReservationDetail reservation={selected} />
        ) : (
          <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
            Sélectionne une réservation pour voir le détail.
          </p>
        )}
      </div>
    </div>
  )
}
