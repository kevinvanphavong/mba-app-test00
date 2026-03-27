'use client'

import { useState, useEffect } from 'react'
import type { EditorCompetence, EditorZone, CompetenceFormData, DifficulteComp } from '@/types/editeur'

const DIFFS: { id: DifficulteComp; label: string; cls: string }[] = [
  { id: 'simple',      label: 'Simple',      cls: 'border-green text-green bg-green/10' },
  { id: 'avancee',     label: 'Avancée',     cls: 'border-yellow text-yellow bg-yellow/10' },
  { id: 'experimente', label: 'Expérimenté', cls: 'border-red text-red bg-red/10' },
]

interface Props {
  open:           boolean
  editCompetence?: EditorCompetence | null
  zone:            EditorZone
  onClose:        () => void
  onSave:         (data: CompetenceFormData) => void
}

export default function ModalAddCompetence({ open, editCompetence, zone, onClose, onSave }: Props) {
  const [nom,         setNom]         = useState('')
  const [difficulte,  setDifficulte]  = useState<DifficulteComp>('simple')
  const [points,      setPoints]      = useState(10)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setNom(editCompetence?.nom         ?? '')
      setDifficulte(editCompetence?.difficulte  ?? 'simple')
      setPoints(editCompetence?.points      ?? 10)
      setDescription(editCompetence?.description ?? '')
    }
  }, [open, editCompetence])

  function handleSave() {
    if (!nom.trim()) return
    onSave({ nom: nom.trim(), difficulte, points, description, zoneId: zone.id })
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-surface border border-border rounded-t-[24px] px-4 pt-5 pb-8 animate-fadeUp max-w-[390px] mx-auto">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-[18px]" />
        <h2 className="font-syne font-extrabold text-[18px] mb-1">
          {editCompetence ? 'Modifier la compétence' : 'Nouvelle compétence'}
        </h2>
        <div className="flex items-center gap-1.5 text-[12px] text-muted mb-4">
          <span className="w-[10px] h-[10px] rounded-[3px]" style={{ background: zone.couleur }} />
          Zone {zone.nom}
        </div>

        {/* Nom */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Nom de la compétence</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Gestion de caisse"
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-[10px] text-[13px] text-text placeholder:text-muted focus:border-accent outline-none transition-colors"
          />
        </div>

        {/* Difficulté */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Difficulté</label>
          <div className="flex gap-1.5">
            {DIFFS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulte(d.id)}
                className={`flex-1 px-2 py-1.5 rounded-[8px] border text-[11px] font-semibold transition-all ${
                  difficulte === d.id ? d.cls : 'border-border text-muted'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Points */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Points attribués</label>
          <div className="flex gap-1.5">
            {[10, 20, 30, 40].map((p) => (
              <button
                key={p}
                onClick={() => setPoints(p)}
                className={`flex-1 py-1.5 rounded-[8px] border text-[12px] font-bold font-syne transition-all ${
                  points === p
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Description (optionnel)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Décrivez les critères de validation..."
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-[10px] text-[13px] text-text placeholder:text-muted focus:border-accent outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex gap-2 mt-[14px]">
          <button onClick={onClose} className="flex-1 py-3 rounded-[12px] border border-border bg-transparent text-muted text-[13px] font-semibold">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!nom.trim()}
            className="flex-[2] py-3 rounded-[12px] bg-accent border-none text-white font-syne font-extrabold text-[13px] disabled:opacity-40"
          >
            {editCompetence ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </>
  )
}
