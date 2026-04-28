/**
 * Conversion d'un nombre d'heures décimales (ex: 7.75) vers un format
 * lisible "7h45" ou "7h00". Utilisé partout où l'on affiche le cumul
 * d'heures travaillées (planning, validation hebdo, fiche staff).
 *
 * Comportements :
 *   - 7.75    → "7h45"
 *   - 7       → "7h00"
 *   - 7.999   → "8h00" (la minute arrondie à 60 réincrémente l'heure)
 *   - 0       → "0h00"
 *   - -0.5    → "-0h30" (signe préservé)
 *
 * NB : on ne renvoie pas "7h" sans minutes car l'affichage dans le planning
 * doit toujours communiquer la précision (manager qui pointe à 7.25 doit
 * voir 7h15, pas 7h tronqué).
 */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return '0h00'

  const sign     = hours < 0 ? '-' : ''
  const abs      = Math.abs(hours)
  let   heures   = Math.floor(abs)
  let   minutes  = Math.round((abs - heures) * 60)

  // Arrondi qui pousse à 60 → re-bascule sur l'heure suivante
  if (minutes === 60) {
    heures  += 1
    minutes  = 0
  }

  return `${sign}${heures}h${minutes.toString().padStart(2, '0')}`
}

/**
 * Variante pour les écarts contractuels — force le signe (+/-).
 * Utilisé dans les vues de comparaison (heures planifiées vs heures
 * contractuelles) où l'on veut visualiser à la fois le sens et l'amplitude.
 *
 * Comportements :
 *   - +2.5  → "+2h30"
 *   - -3.25 → "-3h15"
 *   -  0    → "+0h00"
 */
export function formatHoursDiff(hours: number): string {
  const sign     = hours >= 0 ? '+' : '-'
  const abs      = Math.abs(hours)
  let   heures   = Math.floor(abs)
  let   minutes  = Math.round((abs - heures) * 60)

  if (minutes === 60) {
    heures  += 1
    minutes  = 0
  }

  return `${sign}${heures}h${minutes.toString().padStart(2, '0')}`
}
