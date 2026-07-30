'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Prestation, PrestationInput } from './types'

const member = <T>(data: unknown): T[] => {
  const d = data as { 'hydra:member'?: T[]; member?: T[] }
  return d['hydra:member'] ?? d.member ?? (data as T[])
}

const MERGE = { headers: { 'Content-Type': 'application/merge-patch+json' } }

/** Prestations du centre du gérant (triées par ordre), isolées par le JWT côté API. */
export function usePrestations() {
  const centreId = useAuthStore((s) => s.centreId)
  return useQuery<Prestation[], Error>({
    queryKey: ['prestations-crud', centreId],
    queryFn: () => api.get('/prestations', { params: { 'order[ordre]': 'asc' } }).then((r) => member<Prestation>(r.data)),
    enabled: !!centreId,
  })
}

function usePrestationInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['prestations-crud'] })
}

/** Le centre pose le tenant côté serveur : on n'envoie jamais de `centre`. */
export function useCreatePrestation() {
  const invalidate = usePrestationInvalidate()
  return useMutation<Prestation, Error, PrestationInput>({
    mutationFn: (input) => api.post<Prestation>('/prestations', input).then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}

export function useUpdatePrestation() {
  const invalidate = usePrestationInvalidate()
  return useMutation<Prestation, Error, { id: number; patch: Partial<PrestationInput> }>({
    mutationFn: ({ id, patch }) => api.patch<Prestation>(`/prestations/${id}`, patch, MERGE).then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}

export function useDeletePrestation() {
  const invalidate = usePrestationInvalidate()
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(`/prestations/${id}`).then(() => undefined),
    onSuccess: () => invalidate(),
  })
}
