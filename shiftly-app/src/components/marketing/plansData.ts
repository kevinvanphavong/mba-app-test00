import type { LeadIntent, LeadPlan } from '@/store/leadModalStore'

// Source de vérité unique des formules marketing — utilisée par PricingSection
// (cartes tarifaires) ET par LeadModalParts (options du <select> Formule
// d'intérêt). Changer un prix ici met à jour la landing et la modale.

export type Plan = {
  key:        LeadPlan
  emoji:      string
  name:       string
  monthly:    { val: string; unit: string; sub: string }
  yearly:     { val: string; unit: string; sub: string }
  desc:       string
  features:   string[]
  ctaLabel:   string
  ctaIntent:  LeadIntent
  variant?:   'featured' | 'premium'
  badge?:     string
  foot:       string
  isPrimary?: boolean
  hidden?:    boolean   // carte conservée en DOM, masquée via style.display = 'none'
  pack?:      { icon: string; html: string; full?: boolean }[]
}

export const PLANS: Plan[] = [
  {
    key:     'starter',
    emoji:   '🌱',
    name:    'Starter',
    monthly: { val: '49€',  unit: '/mois HT', sub: 'par établissement · facturation mensuelle' },
    yearly:  { val: '490€', unit: '/an HT',   sub: 'par établissement · paiement en 1 fois' },
    desc:    'L\'essentiel pour reprendre la main sur votre équipe et votre service. Sans usine à gaz.',
    features: [
      '<strong>Planning sur mobile</strong> pour toute votre équipe — fini le tableau effaçable et les SMS le dimanche soir',
      '<strong>Carnet de votre équipe</strong> centralisé — fiches, contacts, contrats, ancienneté en un clic',
      '<strong>Pointage tracé + export paie</strong> — vos heures arrêtent d\'être un sujet de tension avec le comptable',
      '<strong>Liste des tâches du jour</strong> assignée à chacun — plus rien n\'est oublié, même le vendredi soir',
      '<strong>Fiches de poste + tutoriels intégrés</strong> — vos savoir-faire vivent dans l\'app, pas dans la tête de votre chef d\'équipe',
      '<strong>Kévin vous répond</strong> sous 48h ouvrées, en français',
      '<strong>Toutes les nouveautés</strong> débloquées au fur et à mesure, sans surcoût',
    ],
    ctaLabel:  'Essayer 14 jours →',
    ctaIntent: 'trial',
    foot:      'Sans carte bancaire',
  },
  {
    key:     'pro',
    emoji:   '🚀',
    name:    'Pro',
    monthly: { val: '99€',   unit: '/mois HT', sub: 'par établissement · facturation mensuelle' },
    yearly:  { val: '990€',  unit: '/an HT',   sub: 'par établissement · paiement en 1 fois' },
    desc:    'Le standard pour piloter votre établissement avec dashboard manager temps réel.',
    features: [
      '<strong>Tout le plan Starter</strong>',
      '<strong>Dashboard manager</strong> + KPI temps réel',
      '<strong>Collaborateurs illimités</strong>',
      'Support email sous 24h',
    ],
    ctaLabel:  'Réserver une démo',
    ctaIntent: 'demo',
    variant:   'featured',
    badge:     '⭐ Le plus choisi',
    isPrimary: true,
    foot:      'Le plan recommandé',
  },
  // ─── Premium MASQUÉ V1 ────────────────────────────────────────────────────
  // Carte conservée pour réactivation rapide post-audit IDCC + offre stabilisée.
  // L'option reste dans le <select> de la modale lead (utile si Kévin envoie le
  // lien à un prospect haut de gamme pendant un appel).
  {
    key:     'premium',
    emoji:   '👑',
    name:    'Premium',
    monthly: { val: '199€',   unit: '/mois HT', sub: '+ pack accompagnement (devis)' },
    yearly:  { val: '1 990€', unit: '/an HT',   sub: '+ pack accompagnement (devis)' },
    desc:    'Pour les centres qui veulent du sur-mesure : audit, intégration, fonctionnalités exclusives.',
    features: [
      '<strong>Tout le plan Pro</strong>, sans limite',
      '🎨 <strong>Personnalisation</strong> de votre app aux besoins de votre centre',
      '🎯 Support prioritaire + SLA dédié',
    ],
    pack: [
      { icon: '📞', html: '<strong>Analyse</strong> des besoins approfondie' },
      { icon: '🏢', html: '<strong>Audit sur place</strong> dans votre centre' },
      { icon: '📑', html: "<strong>Retour</strong> + plan d'attaque détaillé" },
      { icon: '🔧', html: '<strong>Installation</strong> sur place par Kévin' },
      {
        icon: '📊',
        html: '<strong>Intégration</strong> de vos données existantes (plannings, équipe, historique)',
        full: true,
      },
    ],
    ctaLabel:  'Parler à Kévin →',
    ctaIntent: 'custom',
    variant:   'premium',
    badge:     '✨ Sur mesure',
    foot:      'Devis personnalisé sous 48h',
    hidden:    true,
  },
]
