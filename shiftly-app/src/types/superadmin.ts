export interface SuperAdminUser {
  id:     number
  email:  string
  nom:    string
  role:   'SUPERADMIN'
}

export interface CentreSummary {
  id:          number
  nom:         string
  slug:        string
  adresse:     string | null
  actif:       boolean
  createdAt:   string
  totalUsers:  number
}

export interface CentreUserSummary {
  id:        number
  nom:       string
  prenom:    string | null
  email:     string
  role:      string
  actif:     boolean
  createdAt: string
}

export interface CentreNote {
  id:        number
  contenu:   string
  createdAt: string
}

export interface CentreDetail extends CentreSummary {
  telephone:    string | null
  siteWeb:      string | null
  users:        CentreUserSummary[]
  notes:        CentreNote[]
  sentryIssues: SentryIssue[]
}

export interface AuditLogEntry {
  id:         number
  action:     string
  targetType: string
  targetId:   number | null
  ip:         string | null
  createdAt:  string
}

export interface SentryStats {
  total:      number
  topCentres: Array<{ centreId: string; count: number }>
}

export interface SentryIssue {
  id:          string
  title:       string
  level:       string
  count:       number
  lastSeen:    string
  firstSeen:   string
}

export interface DashboardKPIs {
  totalCentres:   number
  totalUsers:     number
  mrr:            number
  recentActivity: AuditLogEntry[]
  sentryStats:    SentryStats
}

export interface ImpersonationData {
  token:   string
  manager: { id: number; nom: string; prenom: string | null }
  centre:  { id: number; nom: string }
}
