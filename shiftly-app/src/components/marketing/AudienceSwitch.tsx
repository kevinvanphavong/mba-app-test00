'use client'

import { motion } from 'framer-motion'
import { useAudience, type Audience } from '@/store/audienceStore'

// Switcher "double porte" en haut du hero : Loisirs / Commerce.
// Le thumb anime entre les deux options via `layoutId="audienceThumb"`
// (Framer Motion gère la transition fluide sans calculer left/width).
const OPTIONS: { value: Audience; label: string }[] = [
  { value: 'loisirs',  label: '🎳 Parc de loisirs' },
  { value: 'commerce', label: '🏪 Commerce de proximité' },
]

export default function AudienceSwitch() {
  const audience    = useAudience((s) => s.audience)
  const setAudience = useAudience((s) => s.setAudience)

  return (
    <div
      className="mkt-audience-switch"
      role="tablist"
      aria-label="Choisissez votre type d'activité"
    >
      {OPTIONS.map((o) => {
        const active = audience === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`mkt-audience-switch-btn ${active ? 'is-active' : ''}`}
            onClick={() => setAudience(o.value)}
          >
            {active && (
              <motion.span
                layoutId="audienceThumb"
                className="mkt-audience-switch-thumb"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="mkt-audience-switch-label">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
