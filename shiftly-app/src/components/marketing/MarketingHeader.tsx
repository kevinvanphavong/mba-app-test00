'use client'

import Link from 'next/link'
import { useLeadModal } from '@/store/leadModalStore'

// Header sticky de la landing publique : nav ancres + connexion + CTA démo.
export default function MarketingHeader() {
  const openLead = useLeadModal((s) => s.open)

  return (
    <header className="mkt-header">
      <div className="mkt-container mkt-header-inner">
        <Link href="/" className="mkt-logo">
          Shiftly<span className="mkt-logo-dot">.</span>
        </Link>
        <nav className="mkt-nav" aria-label="Navigation principale">
          <a href="#modules">Modules</a>
          <a href="#tarifs">Tarifs</a>
          <a href="#demo">Démo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="mkt-header-cta">
          <Link href="/login" className="mkt-btn mkt-btn-ghost">
            Connexion
          </Link>
          <button
            type="button"
            className="mkt-btn mkt-btn-primary"
            onClick={() => openLead('demo', 'pro')}
          >
            Réserver une démo
          </button>
        </div>
      </div>
    </header>
  )
}
