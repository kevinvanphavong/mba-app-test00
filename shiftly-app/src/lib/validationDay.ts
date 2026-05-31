/**
 * validationDay.ts — Helpers purement fonctionnels du panneau Validation hebdo.
 * Aucun import React. Testables seuls.
 */

import type { ValidationJour, CorrectionPointage, CorrectionChamp } from '@/types/validation'

/** Minutes → "8h30" (ou "8h" sans suffixe, ou "—" si null). */
export function minToHHMM(minutes: number | null): string {
  if (minutes === null) return '—'
  const h = Math.floor(minutes / 60); const min = minutes % 60
  return `${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}

/** Écart entre nettes et prévues (positif = sup, négatif = manque), null si data manquante. */
export function deltaHeures(jour: ValidationJour): number | null {
  if (jour.heuresNettes === null || jour.heuresPrevues === null) return null
  return jour.heuresNettes - jour.heuresPrevues
}

/** Dernière correction matchant le champ (et le pauseId si fourni). */
export function lastCorrectionFor(
  corrections: CorrectionPointage[],
  champ: CorrectionChamp,
  pauseId?: number,
): CorrectionPointage | null {
  return corrections.find(c => c.champModifie === champ && (pauseId === undefined || c.pauseId === pauseId)) ?? null
}

/**
 * Conversion locale (Europe/Paris navigateur) → ISO UTC pour le POST de correction.
 * Le back persiste un \DateTimeImmutable et le ressort en ATOM.
 */
export function toIsoUtc(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm]  = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0).toISOString()
}
