/** Met en majuscule la 1ʳᵉ lettre — utile pour `format(d, 'EEE …', { locale: fr })`
 *  qui renvoie "mer." là où l'UI attend "Mer.". */
export function capitalizeFirst(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
