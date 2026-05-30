// ─── EventLog / Completion History API response types ────────────────────────
// Matches GET /api/dashboard/completion-history and
// GET /api/dashboard/completion-history/services/{serviceId}

export type HistoryPeriod = '7d' | '30d' | '90d'

export interface HistoryPeriode {
  from: string  // 'YYYY-MM-DD'
  to:   string  // 'YYYY-MM-DD'
}

export interface HistoryZoneRow {
  zone:     string | null
  couleur:  string | null
  taux:     number   // 0-100
  checks:   number
  unchecks: number
}

export interface HistoryMissionForgotten {
  missionId:  number | null
  missionNom: string | null
  zoneNom:    string | null
  priorite:   string | null
  fois:       number  // nb d'unchecks
}

export interface HistoryStaffRow {
  userId:        number | null
  userNom:       string | null
  checks:        number
  services:      number  // nb de services distincts touchés
  tauxPersonnel: number  // 0-100
}

export interface HistoryServiceRow {
  serviceId:      number | null
  serviceDate:    string | null   // 'YYYY-MM-DD'
  serviceCreneau: 'matin' | 'apresmidi' | 'soir' | null
  checks:         number
  unchecks:       number
}

export interface CompletionHistoryData {
  periode:                  HistoryPeriode
  totalChecks:              number
  totalUnchecks:            number
  tauxCompletionParZone:    HistoryZoneRow[]
  missionsLesPlusOubliees:  HistoryMissionForgotten[]
  rankingStaff:             HistoryStaffRow[]
  servicesRecents:          HistoryServiceRow[]
}

// ── Drill-down timeline ─────────────────────────────────────────────────────

export type EventAction = 'CHECK' | 'UNCHECK'

export interface EventLogPayload {
  missionNom?:     string | null
  missionPriorite?:string | null
  zoneNom?:        string | null
  zoneCouleur?:    string | null
  userNom?:        string | null
  serviceId?:      number | null
  serviceDate?:    string | null
  serviceCreneau?: 'matin' | 'apresmidi' | 'soir' | null
}

export interface EventLogTimelineRow {
  id:         string
  action:     EventAction
  occurredAt: string
  payload:    EventLogPayload
}

export interface ServiceTimelineData {
  serviceId: number
  events:    EventLogTimelineRow[]
}
