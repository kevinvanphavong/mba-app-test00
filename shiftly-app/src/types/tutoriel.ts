// ─── Tutoriels screen — types ─────────────────────────────────────────────────

export type TutoNiveau = 'debutant' | 'intermediaire' | 'avance'

/** Zone sérialisée en nested dans la réponse API tutoriel */
export interface TutorielZone {
  id:      number
  nom:     string
  couleur: string | null
}

export type TutoBlock =
  | { type: 'intro'; text: string }
  | { type: 'step';  number: number; title: string; text: string }
  | { type: 'tip';   text: string }

/** Type brut retourné par l'API — zone est une entité nullable */
export interface TutorielAPI {
  id:         number
  titre:      string
  zone:       TutorielZone | null
  niveau:     TutoNiveau
  dureMin:    number | null
  contenu:    TutoBlock[]
  createdAt?: string
}

/** Type enrichi pour les composants — inclut readId */
export interface Tutoriel {
  id:         number
  titre:      string
  zone:       TutorielZone | null
  niveau:     TutoNiveau
  dureMin:    number
  contenu:    TutoBlock[]
  readId:     number | null
}

// ─── Filter state ─────────────────────────────────────────────────────────────

/** Filtre par nom de zone (ex: 'Accueil') ou 'all' */
export type ZoneFilter   = string | 'all'
export type NiveauFilter = TutoNiveau | 'all'
