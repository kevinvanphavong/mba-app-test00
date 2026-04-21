// ─── Module Pointage — types ──────────────────────────────────────────────────

export type PointageStatut = 'PREVU' | 'EN_COURS' | 'EN_PAUSE' | 'TERMINE' | 'ABSENT'
export type PauseType      = 'COURTE' | 'REPAS'

export interface PointagePause {
  id:         number
  heureDebut: string        // ISO datetime
  heureFin:   string | null // null = pause en cours
  type:        PauseType
  duree?:      number        // minutes (calculé côté front)
}

export interface PointageUser {
  id:          number
  nom:         string
  prenom:      string | null
  avatarColor: string | null
  role:        'MANAGER' | 'EMPLOYE'
}

export interface PointagePoste {
  id:           number
  heureDebut:   string | null  // HH:mm prévu
  heureFin:     string | null  // HH:mm prévu
  pauseMinutes: number
  zone: {
    id:      number
    nom:     string
    couleur: string
  }
}

export interface PointageEntry {
  id:             number
  user:           PointageUser
  poste:          PointagePoste | null
  heureArrivee:   string | null   // ISO datetime réel
  heureDepart:    string | null   // ISO datetime réel
  statut:         PointageStatut
  pauses:         PointagePause[]
  dureeEffective: number          // minutes (calculé côté API)
  minutesRetard:  number          // 0 si à l'heure
  commentaire:    string | null
}

export interface PointageStats {
  total:          number
  presents:       number   // EN_COURS
  enPause:        number   // EN_PAUSE
  absents:        number   // ABSENT
  termines:       number   // TERMINE
  prevus:         number   // PREVU
  retards:        number   // arrivée > heure prévue
  heuresCumulees: number   // total heures effectives (décimal)
}

export interface PointageServiceData {
  service: {
    id:         number
    date:       string
    heureDebut: string | null
    heureFin:   string | null
    statut:     'PLANIFIE' | 'EN_COURS' | 'TERMINE'
  }
  pointages: PointageEntry[]
  stats:     PointageStats
}

// ─── Payloads mutations ───────────────────────────────────────────────────────

export interface PinPayload {
  codePin?:       string
  managerBypass?: boolean
  commentaire?:   string
}

export interface PauseStartPayload extends PinPayload {
  type?: PauseType
}
