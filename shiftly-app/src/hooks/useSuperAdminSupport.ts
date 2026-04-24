'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { superAdminApi } from '@/lib/superAdminApi'
import type {
  SupportTicketSummary,
  SupportTicketDetail,
  SupportStats,
  TicketStatut,
  TicketPriorite,
} from '@/types/support'

interface TicketFilters {
  statut?:    string
  priorite?:  string
  categorie?: string
  centre?:    string
  search?:    string
}

export function useSuperAdminTickets(filters: TicketFilters = {}) {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<SupportTicketSummary[]>({
    queryKey: ['superadmin', 'tickets', filters],
    queryFn:  () => superAdminApi(token).get<SupportTicketSummary[]>('/superadmin/support', { params: filters }).then(r => r.data),
    enabled:  !!token,
    retry:    false,
  })
}

export function useSuperAdminTicketDetail(ticketId: number | null) {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<SupportTicketDetail>({
    queryKey: ['superadmin', 'ticket', ticketId],
    queryFn:  () => superAdminApi(token).get<SupportTicketDetail>(`/superadmin/support/${ticketId}`).then(r => r.data),
    enabled:  !!token && !!ticketId,
    retry:    false,
  })
}

export function useSupportStats() {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<SupportStats>({
    queryKey: ['superadmin', 'support', 'stats'],
    queryFn:  () => superAdminApi(token).get<SupportStats>('/superadmin/support/stats').then(r => r.data),
    enabled:  !!token,
    refetchInterval: 30000,
    retry:    false,
  })
}

export function useReplyTicket() {
  const token = useSuperAdminStore(s => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, message, interne, files }: {
      ticketId: number
      message:  string
      interne:  boolean
      files?:   File[]
    }) => {
      const fd = new FormData()
      fd.append('message', message)
      fd.append('interne', interne ? '1' : '0')
      ;(files ?? []).forEach(f => fd.append('attachments[]', f))

      return superAdminApi(token).post(`/superadmin/support/${ticketId}/reply`, fd).then(r => r.data)
    },
    onSuccess: (_d, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'tickets'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'support', 'stats'] })
    },
  })
}

export function useChangeTicketStatus() {
  const token = useSuperAdminStore(s => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, statut }: { ticketId: number; statut: TicketStatut }) =>
      superAdminApi(token).patch(`/superadmin/support/${ticketId}/status`, { statut }).then(r => r.data),
    onSuccess: (_d, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'tickets'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'support', 'stats'] })
    },
  })
}

export function useChangeTicketPriority() {
  const token = useSuperAdminStore(s => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, priorite }: { ticketId: number; priorite: TicketPriorite }) =>
      superAdminApi(token).patch(`/superadmin/support/${ticketId}/priority`, { priorite }).then(r => r.data),
    onSuccess: (_d, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'tickets'] })
    },
  })
}
