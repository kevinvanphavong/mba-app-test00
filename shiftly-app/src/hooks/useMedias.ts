'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Media,
  MediaEntityType,
  MediaUrlResponse,
  MediaUploadResponse,
} from '@/types/media'

// ─── Liste des médias d'une entité parente ────────────────────────────────────

const endpointFor = (type: MediaEntityType, id: number): string => {
  // Pluriel français : mission → missions, tutoriel → tutoriels
  if (type === 'mission')          return `/missions/${id}/medias`
  if (type === 'tutoriel')         return `/tutoriels/${id}/medias`
  if (type === 'employe_document') return `/users/${id}/documents`
  throw new Error(`Type d'entité non supporté côté front : ${type}`)
}

export function useMedias(type: MediaEntityType, entityId: number | null) {
  return useQuery<Media[]>({
    queryKey: ['medias', type, entityId],
    queryFn:  () => api.get(endpointFor(type, entityId!)).then(r => r.data),
    enabled:  !!entityId,
  })
}

// ─── URL signée d'un média (1h) ───────────────────────────────────────────────

export function useMediaUrl(mediaId: number | null) {
  return useQuery<MediaUrlResponse>({
    queryKey: ['media-url', mediaId],
    queryFn:  () => api.get(`/media/${mediaId}/url`).then(r => r.data),
    enabled:  !!mediaId,
    // Refresh juste avant expiration (50 min)
    staleTime: 50 * 60 * 1000,
  })
}

// ─── Upload ───────────────────────────────────────────────────────────────────

interface UploadPayload {
  file:       File
  entityType: MediaEntityType
  entityId:   number
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation<MediaUploadResponse, Error, UploadPayload>({
    mutationFn: async ({ file, entityType, entityId }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', entityType)
      formData.append('entityId', String(entityId))

      const res = await api.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (_data, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['medias', entityType, entityId] })
    },
  })
}

// ─── Suppression ──────────────────────────────────────────────────────────────

interface DeletePayload {
  mediaId:    number
  entityType: MediaEntityType
  entityId:   number
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, DeletePayload>({
    mutationFn: async ({ mediaId }) => {
      await api.delete(`/media/${mediaId}`)
    },
    onSuccess: (_data, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['medias', entityType, entityId] })
    },
  })
}
