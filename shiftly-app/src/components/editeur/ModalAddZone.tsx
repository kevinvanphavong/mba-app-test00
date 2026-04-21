'use client'

import { useState, useEffect } from 'react'
import type { EditorZone, ZoneFormData } from '@/types/editeur'
import ColorPicker from './ColorPicker'

interface Props {
  open:       boolean
  editZone?:  EditorZone | null
  zones:      EditorZone[]          // for duplicate selector
  onClose:    () => void
  onSave:     (data: ZoneFormData) => void
}

export default function ModalAddZone({ open, editZone, zones, onClose, onSave }: Props) {
  const [nom,     setNom]     = useState('')
  const [couleur, setCouleur] = useState('#3b82f6')
  const [dupFrom, setDupFrom] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setNom(editZone?.nom     ?? '')
      setCouleur(editZone?.couleur ?? '#3b82f6')
      setDupFrom(null)
    }
  }, [open, editZone])

  function handleSave() {
    if (!nom.trim()) return
    onSave({ nom: nom.trim(), couleur })
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-surface border border-border rounded-t-[24px] px-4 pt-5 pb-20 animate-fadeUp max-w-[390px] mx-auto max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-[18px]" />
        <h2 className="font-syne font-extrabold text-[18px] mb-1">
          {editZone ? 'Modifier la zone' : 'Nouvelle zone'}
        </h2>
        <p className="text-[12px] text-muted mb-4">Personnalisez votre zone de travail</p>

        {/* Nom */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">
            Nom de la zone
          </label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Karaoké"
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-[10px] text-[13px] text-text placeholder:text-muted focus:border-accent outline-none transition-colors"
          />
        </div>

        {/* Couleur */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">
            Couleur
          </label>
          <ColorPicker value={couleur} onChange={setCouleur} />
        </div>

        {/* Dupliquer */}
        {!editZone && (
          <div className="mb-3">
            <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">
              Dupliquer le contenu d'une zone existante
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {[...zones, { id: 0, nom: 'Vide', couleur: '', ordre: 0 }].map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setDupFrom(dupFrom === z.id ? null : z.id)}
                  className={`px-3 py-1.5 rounded-[8px] border text-[12px] font-semibold transition-all ${
                    dupFrom === z.id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted'
                  }`}
                >
                  {z.nom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-[14px]">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] border border-border bg-transparent text-muted text-[13px] font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!nom.trim()}
            className="flex-[2] py-3 rounded-[12px] bg-accent border-none text-white font-syne font-extrabold text-[13px] disabled:opacity-40"
          >
            {editZone ? 'Enregistrer' : 'Créer la zone'}
          </button>
        </div>
      </div>
    </>
  )
}
