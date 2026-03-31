// ─── Dashboard API response types ────────────────────────────────────────────
// Matches GET /api/dashboard/{centreId} from DashboardController

export interface DashboardServiceToday {
  id:         number
  date:       string        // 'YYYY-MM-DD'
  heureDebut: string        // 'HH:mm'
  heureFin:   string        // 'HH:mm'
  statut:     'PLANIFIE' | 'EN_COURS' | 'TERMINE'
  nbPostes:   number
}

export interface DashboardService {
  today:             DashboardServiceToday | null
  tauxCompletion:    number  // taux de completion du service du jour (0-100)
  staffActifCount:   number  // staff avec postes assignés au service du jour
  totalMissions:     number  // total missions du service du jour
  pointsStaffActif:  number  // cumul des points du staff assigné
}

export interface DashboardStaffMember {
  id:          number
  nom:         string
  role:        'MANAGER' | 'EMPLOYE'
  avatarColor: string | null
  points:      number
}

export interface DashboardZone {
  id:      number
  nom:     string
  couleur: string
}

export interface DashboardAlerte {
  id:        number
  titre:     string
  severite:  'haute' | 'moyenne' | 'basse'
  statut:    string
  service:   number | null
  zone:      DashboardZone | null  // zone rattachée à l'incident
  createdAt: string                // ISO 8601
}

export interface DashboardIncidents {
  total:   number
  haute:   number
  moyenne: number
  basse:   number
  alertes: DashboardAlerte[]       // tous les incidents ouverts
}

export interface DashboardTopStaff {
  id:          number
  nom:         string
  role:        'MANAGER' | 'EMPLOYE'
  avatarColor: string | null
  points:      number
}

export interface DashboardTutoriels {
  total:       number
  lectures:    number
  tauxLecture: number  // 0-100
}

export interface DashboardStats {
  moyenneCompletion: number  // moyenne % completion sur tous les services
  totalServices:     number
}

export interface DashboardData {
  service:   DashboardService
  staff:     DashboardStaffMember[]
  incidents: DashboardIncidents
  topStaff:  DashboardTopStaff[]
  tutoriels: DashboardTutoriels
  stats:     DashboardStats
}
