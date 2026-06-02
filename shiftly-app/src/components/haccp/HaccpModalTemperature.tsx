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
  onSubmit: (input: { valeurNumerique: number; note?: string }) => Promise<void>
  loading?: boolean
}

/** Saisie d'une température (TEMPERATURE). Affiche les seuils + statut live. */
export default function HaccpModalTemperature({ open, onClose, missionTexte, spec, onSubmit, loading }: Props) {
  const [valeur, setValeur] = useState<string>('')
  const [note, setNote] = useState('')

  const num = valeur === '' ? null : Number(valeur)
  const min = spec.equipement?.seuilMin ?? spec.seuilMin
  const max = spec.equipement?.seuilMax ?? spec.seuilMax
  const unite = spec.equipement?.unite ?? spec.unite ?? '°C'

  const status: 'ok' | 'ko' | 'idle' = num === null || Number.isNaN(num)
    ? 'idle'
    : (min !== null && num < min) || (max !== null && num > max) ? 'ko' : 'ok'

  const canSubmit = num !== null && !Number.isNaN(num) && !loading
    && (!spec.commentaireObligatoire || note.trim().length > 0)

  const handle = async () => {
    if (!canSubmit || num === null) return
    await onSubmit({ valeurNumerique: num, note: note.trim() || undefined })
    setValeur(''); setNote('')
  }

  return (
    <HaccpModalShell
      open={open}
      onClose={onClose}
      title="Relevé température"
      subtitle={spec.equipement?.nom ?? missionTexte}
      footer={
        <>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] bg-surface2 text-text font-semibold">Annuler</button>
          <button
            onClick={handle}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-[10px] bg-accent text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Envoi…' : 'Valider'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>Température mesurée ({unite})</label>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            autoFocus
            value={valeur}
            onChange={e => setValeur(e.target.value)}
            placeholder="ex. 3.5"
            className="w-full bg-surface2 border border-border rounded-[12px] px-4 py-3 text-[20px] font-syne font-extrabold text-text focus:border-accent outline-none"
          />
          {(min !== null || max !== null) && (
            <div className={`${ty.metaSm} mt-2`}>
              Seuils : {min ?? '—'}{unite} → {max ?? '—'}{unite}
            </div>
          )}
        </div>

        {status !== 'idle' && (
          <div
            className={cn(
              'rounded-[10px] px-3 py-2 text-[13px] font-semibold border',
              status === 'ok'
                ? 'bg-green/10 text-green border-green/30'
                : 'bg-red/10 text-red border-red/30'
            )}
          >
            {status === 'ok' ? '✓ Dans la plage attendue' : '⚠ Hors plage — sera marqué non conforme'}
          </div>
        )}

        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>
            Note {spec.commentaireObligatoire && <span className="text-red">*</span>}
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={spec.commentaireObligatoire ? 'Obligatoire pour cette mission' : 'Optionnel'}
            rows={3}
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] focus:border-accent outline-none"
          />
        </div>
      </div>
    </HaccpModalShell>
  )
}
