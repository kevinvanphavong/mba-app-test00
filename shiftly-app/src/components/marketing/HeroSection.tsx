'use client'

import { motion } from 'framer-motion'
import { useLeadModal } from '@/store/leadModalStore'
import HeroVisualMock from './HeroVisualMock'

// Hero V3 — copy unifié qui énumère les types d'établissements ciblés pour
// déclencher le "ah oui c'est mon cas" chez le lecteur. Plus de switcher
// d'audience : le copywriting fait le travail.
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
            <span>Le logiciel de pilotage des patrons indépendants</span>
          </div>
          <h1>
            Bowling, café, resto, salon, garage&hellip;
            <br />
            <span className="mkt-highlight">Pilotez votre établissement</span> comme une vraie
            entreprise.
          </h1>
          <p>
            Vos managers perdent 8h par semaine à éteindre des feux : plannings griffonnés,
            missions oubliées, pointages contestés. Shiftly leur rend 6h — service du jour,
            postes, pointage, formation, équipe. Pour bowlings, cafés, restos, salons de
            coiffure, garages, parcs de loisirs, instituts de beauté, boutiques&hellip; tout
            commerce avec une équipe à manager au quotidien.
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
              onClick={() => openLead('trial', 'pro')}
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
