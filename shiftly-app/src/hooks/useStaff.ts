'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { StaffResponse } from '@/types/staff'

// ─── Liste enrichie du staff ──────────────────────────────────────────────────

export function useStaff() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<StaffResponse>({
    queryKey: ['staff', centreId],
    queryFn:  () => api.get('/staff').then(r => r.data),
    enabled:  !!centreId,
  })
}

// ─── Créer un membre (éditeur staff) ─────────────────────────────────────────

interface CreateStaffPayload {
  nom:           string
  prenom?:       string | null
  email:         string
  password:      string
  role:          'MANAGER' | 'EMPLOYE'
  tailleHaut?:   string | null
  tailleBas?:    string | null
  pointure?:     string | null
  avatarColor?:  string
  heuresHebdo?:  number | null
  typeContrat?:  string | null
  codePointage?: string | null
}

export function useCreateStaff() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateStaffPayload) =>
      api.post('/editeur/staff', payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', centreId] })
    },
  })
}

// ─── Modifier un membre ───────────────────────────────────────────────────────

interface UpdateStaffPayload {
  id:            number
  nom?:          string
  prenom?:       string | null
  email?:        string
  role?:         'MANAGER' | 'EMPLOYE'
  tailleHaut?:   string | null
  tailleBas?:    string | null
  pointure?:     string | null
  actif?:        boolean
  password?:     string
  avatarColor?:  string
  heuresHebdo?:  number | null
  typeContrat?:  string | null
  codePointage?: string | null
}

export function useUpdateStaff() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateStaffPayload) =>
      api.put(`/editeur/staff/${id}`, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', centreId] })
      // Invalider aussi ['me'] au cas où le manager a modifié sa propre couleur d'avatar
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
