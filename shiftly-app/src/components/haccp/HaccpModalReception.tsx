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
  onSubmit: (input: { valeurNumerique: number; note?: string; photo?: File }) => Promise<void>
  loading?: boolean
}

/** Saisie d'une réception fournisseur : T° + note (fournisseur/lot) + photo BL. */
export default function HaccpModalReception({ open, onClose, missionTexte, spec, onSubmit, loading }: Props) {
  const [valeur, setValeur] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  const num = valeur === '' ? null : Number(valeur)
  const seuilMax = spec.equipement?.seuilMax ?? spec.seuilMax ?? 4
  const status: 'ok' | 'ko' | 'idle' = num === null || Number.isNaN(num)
    ? 'idle' : num > seuilMax ? 'ko' : 'ok'

  const canSubmit = num !== null && !Number.isNaN(num) && !loading
    && (!spec.photoObligatoire || photo !== null)
    && (!spec.commentaireObligatoire || note.trim().length > 0)

  const handle = async () => {
    if (!canSubmit || num === null) return
    await onSubmit({ valeurNumerique: num, note: note.trim() || undefined, photo: photo ?? undefined })
    setValeur(''); setNote(''); setPhoto(null)
  }

  return (
    <HaccpModalShell
      open={open}
      onClose={onClose}
      title="Réception fournisseur"
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
          <label className={`${ty.sectionLabelMd} block mb-2`}>Température à réception (°C)</label>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={valeur}
            onChange={e => setValeur(e.target.value)}
            placeholder="ex. 3.2"
            className="w-full bg-surface2 border border-border rounded-[12px] px-4 py-3 text-[18px] font-syne font-extrabold focus:border-accent outline-none"
          />
          <div className={`${ty.metaSm} mt-2`}>Seuil max accepté : {seuilMax}°C</div>
        </div>

        {status !== 'idle' && (
          <div className={cn('rounded-[10px] px-3 py-2 text-[13px] font-semibold border',
            status === 'ok' ? 'bg-green/10 text-green border-green/30' : 'bg-red/10 text-red border-red/30')}>
            {status === 'ok' ? '✓ Réception conforme' : '⚠ T° trop élevée — réception non conforme'}
          </div>
        )}

        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>
            Note (fournisseur · n° lot) {spec.commentaireObligatoire && <span className="text-red">*</span>}
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] focus:border-accent outline-none"
          />
        </div>

        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>
            Photo BL/étiquette {spec.photoObligatoire && <span className="text-red">*</span>}
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
      </div>
    </HaccpModalShell>
  )
}
