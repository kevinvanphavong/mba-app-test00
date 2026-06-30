'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ReservationStatus } from '@/features/public/types'
import { formatCents } from '@/features/public/money'

/**
 * Écran de confirmation (retour paiement réussi) : la réservation est CONFIRMEE
 * côté API (acompte encaissé via le webhook Stripe signé). Affiché sur la page
 * de succès du parcours de réservation.
 */
export default function ReservationConfirmation({ reservation }: { reservation: ReservationStatus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-5 rounded-card border border-border bg-surface p-8 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent/15 text-2xl text-accent">
        ✓
      </span>
      <div>
        <h2 className="font-syne text-2xl font-bold text-text">Réservation confirmée</h2>
        <p className="mt-1 font-sans text-sm text-muted">{reservation.prestation}</p>
      </div>

      <div className="w-full max-w-sm rounded-card border border-accent/40 bg-accent/5 p-4">
        <div className="flex items-center justify-between font-sans">
          <span className="font-semibold text-text">Acompte réglé</span>
          <span className="font-syne text-xl font-bold text-accent">
            {formatCents(reservation.acompteCents)}
          </span>
        </div>
        <p className="mt-2 font-sans text-xs text-muted">
          Le solde se règle sur place. Un email de confirmation t’a été envoyé.
        </p>
      </div>

      <Link
        href="/site"
        className="rounded-pill border border-border px-5 py-2.5 font-sans text-sm font-medium text-text-soft transition-colors hover:border-accent hover:text-text"
      >
        Retour au site
      </Link>
    </motion.div>
  )
}
