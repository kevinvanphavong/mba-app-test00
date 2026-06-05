'use client'

import { useLeadModal } from '@/store/leadModalStore'
import type { Offer, PriceTile } from './plansData'

// Carte d'un mode de facturation pour l'offre Shiftly unique (V3).
// Mensuel et Annuel partagent le même bloc descriptif (`offer.desc` + features),
// seul le bloc prix + CTA varie. La grille parent les place côte à côte.
export default function PlanCard({ offer, tile }: { offer: Offer; tile: PriceTile }) {
  const openLead = useLeadModal((s) => s.open)
  const variantClass = tile.isPrimary ? 'is-featured' : ''

  return (
    <div className={`mkt-plan ${variantClass}`}>
      {tile.badge && <span className="mkt-plan-badge">{tile.badge}</span>}
      <span className="mkt-plan-emoji">{offer.emoji}</span>
      <div className="mkt-plan-name">
        {offer.name} <span className="mkt-plan-billing">· {tile.label}</span>
      </div>
      <div className="mkt-plan-price">
        <span className="mkt-plan-price-val">{tile.val}</span>
        <span className="mkt-plan-price-unit">{tile.unit}</span>
      </div>
      <div className="mkt-plan-price-sub">{tile.engagement}</div>
      {tile.savings && <div className="mkt-plan-savings">{tile.savings}</div>}
      <div className="mkt-plan-desc">{offer.desc}</div>

      <ul className="mkt-plan-list">
        {offer.features.map((f) => (
          <li key={f}>
            {/* span obligatoire : sans wrapper, le HTML inséré (texte + <strong>)
                devient plusieurs flex items dans le li (display:flex, gap:10px). */}
            <span dangerouslySetInnerHTML={{ __html: f }} />
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`mkt-btn ${tile.isPrimary ? 'mkt-btn-primary' : 'mkt-btn-secondary'}`}
        onClick={() => openLead(tile.ctaIntent, offer.key)}
      >
        {tile.ctaLabel}
      </button>
      <div className="mkt-plan-foot">
        {tile.isPrimary ? '14 jours d\'essai gratuit avant facturation' : 'Sans carte bancaire'}
      </div>
    </div>
  )
}
