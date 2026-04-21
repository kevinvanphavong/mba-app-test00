// ─── Staff — types API réels ──────────────────────────────────────────────────

export type DifficulteComp = 'simple' | 'avancee' | 'experimente'
export type StaffRole      = 'MANAGER' | 'EMPLOYE'
export type ZoneNom        = 'Accueil' | 'Bar' | 'Salle' | 'Manager'

export interface StaffCompetenceItem {
  id:          number
  nom:         string
  zoneName:    string | null
  zoneCouleur: string | null
  points:      number
  difficulte:  DifficulteComp
}

export interface StaffMember {
  id:               number
  nom:              string
  prenom:           string | null
  email:            string
  role:             StaffRole
  points:           number
  actif:            boolean
  avatarColor:      string
  tailleHaut:       string | null
  tailleBas:        string | null
  pointure:         string | null
  heuresHebdo:      number | null
  typeContrat:      string | null
  codePointage:     string | null
  staffCompetences: StaffCompetenceItem[]
  tutorielsLus:     number
  isPresent:        boolean
}

export interface StaffMeta {
  tutorielsTotal:   number
  competencesTotal: number
}

export interface StaffResponse {
  members: StaffMember[]
  meta:    StaffMeta
}

// ─── Filter state ─────────────────────────────────────────────────────────────

export type RoleFilter = 'all' | StaffRole
export type ZoneFilter = string | 'all'
