'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanningTemplateSummary {
  id:           number
  nom:          string
  createdAt:    string
  createdBy:    { id: number | null; nom: string }
  shiftCount:   number
  absenceCount: number
}

export interface PlanningTemplateShift {
  id:           number
  zoneId:       number | null
  userId:       number | null
  dayOfWeek:    number          // 0 = lundi, 6 = dimanche
  heureDebut:   string | null
  heureFin:     string | null
  pauseMinutes: number
}

export interface PlanningTemplateAbsence {
  id:        number
  userId:    number | null
  dayOfWeek: number          // 0 = lundi, 6 = dimanche
  type:      'CP' | 'RTT' | 'MALADIE' | 'REPOS' | 'EVENEMENT_FAMILLE' | 'AUTRE'
  motif:     string | null
}

export interface PlanningTemplate extends PlanningTemplateSummary {
  shifts:   PlanningTemplateShift[]
  absences: PlanningTemplateAbsence[]
}

export interface ApplyTemplateReport {
  /** Postes (shifts) appliqués */
  created:          number
  skippedOrphan:    number   // shift sans user (employé supprimé)
  skippedPast:      number   // jour cible antérieur au service du jour
  skippedDuplicate: number   // legacy (devrait être 0 depuis le mode replace)

  /** Postes existants supprimés avant ré-écriture (template = source de vérité) */
  replacedExisting: number

  /** Absences appliquées (REPOS, CP, etc.) */
  absencesCreated:          number
  absencesSkippedOrphan:    number
  absencesSkippedPast:      number
  absencesSkippedDuplicate: number
}

// ─── Liste des templates du centre ───────────────────────────────────────────

export function usePlanningTemplates() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<PlanningTemplateSummary[]>({
    queryKey: ['planning', 'templates', centreId],
    queryFn:  () => api.get<PlanningTemplateSummary[]>('/planning/templates').then(r => r.data),
    enabled:  !!centreId,
  })
}

// ─── Création depuis une semaine source ──────────────────────────────────────

export function useCreatePlanningTemplate() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ nom, weekStart }: { nom: string; weekStart: string }) =>
      api.post<PlanningTemplate>('/planning/templates', { nom, weekStart }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'templates', centreId] })
    },
  })
}

// ─── Suppression ─────────────────────────────────────────────────────────────

export function useDeletePlanningTemplate() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      api.delete<void>(`/planning/templates/${id}`).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'templates', centreId] })
    },
  })
}

// ─── Application sur une semaine cible (le template écrase l'existant) ──────

export function useApplyPlanningTemplate() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, weekStart }: { id: number; weekStart: string }) =>
      api.post<ApplyTemplateReport>(`/planning/templates/${id}/apply`, { weekStart }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'alerts', centreId] })
    },
  })
}
