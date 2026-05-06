'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Competence } from '@/types/index'
import type {
  EditorMission,
  EditorCompetence,
  EditorZone,
  MissionCategorie,
  MissionFrequence,
  MissionPriorite,
  DifficulteComp,
} from '@/types/editeur'

// ─── Liste des zones (format éditeur — avec missionCount + competenceCount) ──
// Utilisé par /postes pour alimenter le carousel : les compteurs sont déjà
// agrégés côté serveur, pas besoin d'un round-trip par zone.

export function useEditeurZones() {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<EditorZone[]>({
    queryKey: ['editeur-zones', centreId],
    queryFn:  () => api.get('/editeur/zones').then(r => r.data),
    enabled:  !!centreId,
  })
}

// ─── Liste des compétences ────────────────────────────────────────────────────

export function useCompetences(zoneId?: number) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<Competence[]>({
    queryKey: ['competences', centreId, zoneId],
    queryFn:  () =>
      api.get('/competences', { params: { centreId, zoneId } })
        .then(r => r.data['hydra:member'] ?? r.data.member ?? r.data),
    enabled: !!centreId,
  })
}

// ─── Créer une compétence ─────────────────────────────────────────────────────

interface CreateCompetencePayload {
  nom:        string
  description?: string
  difficulte: DifficulteComp
  points:     number
  zoneId:     number
}

export function useCreateCompetence() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation<EditorCompetence, Error, CreateCompetencePayload>({
    mutationFn: (payload) =>
      api.post('/editeur/competences', payload).then(r => r.data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['competences', centreId, variables.zoneId] })
      queryClient.invalidateQueries({ queryKey: ['competences', centreId, undefined] })
      queryClient.invalidateQueries({ queryKey: ['editeur-competences', centreId, variables.zoneId] })
      queryClient.invalidateQueries({ queryKey: ['zones', centreId] })
      queryClient.invalidateQueries({ queryKey: ['editeur-zones', centreId] })
    },
  })
}

// ─── Modifier une compétence ──────────────────────────────────────────────────

interface UpdateCompetencePayload {
  id:          number
  nom?:        string
  description?: string
  difficulte?: DifficulteComp
  points?:     number
}

export function useUpdateCompetence() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation<EditorCompetence, Error, UpdateCompetencePayload>({
    mutationFn: ({ id, ...payload }) =>
      api.put(`/editeur/competences/${id}`, payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competences', centreId] })
      queryClient.invalidateQueries({ queryKey: ['editeur-competences', centreId] })
    },
  })
}

// ─── Supprimer une compétence ─────────────────────────────────────────────────

export function useDeleteCompetence() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: (id) =>
      api.delete(`/editeur/competences/${id}`).then(() => undefined),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competences', centreId] })
      queryClient.invalidateQueries({ queryKey: ['editeur-competences', centreId] })
      queryClient.invalidateQueries({ queryKey: ['zones', centreId] })
      queryClient.invalidateQueries({ queryKey: ['editeur-zones', centreId] })
    },
  })
}

// ─── Liste des missions d'une zone (format éditeur) ───────────────────────────
// Distinct de useMissions() (qui utilise /api/missions et tape la ressource API
// Platform). Ici on lit l'endpoint custom /api/editeur/zones/{id}/missions qui
// renvoie un EditorMission (avec zoneId et zoneName aplatis).

export function useEditeurMissions(zoneId: number | null | undefined) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<EditorMission[]>({
    queryKey: ['editeur-missions', centreId, zoneId],
    queryFn:  () =>
      api.get(`/editeur/zones/${zoneId}/missions`).then(r => r.data),
    enabled: !!centreId && !!zoneId,
  })
}

// ─── Liste des compétences d'une zone (format éditeur) ────────────────────────

export function useEditeurCompetences(zoneId: number | null | undefined) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<EditorCompetence[]>({
    queryKey: ['editeur-competences', centreId, zoneId],
    queryFn:  () =>
      api.get(`/editeur/zones/${zoneId}/competences`).then(r => r.data),
    enabled: !!centreId && !!zoneId,
  })
}

// ─── Créer une mission (endpoint éditeur) ─────────────────────────────────────
// Différent de useCreateMission de useMissions.ts qui tape /missions/create
// (utilisé pour les missions ponctuelles du service du jour).

interface CreateMissionPayload {
  texte:         string
  categorie:     MissionCategorie
  frequence:     MissionFrequence
  priorite:      MissionPriorite
  ordre?:        number
  requiresPhoto: boolean
  zoneId:        number
}

export function useCreateEditeurMission() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation<EditorMission, Error, CreateMissionPayload>({
    mutationFn: (payload) =>
      api.post('/editeur/missions', payload).then(r => r.data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['editeur-missions', centreId, variables.zoneId] })
      queryClient.invalidateQueries({ queryKey: ['missions', centreId, variables.zoneId] })
      queryClient.invalidateQueries({ queryKey: ['zones', centreId] })
      queryClient.invalidateQueries({ queryKey: ['editeur-zones', centreId] })
    },
  })
}

// ─── Modifier une mission ─────────────────────────────────────────────────────

interface UpdateMissionPayload {
  id:             number
  texte?:         string
  categorie?:     MissionCategorie
  frequence?:     MissionFrequence
  priorite?:      MissionPriorite
  ordre?:         number
  requiresPhoto?: boolean
  zoneId?:        number
}

export function useUpdateEditeurMission() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation<EditorMission, Error, UpdateMissionPayload>({
    mutationFn: ({ id, ...payload }) =>
      api.put(`/editeur/missions/${id}`, payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editeur-missions', centreId] })
      queryClient.invalidateQueries({ queryKey: ['missions', centreId] })
    },
  })
}

// ─── Supprimer une mission ────────────────────────────────────────────────────

export function useDeleteEditeurMission() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: (id) =>
      api.delete(`/editeur/missions/${id}`).then(() => undefined),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editeur-missions', centreId] })
      queryClient.invalidateQueries({ queryKey: ['missions', centreId] })
      queryClient.invalidateQueries({ queryKey: ['zones', centreId] })
      queryClient.invalidateQueries({ queryKey: ['editeur-zones', centreId] })
    },
  })
}
