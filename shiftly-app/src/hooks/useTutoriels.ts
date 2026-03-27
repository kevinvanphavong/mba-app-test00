'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Tutoriel } from '@/types/tutoriel'

// ─── Liste des tutoriels ──────────────────────────────────────────────────────

export function useTutoriels() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Tutoriel[]>({
    queryKey: ['tutoriels', centreId],
    queryFn:  () =>
      api.get('/tutoriels', { params: { centreId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Marquer un tutoriel comme lu ────────────────────────────────────────────

interface MarkAsReadPayload {
  tutorielId: number
  readId:     number | null
}

export function useMarkAsRead() {
  const userId      = useAuthStore(s => s.userId)
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tutorielId, readId }: MarkAsReadPayload) => {
      if (readId) {
        // Déjà lu — retire la lecture
        return api.delete(`/tuto-reads/${readId}`).then(r => r.data)
      }
      // Marquer comme lu
      return api.post('/tuto-reads', { tutorielId, userId }).then(r => r.data)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutoriels', centreId] })
      queryClient.invalidateQueries({ queryKey: ['staff', centreId] })
    },
  })
}
