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
