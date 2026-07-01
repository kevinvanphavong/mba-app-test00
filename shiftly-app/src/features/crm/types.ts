// Contrats API gérant CRM (groupes contact:read / avis:read / relance:read).
// Les PII des contacts sont renvoyées DÉCHIFFRÉES par l'API au gérant autorisé.

export interface Contact {
  id:        number
  nom:       string
  email:     string
  telephone: string | null
  segments:  string[]
  createdAt: string
  updatedAt: string
}

export type AvisStatut = 'NOUVEAU' | 'REPONDU'

export interface Avis {
  id:          number
  note:        number
  commentaire: string | null
  reponse:     string | null
  statut:      AvisStatut
  contactNom:  string | null
  createdAt:   string
}

export type RelanceStatut = 'A_REDIGER' | 'A_ENVOYER' | 'ENVOYEE'

export interface Relance {
  id:         number
  motif:      string
  texte:      string | null
  statut:     RelanceStatut
  contactNom: string | null
  createdAt:  string
  sentAt:     string | null
}
