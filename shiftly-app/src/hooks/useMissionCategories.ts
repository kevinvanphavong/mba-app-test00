'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

/**
 * Catégorie de mission — catalogue administrable par centre.
 * Le slug texte `Mission.categorie` côté entité Mission matche `.nom` ici
 * pour récupérer couleur/icône/ordre lors de l'affichage côté front.
 */
export interface MissionCategorie {
  id:      number
  nom:     string
  couleur: string
  icone:   string | null
  ordre:   number
}

interface CreatePayload {
  nom:      string
  couleur:  string
  icone?:   string | null
  ordre:    number
}

interface UpdatePayload {
  id:       number
  nom?:     string
  couleur?: string
  icone?:   string | null
  ordre?:   number
}

const KEY = (centreId: number | null) => ['mission-categories', centreId]

// ─── Liste des catégories du centre courant ──────────────────────────────────
export function useMissionCategories() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<MissionCategorie[]>({
    queryKey: KEY(centreId),
    queryFn:  () =>
      api.get('/mission_categories', {
        params: { 'centre': `/api/centres/${centreId}`, 'order[ordre]': 'asc' },
      }).then(r => {
        const raw = r.data['hydra:member'] ?? r.data.member ?? r.data
        return raw as MissionCategorie[]
      }),
    enabled: !!centreId,
  })
}

// ─── Créer ───────────────────────────────────────────────────────────────────
export function useCreateMissionCategorie() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePayload) =>
      api.post('/mission_categories', {
        ...payload,
        centre: `/api/centres/${centreId}`,
      }).then(r => r.data as MissionCategorie),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(centreId) })
    },
  })
}

// ─── Modifier (PATCH) ────────────────────────────────────────────────────────
export function useUpdateMissionCategorie() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePayload) =>
      api.patch(`/mission_categories/${id}`, payload, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }).then(r => r.data as MissionCategorie),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(centreId) })
    },
  })
}

// ─── Supprimer ───────────────────────────────────────────────────────────────
export function useDeleteMissionCategorie() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/mission_categories/${id}`).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(centreId) })
    },
  })
}
