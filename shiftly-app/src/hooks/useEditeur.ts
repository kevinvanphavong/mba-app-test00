'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Competence } from '@/types/index'

// ─── Liste des compétences ────────────────────────────────────────────────────

export function useCompetences(zoneId?: number) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Competence[]>({
    queryKey: ['competences', centreId, zoneId],
    queryFn:  () =>
      api.get('/competences', { params: { centreId, zoneId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Créer une compétence ─────────────────────────────────────────────────────

interface CreateCompetencePayload {
  nom:        string
  description?: string
  difficulte: 'simple' | 'avancee' | 'experimente'
  points:     number
  zoneId:     number
}

export function useCreateCompetence() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCompetencePayload) =>
      api.post('/editeur/competences', payload).then(r => r.data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['competences', centreId, variables.zoneId] })
      queryClient.invalidateQueries({ queryKey: ['competences', centreId, undefined] })
    },
  })
}

// ─── Modifier une compétence ──────────────────────────────────────────────────

interface UpdateCompetencePayload {
  id:          number
  nom?:        string
  description?: string
  difficulte?: 'simple' | 'avancee' | 'experimente'
  points?:     number
}

export function useUpdateCompetence() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCompetencePayload) =>
      api.patch(`/editeur/competences/${id}`, payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competences', centreId] })
    },
  })
}
