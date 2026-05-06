'use client'

import { useState, useRef, useEffect } from 'react'
import type { EditorCompetence } from '@/types/editeur'

// ─── Ligne compétence (vue mobile/tablette) ───────────────────────────────────

const DIFF_CONFIG: Record<EditorCompetence['difficulte'], { label: string; color: string }> = {
  simple:      { label: 'Simple',      color: 'var(--green)'  },
  avancee:     { label: 'Avancé',      color: 'var(--accent)' },
  experimente: { label: 'Expérimenté', color: 'var(--red)'    },
}

interface Props {
  competence: EditorCompetence
  /** Si fournis, affiche un menu ⋯ avec actions manager. */
  onEdit?:   (c: EditorCompetence) => void
  onDelete?: (c: EditorCompetence) => void
}

export default function CompetenceRow({ competence, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editable = !!onEdit && !!onDelete

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const diff = DIFF_CONFIG[competence.difficulte]

  return (
    <div className="flex items-center gap-2.5 p-2.5 bg-surface2 rounded-xl">
      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-text font-medium leading-snug">{competence.nom}</div>
        {competence.description && (
          <div className="text-[10px] text-muted mt-0.5 truncate">{competence.description}</div>
        )}
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

      {/* Menu actions manager */}
      {editable && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="text-muted hover:text-text text-[14px] px-1 leading-none"
            aria-label="Actions"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-[10px] shadow-card overflow-hidden min-w-[140px]">
              <button
                onClick={() => { setMenuOpen(false); onEdit!(competence) }}
                className="block w-full text-left px-3 py-2 text-[12px] text-text hover:bg-surface2"
              >
                Modifier
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete!(competence) }}
                className="block w-full text-left px-3 py-2 text-[12px] text-red hover:bg-red/10"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
