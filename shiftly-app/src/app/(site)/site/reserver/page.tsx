'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePublicSite } from '@/features/public/usePublicSite'
import ReservationWizard from '@/components/public/ReservationWizard'
import { PublicLoading, PublicError } from '@/components/public/StateBlocks'

/**
 * Parcours de réservation `/site/reserver`. Données via React Query (jamais
 * fetch/useEffect). `useSearchParams` (préfill `?prestation=`) impose un Suspense
 * boundary, sinon `next build` échoue.
 */
export default function ReserverPage() {
  return (
    <Suspense fallback={<PublicLoading label="Préparation de la réservation…" />}>
      <ReserverInner />
    </Suspense>
  )
}

function ReserverInner() {
  const params = useSearchParams()
  const raw = params.get('prestation')
  const initialPrestationId = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null

  const { data, isLoading, isError, refetch } = usePublicSite()

  if (isLoading) return <PublicLoading label="Chargement des prestations…" />
  if (isError || !data) return <PublicError onRetry={() => void refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-syne text-2xl font-bold text-text">
        Réserver <span className="text-accent">·</span> {data.centre}
      </h1>
      <ReservationWizard prestations={data.prestations} initialPrestationId={initialPrestationId} />
    </div>
  )
}
