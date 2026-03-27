export type JourSemaine =
  | 'lundi'
  | 'mardi'
  | 'mercredi'
  | 'jeudi'
  | 'vendredi'
  | 'samedi'
  | 'dimanche'

export type HoraireJour = {
  ouvert:    boolean
  ouverture: string | null  // "HH:MM"
  fermeture: string | null  // "HH:MM"
}

export type OpeningHours = Record<JourSemaine, HoraireJour>

export const JOURS_SEMAINE: JourSemaine[] = [
  'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
]

export const JOURS_LABELS: Record<JourSemaine, { long: string; court: string }> = {
  lundi:    { long: 'Lundi',    court: 'Lun' },
  mardi:    { long: 'Mardi',    court: 'Mar' },
  mercredi: { long: 'Mercredi', court: 'Mer' },
  jeudi:    { long: 'Jeudi',    court: 'Jeu' },
  vendredi: { long: 'Vendredi', court: 'Ven' },
  samedi:   { long: 'Samedi',   court: 'Sam' },
  dimanche: { long: 'Dimanche', court: 'Dim' },
}

/** Retourne un résumé lisible des jours ouverts, ex: "Lun · Mar · Jeu–Sam" */
export function buildHorairesSummary(hours: OpeningHours | null | undefined): string {
  if (!hours) return 'Horaires non configurés'

  const ouverts = JOURS_SEMAINE.filter(j => hours[j]?.ouvert)
  if (ouverts.length === 0) return 'Fermé toute la semaine'
  if (ouverts.length === 7) return 'Ouvert tous les jours'

  // Regroupe les jours consécutifs en plages (ex: lundi+mardi+mercredi → Lun–Mer)
  const segments: string[] = []
  let start = 0

  while (start < ouverts.length) {
    let end = start
    while (
      end + 1 < ouverts.length &&
      JOURS_SEMAINE.indexOf(ouverts[end + 1]) === JOURS_SEMAINE.indexOf(ouverts[end]) + 1
    ) {
      end++
    }
    const startLabel = JOURS_LABELS[ouverts[start]].court
    const endLabel   = JOURS_LABELS[ouverts[end]].court
    segments.push(end > start ? `${startLabel}–${endLabel}` : startLabel)
    start = end + 1
  }

  return segments.join(' · ')
}

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  lundi:    { ouvert: true,  ouverture: '10:00', fermeture: '02:00' },
  mardi:    { ouvert: true,  ouverture: '10:00', fermeture: '02:00' },
  mercredi: { ouvert: true,  ouverture: '10:00', fermeture: '02:00' },
  jeudi:    { ouvert: true,  ouverture: '10:00', fermeture: '02:00' },
  vendredi: { ouvert: true,  ouverture: '10:00', fermeture: '02:00' },
  samedi:   { ouvert: true,  ouverture: '10:00', fermeture: '02:00' },
  dimanche: { ouvert: false, ouverture: null,    fermeture: null    },
}
