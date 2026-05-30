'use client'

/**
 * ValidationDetailHead — Tête du panneau détail employé (avatar + nom + total).
 * Composant purement visuel (pas de logique).
 */

interface Props {
  prenom: string
  nom: string
  role: string
  zone: string | null
  totalMinutes: number
}

function minToHHMM(minutes: number | null): string {
  if (minutes === null) return '—'
  const h = Math.floor(minutes / 60); const min = minutes % 60
  return `${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}

export default function ValidationDetailHead({ prenom, nom, role, zone, totalMinutes }: Props) {
  const initiales = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
  return (
    <div className="validation-detail-head">
      <div className="validation-detail-head__id">
        <span className="validation-detail-head__avatar">{initiales}</span>
        <div>
          <div className="validation-detail-head__name">{prenom} {nom}</div>
          <div className="validation-detail-head__meta">
            {role === 'MANAGER' ? 'Manager' : 'Employé'}{zone ? ` · ${zone}` : ''}
          </div>
        </div>
      </div>
      <div className="validation-detail-head__total">
        <div className="validation-detail-head__total-lbl">Heures nettes</div>
        <div className="validation-detail-head__total-val">{minToHHMM(totalMinutes)}</div>
      </div>
    </div>
  )
}
