'use client'

import { useState } from 'react'
import BillingSwitch, { type BillingPeriod } from './BillingSwitch'
import PlanCard, { type Plan } from './PlanCard'
import RevealSection from './RevealSection'

const PLANS: Plan[] = [
  {
    key: 'starter',
    emoji: '🌱',
    name: 'Starter',
    monthly: { val: '79€', unit: '/mois HT', sub: 'par centre · facturation mensuelle' },
    yearly: { val: '790€', unit: '/an HT', sub: 'par centre · paiement en 1 fois' },
    desc: 'Pour un centre indépendant qui veut structurer ses services et son équipe.',
    features: [
      "Jusqu'à <strong>15 collaborateurs</strong>",
      'Modules <strong>Service, Postes, Staff, Tutoriels</strong>',
      '<strong>Pointage temps réel</strong> + export paie',
      'Support email sous 24h',
      'Mises à jour incluses',
    ],
    ctaLabel: 'Essayer 14 jours →',
    ctaIntent: 'trial',
    foot: 'Sans carte bancaire',
  },
  {
    key: 'pro',
    emoji: '🚀',
    name: 'Pro',
    monthly: { val: '129€', unit: '/mois HT', sub: 'par centre · facturation mensuelle' },
    yearly: { val: '1 290€', unit: '/an HT', sub: 'par centre · paiement en 1 fois' },
    desc: 'Le standard pour un centre qui veut tout : opérationnel, conformité et pilotage.',
    features: [
      '<strong>Collaborateurs illimités</strong>',
      'Tout Starter +',
      '<strong>Dashboard manager</strong> + KPI temps réel',
      '<strong>Validation hebdo IDCC 1790</strong>',
      'HACCP intégré (sept. 2026)',
      'Réservations &amp; CSE',
      'Support email + visio sous 4h',
    ],
    ctaLabel: 'Réserver une démo',
    ctaIntent: 'demo',
    variant: 'featured',
    badge: '⭐ Le plus choisi',
    isPrimary: true,
    foot: 'Le plan recommandé',
  },
  {
    key: 'premium',
    emoji: '👑',
    name: 'Premium',
    monthly: { val: '199€', unit: '/mois HT', sub: '+ pack accompagnement (devis)' },
    yearly: { val: '1 990€', unit: '/an HT', sub: '+ pack accompagnement (devis)' },
    desc: 'Pour les centres qui veulent du sur-mesure : audit, intégration, fonctionnalités exclusives.',
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
    ctaLabel: 'Parler à Kévin →',
    ctaIntent: 'custom',
    variant: 'premium',
    badge: '✨ Sur mesure',
    foot: 'Devis personnalisé sous 48h',
  },
]

// Section tarifs : switcher Mensuel/Annuel + 3 plans.
export default function PricingSection() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  return (
    <RevealSection id="tarifs" className="mkt-section" style={{ background: 'var(--surface)' }}>
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">💶 Tarifs</div>
          <h2 className="mkt-section-title">
            Un prix par centre.
            <br />
            Pas de surprise.
          </h2>
          <p className="mkt-section-subtitle">
            Sans engagement, annulable en un clic. 14 jours d&apos;essai gratuit sans carte
            bancaire. Payez au mois ou à l&apos;année et économisez 2 mois.
          </p>
        </div>

        <BillingSwitch period={period} onChange={setPeriod} />

        <div className="mkt-pricing-grid">
          {PLANS.map((p) => (
            <PlanCard key={p.key} plan={p} period={period} />
          ))}
        </div>

        <div className="mkt-pricing-note">
          <strong>💬 Hésitation sur la formule ?</strong> Réservez 20 minutes avec Kévin, il
          vous oriente vers le bon plan — sans baratin.
        </div>
      </div>
    </RevealSection>
  )
}
