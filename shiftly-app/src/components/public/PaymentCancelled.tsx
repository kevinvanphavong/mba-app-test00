'use client'

import Link from 'next/link'

/**
 * Retour de paiement annulé : la réservation reste EN_ATTENTE_ACOMPTE côté API
 * (rien n'a été encaissé). On propose de relancer le paiement.
 */
export default function PaymentCancelled() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-card border border-border bg-surface p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-border text-xl text-text-soft">
        ×
      </span>
      <h2 className="font-syne text-xl font-bold text-text">Paiement annulé</h2>
      <p className="font-sans text-sm text-muted">
        Aucun montant n’a été débité. Ta réservation est en attente de l’acompte — tu peux
        relancer le paiement quand tu veux.
      </p>
      <Link
        href="/site/reserver"
        className="mt-1 rounded-pill bg-accent px-6 py-2.5 font-sans font-semibold text-accent-on"
      >
        Reprendre la réservation
      </Link>
    </div>
  )
}
