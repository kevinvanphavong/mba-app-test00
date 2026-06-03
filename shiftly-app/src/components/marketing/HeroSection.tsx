'use client'

import { motion } from 'framer-motion'
import { useLeadModal } from '@/store/leadModalStore'
import HeroVisualMock from './HeroVisualMock'

// Hero principal : promesse forte + 2 CTAs (démo / essai) + mock app.
export default function HeroSection() {
  const openLead = useLeadModal((s) => s.open)

  return (
    <section className="mkt-hero">
      <div className="mkt-container mkt-hero-grid">
        <div>
          <div className="mkt-hero-eyebrow">
            <motion.span
              className="mkt-hero-dot"
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            🎳 Le 1er logiciel pensé pour les parcs de loisirs
          </div>
          <h1>
            Vos managers perdent <span className="mkt-highlight">8h par semaine</span> à
            organiser le service.
          </h1>
          <p>
            Shiftly leur en rend 6. Services, postes, pointages, compétences, HACCP — un seul
            outil pensé pour les bowlings, laser games, arcades, karaokés et VR. Conforme
            IDCC 1790.
          </p>
          <div className="mkt-hero-ctas">
            <button
              type="button"
              className="mkt-btn mkt-btn-primary mkt-btn-lg"
              onClick={() => openLead('demo', 'pro')}
            >
              📅 Réserver une démo de 20 min
            </button>
            <button
              type="button"
              className="mkt-btn mkt-btn-secondary mkt-btn-lg"
              onClick={() => openLead('trial', 'starter')}
            >
              Essai gratuit 14 jours
            </button>
          </div>
          <div className="mkt-hero-meta">
            <span className="mkt-hero-meta-item">
              <span className="mkt-check">✓</span> Sans carte bancaire
            </span>
            <span className="mkt-hero-meta-item">
              <span className="mkt-check">✓</span> Installation en 1h
            </span>
            <span className="mkt-hero-meta-item">
              <span className="mkt-check">✓</span> Données en France
            </span>
          </div>
        </div>

        <HeroVisualMock />
      </div>
    </section>
  )
}
