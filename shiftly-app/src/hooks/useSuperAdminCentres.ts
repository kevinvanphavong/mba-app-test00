'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { superAdminApi } from '@/lib/superAdminApi'
import type { CentreSummary, ImpersonationData } from '@/types/superadmin'

export function useSuperAdminCentres(search = '', statut = '') {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<CentreSummary[]>({
    queryKey: ['superadmin', 'centres', search, statut],
    queryFn:  () =>
      superAdminApi(token)
        .get<CentreSummary[]>('/superadmin/centres', { params: { search, statut } })
        .then(r => r.data),
    enabled: !!token,
    retry:   false,
  })
}

export function useImpersonate() {
  const token              = useSuperAdminStore(s => s.token)
  const startImpersonation = useSuperAdminStore(s => s.startImpersonation)

  return useMutation({
    mutationFn: (centreId: number) =>
      superAdminApi(token)
        .post<ImpersonationData>(`/superadmin/centres/${centreId}/impersonate`)
        .then(r => r.data),
    onSuccess: (data) => startImpersonation(data),
  })
}

export function useSuspendCentre() {
  const token = useSuperAdminStore(s => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: (centreId: number) =>
      superAdminApi(token)
        .post(`/superadmin/centres/${centreId}/suspend`)
        .then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin', 'centres'] }),
  })
}

export function useReactivateCentre() {
  const token = useSuperAdminStore(s => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: (centreId: number) =>
      superAdminApi(token)
        .post(`/superadmin/centres/${centreId}/reactivate`)
        .then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin', 'centres'] }),
  })
}

export function useAddCentreNote() {
  const token = useSuperAdminStore(s => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ centreId, contenu }: { centreId: number; contenu: string }) =>
      superAdminApi(token)
        .post(`/superadmin/centres/${centreId}/notes`, { contenu })
        .then(r => r.data),
    onSuccess: (_data, { centreId }) =>
      qc.invalidateQueries({ queryKey: ['superadmin', 'centre', centreId] }),
  })
}
