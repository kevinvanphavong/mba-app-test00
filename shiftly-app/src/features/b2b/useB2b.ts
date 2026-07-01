'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Devis, DevisLigne, DevisStatut, DemandeB2B } from './types'

const member = <T>(data: unknown): T[] => {
  const d = data as { 'hydra:member'?: T[]; member?: T[] }
  return d['hydra:member'] ?? d.member ?? (data as T[])
}

/** Demandes B2B du centre du gérant (isolées par le JWT côté API). */
export function useDemandes() {
  const centreId = useAuthStore((s) => s.centreId)

  return useQuery<DemandeB2B[], Error>({
    queryKey: ['demandes', centreId],
    queryFn: () => api.get('/demande_b2_bs', { params: { 'order[createdAt]': 'desc' } }).then((r) => member<DemandeB2B>(r.data)),
    enabled: !!centreId,
  })
}

/** Tous les devis du centre (le détail d'une demande retrouve le sien par demandeId). */
export function useDevis() {
  const centreId = useAuthStore((s) => s.centreId)

  return useQuery<Devis[], Error>({
    queryKey: ['devis', centreId],
    queryFn: () => api.get('/devis').then((r) => member<Devis>(r.data)),
    enabled: !!centreId,
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['devis'] })
}

/** (Re)génère le devis IA d'une demande. Peut renvoyer 429 (quota) / 503 (IA KO). */
export function useRegenererDevis() {
  const invalidate = useInvalidate()

  return useMutation<unknown, Error, number>({
    mutationFn: (demandeId) => api.post(`/demandes/${demandeId}/generer-devis`).then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}

/** Édite un devis (lignes/statut). Le total est recalculé CÔTÉ SERVEUR. */
export function usePatchDevis() {
  const invalidate = useInvalidate()

  return useMutation<Devis, Error, { id: number; patch: { lignes?: DevisLigne[]; statut?: DevisStatut } }>({
    mutationFn: ({ id, patch }) =>
      api
        .patch<Devis>(`/devis/${id}`, patch, { headers: { 'Content-Type': 'application/merge-patch+json' } })
        .then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}
