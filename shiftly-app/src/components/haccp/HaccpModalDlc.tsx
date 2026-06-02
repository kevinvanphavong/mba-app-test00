'use client'

import { useState } from 'react'
import HaccpModalShell from './HaccpModalShell'
import { ty } from '@/lib/typography'
import { cn } from '@/lib/cn'
import type { MissionHaccpSpec } from '@/types/haccp'

interface Props {
  open: boolean
  onClose: () => void
  missionTexte: string
  spec: MissionHaccpSpec
  onSubmit: (input: { dateReleve: string; note?: string; photo?: File }) => Promise<void>
  loading?: boolean
}

/** Saisie d'une DLC : date + photo étiquette obligatoire si spec. */
export default function HaccpModalDlc({ open, onClose, missionTexte, spec, onSubmit, loading }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  const expired = date && date < today
  const canSubmit = date !== '' && !loading
    && (!spec.photoObligatoire || photo !== null)
    && (!spec.commentaireObligatoire || note.trim().length > 0)

  const handle = async () => {
    if (!canSubmit) return
    await onSubmit({ dateReleve: date, note: note.trim() || undefined, photo: photo ?? undefined })
    setDate(''); setNote(''); setPhoto(null)
  }

  return (
    <HaccpModalShell
      open={open}
      onClose={onClose}
      title="Contrôle DLC"
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
          <label className={`${ty.sectionLabelMd} block mb-2`}>Date limite de consommation</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-[12px] px-4 py-3 text-[15px] font-semibold focus:border-accent outline-none"
          />
          {expired && (
            <div className={cn('mt-2 rounded-[10px] px-3 py-2 text-[12px] font-semibold border',
              'bg-red/10 text-red border-red/30')}>
              ⚠ DLC dépassée — sera marquée non conforme
            </div>
          )}
        </div>

        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>
            Photo étiquette {spec.photoObligatoire && <span className="text-red">*</span>}
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => setPhoto(e.target.files?.[0] ?? null)}
            className="block w-full text-[13px] file:mr-3 file:py-2 file:px-3 file:rounded-[8px] file:border-0 file:bg-accent file:text-white"
          />
          {photo && <div className={`${ty.metaSm} mt-1`}>{photo.name}</div>}
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
