export type EditorTab = 'zones' | 'missions' | 'competences'

/** Correspond à Mission::CAT_* côté backend */
export type MissionCategorie =
  | 'OUVERTURE'
  | 'PENDANT'
  | 'MENAGE'
  | 'FERMETURE'

/** Correspond à Mission::FREQ_* côté backend */
export type MissionFrequence = 'FIXE' | 'PONCTUELLE'

/** Correspond à Mission::PRIO_* côté backend */
export type MissionPriorite =
  | 'vitale'
  | 'important'
  | 'ne_pas_oublier'

export type DifficulteComp = 'simple' | 'avancee' | 'experimente'

export interface EditorZone {
  id:              number
  nom:             string
  couleur:         string
  ordre:           number
  missionCount?:   number
  competenceCount?: number
}

export interface EditorMission {
  id:        number
  zoneId:    number
  zoneName?: string
  texte:     string
  categorie: MissionCategorie
  frequence: MissionFrequence
  priorite:  MissionPriorite
  ordre:     number
}

export interface EditorCompetence {
  id:           number
  zoneId:       number
  zoneName?:    string
  nom:          string
  difficulte:   DifficulteComp
  points:       number
  description?: string | null
}

// ── Payloads de formulaire ─────────────────────────────────────────────────

export interface ZoneFormData {
  nom:     string
  couleur: string
}

export interface MissionFormData {
  texte:     string
  categorie: MissionCategorie
  frequence: MissionFrequence
  priorite:  MissionPriorite
  zoneId:    number
}

export interface CompetenceFormData {
  nom:         string
  difficulte:  DifficulteComp
  points:      number
  description: string
  zoneId:      number
}

// ── Labels d'affichage ─────────────────────────────────────────────────────

export const MISSION_CAT_LABELS: Record<MissionCategorie, string> = {
  OUVERTURE: 'Ouverture',
  PENDANT:   'Pendant',
  MENAGE:    'Ménage',
  FERMETURE: 'Fermeture',
}

export const MISSION_FREQ_LABELS: Record<MissionFrequence, string> = {
  FIXE:       'Fixe',
  PONCTUELLE: 'Ponctuelle',
}

export const MISSION_PRIO_LABELS: Record<MissionPriorite, string> = {
  vitale:          'Vitale',
  important:       'Important',
  ne_pas_oublier:  'À ne pas oublier',
}
