'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { DashboardData } from '@/types/dashboard'

export function useDashboard() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<DashboardData>({
    queryKey: ['dashboard', centreId],
    queryFn:  () => api.get(`/dashboard/${centreId}`).then(r => r.data),
    enabled:  !!centreId,
  })
}
