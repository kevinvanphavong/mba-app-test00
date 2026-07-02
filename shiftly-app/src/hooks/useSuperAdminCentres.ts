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

/**
 * Export RGPD complet d'un centre : télécharge l'archive ZIP (authentifiée par le
 * cookie super-admin). L'action est tracée dans l'AuditLog côté serveur.
 */
export function useExportCentre() {
  return useMutation<void, Error, number>({
    mutationFn: async (centreId) => {
      const res  = await superAdminApi().get(`/superadmin/centres/${centreId}/export`, { responseType: 'blob' })
      const url  = URL.createObjectURL(res.data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `export-centre-${centreId}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    },
  })
}
