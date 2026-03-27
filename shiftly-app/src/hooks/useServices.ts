'use client'

/**
 * useServices.ts — Hooks dédiés au module Planning (/services).
 *
 * Tous les appels passent par lib/api.ts (axios + JWT).
 * Séparé de useService.ts pour isoler le service du jour du planning.
 */

export {
  useServicesList    as useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useAddServiceNote,
} from '@/hooks/useService'
