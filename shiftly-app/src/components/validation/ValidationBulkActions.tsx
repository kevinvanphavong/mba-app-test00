'use client'

/**
 * ValidationBulkActions — Bandeau d'actions rapides en tête du panneau détail.
 * Visible uniquement si ≥1 jour `heureDepartAuto` détecté.
 * Itère côté front sur les jours `auto` et POST une correction `heureDepart`
 * pour chacun (pas d'endpoint bulk côté back).
 */

interface Props {
  nbJoursAuto: number
  onAppliquerDepartPlanifie: () => void
  isApplying: boolean
}

export default function ValidationBulkActions({ nbJoursAuto, onAppliquerDepartPlanifie, isApplying }: Props) {
  if (nbJoursAuto === 0) return null

  return (
    <div className="validation-bulk-bar" role="region" aria-label="Actions rapides">
      <span className="validation-bulk-bar__icon">⚡</span>
      <span className="validation-bulk-bar__label">Action rapide</span>
      <span className="validation-bulk-bar__detail">
        {nbJoursAuto} jour{nbJoursAuto > 1 ? 's' : ''} « auto » détecté{nbJoursAuto > 1 ? 's' : ''}
      </span>
      <button
        type="button"
        className="validation-bulk-bar__action"
        onClick={onAppliquerDepartPlanifie}
        disabled={isApplying}
      >
        {isApplying ? 'Application…' : 'Appliquer le départ planifié à tous'}
      </button>
    </div>
  )
}
