'use client'

import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CheckoutUrl } from './types'

/**
 * Démarre le paiement de l'acompte : demande au back l'URL Stripe Checkout pour
 * une réservation donnée (montant figé côté serveur). L'appelant redirige ensuite
 * le visiteur vers cette URL hébergée.
 */
export function useReservationCheckout() {
  return useMutation<CheckoutUrl, Error, number>({
    mutationFn: (reservationId) =>
      api
        .post<CheckoutUrl>(`/public/reservations/${reservationId}/checkout`, {}, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then((r) => r.data),
  })
}
