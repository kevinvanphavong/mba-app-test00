'use client'

import { useQuery } from '@tanstack/react-query'
import { superAdminApi } from '@/lib/superAdminApi'
import type { CentreDetail } from '@/types/superadmin'

export function useSuperAdminCentreDetail(centreId: number) {

  return useQuery<CentreDetail>({
    queryKey: ['superadmin', 'centre', centreId],
    queryFn:  () =>
      superAdminApi()
        .get<CentreDetail>(`/superadmin/centres/${centreId}`)
        .then(r => r.data),
    enabled: !!centreId,
    retry:   false,
  })
}
