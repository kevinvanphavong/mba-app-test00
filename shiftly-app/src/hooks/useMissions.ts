'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Mission } from '@/types/index'

// ─── Liste des missions d'une zone ────────────────────────────────────────────

export function useMissions(zoneId: number | null | undefined) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Mission[]>({
    queryKey: ['missions', centreId, zoneId],
    queryFn:  () =>
      api.get('/missions', { params: { zone: `/api/zones/${zoneId}` } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId && !!zoneId,
  })
}

// ─── Créer une mission ────────────────────────────────────────────────────────

interface CreateMissionPayload {
  texte:      string
  categorie:  'OUVERTURE' | 'PENDANT' | 'MENAGE' | 'FERMETURE'
  frequence:  'FIXE' | 'PONCTUELLE'
  priorite:   'vitale' | 'important' | 'ne_pas_oublier'
  ordre?:     number
  zoneId:     number
  serviceId?: number
}

export function useCreateMission() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMissionPayload) =>
      // Endpoint custom — évite les problèmes de résolution IRI d'API Platform
      api.post('/missions/create', {
        texte:     payload.texte,
        categorie: payload.categorie,
        frequence: payload.frequence,
        priorite:  payload.priorite,
        ordre:     payload.ordre ?? 0,
        zoneId:    payload.zoneId,
        ...(payload.serviceId ? { serviceId: payload.serviceId } : {}),
      }).then(r => r.data),

    onSuccess: () => {
      // Invalide les données du service du jour pour afficher la nouvelle mission
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
      queryClient.invalidateQueries({ queryKey: ['missions', centreId] })
    },
  })
}

// ─── Cocher / décocher une mission ────────────────────────────────────────────

interface ToggleCompletionPayload {
  missionId:    number
  posteId:      number         // requis pour POST completion
  completionId: number | null  // non-null → DELETE, null → POST
}

export function useToggleCompletion() {
  const userId      = useAuthStore(s => s.userId)
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ missionId, posteId, completionId }: ToggleCompletionPayload): Promise<{ id: number } | null> => {
      if (completionId) {
        // Décocher → supprime la completion
        return api.delete(`/completions/${completionId}`).then(() => null)
      }
      // Cocher → endpoint custom (évite les problèmes de résolution IRI API Platform)
      return api.post('/completions/create', { posteId, missionId })
        .then(r => r.data as { id: number })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', centreId] })
    },
  })
}
