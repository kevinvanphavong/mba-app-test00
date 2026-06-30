'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PaymentSuccess from '@/components/public/PaymentSuccess'
import { PublicLoading } from '@/components/public/StateBlocks'

/** Retour de paiement réussi `/site/reserver/succes?reservation=<id>`. */
export default function SuccesPage() {
  return (
    <Suspense fallback={<PublicLoading label="Validation du paiement…" />}>
      <SuccesInner />
    </Suspense>
  )
}

function SuccesInner() {
  const raw = useSearchParams().get('reservation')
  const id = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null

  return <PaymentSuccess reservationId={id} />
}
