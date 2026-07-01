// Réservation telle qu'exposée au gérant (groupe `reservation:read` de l'API).
// Aucune donnée Stripe/carte n'est présente côté API — ne rien ajouter ici.

export type ReservationStatut = 'EN_ATTENTE_ACOMPTE' | 'CONFIRMEE'

export interface Reservation {
  id:                number
  statut:            ReservationStatut
  dateCreneau:       string
  prestationNom:     string | null
  nbPersonnes:       number
  nomInvite:         string
  emailInvite:       string
  telephoneInvite:   string
  montantTotalCents: number
  acompteCents:      number
  paidAt:            string | null
  createdAt:         string
}

/** Onglet de filtre de l'écran Réservations. */
export type ReservationFiltre = 'a_venir' | 'passees' | 'confirmees' | 'en_attente'
