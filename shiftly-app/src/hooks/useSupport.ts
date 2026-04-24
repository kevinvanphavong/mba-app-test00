'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  MyTicketSummary,
  MyTicketDetail,
  SupportNotifications,
} from '@/types/support'

export function useMyTickets() {
  return useQuery<MyTicketSummary[]>({
    queryKey: ['support', 'my-tickets'],
    queryFn:  () => api.get<MyTicketSummary[]>('/support/mes-tickets').then(r => r.data),
  })
}

export function useMyTicketDetail(ticketId: number | null) {
  return useQuery<MyTicketDetail>({
    queryKey: ['support', 'my-ticket', ticketId],
    queryFn:  () => api.get<MyTicketDetail>(`/support/mes-tickets/${ticketId}`).then(r => r.data),
    enabled:  !!ticketId,
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      sujet:     string
      message:   string
      categorie: string
      priorite:  string
      files?:    File[]
    }) => {
      const fd = new FormData()
      fd.append('sujet',     data.sujet)
      fd.append('message',   data.message)
      fd.append('categorie', data.categorie)
      fd.append('priorite',  data.priorite)
      ;(data.files ?? []).forEach(f => fd.append('attachments[]', f))

      return api.post<{ id: number }>('/support', fd).then(r => r.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support', 'my-tickets'] }),
  })
}

export function useReplyToMyTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, message, files }: { ticketId: number; message: string; files?: File[] }) => {
      const fd = new FormData()
      fd.append('message', message)
      ;(files ?? []).forEach(f => fd.append('attachments[]', f))
      return api.post(`/support/mes-tickets/${ticketId}/reply`, fd).then(r => r.data)
    },
    onSuccess: (_d, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ['support', 'my-ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['support', 'my-tickets'] })
    },
  })
}

export function useSupportNotifications() {
  return useQuery<SupportNotifications>({
    queryKey: ['support', 'notifications'],
    queryFn:  () => api.get<SupportNotifications>('/support/notifications').then(r => r.data),
    refetchInterval: 30000,
  })
}
