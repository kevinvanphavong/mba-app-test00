'use client'

import { useState, useRef, useEffect } from 'react'
import type { EditorMission } from '@/types/editeur'

// ─── Ligne mission (vue mobile/tablette) ──────────────────────────────────────

const CAT_CONFIG: Record<EditorMission['categorie'], { label: string; color: string }> = {
  OUVERTURE: { label: 'Ouverture', color: 'var(--blue)'   },
  PENDANT:   { label: 'Pendant',   color: 'var(--green)'  },
  MENAGE:    { label: 'Ménage',    color: 'var(--yellow)' },
  FERMETURE: { label: 'Fermeture', color: 'var(--purple)' },
}

const PRIO_CONFIG: Record<EditorMission['priorite'], { label: string; color: string }> = {
  vitale:          { label: 'Vitale',           color: 'var(--red)'    },
  important:       { label: 'Important',        color: 'var(--accent)' },
  ne_pas_oublier:  { label: 'À ne pas oublier', color: 'var(--muted)'  },
}

interface Props {
  mission: EditorMission
  /** Si fournis, affiche un menu ⋯ avec actions manager. */
  onEdit?:   (m: EditorMission) => void
  onDelete?: (m: EditorMission) => void
}

export default function MissionRow({ mission, onEdit, onDelete }: Props) {
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
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px]"
          style={{ color: cat.color, background: `${cat.color}20` }}
        >
          {cat.label}
        </span>

        {mission.frequence === 'PONCTUELLE' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] text-accent bg-accent/10">
            Ponctuelle
          </span>
        )}

        {mission.requiresPhoto && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] text-accent bg-accent/10 inline-flex items-center gap-0.5"
            title="Cette mission demande une preuve photo pour être validée"
          >
            📷
          </span>
        )}

        {/* Menu actions manager (mobile) */}
        {editable && (
          <div className="relative" ref={menuRef}>
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
                  onClick={() => { setMenuOpen(false); onEdit!(mission) }}
                  className="block w-full text-left px-3 py-2 text-[12px] text-text hover:bg-surface2"
                >
                  Modifier
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete!(mission) }}
                  className="block w-full text-left px-3 py-2 text-[12px] text-red hover:bg-red/10"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
