'use client'

import { useState, useRef, useEffect } from 'react'
import type { EditorCompetence } from '@/types/editeur'
import type { Zone } from '@/types/index'

// ─── Panel compétences desktop ────────────────────────────────────────────────

interface Props {
  zone:        Zone
  competences: EditorCompetence[]
  loading:     boolean
  error:       boolean
  onAdd:       () => void
  onEdit:      (c: EditorCompetence) => void
  onDelete:    (c: EditorCompetence) => void
}

// Mapping difficulte → niveau (1-3) pour les 3 dots de la maquette
const DIFF_LEVEL: Record<EditorCompetence['difficulte'], number> = {
  simple: 1, avancee: 2, experimente: 3,
}

const DIFF_LABEL: Record<EditorCompetence['difficulte'], string> = {
  simple: 'Simple', avancee: 'Avancée', experimente: 'Expérimenté',
}

export default function CompetencesPanel({ zone, competences, loading, error, onAdd, onEdit, onDelete }: Props) {
  const color = zone.couleur ?? 'var(--accent)'

  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden shadow-card">
      {/* En-tête */}
      <div
        className="px-4 py-3 flex items-center gap-3 border-b border-border"
        style={{ background: `${color}0d` }}
      >
        <span className="w-3.5 h-3.5 rounded-[4px]" style={{ background: color }} />
        <div className="flex-1">
          <div className="font-syne font-extrabold text-[16px] text-text">
            Compétences · {competences.length}
          </div>
          <div className="text-[11px] text-muted">
            Référentiel des savoir-faire pour {zone.nom}
          </div>
        </div>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 rounded-[9px] bg-accent text-white text-[11px] font-syne font-bold"
        >
          + Compétence
        </button>
      </div>

      {/* Corps */}
      {loading && (
        <div className="p-4 space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-10 rounded bg-surface2 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="p-4 text-[12px] text-red">Erreur de chargement.</p>
      )}

      {!loading && !error && competences.length === 0 && (
        <p className="p-6 text-[12px] text-muted italic text-center">
          Aucune compétence définie pour cette zone.
        </p>
      )}

      {!loading && !error && competences.length > 0 && (
        <div>
          {competences.map((c, idx) => (
            <CompetenceLine
              key={c.id}
              competence={c}
              isLast={idx === competences.length - 1}
              color={color}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Ligne compétence ─────────────────────────────────────────────────────────
// Sous-composant inline (court) — pas de fichier dédié.

function CompetenceLine({
  competence: c, isLast, color, onEdit, onDelete,
}: {
  competence: EditorCompetence
  isLast:     boolean
  color:      string
  onEdit:     (c: EditorCompetence) => void
  onDelete:   (c: EditorCompetence) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const level = DIFF_LEVEL[c.difficulte]

  return (
    <div
      className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-3"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-text">{c.nom}</div>
        {c.description && (
          <div className="text-[11px] text-muted truncate">{c.description}</div>
        )}
      </div>

      {/* Niveau (3 dots) */}
      <div className="flex gap-1" title={`${DIFF_LABEL[c.difficulte]} · niveau ${level}/3`}>
        {[1, 2, 3].map(n => (
          <span
            key={n}
            className="w-[7px] h-[7px] rounded-full border"
            style={{
              background:  n <= level ? color : 'var(--surface2)',
              borderColor: n <= level ? color : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Points */}
      <span className="font-syne font-extrabold text-accent text-[13px]">+{c.points}</span>

      {/* Menu actions */}
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
              onClick={() => { setMenuOpen(false); onEdit(c) }}
              className="block w-full text-left px-3 py-2 text-[12px] text-text hover:bg-surface2"
            >
              Modifier
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(c) }}
              className="block w-full text-left px-3 py-2 text-[12px] text-red hover:bg-red/10"
            >
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
