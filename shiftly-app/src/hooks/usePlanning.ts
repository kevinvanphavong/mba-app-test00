'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type {
  PlanningAlerte,
  PlanningWeekData,
  EmployeePlanningData,
  CreateShiftPayload,
  UpdateShiftPayload,
  PublishWeekPayload,
  DuplicateWeekPayload,
  MoveShiftPayload,
  PlanningSnapshotSummary,
  AbsenceType,
} from '@/types/planning'

// ─── Planning hebdo (vue Manager) ────────────────────────────────────────────

export function usePlanningWeek(weekStart: string) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<PlanningWeekData>({
    queryKey: ['planning', 'week', centreId, weekStart],
    queryFn:  () =>
      api.get('/planning/week', { params: { centreId, weekStart } }).then(r => r.data),
    enabled: !!centreId && !!weekStart,
  })
}

// ─── Alertes planning ────────────────────────────────────────────────────────

export function usePlanningAlerts(weekStart: string) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<PlanningAlerte[]>({
    queryKey: ['planning', 'alerts', centreId, weekStart],
    queryFn:  () =>
      api.get('/planning/alerts', { params: { centreId, weekStart } }).then(r => r.data),
    enabled: !!centreId && !!weekStart,
  })
}

// ─── Planning employé (3 semaines publiées) ───────────────────────────────────

export function useEmployeePlanning() {
  return useQuery<EmployeePlanningData>({
    queryKey: ['planning', 'employee'],
    queryFn:  () => api.get('/planning/employee').then(r => r.data),
  })
}

// ─── Créer un shift ───────────────────────────────────────────────────────────

export function useCreateShift() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateShiftPayload) =>
      api.post('/postes/create', payload).then(r => r.data),

    onSuccess: async () => {
      // await garantit que le refetch est terminé avant que mutateAsync resolve
      // → la modal se ferme avec des alertes déjà à jour
      await queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
    },
  })
}

// ─── Modifier un shift ────────────────────────────────────────────────────────

export function useUpdateShift() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ posteId, ...data }: UpdateShiftPayload) =>
      api.patch(`/postes/${posteId}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }).then(r => r.data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
    },
  })
}

// ─── Supprimer un shift ───────────────────────────────────────────────────────

export function useDeleteShift() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (posteId: number) =>
      api.delete(`/postes/${posteId}`).then(r => r.data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
    },
  })
}

// ─── Publier une semaine ──────────────────────────────────────────────────────
// Note : le composant appelant doit gérer onError avec status 422
// pour afficher la modal de confirmation avec saisie du motif.
// Flow : 1er appel (forcePublication: false) → 422 → modal → 2e appel (forcePublication: true + motif)

export function usePublishWeek() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PublishWeekPayload) =>
      api.post('/planning/publish', payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'employee'] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'snapshots', centreId] })
    },
  })
}

// ─── Snapshot publié actuellement visible par le staff ────────────────────────
// Utilisé par la modale "Aperçu staff" : permet au manager de visualiser ce
// que le staff voit dans son app, à comparer avec son live (potentiellement
// modifié et non encore republié).

export interface PublishedSnapshotResponse {
  weekStart:      string
  publishedAt:    string
  publishedByNom: string
  /** Le snapshot stocke un PlanningWeekData JSON figé au moment de la publish. */
  data:           PlanningWeekData
}

export function usePublishedSnapshot(weekStart: string, enabled: boolean) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<PublishedSnapshotResponse>({
    queryKey: ['planning', 'published-snapshot', centreId, weekStart],
    queryFn:  () =>
      api.get('/planning/published-snapshot', { params: { centreId, weekStart } }).then(r => r.data),
    enabled: enabled && !!centreId && !!weekStart,
    // staleTime généreux : le snapshot est immuable par définition
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Historique des snapshots (archivage légal) ───────────────────────────────

export function usePlanningSnapshots(weekStart: string) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<PlanningSnapshotSummary[]>({
    queryKey: ['planning', 'snapshots', centreId, weekStart],
    queryFn:  () =>
      api.get('/planning/snapshots', { params: { centreId, weekStart } }).then(r => r.data),
    enabled: !!centreId && !!weekStart,
  })
}

// ─── Copier un shift (drag & drop inter-jours) ───────────────────────────────
// Le drag-and-drop produit une COPIE et non un déplacement : le manager peut
// préparer les jours suivants à partir du jour présent sans altérer les
// données actuelles. La contrainte unique (service, zone, user) côté back
// rejette les doublons exacts (même date + zone + user).

export function useCopyShift() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shift, newDate }: MoveShiftPayload) =>
      api.post('/postes/create', {
        date:         newDate,
        userId:       shift.userId,
        zoneId:       shift.zoneId,
        heureDebut:   shift.heureDebut,
        heureFin:     shift.heureFin,
        pauseMinutes: shift.pauseMinutes,
      }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'alerts', centreId] })
    },
  })
}

// ─── Export PDF légal ─────────────────────────────────────────────────────────

export function useExportPlanningPdf() {
  const centreId = useAuthStore(s => s.centreId)

  return async (weekStart: string) => {
    if (!centreId) return
    // axios envoie automatiquement le header Authorization (JWT)
    const response = await api.get('/planning/export-pdf', {
      params:       { centreId, weekStart },
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href     = url
    link.download = `planning-s${weekStart}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }
}

// ─── Dupliquer une semaine ────────────────────────────────────────────────────

export function useDuplicateWeek() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DuplicateWeekPayload) =>
      api.post('/planning/duplicate', payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
    },
  })
}

// ─── Vider une semaine (supprime toutes les assignations Poste) ──────────────
// Préserve les jours déjà passés côté back. Sert à remettre une semaine à blanc
// avant d'appliquer un template ou de repartir de zéro.

export function useClearWeek() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (weekStart: string) =>
      api.delete<{ deletedCount: number }>('/planning/week', {
        params: { centreId, weekStart },
      }).then(r => r.data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'alerts', centreId] })
    },
  })
}

// ─── Créer une absence ────────────────────────────────────────────────────────

export function useCreateAbsence() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { userId: number; date: string; type: AbsenceType; motif?: string }) =>
      api.post('/planning/absence', payload).then(r => r.data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
    },
  })
}

// ─── Supprimer une absence ────────────────────────────────────────────────────

export function useDeleteAbsence() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (absenceId: number) =>
      api.delete(`/planning/absence/${absenceId}`).then(r => r.data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
    },
  })
}
