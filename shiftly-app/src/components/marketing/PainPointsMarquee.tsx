'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLeadModal } from '@/store/leadModalStore'

// Bandeau défilant "Si vous vous retrouvez dans un de ces cas..." — cas concrets
// par type de commerce pour déclencher le mécanisme de reconnaissance.
//
// Implémentation marquee : la track contient les items dupliqués deux fois.
// On anime de 0 à -50% en x sur une durée linéaire infinie → effet seamless.
// Pause au survol via un état (les CTAs des cards restent cliquables au passage).
// `useReducedMotion` désactive l'animation pour les utilisateurs sensibles.

type PainPoint = {
  quote:    string
  commerce: string
  emoji:    string
}

const PAIN_POINTS: PainPoint[] = [
  { quote: 'Mes serveurs débarquent et demandent "je commence par quoi ?" tous les matins.',          emoji: '🍽️', commerce: 'Restaurant' },
  { quote: 'Le planning est griffonné sur un tableau effaçable, personne ne sait qui ferme samedi.',  emoji: '🎳', commerce: 'Bowling' },
  { quote: 'Je passe mes dimanches à refaire les plannings au stylo.',                                 emoji: '✂️', commerce: 'Salon de coiffure' },
  { quote: 'Je découvre le lundi qu\'une remise en état du véhicule a été bâclée vendredi.',           emoji: '🔧', commerce: 'Garage' },
  { quote: 'Les heures supp de mon équipe sont toujours contestées en fin de mois.',                  emoji: '☕', commerce: 'Café · Bar' },
  { quote: 'J\'ai 3 nouvelles recrues à former et zéro temps à dégager.',                              emoji: '🧖', commerce: 'Institut de beauté' },
  { quote: 'Les missions critiques de fermeture tombent une fois sur trois.',                         emoji: '🎯', commerce: 'Laser game' },
  { quote: 'Mes vendeuses tournent tous les 6 mois, je re-recrute en boucle.',                        emoji: '🛍️', commerce: 'Boutique' },
  { quote: 'Mon staff part au bout de 6 mois — pas de progression visible, pas de reconnaissance.',   emoji: '🎤', commerce: 'Karaoké' },
  { quote: 'Chaque embauche, c\'est 4h de formation à l\'oral que je recommence à zéro.',              emoji: '🍷', commerce: 'Brasserie' },
]

export default function PainPointsMarquee() {
  const openLead       = useLeadModal((s) => s.open)
  const reduced        = useReducedMotion()
  const [paused, setPaused] = useState(false)

  // Items dupliqués : la track fait 200% de large, on translate de -50% pour
  // que le 2e jeu prenne la place du 1er → boucle invisible.
  const looped = [...PAIN_POINTS, ...PAIN_POINTS]

  return (
    <section className="mkt-pain-section">
      <div className="mkt-container mkt-pain-head">
        <div className="mkt-section-label">👀 Vous reconnaissez-vous ?</div>
        <h2 className="mkt-section-title">
          Si vous vous retrouvez dans un de ces cas&hellip;
        </h2>
      </div>

      <div
        className="mkt-pain-marquee"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-label="Témoignages de patrons par type de commerce"
      >
        <motion.div
          className="mkt-pain-track"
          animate={reduced ? undefined : { x: paused ? undefined : ['0%', '-50%'] }}
          transition={reduced ? undefined : { duration: 55, repeat: Infinity, ease: 'linear' }}
        >
          {looped.map((p, i) => (
            <article className="mkt-pain-card" key={`${p.commerce}-${i}`}>
              <div className="mkt-pain-card-quote">&laquo;&nbsp;{p.quote}&nbsp;&raquo;</div>
              <div className="mkt-pain-card-meta">
                <span className="mkt-pain-card-emoji">{p.emoji}</span>
                <span className="mkt-pain-card-commerce">{p.commerce}</span>
              </div>
            </article>
          ))}
        </motion.div>
      </div>

      <div className="mkt-container mkt-pain-foot">
        <p>
          &hellip;alors vous êtes au bon endroit. <strong>Shiftly est fait pour vous.</strong>
        </p>
        <button
          type="button"
          className="mkt-btn mkt-btn-primary"
          onClick={() => openLead('demo', 'pro')}
        >
          📅 Réserver une démo de 20 min
        </button>
      </div>
    </section>
  )
}
