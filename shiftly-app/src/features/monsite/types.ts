// Catalogue des prestations réservables (côté gérant). Montants en centimes.

export interface Prestation {
  id:          number
  nom:         string
  description: string | null
  prixCents:   number
  ordre:       number
  actif:       boolean
}

/** Payload de création/édition d'une prestation. */
export interface PrestationInput {
  nom:         string
  description: string | null
  prixCents:   number
  ordre:       number
  actif:       boolean
}
