'use client'

import { useQuery } from '@tanstack/react-query'
import { superAdminApi } from '@/lib/superAdminApi'
import type { DashboardKPIs } from '@/types/superadmin'

export function useSuperAdminDashboard() {

  return useQuery<DashboardKPIs>({
    queryKey: ['superadmin', 'dashboard'],
    queryFn:  () =>
      superAdminApi()
        .get<DashboardKPIs>('/superadmin/dashboard')
        .then(r => r.data),
    enabled: true,
    retry:   false,
  })
}
