import type { AbsenceType } from '@/types/planning'

/**
 * Libellés courts des types d'absence — adaptés aux cellules compactes
 * (tableau de validation hebdo). Pour les libellés longs/icônes, voir AbsenceModal.
 */
const ABSENCE_LABELS_COURT: Record<AbsenceType, string> = {
  CP:                'Congés',
  RTT:               'RTT',
  MALADIE:           'Maladie',
  REPOS:             'Repos',
  EVENEMENT_FAMILLE: 'Familial',
  AUTRE:             'Autre',
}

/** Libellé court d'un type d'absence (fallback « Absent » si inconnu). */
export function absenceTypeLabel(type: string | null | undefined): string {
  return type && type in ABSENCE_LABELS_COURT
    ? ABSENCE_LABELS_COURT[type as AbsenceType]
    : 'Absent'
}
