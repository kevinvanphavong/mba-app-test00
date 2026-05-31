'use client'

/**
 * ValidationArriveeEmptyCta — Bouton(s) affiché(s) quand l'arrivée n'est pas pointée.
 *
 * 3 comportements (décision V2-fixes #1) :
 *  - Jour passé → bouton "+ Saisir l'heure d'arrivée" qui ouvre le popover pré-rempli
 *  - Aujourd'hui + après heure planifiée → bouton "⚠ Pointer arrivée maintenant" (POST now)
 *  - Aujourd'hui + avant heure planifiée → null (le shift n'a pas commencé, rien à faire)
 */

import { isToday, parseISO } from 'date-fns'

interface Props {
  jourDate: string             // 'YYYY-MM-DD'
  pointageId: number | null
  heureDebutPlanifiee: string | null
  onPointerNow: (pointageId: number) => void
  onOpenSaisie: (initialTime: string) => void
}

/** Vrai si l'heure actuelle locale a atteint l'heure planifiée 'HH:MM'. */
function isPastPlannedTime(plannedHHMM: string): boolean {
  const [h, m] = plannedHHMM.split(':').map(Number)
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m
}

export default function ValidationArriveeEmptyCta({ jourDate, pointageId, heureDebutPlanifiee, onPointerNow, onOpenSaisie }: Props) {
  if (pointageId === null) return null

  const date         = parseISO(jourDate)
  const isJourPasse  = !isToday(date) && date < new Date()

  if (isJourPasse) {
    return (
      <button type="button" className="validation-day-row__empty-cta validation-day-row__empty-cta--past"
        onClick={() => onOpenSaisie(heureDebutPlanifiee ?? '09:00')}>
        + Saisir l'heure d'arrivée
      </button>
    )
  }

  if (heureDebutPlanifiee && !isPastPlannedTime(heureDebutPlanifiee)) return null

  return (
    <button type="button" className="validation-day-row__empty-cta" onClick={() => onPointerNow(pointageId)}>
      ⚠ Pointer arrivée maintenant{heureDebutPlanifiee ? ` (plan. ${heureDebutPlanifiee})` : ''}
    </button>
  )
}
