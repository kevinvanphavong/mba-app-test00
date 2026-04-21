'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import type { Incident } from '@/types/index'
import type { IncidentFull } from '@/types/incident'

// ─── Liste des incidents (API Platform) ──────────────────────────────────────

export function useIncidents(serviceId?: number) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Incident[]>({
    queryKey: ['incidents', centreId, serviceId],
    queryFn:  () =>
      api.get('/incidents', { params: { centreId, serviceId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Liste complète des incidents (pour la page réglages manager) ─────────────

export function useIncidentsFull() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<IncidentFull[]>({
    queryKey: ['incidents', 'list', centreId],
    queryFn:  () =>
      api.get('/incidents/list', { params: { centreId } }).then(r => r.data),
    enabled: !!centreId,
  })
}

// ─── Créer un incident ────────────────────────────────────────────────────────

interface CreateIncidentPayload {
  titre:     string
  severite:  'haute' | 'moyenne' | 'basse'
  serviceId: number
  centreId:  number
  zoneId?:   number | null
  staffIds?: number[]
}

export function useCreateIncident() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()
  const showToast   = useToastStore(s => s.show)

  return useMutation({
    mutationFn: ({ titre, severite, serviceId, centreId: cid, zoneId, staffIds }: CreateIncidentPayload) =>
      api.post('/incidents/create', {
        titre,
        severite,
        centreId:  cid,
        serviceId,
        zoneId:   zoneId ?? null,
        staffIds: staffIds ?? [],
      }).then(r => r.data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', centreId, variables.serviceId] })
      queryClient.invalidateQueries({ queryKey: ['incidents', centreId, undefined] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', centreId] })
      showToast('Incident signalé avec succès', 'success')
    },

    onError: () => {
      showToast('Erreur lors de la création de l\'incident', 'error')
    },
  })
}

// ─── Modifier un incident (statut/sévérité simple) ────────────────────────────

interface UpdateIncidentPayload {
  id:        number
  statut?:   'OUVERT' | 'EN_COURS' | 'RESOLU'
  severite?: 'haute' | 'moyenne' | 'basse'
}

export function useUpdateIncident() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateIncidentPayload) =>
      api.put(`/incidents/${id}`, payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', centreId] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', centreId] })
    },
  })
}

// ─── Modifier un incident complet (titre, zone, staffIds, statut) ─────────────

interface UpdateIncidentFullPayload {
  id:        number
  titre?:    string
  severite?: 'haute' | 'moyenne' | 'basse'
  statut?:   'OUVERT' | 'EN_COURS' | 'RESOLU'
  zoneId?:   number | null
  staffIds?: number[]
}

export function useUpdateIncidentFull() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateIncidentFullPayload) =>
      api.patch(`/incidents/${id}/update`, payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', centreId] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', centreId] })
    },
  })
}
