'use client'

/**
 * useValidation.ts — Hooks React Query du module Validation Hebdomadaire.
 * Toutes les requêtes sont filtrées côté API par le centre_id du JWT.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  ValidationSemaine,
  ValidationKPI,
  AlerteLegale,
  ValidationEmploye,
  CorrectionPayload,
} from '@/types/validation'

// ─── Clés de cache ────────────────────────────────────────────────────────────

const keysSemaine  = (date: string) => ['validation', 'semaine', date]
const keysKPIs     = (date: string) => ['validation', 'kpis', date]
const keysAlertes  = (date: string) => ['validation', 'alertes', date]
const keysDetail   = (userId: number, date: string) => ['validation', 'detail', userId, date]

// ─── Lecture ─────────────────────────────────────────────────────────────────

/** Charge les données complètes d'une semaine (tableau + statuts). */
export function useValidationSemaine(date: string) {
  return useQuery<ValidationSemaine>({
    queryKey: keysSemaine(date),
    queryFn:  () =>
      api.get(`/pointages/validation/semaine/${date}`).then(r => r.data),
    enabled: !!date,
  })
}

/** Charge les 5 KPIs de la semaine. */
export function useValidationKPIs(date: string) {
  return useQuery<ValidationKPI>({
    queryKey: keysKPIs(date),
    queryFn:  () =>
      api.get(`/pointages/validation/kpis/${date}`).then(r => r.data),
    enabled: !!date,
  })
}

/** Charge les alertes légales de la semaine. */
export function useValidationAlertes(date: string) {
  return useQuery<AlerteLegale[]>({
    queryKey: keysAlertes(date),
    queryFn:  () =>
      api.get(`/pointages/validation/alertes/${date}`).then(r => r.data),
    enabled: !!date,
  })
}

/** Charge le détail jour par jour d'un employé. */
export function useValidationDetail(userId: number | null, date: string) {
  return useQuery<ValidationEmploye>({
    queryKey: keysDetail(userId ?? 0, date),
    queryFn:  () =>
      api.get(`/pointages/validation/detail/${userId}/${date}`).then(r => r.data),
    enabled: !!userId && !!date,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Valide les heures d'un employé pour la semaine. */
export function useValiderEmploye(date: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) =>
      api.post(`/pointages/validation/valider/${userId}/${date}`).then(r => r.data),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: keysSemaine(date) })
      queryClient.invalidateQueries({ queryKey: keysDetail(userId, date) })
    },
  })
}

/** Valide toute la semaine d'un coup. */
export function useValiderSemaine(date: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post(`/pointages/validation/valider-semaine/${date}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keysSemaine(date) })
    },
  })
}

/** Applique une correction sur un pointage. */
export function useCorrigerPointage(date: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CorrectionPayload) =>
      api.post('/pointages/validation/correction', payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keysSemaine(date) })
    },
  })
}
