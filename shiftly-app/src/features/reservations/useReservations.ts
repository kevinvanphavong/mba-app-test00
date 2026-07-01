'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Reservation, ReservationFiltre } from './types'

/**
 * Réservations du centre du gérant (isolées par le JWT côté API : CentreQueryExtension
 * + ReservationVoter). React Query — jamais fetch/useEffect. Triées créneau décroissant.
 */
export function useReservations() {
  const centreId = useAuthStore((s) => s.centreId)

  return useQuery<Reservation[], Error>({
    queryKey: ['reservations', centreId],
    queryFn: () =>
      api
        .get('/reservations', { params: { 'order[dateCreneau]': 'desc' } })
        .then((r) => (r.data['hydra:member'] ?? r.data.member ?? r.data) as Reservation[]),
    enabled: !!centreId,
  })
}

/** Filtre client (à venir / passées / par statut) sur la liste chargée. */
export function filtrer(reservations: Reservation[], filtre: ReservationFiltre): Reservation[] {
  const maintenant = Date.now()

  switch (filtre) {
    case 'a_venir':
      return reservations.filter((r) => new Date(r.dateCreneau).getTime() >= maintenant)
    case 'passees':
      return reservations.filter((r) => new Date(r.dateCreneau).getTime() < maintenant)
    case 'confirmees':
      return reservations.filter((r) => r.statut === 'CONFIRMEE')
    case 'en_attente':
      return reservations.filter((r) => r.statut === 'EN_ATTENTE_ACOMPTE')
  }
}
