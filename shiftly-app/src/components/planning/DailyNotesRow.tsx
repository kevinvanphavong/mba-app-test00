'use client'

import { useState } from 'react'
import type { PlanningNote } from '@/types/planning'
import { useCreateNote, useDeleteNote } from '@/hooks/usePlanning'

interface Props {
  weekDates: string[]
  notes:     PlanningNote[]
}

/**
 * Ligne « Notes & événements » au-dessus de la grille planning (P2).
 * Une cellule par jour : chips de notes (suppression au survol) + ajout inline.
 * Alignée sur la grille (colonne gauche sticky de même largeur que PlanningRow).
 */
export default function DailyNotesRow({ weekDates, notes }: Props) {
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()

  const notesByDate = notes.reduce<Record<string, PlanningNote[]>>((acc, n) => {
    (acc[n.date] = acc[n.date] ?? []).push(n)
    return acc
  }, {})

  const submit = (date: string) => {
    const contenu = draft.trim()
    if (!contenu) { setActiveDate(null); return }
    createNote.mutate({ date, contenu }, { onSuccess: () => { setDraft(''); setActiveDate(null) } })
  }

  return (
    <div className="flex border-b border-[var(--border)] bg-[var(--surface)]/40">
      <div
        className="flex w-[140px] tablet:w-[200px] shrink-0 items-center border-r border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]"
        style={{ position: 'sticky', left: 0, zIndex: 4 }}
      >
        📌 Notes & événements
      </div>

      {weekDates.map(date => (
        <div key={date} className="group/cell relative flex-1 border-l border-[var(--border)] px-1.5 py-1.5" style={{ minWidth: 120 }}>
          <div className="flex flex-col gap-1">
            {(notesByDate[date] ?? []).map(n => (
              <div
                key={n.id}
                title={n.auteur ? `Ajoutée par ${n.auteur}` : undefined}
                className="group/note flex items-start gap-1 rounded-md border-l-2 border-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-1 text-[11px] text-[var(--text)]"
              >
                <span className="min-w-0 flex-1 break-words">{n.contenu}</span>
                <button
                  onClick={() => deleteNote.mutate(n.id)}
                  aria-label="Supprimer la note"
                  className="shrink-0 text-[var(--muted)] opacity-0 transition-opacity hover:text-[var(--red)] group-hover/note:opacity-100"
                >×</button>
              </div>
            ))}

            {activeDate === date ? (
              <input
                autoFocus
                value={draft}
                maxLength={280}
                onChange={e => setDraft(e.target.value)}
                onBlur={() => submit(date)}
                onKeyDown={e => { if (e.key === 'Enter') submit(date); if (e.key === 'Escape') setActiveDate(null) }}
                placeholder="Soirée privée, affluence…"
                className="w-full rounded border border-[var(--accent)]/40 bg-[var(--bg)] px-1.5 py-1 text-[11px] text-[var(--text)] outline-none"
              />
            ) : (
              <button
                onClick={() => { setActiveDate(date); setDraft('') }}
                className="w-full rounded border border-dashed border-[var(--border)] py-0.5 text-[10px] text-[var(--muted)] opacity-0 transition-opacity hover:text-[var(--text)] group-hover/cell:opacity-100"
              >
                + note
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
