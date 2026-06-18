'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Contrat } from '@/types/staff'

const qk = (userId: number) => ['contrats', userId] as const

export function useContrats(userId: number | null) {
  return useQuery<Contrat[]>({
    queryKey: ['contrats', userId],
    queryFn:  () => api.get(`/users/${userId}/contrats`).then(r => r.data),
    enabled:  !!userId,
  })
}

export interface ContratInput {
  typeContrat:   string
  dateDebut:     string
  dateFin?:      string | null
  qualification?: string | null
  heuresHebdo?:  number | null
}

export function useCreateContrat(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ContratInput) =>
      api.post(`/users/${userId}/contrats`, payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk(userId) }),
  })
}

export function useUpdateContrat(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: ContratInput & { id: number }) =>
      api.patch(`/contrats/${id}`, payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk(userId) }),
  })
}

export function useDeleteContrat(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/contrats/${id}`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk(userId) }),
  })
}

/** Proposition IA d'un contrat extrait des documents (non persisté). */
export interface ContratSuggestion {
  typeContrat:   string
  dateDebut:     string | null
  dateFin:       string | null
  qualification: string | null
  heuresHebdo:   number | null
}

/** Génère via IA des propositions de contrats depuis les documents uploadés. */
export function useSuggestContratsFromDocs(userId: number) {
  return useMutation<{ contrats: ContratSuggestion[] }, Error>({
    mutationFn: () =>
      api.post(`/users/${userId}/contrats/suggest-from-documents`).then(r => r.data),
  })
}
