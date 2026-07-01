import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const euros = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

export const creneau = (iso: string) => format(new Date(iso), "EEE d MMM yyyy 'à' HH'h'mm", { locale: fr })

/** Libellé + classe token du statut (jamais de couleur hex). */
export function statutBadge(statut: string): { label: string; cls: string } {
  return statut === 'CONFIRMEE'
    ? { label: 'Confirmée', cls: 'bg-green/15 text-green' }
    : { label: 'Acompte à régler', cls: 'bg-yellow/15 text-yellow' }
}
