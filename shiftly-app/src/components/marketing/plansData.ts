import type { LeadIntent, LeadPlan } from '@/store/leadModalStore'

// Source de vérité unique de l'offre Shiftly — utilisée par PricingSection
// (cartes Mensuel + Annuel side-by-side) ET par LeadModalParts (option
// du <select> Formule). Changer un prix ici met à jour la landing et la
// modale.
//
// V3 : une seule offre. Plus de Starter/Pro/Premium. Deux modes de
// facturation présentés côte à côte (mensuel sans engagement vs annuel
// avec engagement 1 an et 2 mois offerts).

export type BillingMode = 'monthly' | 'yearly'

export type PriceTile = {
  mode:        BillingMode
  label:       string             // "Mensuel" / "Annuel"
  val:         string             // "79€" / "790€"
  unit:        string             // "/mois HT" / "/an HT"
  engagement:  string             // "Sans engagement" / "Engagement 1 an"
  badge?:      string             // bandeau coin sup.
  savings?:    string             // "Économisez 158€ · 2 mois offerts"
  ctaLabel:    string
  ctaIntent:   LeadIntent
  isPrimary?:  boolean
}

export type Offer = {
  key:       LeadPlan
  emoji:     string
  name:      string
  desc:      string
  features:  string[]
  tiles:     [PriceTile, PriceTile]
}

export const OFFER: Offer = {
  key:   'pro',
  emoji: '🚀',
  name:  'L\'offre Shiftly',
  desc:  'Tout ce qu\'il faut pour piloter votre équipe et votre service au quotidien — sans surcouche, sans add-on, sans surprise.',
  features: [
    '<strong>Planning sur mobile</strong> pour toute votre équipe — fini le tableau effaçable et les SMS le dimanche soir',
    '<strong>Carnet de votre équipe</strong> centralisé — fiches, contacts, contrats, ancienneté en un clic',
    '<strong>Pointage tracé + export paie</strong> — vos heures arrêtent d\'être un sujet de tension avec le comptable',
    '<strong>Liste des tâches du jour</strong> assignée à chacun — plus rien n\'est oublié, même le vendredi soir',
    '<strong>Fiches de poste + tutoriels intégrés</strong> — vos savoir-faire vivent dans l\'app, pas dans la tête de votre chef d\'équipe',
    '<strong>Dashboard manager</strong> + KPI temps réel',
    '<strong>Collaborateurs illimités</strong>',
    '<strong>Kévin vous répond</strong> sous 24h ouvrées, en français',
    '<strong>Toutes les nouveautés</strong> débloquées au fur et à mesure, sans surcoût',
  ],
  tiles: [
    {
      mode:       'monthly',
      label:      'Mensuel',
      val:        '79€',
      unit:       '/mois HT',
      engagement: 'Sans engagement · annulable en 1 clic',
      ctaLabel:   'Essayer 14 jours →',
      ctaIntent:  'trial',
    },
    {
      mode:       'yearly',
      label:      'Annuel',
      val:        '790€',
      unit:       '/an HT',
      engagement: 'Engagement 1 an · paiement en 1 fois',
      badge:      '⭐ Le plus économique',
      savings:    'Économisez 158€ · 2 mois offerts',
      ctaLabel:   'Réserver une démo',
      ctaIntent:  'demo',
      isPrimary:  true,
    },
  ],
}
