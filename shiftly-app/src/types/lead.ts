// Types Lead — alignés sur App\Entity\Lead côté Symfony.
// Workflow : nouveau → contacte → qualifie → converti | perdu.

export type LeadIntent = 'trial' | 'demo' | 'custom'

export type LeadPlan = 'starter' | 'pro' | 'premium' | 'undecided'

export type LeadStatus = 'nouveau' | 'contacte' | 'qualifie' | 'converti' | 'perdu'

export type LeadChannel = 'meet' | 'zoom' | 'teams' | 'phone'

export type LeadActivity =
  | 'bowling'
  | 'laser'
  | 'arcade'
  | 'karaoke'
  | 'vr'
  | 'mixte'
  | 'autre'

export interface LeadHandler {
  id:     number
  nom:    string
  prenom: string | null
}

export interface LeadSummary {
  id:        number
  intent:    LeadIntent
  plan:      LeadPlan
  name:      string
  email:     string
  phone:     string
  centre:    string
  city:      string | null
  zip:       string | null
  activity:  LeadActivity
  status:    LeadStatus
  createdAt: string
  handledBy: LeadHandler | null
  handledAt: string | null
}

export interface LeadDetail extends LeadSummary {
  staffSize:     string
  preferredSlot: string | null
  channel:       LeadChannel | null
  customNeeds:   string | null
  message:       string | null
  consent:       boolean
  consentAt:     string | null
  source:        string
  notes:         string | null
  updatedAt:     string | null
}

export interface LeadListResponse {
  items:      LeadSummary[]
  total:      number
  page:       number
  perPage:    number
  totalPages: number
}

export interface LeadStats {
  nouveaux:             number
  nouveauxCeMois:       number
  tauxConversion:       number
  leadsNonTraitesVieux: number
  mrrPotentielEur:      number
}

export interface LeadFilters {
  status?: LeadStatus | ''
  intent?: LeadIntent | ''
  plan?:   LeadPlan | ''
  q?:      string
  page?:   number
}
