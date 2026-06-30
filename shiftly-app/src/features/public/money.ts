// Aides de tarification côté public. Les montants définitifs sont TOUJOURS ceux
// renvoyés par l'API (réponse 201) ; ces calculs ne servent qu'à l'aperçu live.

/** Part d'acompte affichée à l'aperçu (le back applique son propre taux). */
export const ACOMPTE_RATE = 0.2

/** Formate des centimes en euros FR : 650 → « 6,50 € ». */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

/** Aperçu de l'acompte (centimes), aligné sur la règle des 20 % du back. */
export function acompteCents(totalCents: number): number {
  return Math.round(totalCents * ACOMPTE_RATE)
}
