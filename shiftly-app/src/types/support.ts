export type TicketStatut    = 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'FERME'
export type TicketPriorite  = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'
export type TicketCategorie = 'bug' | 'question' | 'feature_request' | 'facturation' | 'autre'

export interface SupportAttachment {
  id:       number
  filename: string
  mimeType: string
  size:     number
}

/** Réponse de GET /api/support/attachments/{id}/url — URL signée TTL 1h. */
export interface SupportAttachmentUrl {
  url:       string
  expiresAt: string
}

export interface TicketAuthor {
  id:     number
  nom:    string
  prenom: string | null
  email?: string
  role?:  string
}

export interface SupportReply {
  id:        number
  message:   string
  interne:   boolean
  createdAt: string
  auteur:    TicketAuthor
  attachments: SupportAttachment[]
}

export interface SupportTicketSummary {
  id:            number
  sujet:         string
  extrait:       string
  categorie:     TicketCategorie
  statut:        TicketStatut
  priorite:      TicketPriorite
  centre:        { id: number; nom: string } | null
  auteur:        TicketAuthor
  assigneA:      { id: number; nom: string } | null
  createdAt:     string
  updatedAt:     string | null
  lastActivity:  string
  repliesCount:  number
  unread:        boolean
}

export interface SupportTicketDetail extends SupportTicketSummary {
  message:     string
  attachments: SupportAttachment[]
  replies:     SupportReply[]
}

export interface SupportStats {
  ouverts:             number
  enCours:             number
  urgents:             number
  resolusCetteSemaine: number
}

// ─── Manager side (app classique) ────────────────────────────────────────────

export interface MyTicketSummary {
  id:             number
  sujet:          string
  categorie:      TicketCategorie
  statut:         TicketStatut
  priorite:       TicketPriorite
  createdAt:      string
  updatedAt:      string | null
  hasUnreadReply: boolean
}

export interface MyTicketDetail {
  id:          number
  sujet:       string
  message:     string
  categorie:   TicketCategorie
  statut:      TicketStatut
  priorite:    TicketPriorite
  createdAt:   string
  attachments: SupportAttachment[]
  replies:     Omit<SupportReply, 'interne'>[]
}

export interface SupportNotifications {
  count:   number
  tickets: Array<{ id: number; sujet: string; statut: TicketStatut }>
}
