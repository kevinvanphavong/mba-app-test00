'use client'

import type { Competence } from '@/types/index'

// ─── Styles des niveaux de difficulté ─────────────────────────────────────────

const DIFF_CONFIG: Record<Competence['difficulte'], { label: string; color: string }> = {
  simple:      { label: 'Simple',      color: 'var(--green)'  },
  avancee:     { label: 'Avancé',      color: 'var(--accent)' },
  experimente: { label: 'Expérimenté', color: 'var(--red)'    },
}

interface Props {
  competence: Competence
}

export default function CompetenceRow({ competence }: Props) {
  const diff = DIFF_CONFIG[competence.difficulte]

  return (
    <div className="flex items-center gap-2.5 p-2.5 bg-surface2 rounded-xl">
      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-text font-medium leading-snug">{competence.nom}</div>
        {competence.description && (
          <div className="text-[10px] text-muted mt-0.5 truncate">{competence.description}</div>
        )}
        {/* Badge difficulté */}
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] mt-1 inline-block"
          style={{ color: diff.color, background: `${diff.color}20` }}
        >
          {diff.label}
        </span>
      </div>

      {/* Points */}
      <div className="text-right flex-shrink-0">
        <div className="font-syne font-extrabold text-[15px] text-accent">+{competence.points}</div>
        <div className="text-[9px] text-muted">pts</div>
      </div>
    </div>
  )
}
