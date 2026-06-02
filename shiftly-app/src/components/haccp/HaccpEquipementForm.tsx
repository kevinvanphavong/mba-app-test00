'use client'

import { useState } from 'react'
import HaccpModalShell from './HaccpModalShell'
import HaccpTypePicker from './HaccpTypePicker'
import { ty } from '@/lib/typography'
import type { HaccpEquipement, HaccpEquipementInput, HaccpEquipType } from '@/types/haccp'

interface Props {
  open: boolean
  initial?: HaccpEquipement | null
  onClose: () => void
  onSubmit: (payload: HaccpEquipementInput) => Promise<void>
  loading?: boolean
}

const DEFAULTS: Record<HaccpEquipType, { min: number; max: number }> = {
  FRIGO:       { min: 0,   max: 4 },
  CONGELATEUR: { min: -22, max: -18 },
  VITRINE:     { min: 0,   max: 8 },
  AUTRE:       { min: 0,   max: 10 },
}

export default function HaccpEquipementForm({ open, initial, onClose, onSubmit, loading }: Props) {
  const [nom,  setNom]  = useState(initial?.nom ?? '')
  const [type, setType] = useState<HaccpEquipType>(initial?.type ?? 'FRIGO')
  const [seuilMin, setSeuilMin] = useState<string>(initial?.seuilMin?.toString() ?? '0')
  const [seuilMax, setSeuilMax] = useState<string>(initial?.seuilMax?.toString() ?? '4')

  const handleTypeChange = (t: HaccpEquipType) => {
    setType(t)
    if (!initial) {
      setSeuilMin(String(DEFAULTS[t].min))
      setSeuilMax(String(DEFAULTS[t].max))
    }
  }

  const canSubmit = nom.trim().length > 0 && !Number.isNaN(Number(seuilMin)) && !Number.isNaN(Number(seuilMax)) && !loading

  const handle = async () => {
    if (!canSubmit) return
    await onSubmit({
      nom: nom.trim(),
      type,
      seuilMin: Number(seuilMin),
      seuilMax: Number(seuilMax),
      unite: '°C',
      actif: initial?.actif ?? true,
    })
  }

  return (
    <HaccpModalShell
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier équipement' : 'Nouvel équipement'}
      footer={
        <>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] bg-surface2 text-text font-semibold">Annuler</button>
          <button onClick={handle} disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-[10px] bg-accent text-white font-semibold disabled:opacity-50">
            {loading ? 'Envoi…' : initial ? 'Enregistrer' : 'Créer'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>Nom</label>
          <input
            type="text"
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="Frigo bar principal"
            maxLength={120}
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[14px] focus:border-accent outline-none"
          />
        </div>

        <div>
          <label className={`${ty.sectionLabelMd} block mb-2`}>Type</label>
          <HaccpTypePicker value={type} onChange={handleTypeChange} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`${ty.sectionLabelMd} block mb-2`}>Seuil min (°C)</label>
            <input
              type="number" step="0.1" inputMode="decimal"
              value={seuilMin} onChange={e => setSeuilMin(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[14px] font-syne font-bold focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className={`${ty.sectionLabelMd} block mb-2`}>Seuil max (°C)</label>
            <input
              type="number" step="0.1" inputMode="decimal"
              value={seuilMax} onChange={e => setSeuilMax(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[14px] font-syne font-bold focus:border-accent outline-none"
            />
          </div>
        </div>

        <p className={ty.metaSm}>
          Le système crée automatiquement 2 missions T° par équipement actif (début + fin de service).
        </p>
      </div>
    </HaccpModalShell>
  )
}
