// ─── Shift (poste avec horaires) ─────────────────────────────────────────────

export interface PlanningShift {
  posteId:      number
  serviceId:    number
  userId:       number        // nécessaire pour le déplacement de shift (drag & drop)
  date:         string        // 'YYYY-MM-DD'
  zoneId:       number
  zoneNom:      string
  zoneCouleur:  string
  heureDebut:   string | null // 'HH:mm'
  heureFin:     string | null // 'HH:mm'
  pauseMinutes: number
}

export interface MoveShiftPayload {
  shift:   PlanningShift  // shift source
  newDate: string         // 'YYYY-MM-DD' cible
}

// ─── Employé dans le planning ─────────────────────────────────────────────────

export interface PlanningEmployee {
  id:           number
  nom:          string
  prenom:       string | null
  role:         'MANAGER' | 'EMPLOYE'
  avatarColor:  string | null
  heuresHebdo:  number | null
  typeContrat:  string | null
  shifts:       PlanningShift[]
  totalHeures:  number
  ecartContrat: number         // positif = surplus, négatif = sous-planifié
}

// ─── Alerte planning ──────────────────────────────────────────────────────────

export type AlerteType =
  | 'DEPASSEMENT_HEURES'
  | 'SOUS_PLANIFIE'
  | 'ZONE_NON_COUVERTE'
  | 'SANS_PAUSE'
  | 'JOUR_SANS_REPOS'

export type AlerteSeverite = 'haute' | 'moyenne'

export interface PlanningAlerte {
  type:     AlerteType
  severite: AlerteSeverite
  message:  string
  date?:    string
  zoneId?:  number
  userId?:  number
}

// ─── Zone résumée ─────────────────────────────────────────────────────────────

export interface PlanningZone {
  id:      number
  nom:     string
  couleur: string
}

// ─── Stats résumées ───────────────────────────────────────────────────────────

export interface PlanningStats {
  employesPlanifies: number
  totalHeures:       number
  creneauxVides:     number
  sousPlanifies:     number
}

// ─── Réponse complète GET /planning/week ─────────────────────────────────────

export interface PlanningWeekData {
  weekStart:  string
  weekEnd:    string
  statut:     'BROUILLON' | 'PUBLIE'
  note:       string | null
  zones:      PlanningZone[]
  employees:  PlanningEmployee[]
  alertes:    PlanningAlerte[]
  stats:      PlanningStats
}

// ─── Vue employé ──────────────────────────────────────────────────────────────

export interface EmployeeShift {
  date:         string
  zoneNom:      string
  zoneCouleur:  string
  heureDebut:   string | null
  heureFin:     string | null
  pauseMinutes: number
}

export interface EmployeeWeek {
  weekStart:   string
  weekEnd:     string
  statut:      'PUBLIE'
  shifts:      EmployeeShift[]
  totalHeures: number
}

export interface EmployeePlanningData {
  weeks: EmployeeWeek[]
}

// ─── Payloads mutations ───────────────────────────────────────────────────────

export interface CreateShiftPayload {
  date:          string       // 'YYYY-MM-DD' — le controller crée le service si absent
  zoneId:        number
  userId:        number
  heureDebut:    string       // 'HH:mm'
  heureFin:      string       // 'HH:mm'
  pauseMinutes?: number       // défaut 0
}

export interface UpdateShiftPayload {
  posteId:       number
  zone?:         string   // IRI : '/api/zones/{id}'
  heureDebut?:   string
  heureFin?:     string
  pauseMinutes?: number
}

export interface PublishWeekPayload {
  weekStart:          string          // 'YYYY-MM-DD' (lundi)
  motifModification?: string          // obligatoire si délai < 7j
  forcePublication?:  boolean         // true pour confirmer malgré délai < 7j
}

// Réponse 422 quand délai de prévenance non respecté
export interface PublishWarningResponse {
  warning:       'DELAI_PREVENANCE_NON_RESPECTE'
  delaiJours:    number
  message:       string
  severity:      'attention' | 'critique'   // critique si < 3j
  requiresMotif: true
}

export interface DuplicateWeekPayload {
  sourceWeekStart: string
  targetWeekStart: string
}

// ─── Snapshot (archivage légal) ──────────────────────────────────────────────

export interface PlanningSnapshotSummary {
  id:                number
  weekStart:         string
  publishedAt:       string           // ISO datetime
  publishedByNom:    string
  motifModification: string | null
  delaiRespect:      boolean          // false = publié à moins de 7j
}
