'use client'

import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CreateReservationBody, ReservationResult } from './types'

/**
 * Crée une réservation B2C invité (POST /api/public/reservations).
 *
 * Le back exige `Content-Type: application/json` (MapRequestPayload) : on surcharge
 * l'en-tête par défaut du client axios (`application/ld+json`) pour cette mutation.
 * Aucun paiement n'est déclenché — la résa naît au statut `EN_ATTENTE_ACOMPTE`.
 */
export function useCreateReservation() {
  return useMutation<ReservationResult, Error, CreateReservationBody>({
    mutationFn: (body) =>
      api
        .post<ReservationResult>('/public/reservations', body, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then((r) => r.data),
  })
}
