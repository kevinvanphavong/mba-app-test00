// ─── Service du Jour — types ──────────────────────────────────────────────────

export type MissionCategorie = 'OUVERTURE' | 'PENDANT' | 'MENAGE' | 'FERMETURE'
export type MissionFrequence = 'FIXE' | 'PONCTUELLE'
export type MissionPriorite  = 'vitale' | 'important' | 'ne_pas_oublier'
export type ServiceStatut    = 'PLANIFIE' | 'EN_COURS' | 'TERMINE'
export type IncidentSeverite = 'haute' | 'moyenne' | 'basse'

export interface ServiceZone {
  id:      number
  nom:     string
  couleur: string   // hex
  ordre:   number
}

export interface ServiceStaffMember {
  id:          number
  nom:         string
  prenom:      string | null
  role:        'MANAGER' | 'EMPLOYE'
  avatarColor: string
}

/** Poste dans le contexte d'une zone (staff assigné) */
export interface ServiceZonePoste {
  id:   number
  user: ServiceStaffMember | null
}

export interface ServiceMission {
  id:          number
  texte:       string
  categorie:   MissionCategorie
  frequence:   MissionFrequence
  priorite:    MissionPriorite
  ordre:       number
  /** true → la validation impose une preuve photo (capture caméra) */
  requiresPhoto: boolean
  /** completionId si cochée, null sinon */
  completionId: number | null
  /** true si la completion a une photo de preuve attachée (servie par /api/completions/{id}/photo) */
  hasPhoto:     boolean
  /** Qui a coché cette mission (null si pas encore cochée) */
  completedBy:  Pick<ServiceStaffMember, 'id' | 'nom' | 'prenom' | 'avatarColor'> | null
}

/** Zone avec ses postes (staff) et ses missions dédupliquées */
export interface ServiceZoneData extends ServiceZone {
  postes:   ServiceZonePoste[]
  missions: ServiceMission[]
}

export interface ServicePageData {
  service: {
    id:          number
    date:        string     // 'YYYY-MM-DD'
    heureDebut:  string     // 'HH:mm'
    heureFin:    string     // 'HH:mm'
    statut:      ServiceStatut
    centreName:  string
  }
  zones: ServiceZoneData[]
  staff: ServiceStaffMember[]
}

// ─── Incident form payload ────────────────────────────────────────────────────

export interface IncidentPayload {
  titre:      string
  severite:   IncidentSeverite
  zoneId:     number | null
  staffIds:   number[]
  serviceId:  number
}
