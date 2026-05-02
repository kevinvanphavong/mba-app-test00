/** Met en majuscule la 1ʳᵉ lettre — utile pour `format(d, 'EEE …', { locale: fr })`
 *  qui renvoie "mer." là où l'UI attend "Mer.". */
export function capitalizeFirst(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Met en majuscule la 1ʳᵉ lettre de chaque mot — pour les dates raccourcies.
 *  Ex: "mer. 18 mars 2026" → "Mer. 18 Mars 2026". Les chiffres restent inchangés. */
export function capitalizeWords(s: string): string {
  if (!s) return s
  // Découpe sur espaces uniquement : conserve les ponctuations attachées (ex: "mer." → "Mer.")
  return s.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ')
}
