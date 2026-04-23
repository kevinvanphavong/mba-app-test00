'use client'

import { useQuery } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { superAdminApi } from '@/lib/superAdminApi'
import type { DashboardKPIs } from '@/types/superadmin'

export function useSuperAdminDashboard() {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<DashboardKPIs>({
    queryKey: ['superadmin', 'dashboard'],
    queryFn:  () =>
      superAdminApi(token)
        .get<DashboardKPIs>('/superadmin/dashboard')
        .then(r => r.data),
    enabled: !!token,
    retry:   false,
  })
}
