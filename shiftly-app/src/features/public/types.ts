// Contrats d'API publique de la Branche 1 (site client résolu par domaine).
// Alignés EXACTEMENT sur les controllers back :
//   - GET  /api/public/site          → PublicSiteController::show
//   - POST /api/public/reservations  → PublicReservationController::create
// Aucun `any` : tout ce qui vient de l'API est typé ici.

/** Une prestation telle qu'exposée publiquement (cf. PublicSiteController). */
export interface PublicPrestation {
  id:        number
  nom:       string
  description: string | null
  prixCents: number
}

/** Réponse de GET /api/public/site. */
export interface PublicSite {
  centre:        string
  heroTitre:     string | null
  heroSousTitre: string | null
  description:   string | null
  prestations:  PublicPrestation[]
}

/** Corps attendu par POST /api/public/reservations (cf. CreateReservationInput). */
export interface CreateReservationBody {
  prestationId: number
  dateCreneau:  string // ISO 8601, créneau futur
  nbPersonnes:  number
  nom:          string
  email:        string
  telephone:    string
}

/** Réponse 201 de POST /api/public/reservations. */
export interface ReservationResult {
  id:                number
  statut:            string
  prestation:        string | null
  dateCreneau:       string | null
  nbPersonnes:       number
  montantTotalCents: number
  acompteCents:      number
}

/** Réponse de POST /api/public/reservations/{id}/checkout : URL Stripe hébergée. */
export interface CheckoutUrl {
  url: string
}

/** Réponse de GET /api/public/reservations/{id} (page de retour paiement). */
export interface ReservationStatus {
  id:           number
  statut:       string
  prestation:   string | null
  acompteCents: number
}

/** Statut « réservation confirmée » (acompte encaissé). */
export const STATUT_CONFIRMEE = 'CONFIRMEE'
