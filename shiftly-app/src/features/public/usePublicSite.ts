'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { PublicSite } from './types'

/**
 * Vitrine publique du centre résolu par le domaine (host) côté API.
 * Le front ne fournit jamais le centre : il consomme juste l'endpoint public,
 * la résolution par host (fail-closed, 404 si inconnu) reste l'affaire du back.
 */
export function usePublicSite() {
  return useQuery<PublicSite, Error>({
    queryKey: ['public-site'],
    queryFn:  () => api.get<PublicSite>('/public/site').then((r) => r.data),
    retry:    false,
    staleTime: 5 * 60 * 1000,
  })
}
