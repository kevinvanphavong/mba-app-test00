// ─── Staff — types API réels ──────────────────────────────────────────────────

export type DifficulteComp = 'simple' | 'avancee' | 'experimente'
export type StaffRole      = 'MANAGER' | 'EMPLOYE'
export type ZoneNom        = 'Accueil' | 'Bar' | 'Salle' | 'Manager'

export interface StaffCompetenceItem {
  id:           number
  competenceId: number
  nom:          string
  zoneName:     string | null
  zoneCouleur:  string | null
  points:       number
  difficulte:   DifficulteComp
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
  /** Champs contrat — null pour un employé qui regarde un autre membre */
  heuresHebdo:      number | null
  typeContrat:      string | null
  dateEmbauche:     string | null     // YYYY-MM-DD ou null
  codePointage:     string | null
  staffCompetences: StaffCompetenceItem[]
  tutorielsLus:     number
  isPresent:        boolean
}

export interface CompetenceCatalogItem {
  id:          number
  nom:         string
  difficulte:  DifficulteComp
  points:      number
  zoneId:      number
  zoneName:    string
  zoneCouleur: string
}

export interface StaffMeta {
  tutorielsTotal:     number
  competencesTotal:   number
  /** Totaux compétences groupés par nom de zone — sert à calculer le % par zone côté front. */
  competencesParZone: Record<string, { total: number; couleur: string }>
  /** Liste complète des compétences du centre (acquises + non-acquises) ordonnée par zone. */
  competencesCatalog: CompetenceCatalogItem[]
  tenueHaut:          string | null
  tenueBas:           string | null
  tenueChaussures:    string | null
}

export interface StaffResponse {
  members: StaffMember[]
  meta:    StaffMeta
}

// ─── Filter state ─────────────────────────────────────────────────────────────

export type RoleFilter = 'all' | StaffRole
export type ZoneFilter = string | 'all'
