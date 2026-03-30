'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Competence } from '@/types/index'

// ─── Liste des compétences d'une zone ─────────────────────────────────────────

export function useCompetences(zoneId: number | null | undefined) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Competence[]>({
    queryKey: ['competences', centreId, zoneId],
    queryFn:  () =>
      api.get('/competences', { params: { zone: `/api/zones/${zoneId}` } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId && !!zoneId,
  })
}
