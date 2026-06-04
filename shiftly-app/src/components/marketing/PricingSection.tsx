'use client'

import { useState } from 'react'
import BillingSwitch, { type BillingPeriod } from './BillingSwitch'
import PlanCard from './PlanCard'
import { PLANS } from './plansData'
import RevealSection from './RevealSection'

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
            // p.hidden = carte conservée en DOM (réactivation rapide) mais
            // masquée visuellement. Utile aussi pour l'option correspondante
            // dans la modale lead.
            <div key={p.key} style={p.hidden ? { display: 'none' } : undefined} aria-hidden={p.hidden}>
              <PlanCard plan={p} period={period} />
            </div>
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
