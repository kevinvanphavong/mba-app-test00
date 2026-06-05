'use client'

import PlanCard from './PlanCard'
import { OFFER } from './plansData'
import RevealSection from './RevealSection'

// Section tarifs V3 : une seule offre, deux modes de facturation présentés
// côte à côte (Mensuel sans engagement / Annuel avec engagement 1 an et
// 2 mois offerts). Plus de toggle.
export default function PricingSection() {
  return (
    <RevealSection id="tarifs" className="mkt-section" style={{ background: 'var(--surface)' }}>
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">💶 Tarifs</div>
          <h2 className="mkt-section-title">
            Une offre, deux rythmes.
            <br />
            Pas de surprise.
          </h2>
          <p className="mkt-section-subtitle">
            Tout est inclus dans l&apos;offre. Choisissez le mensuel pour rester libre, ou
            l&apos;annuel pour économiser 2 mois (158€) avec un engagement d&apos;un an.
            14 jours d&apos;essai gratuit sans carte bancaire.
          </p>
        </div>

        <div className="mkt-pricing-grid">
          {OFFER.tiles.map((t) => (
            <PlanCard key={t.mode} offer={OFFER} tile={t} />
          ))}
        </div>

        <div className="mkt-pricing-note">
          <strong>💬 Une question avant de vous lancer ?</strong> Réservez 20 minutes avec
          Kévin — il vous montre concrètement comment Shiftly s&apos;adapte à votre métier,
          sans baratin.
        </div>
      </div>
    </RevealSection>
  )
}
