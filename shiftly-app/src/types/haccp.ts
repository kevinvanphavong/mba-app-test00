// ─── HACCP types — API responses ──────────────────────────────────────────────

export type HaccpEquipType = 'FRIGO' | 'CONGELATEUR' | 'VITRINE' | 'AUTRE'
export type HaccpReleveType = 'TEMPERATURE' | 'DLC' | 'PHOTO' | 'RECEPTION'
export type HaccpMoment = 'DEBUT_SERVICE' | 'FIN_SERVICE'

export interface HaccpEquipement {
  '@id'?:    string
  id:        number
  nom:       string
  type:      HaccpEquipType
  zone?:     { id: number; nom: string; couleur: string | null } | string | null
  seuilMin:  number
  seuilMax:  number
  unite:     string
  ordre:     number
  actif:     boolean
  createdAt: string
  updatedAt: string
}

export interface HaccpEquipementInput {
  centre?:   string  // IRI '/api/centres/{id}'
  nom:       string
  type:      HaccpEquipType
  zone?:     string | null
  seuilMin:  number
  seuilMax:  number
  unite?:    string
  ordre?:    number
  actif?:    boolean
}

/** Spec HACCP inline dans une mission. */
export interface MissionHaccpSpec {
  id:                       number
  typeReleve:               HaccpReleveType
  moment:                   HaccpMoment | null
  seuilMin:                 number | null
  seuilMax:                 number | null
  unite:                    string | null
  photoObligatoire:         boolean
  commentaireObligatoire:   boolean
  archivee:                 boolean
  equipement: {
    id:       number
    nom:      string
    type:     HaccpEquipType
    seuilMin: number
    seuilMax: number
    unite:    string
  } | null
}

export interface CompleterHaccpInput {
  posteId:          number
  missionId:        number
  valeurNumerique?: number | null
  dateReleve?:      string | null   // 'YYYY-MM-DD'
  note?:            string | null
  photo?:           File | null
}

export interface CompleterHaccpResult {
  completion:  { id: number; completedAt: string | null }
  haccpProof:  {
    id:              number
    valeurNumerique: number | null
    dateReleve:      string | null
    estConforme:     boolean | null
    hasPhoto:        boolean
  }
}

export interface HaccpRegistreItem {
  id:               number
  createdAt:        string | null
  valeurNumerique:  number | null
  dateReleve:       string | null
  note:             string | null
  estConforme:      boolean | null
  hasPhoto:         boolean
  photoUrl:         string | null
  completion:       { id: number; completedAt: string | null } | null
  mission:          { id: number; texte: string } | null
  spec:             {
    typeReleve: HaccpReleveType
    moment:     HaccpMoment | null
    seuils:     { min: number | null; max: number | null; unite: string | null }
  } | null
  equipement:       { id: number; nom: string; type: HaccpEquipType } | null
  relevePar:        { id: number; nom: string; prenom: string | null } | null
}

export interface HaccpRegistreData {
  mois: string | null
  kpis: {
    total:           number
    conformes:       number
    nonConformes:    number
    tauxConformite:  number | null
  }
  items: HaccpRegistreItem[]
}

export interface HaccpSyncResult {
  creees:     number
  archivees:  number
  reactivees: number
  inchangees: number
}
