'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

/**
 * Bannière de retour après le Checkout d'ABONNEMENT (le gérant paie son abonnement Shiftly
 * et revient sur /reglages?abonnement=ok|annule). Confirmation lisible, pas de 3 états requis.
 */
export default function AbonnementBanner() {
  const etat = useSearchParams().get('abonnement')

  if (etat === 'ok') {
    return (
      <div className="mb-4 rounded-[18px] border border-green/40 bg-green/10 px-4 py-3.5">
        <div className="font-semibold text-[14px] text-green">Abonnement activé ✓</div>
        <p className="text-[12px] text-muted mt-0.5">Ton paiement est confirmé. Bienvenue sur Shiftly !</p>
        <Link href="/dashboard" className="mt-2 inline-block text-[13px] font-medium text-accent hover:underline">
          Aller au tableau de bord →
        </Link>
      </div>
    )
  }

  if (etat === 'annule') {
    return (
      <div className="mb-4 rounded-[18px] border border-border bg-surface2 px-4 py-3.5">
        <div className="font-semibold text-[14px]">Paiement annulé</div>
        <p className="text-[12px] text-muted mt-0.5">Aucun montant n'a été débité. Tu peux réessayer quand tu veux.</p>
      </div>
    )
  }

  return null
}
