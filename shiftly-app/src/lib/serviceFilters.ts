import { format, subDays, addDays } from 'date-fns'
import type { ServiceListItem } from '@/types/index'

/**
 * Helpers purs pour la vue desktop /services :
 * - tri/filtrage par onglet (En cours / À venir / Historique)
 * - filtrage par période (date pickers)
 * - calcul du taux de clôture (KPI hero)
 *
 * Aucun appel React/hook ici — composants et tests peuvent les consommer
 * directement sans couplage à React Query.
 */

export type TabKey = 'encours' | 'avenir' | 'historique'

export interface TabBuckets {
  encours:    ServiceListItem[]
  avenir:     ServiceListItem[]
  historique: ServiceListItem[]
}

/**
 * Répartit les services dans les 3 onglets.
 * - encours    : statut EN_COURS (tri date asc)
 * - avenir     : statut PLANIFIE et date >= today (tri date asc)
 * - historique : statut TERMINE OU (PLANIFIE et date < today, services planifiés
 *                jamais clôturés manuellement) — tri date desc
 *
 * `today` doit être au format YYYY-MM-DD (utilise `getEffectiveToday()` côté appelant).
 */
export function getTabBuckets(services: ServiceListItem[], today: string): TabBuckets {
  const encours = services
    .filter(s => s.statut === 'EN_COURS')
    .sort((a, b) => a.date.localeCompare(b.date))

  const avenir = services
    .filter(s => s.statut === 'PLANIFIE' && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const historique = services
    .filter(s => s.statut === 'TERMINE' || (s.statut === 'PLANIFIE' && s.date < today))
    .sort((a, b) => b.date.localeCompare(a.date))

  return { encours, avenir, historique }
}

/**
 * Filtre une liste sur une plage de dates inclusives.
 * Bornes vides ignorées : `filterByPeriod(s, '', '')` renvoie tout.
 */
export function filterByPeriod(
  services: ServiceListItem[],
  dateFrom: string,
  dateTo:   string,
): ServiceListItem[] {
  return services.filter(s =>
    (!dateFrom || s.date >= dateFrom) &&
    (!dateTo   || s.date <= dateTo),
  )
}

/**
 * Taux de clôture sur la fenêtre [dateFrom, dateTo].
 * - Si la fenêtre est vide → fenêtre par défaut [today-30j, today].
 * - Dénominateur = services TERMINE + services PLANIFIE-passés (auraient dû être clôturés).
 * - Numérateur   = services TERMINE.
 *
 * Renvoie null si dénominateur 0 (UI affiche "—" plutôt que "0%").
 */
export function computeClotureRate(
  services: ServiceListItem[],
  today:    string,
  dateFrom: string,
  dateTo:   string,
): number | null {
  const effectiveFrom = dateFrom || format(subDays(new Date(today + 'T12:00:00'), 30), 'yyyy-MM-dd')
  const effectiveTo   = dateTo   || today

  const window = filterByPeriod(services, effectiveFrom, effectiveTo)
  const eligibles = window.filter(s =>
    s.statut === 'TERMINE' ||
    (s.statut === 'PLANIFIE' && s.date < today),
  )
  if (eligibles.length === 0) return null

  const termines = eligibles.filter(s => s.statut === 'TERMINE').length
  return Math.round((termines / eligibles.length) * 100)
}

/**
 * Raccourcis période : ±N jours autour de today.
 * Renvoie deux chaînes ISO YYYY-MM-DD (vides pour "Tout").
 */
export function getPeriodShortcut(today: string, kind: '7j' | '30j' | 'tout'): { from: string; to: string } {
  if (kind === 'tout') return { from: '', to: '' }
  const days = kind === '7j' ? 7 : 30
  const ref = new Date(today + 'T12:00:00')
  return {
    from: format(subDays(ref, days), 'yyyy-MM-dd'),
    to:   format(addDays(ref, days), 'yyyy-MM-dd'),
  }
}
