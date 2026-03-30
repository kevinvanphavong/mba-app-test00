'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { TutorielAPI } from '@/types/tutoriel'

// ─── Liste des tutoriels du centre ────────────────────────────────────────────

export function useTutoriels() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<TutorielAPI[]>({
    queryKey: ['tutoriels', centreId],
    queryFn:  () =>
      api.get('/tutoriels', { params: { centreId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Lectures de l'utilisateur courant ────────────────────────────────────────

interface TutoReadItem {
  id:         number
  tutorielId: number
}

/** Retourne les tutoriels lus par l'utilisateur sous forme { id, tutorielId }[] */
export function useTutoReads(userId: number | null | undefined) {
  return useQuery<TutoReadItem[]>({
    queryKey: ['tutoReads', userId],
    queryFn:  () =>
      api.get('/tuto_reads', { params: { user: `/api/users/${userId}` } })
        .then(r => {
          const members = r.data['hydra:member'] ?? r.data.member ?? r.data
          return members.map((tr: { id: number; tutoriel: string | { id: number } }) => ({
            id: tr.id,
            // L'API Platform retourne l'IRI "/api/tutoriels/3" ou un objet
            tutorielId: typeof tr.tutoriel === 'string'
              ? parseInt(tr.tutoriel.split('/').pop() ?? '0')
              : tr.tutoriel.id,
          }))
        }),
    enabled: !!userId,
  })
}

// ─── Marquer / démarquer un tutoriel comme lu ─────────────────────────────────

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
        // Déjà lu — retire la lecture (underscore = URL API Platform)
        return api.delete(`/tuto_reads/${readId}`).then(() => null)
      }
      // Marquer comme lu via endpoint custom (accepte des IDs entiers)
      return api.post('/tuto-reads/create', { tutorielId }).then(r => r.data)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutoriels', centreId] })
      queryClient.invalidateQueries({ queryKey: ['tutoReads', userId] })
      queryClient.invalidateQueries({ queryKey: ['staff', centreId] })
    },
  })
}
