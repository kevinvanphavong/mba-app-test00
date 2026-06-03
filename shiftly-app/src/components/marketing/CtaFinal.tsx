'use client'

import { useLeadModal } from '@/store/leadModalStore'

// CTA terminal — bloc sombre avec gradient ember, double bouton démo + essai.
export default function CtaFinal() {
  const openLead = useLeadModal((s) => s.open)

  return (
    <section className="mkt-cta-final" id="demo">
      <div className="mkt-container">
        <h2>
          Récupérez 6 heures par semaine.
          <br />
          Dès ce soir.
        </h2>
        <p>
          Réservez 20 minutes avec Kévin, montrez-nous votre centre, on vous montre comment
          Shiftly s&apos;y intègre. Sans engagement, sans baratin.
        </p>
        <div className="mkt-hero-ctas">
          <button
            type="button"
            className="mkt-btn mkt-btn-primary mkt-btn-lg"
            onClick={() => openLead('demo', 'pro')}
          >
            📅 Réserver ma démo de 20 min
          </button>
          <button
            type="button"
            className="mkt-btn mkt-btn-secondary mkt-btn-lg"
            onClick={() => openLead('trial', 'starter')}
          >
            Essayer 14 jours gratuit →
          </button>
        </div>
      </div>
    </section>
  )
}
