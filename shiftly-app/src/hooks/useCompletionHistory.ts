'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type {
  CompletionHistoryData,
  HistoryPeriod,
  ServiceTimelineData,
} from '@/types/eventlog'

/** Historique agrégé des Completions sur 7/30/90 jours. */
export function useCompletionHistory(period: HistoryPeriod) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<CompletionHistoryData>({
    queryKey: ['completion-history', centreId, period],
    queryFn:  () => api.get(`/dashboard/completion-history?period=${period}`).then(r => r.data),
    enabled:  !!centreId,
    staleTime: 60_000,
  })
}

/** Timeline brute d'un service pour la modale drill-down. */
export function useServiceTimeline(serviceId: number | null) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<ServiceTimelineData>({
    queryKey: ['completion-history', 'service', centreId, serviceId],
    queryFn:  () => api.get(`/dashboard/completion-history/services/${serviceId}`).then(r => r.data),
    enabled:  !!centreId && serviceId != null,
    staleTime: 60_000,
  })
}
