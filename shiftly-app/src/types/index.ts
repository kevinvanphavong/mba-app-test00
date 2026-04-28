export interface Centre {
  id: number
  nom: string
  adresse?: string
  typeActivite?: string
  horaireOuverture?: string
  horaireFermeture?: string
}

export interface User {
  id: number
  centre: Centre
  nom: string
  prenom?: string
  email: string
  role: 'MANAGER' | 'EMPLOYE'
  actif: boolean
  pointsTotal: number
  niveau: number
  tailleHaut?: string
  tailleBas?: string
  pointure?: string
}

export interface Zone {
  id: number
  nom: string
  couleur?: string
  ordre: number
  archivee: boolean
}

export interface Mission {
  id: number
  zone: Zone
  texte: string
  categorie: 'OUVERTURE' | 'PENDANT' | 'MENAGE' | 'FERMETURE'
  frequence: 'FIXE' | 'PONCTUELLE'
  priorite: 'vitale' | 'important' | 'ne_pas_oublier'
  description?: string
  ordre: number
  /** true → la validation côté staff impose une preuve photo (caméra). */
  requiresPhoto?: boolean
}

export interface Competence {
  id: number
  zone: Zone
  nom: string
  description?: string
  difficulte: 'simple' | 'avancee' | 'experimente'
  points: number
}

export interface Service {
  id: number
  date: string
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE'
  tauxCompletion: number
  manager?: User
  assignations?: Assignation[]
}

export interface Assignation {
  id: number
  user: User
  zone: Zone
}

export interface Incident {
  id: number
  description: string
  severite: 'haute' | 'moyenne' | 'basse'
  statut: 'OUVERT' | 'EN_COURS' | 'RESOLU'
  zone?: Zone
  creePar?: User
  createdAt: string
}

export interface Tutoriel {
  id: number
  zone?: Zone
  titre: string
  contenu: TutorielBlock[]
  niveau: 'debutant' | 'intermediaire' | 'avance'
  dureeMins?: number
  misEnAvant: boolean
  publie: boolean
}

export type TutorielBlock =
  | { type: 'intro'; text: string }
  | { type: 'step'; number: number; title: string; text: string }
  | { type: 'tip'; text: string }

// ─── Services Planning ────────────────────────────────────────────────────────

export interface ServiceListStaffMember {
  id:          number
  nom:         string
  prenom:      string | null
  avatarColor: string
}

export interface ServiceListZonePoste {
  posteId:     number
  userId:      number
  nom:         string
  prenom:      string | null
  avatarColor: string
}

export interface ServiceListZone {
  id:      number
  nom:     string
  couleur: string
  taux:    number
  postes:  ServiceListZonePoste[]
}

export interface ServiceListManager {
  id:          number
  nom:         string
  avatarColor: string
}

/** Item retourné par GET /api/services/list */
export interface ServiceListItem {
  id:             number
  date:           string    // 'YYYY-MM-DD'
  heureDebut:     string | null
  heureFin:       string | null
  statut:         'PLANIFIE' | 'EN_COURS' | 'TERMINE'
  tauxCompletion: number
  note:           string | null
  staff:          ServiceListStaffMember[]
  zones:          ServiceListZone[]
  managers:       ServiceListManager[]
}
