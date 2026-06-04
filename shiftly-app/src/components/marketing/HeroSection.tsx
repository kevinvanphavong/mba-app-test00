'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLeadModal } from '@/store/leadModalStore'
import { useAudience } from '@/store/audienceStore'
import AudienceSwitch from './AudienceSwitch'
import HeroVisualMock from './HeroVisualMock'

// Textes alternatifs eyebrow / H1 / sous-titre selon l'audience.
// Source : `docs/maquettes/landing-shiftly.html` lignes 1312-1319.
const HERO_TEXTS = {
  loisirs: {
    eyebrow: 'Le logiciel pensé pour les parcs de loisirs',
    h1Lead:  'Pilotez votre parc de loisirs',
    p:       'Vos managers perdent 8h par semaine à éteindre des feux : plannings griffonnés, missions oubliées, pointages contestés. Shiftly leur rend 6h — service du jour, postes, pointage, formation, équipe. Pensé pour bowling, laser, arcade, karaoké, VR.',
  },
  commerce: {
    eyebrow: "L'outil de pilotage pour les commerces de proximité",
    h1Lead:  'Pilotez votre commerce',
    p:       'Vos managers perdent 8h par semaine à éteindre des feux : plannings griffonnés, missions oubliées, pointages contestés. Shiftly leur rend 6h — service du jour, postes, pointage, formation, équipe. Pensé pour cafés, restos, salons, garages, boutiques.',
  },
} as const

export default function HeroSection() {
  const openLead = useLeadModal((s) => s.open)
  const audience = useAudience((s) => s.audience)
  const hydrate  = useAudience((s) => s.hydrate)

  // Hydratation depuis localStorage au mount (évite le mismatch SSR).
  useEffect(() => { hydrate() }, [hydrate])

  const texts = HERO_TEXTS[audience]

  return (
    <section className="mkt-hero">
      <div className="mkt-container mkt-hero-grid">
        <div>
          <AudienceSwitch />

          <div className="mkt-hero-eyebrow">
            <motion.span
              className="mkt-hero-dot"
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span>{texts.eyebrow}</span>
          </div>
          <h1>
            {texts.h1Lead} <span className="mkt-highlight">comme une vraie entreprise.</span>
          </h1>
          <p>{texts.p}</p>
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
