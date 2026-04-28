'use client'

/**
 * ValidationDayCell — Cellule d'un jour dans le tableau principal.
 * 4 états : travaillé | repos | absent | en cours
 */

import type { ValidationJour } from '@/types/validation'

interface Props {
  jour: ValidationJour
}

function minToHHMM(minutes: number | null): string {
  if (minutes === null) return ''
  const h   = Math.floor(minutes / 60)
  const min = minutes % 60
  return `${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}

export default function ValidationDayCell({ jour }: Props) {
  if (jour.statut === 'repos') {
    return (
      <td className="validation-day-cell">
        <div className="validation-day-rest">—</div>
      </td>
    )
  }

  if (jour.statut === 'absent_justifie') {
    return (
      <td className="validation-day-cell">
        <div className="validation-day-absent-justifie">
          {jour.typeAbsence ?? 'ABS'}
        </div>
      </td>
    )
  }

  if (jour.statut === 'absent_non_justifie') {
    return (
      <td className="validation-day-cell" style={{ background: 'rgba(239,68,68,0.08)' }}>
        <div className="validation-day-absent">ABS</div>
      </td>
    )
  }

  if (jour.statut === 'en_cours') {
    return (
      <td className="validation-day-cell">
        <div className="validation-inprogress-dot validation-day-inprogress">
          en cours{jour.estRetard && <span className="validation-retard-dot" />}
        </div>
        {jour.heureArrivee && (
          <div className="validation-day-hours">{jour.heureArrivee}–??</div>
        )}
      </td>
    )
  }

  // Cas : travaillé
  return (
    <td className="validation-day-cell">
      <div className="validation-day-time">
        {jour.heureArrivee}–
        {jour.heureDepartAuto ? (
          // Départ inféré depuis l'heure de fin du poste : italique + tag auto
          <>
            <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>{jour.heureDepart}</span>
            <span
              title="Heure de fin appliquée automatiquement (pas de pointage de départ)"
              style={{
                marginLeft:    4,
                padding:       '0 4px',
                fontSize:      9,
                fontWeight:    700,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                borderRadius:  4,
                background:    'rgba(249,115,22,0.12)',
                color:         'var(--accent)',
                verticalAlign: 'middle',
              }}
            >
              auto
            </span>
          </>
        ) : (
          jour.heureDepart
        )}
        {jour.estRetard && <span className="validation-retard-dot" />}
      </div>
      {jour.heuresNettes !== null && (
        <div className="validation-day-hours">{minToHHMM(jour.heuresNettes)}</div>
      )}
    </td>
  )
}
