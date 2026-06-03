'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { superAdminApi } from '@/lib/superAdminApi'
import type {
  LeadDetail,
  LeadFilters,
  LeadListResponse,
  LeadStats,
  LeadStatus,
} from '@/types/lead'

export function useLeads(filters: LeadFilters = {}) {
  const token = useSuperAdminStore((s) => s.token)

  return useQuery<LeadListResponse>({
    queryKey: ['superadmin', 'leads', filters],
    queryFn:  () =>
      superAdminApi(token)
        .get<LeadListResponse>('/superadmin/leads', {
          params: {
            status: filters.status || undefined,
            intent: filters.intent || undefined,
            plan:   filters.plan   || undefined,
            q:      filters.q      || undefined,
            page:   filters.page   || 1,
          },
        })
        .then((r) => r.data),
    enabled: !!token,
    retry:   false,
  })
}

export function useLead(id: number | null) {
  const token = useSuperAdminStore((s) => s.token)

  return useQuery<LeadDetail>({
    queryKey: ['superadmin', 'lead', id],
    queryFn:  () =>
      superAdminApi(token)
        .get<LeadDetail>(`/superadmin/leads/${id}`)
        .then((r) => r.data),
    enabled: !!token && !!id,
    retry:   false,
  })
}

export function useLeadsStats() {
  const token = useSuperAdminStore((s) => s.token)

  return useQuery<LeadStats>({
    queryKey: ['superadmin', 'leads', 'stats'],
    queryFn:  () =>
      superAdminApi(token)
        .get<LeadStats>('/superadmin/leads/stats')
        .then((r) => r.data),
    enabled:         !!token,
    refetchInterval: 60000,
    retry:           false,
  })
}

export function useUpdateLeadStatus() {
  const token = useSuperAdminStore((s) => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      superAdminApi(token)
        .patch<LeadDetail>(`/superadmin/leads/${id}`, { status })
        .then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'lead', id] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'leads'] })
    },
  })
}

export function useUpdateLeadNotes() {
  const token = useSuperAdminStore((s) => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      superAdminApi(token)
        .patch<LeadDetail>(`/superadmin/leads/${id}`, { notes })
        .then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'lead', id] })
    },
  })
}
