'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Avis, AvisStatut, Contact, Relance, RelanceStatut } from './types'

const member = <T>(data: unknown): T[] => {
  const d = data as { 'hydra:member'?: T[]; member?: T[] }
  return d['hydra:member'] ?? d.member ?? (data as T[])
}

const MERGE = { headers: { 'Content-Type': 'application/merge-patch+json' } }

function useCentreQuery<T>(key: string, path: string, params?: Record<string, string>) {
  const centreId = useAuthStore((s) => s.centreId)
  return useQuery<T[], Error>({
    queryKey: [key, centreId],
    queryFn: () => api.get(path, { params }).then((r) => member<T>(r.data)),
    enabled: !!centreId,
  })
}

export const useContacts = () => useCentreQuery<Contact>('contacts', '/contacts', { 'order[updatedAt]': 'desc' })
export const useAvis = () => useCentreQuery<Avis>('avis', '/avis', { 'order[createdAt]': 'desc' })
export const useRelances = () => useCentreQuery<Relance>('relances', '/relances', { 'order[createdAt]': 'desc' })

/** Rédige une réponse d'avis via l'IA (brouillon). Peut renvoyer 429 / 503. */
export function useRedigerReponse() {
  const qc = useQueryClient()
  return useMutation<{ reponse: string }, Error, number>({
    mutationFn: (avisId) => api.post(`/avis/${avisId}/rediger-reponse`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avis'] }),
  })
}

/** Édite/valide un avis (réponse + statut). « Publier » = statut REPONDU, jamais auto. */
export function usePatchAvis() {
  const qc = useQueryClient()
  return useMutation<Avis, Error, { id: number; patch: { reponse?: string; statut?: AvisStatut } }>({
    mutationFn: ({ id, patch }) => api.patch<Avis>(`/avis/${id}`, patch, MERGE).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avis'] }),
  })
}

/** Édite le brouillon d'une relance (texte / statut). */
export function usePatchRelance() {
  const qc = useQueryClient()
  return useMutation<Relance, Error, { id: number; patch: { texte?: string; statut?: RelanceStatut } }>({
    mutationFn: ({ id, patch }) => api.patch<Relance>(`/relances/${id}`, patch, MERGE).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relances'] }),
  })
}

/** Envoie une relance (ACTION HUMAINE). L'email part côté serveur ; statut → ENVOYEE. */
export function useEnvoyerRelance() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, number>({
    mutationFn: (id) => api.post(`/relances/${id}/envoyer`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relances'] }),
  })
}
