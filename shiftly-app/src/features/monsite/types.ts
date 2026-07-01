// Contenu éditable du site public (côté gérant). Montants en centimes.

export interface Prestation {
  id:          number
  nom:         string
  description: string | null
  prixCents:   number
  ordre:       number
  actif:       boolean
}

/** Champs texte du site (groupe centre:read + édition via /centres/{id}/update). */
export interface SiteContenu {
  nom:               string
  siteHeroTitre:     string | null
  siteHeroSousTitre: string | null
  siteDescription:   string | null
}

/** Payload de création/édition d'une prestation. */
export interface PrestationInput {
  nom:         string
  description: string | null
  prixCents:   number
  ordre:       number
  actif:       boolean
}
