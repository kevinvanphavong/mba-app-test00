'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Zone } from '@/types/index'

// ─── Liste des zones ──────────────────────────────────────────────────────────

export function useZones() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Zone[]>({
    queryKey: ['zones', centreId],
    queryFn:  () =>
      api.get('/zones', { params: { centreId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Créer une zone ───────────────────────────────────────────────────────────

interface CreateZonePayload {
  nom:     string
  couleur: string
  ordre:   number
}

export function useCreateZone() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateZonePayload) =>
      api.post('/zones', { ...payload, centreId }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', centreId] })
    },
  })
}

// ─── Modifier une zone ────────────────────────────────────────────────────────

interface UpdateZonePayload {
  id:       number
  nom?:     string
  couleur?: string
  ordre?:   number
}

export function useUpdateZone() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateZonePayload) =>
      api.patch(`/zones/${id}`, payload, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', centreId] })
    },
  })
}

// ─── Supprimer une zone ───────────────────────────────────────────────────────

export function useDeleteZone() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/zones/${id}`).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', centreId] })
      queryClient.invalidateQueries({ queryKey: ['missions', centreId] })
    },
  })
}
