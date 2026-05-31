'use client'

/**
 * ValidationCorrectionTimeline — Historique complet des corrections d'un employé.
 * Jour concerné, champ, diff ancien→nouveau, motif chip, ancienneté, bouton Annuler.
 * Pas de troncature (audit paie). Bouton Annuler = POST inverse (cf. useAnnulerCorrection).
 */

import { formatDistanceToNow, parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { CorrectionPointage } from '@/types/validation'
import { formatHeure } from '@/lib/formatHeure'

interface Props {
  corrections: CorrectionPointage[]
  /** Map pointageId → date 'YYYY-MM-DD' du jour concerné (pour libellé "Sam. 30 mai"). */
  pointageToDate: Record<number, string>
  onAnnuler: (correction: CorrectionPointage) => void
  isAnnulant: boolean
}

const CHAMP_LIBELLE: Record<string, string> = {
  heureArrivee: 'Arrivée',
  heureDepart:  'Départ',
  pauseDebut:   'Début pause',
  pauseFin:     'Fin pause',
}

export default function ValidationCorrectionTimeline({ corrections, pointageToDate, onAnnuler, isAnnulant }: Props) {
  if (corrections.length === 0) {
    return (
      <div className="validation-history">
        <div className="validation-history__head">
          <span className="validation-history__title">📜 Historique des corrections</span>
        </div>
        <div className="validation-history__empty">
          Aucune correction sur cette semaine — les heures pointées sont conservées telles quelles.
        </div>
      </div>
    )
  }

  // Tri du plus récent au plus ancien (le back renvoie déjà créées ordre,
  // mais on re-trie pour ne pas dépendre du contrat backend).
  const sorted = [...corrections].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  return (
    <div className="validation-history">
      <div className="validation-history__head">
        <span className="validation-history__title">📜 Historique des corrections</span>
        <span className="validation-history__count">{sorted.length}</span>
      </div>

      <div className="validation-timeline">
        {sorted.map(c => {
          const dateJour = pointageToDate[c.pointageId]
          const jourLabel = dateJour
            ? format(parseISO(dateJour), 'EEE d MMM', { locale: fr })
            : '—'
          const isAnnulation = c.motif?.toLowerCase().startsWith('annulation')

          return (
            <div key={c.id} className="validation-timeline__item">
              <div className="validation-timeline__line1">
                {jourLabel} · <span className="validation-timeline__field">{CHAMP_LIBELLE[c.champModifie] ?? c.champModifie}</span>{' '}
                <span className="validation-timeline__old">{formatHeure(c.ancienneValeur)}</span>{' → '}
                <span className="validation-timeline__new">{formatHeure(c.nouvelleValeur)}</span>
              </div>
              <div className="validation-timeline__line2">
                {c.motif && <span className="validation-timeline__motif">{c.motif}</span>}
                par <strong>{c.corrigePar}</strong>
                <span> · il y a {formatDistanceToNow(parseISO(c.createdAt), { locale: fr })}</span>
                {!isAnnulation && (
                  <button
                    type="button"
                    className="validation-timeline__undo"
                    disabled={isAnnulant}
                    onClick={() => onAnnuler(c)}
                    aria-label={`Annuler la correction du ${jourLabel}`}
                  >
                    ↺ Annuler
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
