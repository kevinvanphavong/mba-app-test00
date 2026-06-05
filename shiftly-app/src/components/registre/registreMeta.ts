/**
 * Helpers métier du module Registre — partagés entre la page, la table
 * et la modale sortie. Aucune dépendance React.
 */

import type { MotifSortie } from '@/types/staff'

export const MOTIF_LABELS: Record<MotifSortie, string> = {
  demission:               'Démission',
  rupture_conventionnelle: 'Rupture conv.',
  licenciement:            'Licenciement',
  fin_cdd:                 'Fin CDD',
  fin_periode_essai:       'Fin essai',
  retraite:                'Retraite',
  autre:                   'Autre',
}

export const CONTRAT_PILL_CLASS: Record<string, string> = {
  CDI:        'bg-green/15 text-green border-green/30',
  CDD:        'bg-blue/15  text-blue  border-blue/30',
  EXTRA:      'bg-yellow/15 text-yellow border-yellow/30',
  ALTERNANCE: 'bg-purple/15 text-purple border-purple/30',
  STAGE:      'bg-muted/15 text-muted border-muted/30',
}

export function fmtFRDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return d && m && y ? `${d}/${m}/${y}` : iso
}

export function fullName(prenom: string | null, nom: string): string {
  return prenom ? `${prenom} ${nom}` : nom
}

export function initials(prenom: string | null, nom: string): string {
  const p = (prenom?.[0] ?? '').toUpperCase()
  const n = (nom?.[0] ?? '').toUpperCase()
  return (p + n) || '?'
}
