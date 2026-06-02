'use client'

import { useState } from 'react'
import HaccpModalShell from './HaccpModalShell'
import { ty } from '@/lib/typography'
import type { MissionHaccpSpec } from '@/types/haccp'

interface Props {
  open: boolean
  onClose: () => void
  missionTexte: string
  spec: MissionHaccpSpec
  onSubmit: (input: { photo: File; note?: string }) => Promise<void>
  loading?: boolean
}

/** Saisie d'une preuve photo simple (PHOTO). Note optionnelle. */
export default function HaccpModalPhoto({ open, onClose, missionTexte, spec, onSubmit, loading }: Props) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [note, setNote] = useState('')

  const canSubmit = photo !== null && !loading
    && (!spec.commentaireObligatoire || note.trim().length > 0)

  const handle = async () => {
    if (!canSubmit || !photo) return
    await onSubmit({ photo, note: note.trim() || undefined })
    setPhoto(null); setNote('')
  }

  return (
    <HaccpModalShell
      open={open}
      onClose={onClose}
      title="Preuve photo"
      subtitle={missionTexte}
      footer={
        <>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] bg-surface2 text-text font-semibold">Annuler</button>
          <button onClick={handle} disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-[10px] bg-accent text-white font-semibold disabled:opacity-50">
            {loading ? 'Envoi…' : 'Valider'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>Photo de la preuve</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => setPhoto(e.target.files?.[0] ?? null)}
            className="block w-full text-[13px] file:mr-3 file:py-2 file:px-3 file:rounded-[8px] file:border-0 file:bg-accent file:text-white"
          />
          {photo && (
            <div className={`${ty.metaSm} mt-1`}>{photo.name} · {(photo.size / 1024).toFixed(0)} Ko</div>
          )}
        </div>
        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>
            Note {spec.commentaireObligatoire && <span className="text-red">*</span>}
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] focus:border-accent outline-none"
          />
        </div>
      </div>
    </HaccpModalShell>
  )
}
