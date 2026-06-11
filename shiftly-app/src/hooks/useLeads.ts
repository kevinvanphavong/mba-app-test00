'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi } from '@/lib/superAdminApi'
import type {
  LeadDetail,
  LeadFilters,
  LeadListResponse,
  LeadStats,
  LeadStatus,
} from '@/types/lead'

export function useLeads(filters: LeadFilters = {}) {

  return useQuery<LeadListResponse>({
    queryKey: ['superadmin', 'leads', filters],
    queryFn:  () =>
      superAdminApi()
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
    enabled: true,
    retry:   false,
  })
}

export function useLead(id: number | null) {

  return useQuery<LeadDetail>({
    queryKey: ['superadmin', 'lead', id],
    queryFn:  () =>
      superAdminApi()
        .get<LeadDetail>(`/superadmin/leads/${id}`)
        .then((r) => r.data),
    enabled: !!id,
    retry:   false,
  })
}

export function useLeadsStats() {

  return useQuery<LeadStats>({
    queryKey: ['superadmin', 'leads', 'stats'],
    queryFn:  () =>
      superAdminApi()
        .get<LeadStats>('/superadmin/leads/stats')
        .then((r) => r.data),
    enabled: true,
    refetchInterval: 60000,
    retry:           false,
  })
}

export function useUpdateLeadStatus() {
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      superAdminApi()
        .patch<LeadDetail>(`/superadmin/leads/${id}`, { status })
        .then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'lead', id] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'leads'] })
    },
  })
}

export function useUpdateLeadNotes() {
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      superAdminApi()
        .patch<LeadDetail>(`/superadmin/leads/${id}`, { notes })
        .then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'lead', id] })
    },
  })
}
