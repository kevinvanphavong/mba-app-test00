'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { STATUT_CONFIRMEE, type ReservationStatus } from './types'

/**
 * Statut public d'une réservation (page de retour paiement). Le webhook Stripe
 * confirme la résa en asynchrone : tant qu'elle n'est pas CONFIRMEE, on repoll
 * (le retour visiteur peut précéder le webhook de quelques secondes).
 */
export function useReservationStatus(id: number | null) {
  return useQuery<ReservationStatus, Error>({
    queryKey: ['reservation-status', id],
    queryFn: () => api.get<ReservationStatus>(`/public/reservations/${id}`).then((r) => r.data),
    enabled: id !== null,
    retry: false,
    refetchInterval: (query) => (query.state.data?.statut === STATUT_CONFIRMEE ? false : 3000),
  })
}
