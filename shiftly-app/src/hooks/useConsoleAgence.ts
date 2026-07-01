'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi } from '@/lib/superAdminApi'

/** KPI globaux de l'agence (cross-tenant, super-admin). */
export interface KpiGlobal {
  mrrCents:           number
  objectifMrrCents:   number
  progressionMrrPct:  number
  nbCentres:          number
  nbCentresActifs:    number
  iaAppelsMois:       number
  totalReservations:  number
  totalAvis:          number
}

/** KPI d'un centre client. */
export interface KpiCentre {
  id:                     number
  nom:                    string
  actif:                  boolean
  abonnementMensuelCents: number
  reservations:           number
  caEstimeCents:          number
  noShowRelances:         number
  avis:                   number
  noteMoyenne:            number | null
}

export interface ConsoleKpis {
  global:  KpiGlobal
  centres: KpiCentre[]
}

/** KPI de la console agence (lecture seule). */
export function useConsoleKpis() {
  return useQuery<ConsoleKpis, Error>({
    queryKey: ['superadmin', 'console', 'kpis'],
    queryFn:  () => superAdminApi().get<ConsoleKpis>('/superadmin/console/kpis').then((r) => r.data),
    retry:    false,
  })
}

/** Seule écriture : régler l'abonnement mensuel d'un centre (centimes). */
export function useSetAbonnement() {
  const qc = useQueryClient()

  return useMutation<{ id: number; abonnementMensuelCents: number }, Error, { id: number; cents: number }>({
    mutationFn: ({ id, cents }) =>
      superAdminApi()
        .put(`/superadmin/console/centres/${id}/abonnement`, { abonnementMensuelCents: cents })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin', 'console', 'kpis'] }),
  })
}

/** Résumé IA mensuel d'un client (budget plateforme, pas le quota client). */
export function useResumeIa() {
  return useMutation<{ centreId: number; resume: string }, Error, number>({
    mutationFn: (id) =>
      superAdminApi().post(`/superadmin/console/centres/${id}/resume-ia`).then((r) => r.data),
  })
}
