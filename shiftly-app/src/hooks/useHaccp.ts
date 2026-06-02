'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type {
  HaccpEquipement,
  HaccpEquipementInput,
  HaccpRegistreData,
  HaccpSyncResult,
  HaccpReleveType,
  CompleterHaccpInput,
  CompleterHaccpResult,
} from '@/types/haccp'

const unwrap = <T,>(r: { data: any }): T =>
  (r.data['hydra:member'] ?? r.data.member ?? r.data) as T

// ─── Équipements ──────────────────────────────────────────────────────────────

// Hydra/API Platform sérialise `decimal` comme string ("0.00") → on convertit
// en number à la frontière pour que les composants comparent / affichent
// proprement.
function deserializeEquipement(raw: any): HaccpEquipement {
  return {
    ...raw,
    seuilMin: typeof raw.seuilMin === 'string' ? Number(raw.seuilMin) : raw.seuilMin,
    seuilMax: typeof raw.seuilMax === 'string' ? Number(raw.seuilMax) : raw.seuilMax,
  }
}

export function useHaccpEquipements() {
  const centreId = useAuthStore(s => s.centreId)
  return useQuery<HaccpEquipement[]>({
    queryKey: ['haccp', 'equipements', centreId],
    queryFn:  () => api.get('/haccp_equipements').then(r => {
      const list = unwrap<any[]>(r)
      return Array.isArray(list) ? list.map(deserializeEquipement) : []
    }),
    enabled:  !!centreId,
  })
}

// API Platform / Hydra convention : un champ Doctrine `decimal` (seuils HACCP)
// est sérialisé / dénormalisé comme **string** (xsd:decimal). Les hooks
// convertissent les nombres en strings avant POST/PATCH pour éviter une 400
// "must be string, integer given" côté serveur.
function normalizeEquipementPayload<P extends Partial<HaccpEquipementInput>>(p: P): Record<string, unknown> {
  const out: Record<string, unknown> = { ...p }
  if (typeof p.seuilMin === 'number') out.seuilMin = p.seuilMin.toFixed(2)
  if (typeof p.seuilMax === 'number') out.seuilMax = p.seuilMax.toFixed(2)
  return out
}

export function useCreerEquipement() {
  const centreId = useAuthStore(s => s.centreId)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: HaccpEquipementInput) =>
      api.post('/haccp_equipements', {
        ...normalizeEquipementPayload(payload),
        centre: `/api/centres/${centreId}`,
      }).then(r => deserializeEquipement(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['haccp', 'equipements', centreId] })
      qc.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export function useModifierEquipement() {
  const centreId = useAuthStore(s => s.centreId)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & Partial<HaccpEquipementInput>) =>
      api.patch(`/haccp_equipements/${id}`, normalizeEquipementPayload(payload), {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }).then(r => deserializeEquipement(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['haccp', 'equipements', centreId] })
      qc.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export function useToggleEquipementActif() {
  const mod = useModifierEquipement()
  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) =>
      mod.mutateAsync({ id, actif }),
  })
}

export function useSupprimerEquipement() {
  const centreId = useAuthStore(s => s.centreId)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/haccp_equipements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['haccp', 'equipements', centreId] })
      qc.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export function useRegenererMissions() {
  const centreId = useAuthStore(s => s.centreId)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/haccp/sync-missions').then(r => r.data as HaccpSyncResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['service'] })
      qc.invalidateQueries({ queryKey: ['haccp', 'equipements', centreId] })
    },
  })
}

// ─── Registre ────────────────────────────────────────────────────────────────

export interface RegistreFilters {
  mois?:     string                  // 'YYYY-MM'
  type?:     HaccpReleveType
  conforme?: boolean
}

export function useHaccpRegistre(filters: RegistreFilters) {
  const centreId = useAuthStore(s => s.centreId)
  return useQuery<HaccpRegistreData>({
    queryKey: ['haccp', 'registre', centreId, filters],
    queryFn:  () =>
      api.get('/haccp/registre', { params: filters }).then(r => r.data as HaccpRegistreData),
    enabled:  !!centreId,
  })
}

// ─── Saisie HACCP depuis /service ────────────────────────────────────────────

export function useCompleterMissionHaccp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompleterHaccpInput) => {
      const form = new FormData()
      form.append('posteId',   String(input.posteId))
      form.append('missionId', String(input.missionId))
      if (input.valeurNumerique != null) form.append('valeurNumerique', String(input.valeurNumerique))
      if (input.dateReleve)              form.append('dateReleve',      input.dateReleve)
      if (input.note)                    form.append('note',            input.note)
      if (input.photo)                   form.append('photo',           input.photo)

      const r = await api.post('/completions/haccp', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return r.data as CompleterHaccpResult
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service'] })
      qc.invalidateQueries({ queryKey: ['haccp', 'registre'] })
    },
  })
}

// ─── Export PDF (URL téléchargeable) ─────────────────────────────────────────

export function getHaccpExportUrl(mois: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'
  return `${base}/haccp/export?mois=${encodeURIComponent(mois)}`
}
