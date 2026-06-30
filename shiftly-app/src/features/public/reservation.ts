// État local du parcours de réservation (UI only — pas du server state).

/** Brouillon de réservation accumulé au fil des 3 étapes. */
export interface ReservationDraft {
  prestationId: number | null
  date:         string // yyyy-mm-dd
  heure:        string // HH:mm
  nbPersonnes:  number
  nom:          string
  email:        string
  telephone:    string
}

/** Créneaux proposés (présentationnels — le back valide « futur »). */
export const CRENEAUX = ['17:00', '18:30', '20:00', '21:30', '23:00'] as const

export function emptyDraft(prestationId: number | null): ReservationDraft {
  return {
    prestationId,
    date: '',
    heure: '',
    nbPersonnes: 1,
    nom: '',
    email: '',
    telephone: '',
  }
}

/** Combine date + heure du brouillon en ISO 8601 (ou null si incomplet). */
export function toDateCreneauISO(draft: ReservationDraft): string | null {
  if (!draft.date || !draft.heure) return null
  const d = new Date(`${draft.date}T${draft.heure}:00`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Email basique (le back revalide systématiquement — défense en profondeur). */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
