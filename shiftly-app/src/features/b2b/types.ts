// Contrats API gérant B2B (groupes `demande_b2b:read` / `devis:read`).

export interface DemandeB2B {
  id:            number
  nomContact:    string
  email:         string
  telephone:     string
  societe:       string | null
  typeEvenement: string
  nbPersonnes:   number | null
  dateSouhaitee: string | null
  message:       string
  statut:        string
  createdAt:     string
}

export interface DevisLigne {
  designation:       string
  quantite:          number
  prixUnitaireCents: number
  montantCents:      number
}

export type DevisStatut = 'BROUILLON' | 'VALIDE' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE'

export interface Devis {
  id:         number
  demandeId:  number | null
  lignes:     DevisLigne[]
  totalCents: number
  statut:     DevisStatut
  notes:      string | null
  createdAt:  string
}
