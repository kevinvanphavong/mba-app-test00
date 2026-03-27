'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { StaffMember } from '@/types/staff'

// ─── Liste du staff ───────────────────────────────────────────────────────────

export function useStaff() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<StaffMember[]>({
    queryKey: ['staff', centreId],
    queryFn:  () =>
      api.get('/users', { params: { centreId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Créer un utilisateur ─────────────────────────────────────────────────────

interface CreateUserPayload {
  nom:        string
  prenom:     string
  email:      string
  password:   string
  role:       'MANAGER' | 'EMPLOYE'
  tailleHaut?: string
  tailleBas?:  string
  pointure?:   string
}

export function useCreateUser() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      api.post('/users', { ...payload, centreId }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', centreId] })
    },
  })
}

// ─── Modifier un utilisateur ──────────────────────────────────────────────────

interface UpdateUserPayload {
  id:          number
  nom?:        string
  prenom?:     string
  email?:      string
  role?:       'MANAGER' | 'EMPLOYE'
  tailleHaut?: string
  tailleBas?:  string
  pointure?:   string
  actif?:      boolean
}

export function useUpdateUser() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUserPayload) =>
      api.patch(`/users/${id}`, payload, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', centreId] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
