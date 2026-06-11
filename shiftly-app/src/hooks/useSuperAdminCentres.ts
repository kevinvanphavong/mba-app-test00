'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { superAdminApi } from '@/lib/superAdminApi'
import type { CentreSummary, ImpersonationData } from '@/types/superadmin'

export function useSuperAdminCentres(search = '', statut = '') {

  return useQuery<CentreSummary[]>({
    queryKey: ['superadmin', 'centres', search, statut],
    queryFn:  () =>
      superAdminApi()
        .get<CentreSummary[]>('/superadmin/centres', { params: { search, statut } })
        .then(r => r.data),
    enabled: true,
    retry:   false,
  })
}

export function useImpersonate() {
  const startImpersonation = useSuperAdminStore(s => s.startImpersonation)

  return useMutation({
    mutationFn: (centreId: number) =>
      superAdminApi()
        .post<ImpersonationData>(`/superadmin/centres/${centreId}/impersonate`)
        .then(r => r.data),
    onSuccess: (data) => startImpersonation(data),
  })
}

export function useSuspendCentre() {
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: (centreId: number) =>
      superAdminApi()
        .post(`/superadmin/centres/${centreId}/suspend`)
        .then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin', 'centres'] }),
  })
}

export function useReactivateCentre() {
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: (centreId: number) =>
      superAdminApi()
        .post(`/superadmin/centres/${centreId}/reactivate`)
        .then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin', 'centres'] }),
  })
}

export function useAddCentreNote() {
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ centreId, contenu }: { centreId: number; contenu: string }) =>
      superAdminApi()
        .post(`/superadmin/centres/${centreId}/notes`, { contenu })
        .then(r => r.data),
    onSuccess: (_data, { centreId }) =>
      qc.invalidateQueries({ queryKey: ['superadmin', 'centre', centreId] }),
  })
}
