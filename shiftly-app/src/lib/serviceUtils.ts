import { format } from 'date-fns'
import type { ServiceListItem } from '@/types/index'

/**
 * Heure (0-23) de bascule du « jour actif » sur le jour calendaire suivant.
 *
 * DOIT MATCHER `App\Service\ActiveDayResolver::NIGHT_SHIFT_HOUR` (backend).
 * Si tu changes l'une, change l'autre — sinon les pages /service, /dashboard
 * et /services divergeront à nouveau entre minuit et le seuil de bascule.
 */
export const NIGHT_SHIFT_HOUR = 5

/**
 * Retourne la date du « jour actif » au format YYYY-MM-DD.
 * Entre 0h et NIGHT_SHIFT_HOUR-1 → date d'hier (service de nuit en cours).
 * À partir de NIGHT_SHIFT_HOUR → date calendaire normale.
 */
export function getEffectiveToday(): string {
  const now = new Date()
  if (now.getHours() < NIGHT_SHIFT_HOUR) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return format(yesterday, 'yyyy-MM-dd')
  }
  return format(now, 'yyyy-MM-dd')
}

/** Vérifie si une date de service (YYYY-MM-DD) correspond au jour actif */
export function isTodayService(date: string): boolean {
  return date === getEffectiveToday()
}

/** Extrait le service du jour depuis une liste de services */
export function findTodayService(services: ServiceListItem[]): ServiceListItem | undefined {
  return services.find(s => isTodayService(s.date))
}
