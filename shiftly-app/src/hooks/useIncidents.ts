'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Incident } from '@/types/index'

// ─── Liste des incidents ──────────────────────────────────────────────────────

export function useIncidents(serviceId?: number) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Incident[]>({
    queryKey: ['incidents', centreId, serviceId],
    queryFn:  () =>
      api.get('/incidents', { params: { centreId, serviceId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Créer un incident ────────────────────────────────────────────────────────

interface CreateIncidentPayload {
  titre:     string
  severite:  'haute' | 'moyenne' | 'basse'
  serviceId: number
  centreId:  number
  zoneId?:   number | null
  staffIds?: number[]
}

export function useCreateIncident() {
  const userId      = useAuthStore(s => s.userId)
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ titre, severite, serviceId, centreId: cid }: CreateIncidentPayload) =>
      // Endpoint custom — évite les problèmes de résolution IRI d'API Platform
      api.post('/incidents/create', {
        titre,
        severite,
        centreId:  cid,
        serviceId,
      }).then(r => r.data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', centreId, variables.serviceId] })
      queryClient.invalidateQueries({ queryKey: ['incidents', centreId, undefined] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', centreId] })
    },
  })
}

// ─── Modifier un incident ─────────────────────────────────────────────────────

interface UpdateIncidentPayload {
  id:        number
  statut?:   'OUVERT' | 'EN_COURS' | 'RESOLU'
  severite?: 'haute' | 'moyenne' | 'basse'
}

export function useUpdateIncident() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateIncidentPayload) =>
      api.put(`/incidents/${id}`, payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', centreId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', centreId] })
    },
  })
}
