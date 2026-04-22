'use client'

import { useQuery } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import type { DashboardKPIs } from '@/types/superadmin'
import axios from 'axios'

function superAdminApi(token: string | null) {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export function useSuperAdminDashboard() {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<DashboardKPIs>({
    queryKey: ['superadmin', 'dashboard'],
    queryFn:  () =>
      superAdminApi(token)
        .get<DashboardKPIs>('/superadmin/dashboard')
        .then(r => r.data),
    enabled: !!token,
  })
}
