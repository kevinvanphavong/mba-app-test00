'use client'

import { useLeadModal, type LeadIntent, type LeadPlan } from '@/store/leadModalStore'
import type { BillingPeriod } from './BillingSwitch'

export type Plan = {
  key: LeadPlan
  emoji: string
  name: string
  monthly: { val: string; unit: string; sub: string }
  yearly: { val: string; unit: string; sub: string }
  desc: string
  features: string[]
  ctaLabel: string
  ctaIntent: LeadIntent
  variant?: 'featured' | 'premium'
  badge?: string
  foot: string
  isPrimary?: boolean
  pack?: { icon: string; html: string; full?: boolean }[]
}

// Carte d'un plan tarifaire. Le bouton ouvre la modale lead avec intent/plan préselectionnés.
export default function PlanCard({ plan, period }: { plan: Plan; period: BillingPeriod }) {
  const openLead = useLeadModal((s) => s.open)
  const price = period === 'monthly' ? plan.monthly : plan.yearly
  const variantClass =
    plan.variant === 'featured' ? 'is-featured' : plan.variant === 'premium' ? 'is-premium' : ''

  return (
    <div className={`mkt-plan ${variantClass}`}>
      {plan.badge && <span className="mkt-plan-badge">{plan.badge}</span>}
      <span className="mkt-plan-emoji">{plan.emoji}</span>
      <div className="mkt-plan-name">{plan.name}</div>
      <div className="mkt-plan-price">
        <span className="mkt-plan-price-val">{price.val}</span>
        <span className="mkt-plan-price-unit">{price.unit}</span>
      </div>
      <div className="mkt-plan-price-sub">{price.sub}</div>
      <div className="mkt-plan-desc">{plan.desc}</div>

      <ul className="mkt-plan-list">
        {plan.features.map((f) => (
          <li key={f} dangerouslySetInnerHTML={{ __html: f }} />
        ))}
      </ul>

      {plan.pack && (
        <div className="mkt-plan-pack">
          <div className="mkt-plan-pack-head">🤝 Pack accompagnement inclus</div>
          <div className="mkt-plan-pack-grid">
            {plan.pack.map((it) => (
              <div
                key={it.html}
                className={`mkt-plan-pack-item ${it.full ? 'mkt-plan-pack-full' : ''}`}
              >
                <span className="mkt-plan-pack-icon">{it.icon}</span>
                <span dangerouslySetInnerHTML={{ __html: it.html }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className={`mkt-btn ${plan.isPrimary ? 'mkt-btn-primary' : 'mkt-btn-secondary'}`}
        onClick={() => openLead(plan.ctaIntent, plan.key)}
      >
        {plan.ctaLabel}
      </button>
      <div className="mkt-plan-foot">{plan.foot}</div>
    </div>
  )
}
