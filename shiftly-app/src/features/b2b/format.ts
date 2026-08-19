export const euros = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

/** Badge de statut de devis (classes token, jamais de hex). */
export function devisBadge(statut: string): { label: string; cls: string } {
  switch (statut) {
    case 'BROUILLON':
      return { label: 'Brouillon IA', cls: 'bg-purple/15 text-purple' }
    case 'VALIDE':
      return { label: 'Validé', cls: 'bg-blue/15 text-blue' }
    case 'ENVOYE':
      return { label: 'Envoyé', cls: 'bg-accent/15 text-accent' }
    case 'ACCEPTE':
      return { label: 'Accepté', cls: 'bg-green/15 text-green' }
    default:
      return { label: 'Refusé', cls: 'bg-red/15 text-red' }
  }
}

/**
 * Date souhaitée d'une demande B2B, rendue en français (ex. « ven. 12 sept. 2026 »).
 * L'API renvoie un ISO 8601 : l'afficher brut est illisible côté gérant.
 */
export function dateSouhaitee(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
