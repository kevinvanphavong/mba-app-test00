'use client'

import { motion } from 'framer-motion'
import { STATUT_CONFIRMEE } from '@/features/public/types'
import { useReservationStatus } from '@/features/public/useReservationStatus'
import ReservationConfirmation from './ReservationConfirmation'
import { PublicLoading, PublicError } from './StateBlocks'

/**
 * Retour de paiement réussi. La confirmation passe par le webhook Stripe (async) :
 * tant que la résa n'est pas CONFIRMEE, on affiche « validation en cours » et le
 * hook repoll. 3 états : loading / error / (pending|confirmée).
 */
export default function PaymentSuccess({ reservationId }: { reservationId: number | null }) {
  const { data, isLoading, isError } = useReservationStatus(reservationId)

  if (reservationId === null || isError) return <PublicError />
  if (isLoading || !data) return <PublicLoading label="Validation du paiement…" />

  if (data.statut !== STATUT_CONFIRMEE) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-surface p-8 text-center">
        <motion.span
          className="inline-block h-3 w-3 rounded-pill bg-accent"
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <p className="font-syne text-lg font-bold text-text">Paiement reçu</p>
        <p className="max-w-sm font-sans text-sm text-muted">
          Confirmation de ta réservation en cours… cette page se met à jour automatiquement.
        </p>
      </div>
    )
  }

  return <ReservationConfirmation reservation={data} />
}
