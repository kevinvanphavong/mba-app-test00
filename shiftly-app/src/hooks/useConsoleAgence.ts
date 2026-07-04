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
  planId:                 number | null
  planNom:                string | null
  abonnementStatut:       string | null
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

/** Données d'onboarding d'un nouveau client (super-admin). Montant en centimes. */
export interface CreerClientInput {
  nom:                    string
  domaine:                string
  managerNom:             string
  managerEmail:           string
  managerMotDePasse:      string
  abonnementMensuelCents: number
}

export interface ClientCree {
  id:                     number
  nom:                    string
  domaine:                string
  abonnementMensuelCents: number
}

/** Crée un client complet (centre + domaine + gérant + abonnement). */
export function useCreerClient() {
  const qc = useQueryClient()

  return useMutation<ClientCree, Error, CreerClientInput>({
    mutationFn: (input) =>
      superAdminApi().post<ClientCree>('/superadmin/console/centres', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin', 'console', 'kpis'] }),
  })
}

/** Invalide les KPI console (rafraîchit la liste des clients). */
function useConsoleInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['superadmin', 'console', 'kpis'] })
}

/** Change le domaine d'un centre (unique globalement — 409 si déjà pris). */
export function useChangerDomaine() {
  const invalidate = useConsoleInvalidate()
  return useMutation<{ id: number; domaine: string }, Error, { id: number; domaine: string }>({
    mutationFn: ({ id, domaine }) =>
      superAdminApi().patch(`/superadmin/centres/${id}/domaine`, { domaine }).then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}

/** Reset du mot de passe du gérant. Renvoie l'email concerné, jamais le mot de passe. */
export function useResetPasswordGerant() {
  return useMutation<{ managerEmail: string }, Error, { id: number; motDePasse: string }>({
    mutationFn: ({ id, motDePasse }) =>
      superAdminApi().post(`/superadmin/centres/${id}/reset-password`, { motDePasse }).then((r) => r.data),
  })
}

/** Assigne un plan (ou le détache si null) à un centre — l'abonnement en est dérivé.
 *  `checkoutUrl` : lien de paiement Stripe à transmettre au client (null si détaché). */
export function useAssignerPlan() {
  const invalidate = useConsoleInvalidate()
  return useMutation<{ id: number; planId: number | null; abonnementMensuelCents: number; checkoutUrl: string | null }, Error, { id: number; planId: number | null }>({
    mutationFn: ({ id, planId }) =>
      superAdminApi().put(`/superadmin/console/centres/${id}/plan`, { planId }).then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}

/** Suspend (coupe l'accès) ou réactive un centre depuis la console. */
export function useToggleActifCentre() {
  const invalidate = useConsoleInvalidate()
  return useMutation<{ id: number; actif: boolean }, Error, { id: number; actif: boolean }>({
    mutationFn: ({ id, actif }) =>
      superAdminApi().post(`/superadmin/centres/${id}/${actif ? 'reactivate' : 'suspend'}`).then((r) => r.data),
    onSuccess: () => invalidate(),
  })
}
