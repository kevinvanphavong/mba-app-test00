'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

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
  team:     string  // "8 personnes · 3 serveurs · 2 cuistots · 1 manager"
  city:     string
  surface:  string  // ex. "120 m²"
}

// Profils volontairement variés en taille / ville / m² pour que le lecteur
// trouve un cas proche du sien (PME indé / parc loisirs / commerce de centre-ville).
const PAIN_POINTS: PainPoint[] = [
  {
    quote:    'Mes serveurs débarquent et demandent "je commence par quoi ?" tous les matins.',
    emoji:    '🍽️',
    commerce: 'Restaurant',
    team:     '8 pers. · 3 serveurs · 2 cuistots · 2 plongeurs · 1 manager',
    city:     'Bordeaux',
    surface:  '120 m²',
  },
  {
    quote:    'Le planning est griffonné sur un tableau effaçable, personne ne sait qui ferme samedi.',
    emoji:    '🎳',
    commerce: 'Bowling',
    team:     '14 pers. · 4 accueil · 3 bar · 5 salle · 2 managers',
    city:     'Tours',
    surface:  '850 m²',
  },
  {
    quote:    'Je passe mes dimanches à refaire les plannings au stylo.',
    emoji:    '✂️',
    commerce: 'Salon de coiffure',
    team:     '5 pers. · 3 coiffeuses · 1 manucure · 1 gérante',
    city:     'Lyon',
    surface:  '60 m²',
  },
  {
    quote:    'Je découvre le lundi qu\'une remise en état du véhicule a été bâclée vendredi.',
    emoji:    '🔧',
    commerce: 'Garage',
    team:     '6 pers. · 3 mécaniciens · 1 carrossier · 1 secrétaire · 1 chef d\'atelier',
    city:     'Saint-Étienne',
    surface:  '320 m²',
  },
  {
    quote:    'Les heures supp de mon équipe sont toujours contestées en fin de mois.',
    emoji:    '☕',
    commerce: 'Café · Bar',
    team:     '7 pers. · 4 serveurs · 2 barmen · 1 manager',
    city:     'Nantes',
    surface:  '95 m²',
  },
  {
    quote:    'J\'ai 3 nouvelles recrues à former et zéro temps à dégager.',
    emoji:    '🧖',
    commerce: 'Institut de beauté',
    team:     '4 pers. · 2 esthéticiennes · 1 prothésiste · 1 gérante',
    city:     'Aix-en-Provence',
    surface:  '75 m²',
  },
  {
    quote:    'Les missions critiques de fermeture tombent une fois sur trois.',
    emoji:    '🎯',
    commerce: 'Laser game',
    team:     '10 pers. · 3 accueil · 4 game masters · 2 bar · 1 manager',
    city:     'Lille',
    surface:  '600 m²',
  },
  {
    quote:    'Mes vendeuses tournent tous les 6 mois, je re-recrute en boucle.',
    emoji:    '🛍️',
    commerce: 'Boutique',
    team:     '5 pers. · 3 vendeurs · 1 visual merch · 1 responsable',
    city:     'Strasbourg',
    surface:  '110 m²',
  },
  {
    quote:    'Mon staff part au bout de 6 mois — pas de progression visible, pas de reconnaissance.',
    emoji:    '🎤',
    commerce: 'Karaoké',
    team:     '8 pers. · 2 accueil · 3 bar · 2 régie · 1 manager',
    city:     'Toulouse',
    surface:  '280 m²',
  },
  {
    quote:    'Chaque embauche, c\'est 4h de formation à l\'oral que je recommence à zéro.',
    emoji:    '🍷',
    commerce: 'Brasserie',
    team:     '12 pers. · 5 serveurs · 3 cuistots · 2 plongeurs · 1 chef · 1 manager',
    city:     'Marseille',
    surface:  '180 m²',
  },
]

export default function PainPointsMarquee() {
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
              <div className="mkt-pain-card-details">
                <span className="mkt-pain-card-detail">
                  <span className="mkt-pain-card-icon">📍</span>
                  {p.city} · {p.surface}
                </span>
                <span className="mkt-pain-card-detail">
                  <span className="mkt-pain-card-icon">👥</span>
                  {p.team}
                </span>
              </div>
            </article>
          ))}
        </motion.div>
      </div>

      <div className="mkt-container mkt-pain-foot">
        <p>
          &hellip;alors vous êtes au bon endroit.{' '}
          <span className="mkt-pain-brand">Shiftly</span> est fait pour vous.
        </p>
      </div>
    </section>
  )
}
