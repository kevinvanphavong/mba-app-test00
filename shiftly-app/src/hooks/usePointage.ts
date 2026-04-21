'use client'

/**
 * usePointage.ts — Hooks du module Pointage.
 * Polling 15s sur usePointageService pour maintenir les KPIs et durées à jour.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  PointageServiceData,
  PinPayload,
  PauseStartPayload,
} from '@/types/pointage'

// ─── Clé de cache partagée ────────────────────────────────────────────────────

const key = (serviceId: number) => ['pointage', serviceId]

// ─── Lecture ─────────────────────────────────────────────────────────────────

/** Charge les pointages d'un service avec polling toutes les 15 secondes. */
export function usePointageService(serviceId: number | null) {
  return useQuery<PointageServiceData>({
    queryKey: serviceId ? key(serviceId) : ['pointage', null],
    queryFn:  () =>
      api.get(`/pointage/service/${serviceId}`).then(r => r.data),
    enabled:         !!serviceId,
    refetchInterval: 15_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Pointer l'arrivée d'un employé. */
export function usePointageArrivee(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PinPayload }) =>
      api.post(`/pointage/${id}/arrivee`, payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(serviceId) }),
  })
}

/** Pointer le départ d'un employé. */
export function usePointageDepart(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PinPayload }) =>
      api.post(`/pointage/${id}/depart`, payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(serviceId) }),
  })
}

/** Démarrer une pause. */
export function usePointagePauseStart(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PauseStartPayload }) =>
      api.post(`/pointage/${id}/pause/start`, payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(serviceId) }),
  })
}

/** Terminer une pause. */
export function usePointagePauseEnd(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PinPayload }) =>
      api.post(`/pointage/${id}/pause/end`, payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(serviceId) }),
  })
}

/** Marquer un employé absent (manager only, pas de PIN). */
export function usePointageAbsence(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, commentaire }: { id: number; commentaire?: string }) =>
      api.post(`/pointage/${id}/absence`, { commentaire }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(serviceId) }),
  })
}

/** Clôturer tous les pointages ouverts d'un service. */
export function usePointageCloturerService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceId: number) =>
      api.post(`/pointage/cloturer-service/${serviceId}`).then(r => r.data),
    onSuccess: (_data, serviceId) =>
      queryClient.invalidateQueries({ queryKey: key(serviceId) }),
  })
}
