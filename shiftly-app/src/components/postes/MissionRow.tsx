'use client'

import type { Mission } from '@/types/index'

// ─── Labels et styles des propriétés métier ───────────────────────────────────

const CAT_CONFIG: Record<Mission['categorie'], { label: string; color: string }> = {
  OUVERTURE: { label: 'Ouverture', color: 'var(--blue)'   },
  PENDANT:   { label: 'Pendant',   color: 'var(--green)'  },
  MENAGE:    { label: 'Ménage',    color: 'var(--yellow)' },
  FERMETURE: { label: 'Fermeture', color: 'var(--purple)' },
}

const PRIO_CONFIG: Record<Mission['priorite'], { label: string; color: string }> = {
  vitale:          { label: 'Vitale',        color: 'var(--red)'    },
  important:       { label: 'Important',     color: 'var(--accent)' },
  ne_pas_oublier:  { label: 'À ne pas oublier', color: 'var(--muted)'  },
}

interface Props {
  mission: Mission
}

export default function MissionRow({ mission }: Props) {
  const cat  = CAT_CONFIG[mission.categorie]
  const prio = PRIO_CONFIG[mission.priorite]

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border last:border-0">
      {/* Dot priorité */}
      <span
        className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: prio.color }}
      />

      {/* Texte */}
      <span className="flex-1 text-[12px] text-text leading-snug">{mission.texte}</span>

      {/* Tags */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Tag catégorie */}
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px]"
          style={{ color: cat.color, background: `${cat.color}20` }}
        >
          {cat.label}
        </span>

        {/* Badge PONCTUELLE */}
        {mission.frequence === 'PONCTUELLE' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] text-accent bg-[rgba(249,115,22,0.12)]">
            Ponctuelle
          </span>
        )}
      </div>
    </div>
  )
}
