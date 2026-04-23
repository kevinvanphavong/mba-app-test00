'use client'

import { useQuery } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { superAdminApi } from '@/lib/superAdminApi'
import type { CentreDetail } from '@/types/superadmin'

export function useSuperAdminCentreDetail(centreId: number) {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<CentreDetail>({
    queryKey: ['superadmin', 'centre', centreId],
    queryFn:  () =>
      superAdminApi(token)
        .get<CentreDetail>(`/superadmin/centres/${centreId}`)
        .then(r => r.data),
    enabled: !!token && !!centreId,
    retry:   false,
  })
}
