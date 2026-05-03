'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { findTodayService } from '@/lib/serviceUtils'
import type { ServicePageData } from '@/types/service'
import type { Service, ServiceListItem } from '@/types/index'

// ─── Service du jour ──────────────────────────────────────────────────────────

export function useServiceToday() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<ServicePageData>({
    queryKey: ['service', 'today', centreId],
    queryFn:  () => api.get(`/service/today?centreId=${centreId}`).then(r => r.data),
    enabled:  !!centreId,
  })
}

// ─── Liste des services ───────────────────────────────────────────────────────

export function useServices() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Service[]>({
    queryKey: ['services', centreId],
    queryFn:  () =>
      api.get('/services', { params: { centreId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Retirer un membre d'une zone (supprimer un poste) ────────────────────────

export function useDeletePoste() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()
  const showToast   = useToastStore(s => s.show)

  return useMutation({
    mutationFn: (posteId: number) =>
      api.delete(`/postes/${posteId}`).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
      queryClient.invalidateQueries({ queryKey: ['services', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', centreId] })
    },

    // 409 Conflict : remontée par PostePreRemoveListener quand le pointage du
    // staff est déjà commencé. On affiche le `detail` du serveur via toast.
    // Pour les autres erreurs, message générique.
    onError: (error: unknown) => {
      const e = error as { response?: { status?: number; data?: { detail?: string } } }
      const detail = e?.response?.data?.detail
      if (e?.response?.status === 409 && detail) {
        showToast(detail, 'error')
      } else {
        showToast('Impossible de retirer ce membre.', 'error')
      }
    },
  })
}

// ─── Affecter un membre à une zone pour un service ────────────────────────────

interface CreatePostePayload {
  serviceId: number
  zoneId:    number
  userId:    number
}

export function useCreatePoste() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePostePayload) =>
      // Endpoint custom — évite les problèmes de résolution IRI d'API Platform
      api.post('/postes/create', payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
      queryClient.invalidateQueries({ queryKey: ['services', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', centreId] })
    },
  })
}

// ─── Liste enrichie des services (planning) ───────────────────────────────────

export function useServicesList() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<ServiceListItem[]>({
    queryKey: ['services', 'list', centreId],
    queryFn:  () =>
      api.get('/services/list', { params: { centreId } }).then(r => r.data),
    enabled: !!centreId,
  })
}

// ─── Service du jour (depuis la liste) ───────────────────────────────────────

export function useTodayService(): ServiceListItem | undefined {
  const { data: services = [] } = useServicesList()
  return findTodayService(services)
}

// ─── Créer un service ─────────────────────────────────────────────────────────

interface CreateServicePayload {
  date:         string     // 'YYYY-MM-DD'
  heureDebut:   string     // 'HH:mm'
  heureFin:     string     // 'HH:mm'
  managerIds?:  number[]
}

export function useCreateService() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateServicePayload) =>
      // centreId extrait du JWT côté backend — ne pas l'envoyer dans le body
      api.post('/services/create', payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
    },
  })
}

// ─── Modifier un service (statut, heures) ─────────────────────────────────────

interface UpdateServicePayload {
  serviceId:  number
  statut?:    'PLANIFIE' | 'EN_COURS' | 'TERMINE'
  heureDebut?: string
  heureFin?:   string
}

export function useUpdateService() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ serviceId, ...data }: UpdateServicePayload) =>
      api.patch(`/services/${serviceId}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
    },
  })
}

// ─── Ajouter / modifier la note d'un service ──────────────────────────────────

export function useAddServiceNote() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ serviceId, note }: { serviceId: number; note: string }) =>
      api.patch(`/services/${serviceId}`, { note }, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
    },
  })
}

// ─── Supprimer un service ─────────────────────────────────────────────────────

export function useDeleteService() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceId: number) =>
      api.delete(`/services/${serviceId}`).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'list', centreId] })
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
    },
  })
}
