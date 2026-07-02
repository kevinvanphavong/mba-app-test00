'use client'

import { useQuery } from '@tanstack/react-query'
import { superAdminApi } from '@/lib/superAdminApi'

/** Abonnement récurrent d'un client (agence). Montant en centimes. */
export interface Subscription {
  id:                   number
  stripeSubscriptionId: string
  statut:               string
  montantCents:         number
  centreNom:            string | null
  planNom:              string | null
  createdAt:            string
}

/** Facture d'abonnement reflétée depuis Stripe. */
export interface Invoice {
  id:              number
  stripeInvoiceId: string
  montantCents:    number
  statut:          string
  centreNom:       string | null
  createdAt:       string
}

function member<T>(data: unknown): T[] {
  const d = data as { 'hydra:member'?: T[]; member?: T[] }
  return d['hydra:member'] ?? d.member ?? (data as T[])
}

/** Abonnements par client (super-admin, lecture seule). */
export function useSubscriptions() {
  return useQuery<Subscription[], Error>({
    queryKey: ['superadmin', 'subscriptions'],
    queryFn: () => superAdminApi().get('/superadmin/subscriptions').then((r) => member<Subscription>(r.data)),
    retry: false,
  })
}

/** Factures d'abonnement (super-admin, lecture seule). */
export function useInvoices() {
  return useQuery<Invoice[], Error>({
    queryKey: ['superadmin', 'invoices'],
    queryFn: () => superAdminApi().get('/superadmin/invoices').then((r) => member<Invoice>(r.data)),
    retry: false,
  })
}
