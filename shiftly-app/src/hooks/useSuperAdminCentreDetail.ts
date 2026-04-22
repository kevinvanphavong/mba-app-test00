'use client'

import { useQuery } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import type { CentreDetail } from '@/types/superadmin'
import axios from 'axios'

function superAdminApi(token: string | null) {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export function useSuperAdminCentreDetail(centreId: number) {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<CentreDetail>({
    queryKey: ['superadmin', 'centre', centreId],
    queryFn:  () =>
      superAdminApi(token)
        .get<CentreDetail>(`/superadmin/centres/${centreId}`)
        .then(r => r.data),
    enabled: !!token && !!centreId,
  })
}
