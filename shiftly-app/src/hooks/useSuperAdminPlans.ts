'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi } from '@/lib/superAdminApi'

/** Plan du catalogue agence. Montant en centimes. */
export interface Plan {
  id:               number
  nom:              string
  cle:              string
  prixMensuelCents: number
  actif:            boolean
  createdAt:        string
}

export interface PlanInput {
  nom:              string
  cle:              string
  prixMensuelCents: number
  actif:            boolean
}

const member = (data: unknown): Plan[] => {
  const d = data as { 'hydra:member'?: Plan[]; member?: Plan[] }
  return d['hydra:member'] ?? d.member ?? (data as Plan[])
}

/** Catalogue des plans (super-admin). */
export function usePlans() {
  return useQuery<Plan[], Error>({
    queryKey: ['superadmin', 'plans'],
    queryFn: () => superAdminApi().get('/superadmin/plans').then((r) => member(r.data)),
    retry: false,
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['superadmin', 'plans'] })
}

/** Crée un plan. Conflit de clé → 422 (UniqueEntity). */
export function useCreatePlan() {
  const invalidate = useInvalidate()
  return useMutation<Plan, Error, PlanInput>({
    mutationFn: (input) => superAdminApi().post<Plan>('/superadmin/plans', input).then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}

/** Édite un plan (prix, actif, nom). */
export function useUpdatePlan() {
  const invalidate = useInvalidate()
  return useMutation<Plan, Error, { id: number; patch: Partial<PlanInput> }>({
    mutationFn: ({ id, patch }) =>
      superAdminApi()
        .patch<Plan>(`/superadmin/plans/${id}`, patch, { headers: { 'Content-Type': 'application/merge-patch+json' } })
        .then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}
