// Types TypeScript pour le module Validation Hebdomadaire

export type ValidationStatut = 'EN_ATTENTE' | 'VALIDEE' | 'CORRIGEE'

export type JourStatut =
  | 'travaille'
  | 'repos'
  | 'absent_justifie'
  | 'absent_non_justifie'
  | 'en_cours'

export type AlerteType =
  | 'depassement_hebdo'
  | 'majoration_25'
  | 'majoration_50'
  | 'absence_non_justifiee'
  | 'repos_quotidien'
  | 'repos_hebdo'
  | 'pause_6h'
  | 'max_journalier'
  | 'max_hebdo'

export type AlerteSeverite = 'ok' | 'warning' | 'danger'

export interface ValidationKPI {
  heuresTravaillees: number  // en minutes
  heuresPrevues: number      // en minutes
  ecart: number              // en minutes, peut être négatif
  tauxPonctualite: number    // 0-100
  nbAbsences: number
  evolutionAbsences: number  // diff vs semaine N-1 (positif = plus d'absences)
}

export interface ValidationPause {
  debut: string
  fin: string | null
  type: 'COURTE' | 'REPAS'
  dureeMinutes: number
}

export interface ValidationJour {
  date: string               // 'YYYY-MM-DD'
  jourSemaine: string        // 'Lun', 'Mar', etc.
  /** ID du Pointage du jour, null si repos ou pas de pointage créé. */
  pointageId: number | null
  statut: JourStatut
  heureArrivee: string | null
  heureDepart: string | null
  /**
   * true si heureDepart est inférée depuis l'heure de fin planifiée du
   * poste (staff a oublié de pointer son départ et le shift est terminé).
   * Le manager peut corriger via le formulaire de correction.
   */
  heureDepartAuto: boolean
  pauses: ValidationPause[]
  heuresNettes: number | null  // en minutes
  heuresPrevues: number | null // en minutes
  estRetard: boolean
  typeAbsence: string | null   // 'CP', 'RTT', 'MALADIE', etc.
}

export interface ValidationEmploye {
  userId: number
  nom: string
  prenom: string
  role: string
  zone: string | null
  jours: ValidationJour[]    // 7 éléments (lun→dim)
  totalTravaille: number     // minutes
  totalPrevu: number         // minutes
  ecart: number              // minutes
  heuresSup: number          // minutes
  nbRetards: number
  nbAbsences: number
  statut: ValidationStatut
  note: string | null        // ex: "2 retards cette semaine"
  corrections?: CorrectionPointage[]
}

export interface ValidationSemaine {
  semaine: number            // numéro ISO
  dateDebut: string          // lundi 'YYYY-MM-DD'
  dateFin: string            // dimanche 'YYYY-MM-DD'
  statutSemaine: 'en_attente' | 'validee' | 'en_cours'
  employes: ValidationEmploye[]
  kpis: ValidationKPI
}

export interface AlerteLegale {
  type: AlerteType
  severite: AlerteSeverite
  employe: { id: number; nom: string }
  titre: string
  detail: string
}

export interface CorrectionPointage {
  id: number
  pointageId: number
  champModifie: string
  ancienneValeur: string | null
  nouvelleValeur: string | null
  motif: string | null
  corrigePar: string         // nom du manager
  createdAt: string
}

export interface ValiderEmployePayload {
  userId: number
  date: string              // lundi YYYY-MM-DD
}

export interface CorrectionPayload {
  pointageId: number
  champModifie: 'heureArrivee' | 'heureDepart' | 'pauseDebut' | 'pauseFin'
  nouvelleValeur: string   // ISO datetime
  motif?: string
}
