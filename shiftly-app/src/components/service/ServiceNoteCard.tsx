'use client'

import { useState, useRef } from 'react'
import { ty }                from '@/lib/typography'
import { useAddServiceNote } from '@/hooks/useService'

interface Props {
  serviceId: number
  note:      string | null
  isManager: boolean
}

export default function ServiceNoteCard({ serviceId, note, isManager }: Props) {
  const [editing,    setEditing]   = useState(false)
  const [value,      setValue]     = useState(note ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { mutate, isPending } = useAddServiceNote()

  // Si pas de note et pas manager → ne rien afficher (évite une carte vide en lecture seule)
  if (!note && !isManager) return null

  function startEdit() {
    setValue(note ?? '')
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function save() {
    mutate({ serviceId, note: value }, {
      onSuccess: () => setEditing(false),
    })
  }

  function cancel() {
    setValue(note ?? '')
    setEditing(false)
  }

  return (
    <div className="bg-surface border border-border rounded-[18px] p-4">
      <div className="flex items-center justify-between mb-2">
        <p className={`${ty.labelMuted} uppercase tracking-wide`}>Note du service</p>
        {isManager && !editing && (
          <button
            onClick={startEdit}
            className="text-[11px] text-accent hover:opacity-80 transition-opacity"
          >
            {note ? 'Modifier' : '+ Ajouter'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            rows={3}
            placeholder="Note sur ce service…"
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2.5 text-[13px] text-text resize-none focus:outline-none focus:border-accent transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={isPending}
              className="flex-1 py-2 rounded-[10px] bg-accent text-white text-[12px] font-bold hover:bg-accent/90 disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              onClick={cancel}
              disabled={isPending}
              className="flex-1 py-2 rounded-[10px] bg-surface2 text-muted text-[12px] hover:text-text disabled:opacity-60 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : note ? (
        <div className="bg-surface2 border border-border rounded-[12px] px-3.5 py-3 flex gap-2.5">
          <span className="text-[16px] shrink-0">📝</span>
          <p className={`${ty.bodyLg} leading-relaxed whitespace-pre-wrap`}>{note}</p>
        </div>
      ) : (
        <p className={`${ty.bodyLg} text-muted italic`}>
          Aucune note pour ce service.
        </p>
      )}
    </div>
  )
}
