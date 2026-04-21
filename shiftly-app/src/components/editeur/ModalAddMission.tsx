'use client'

import { useState, useEffect } from 'react'
import type {
  EditorMission,
  EditorZone,
  MissionFormData,
  MissionCategorie,
  MissionFrequence,
  MissionPriorite,
} from '@/types/editeur'

const CATEGORIES: { id: MissionCategorie; label: string; cls: string }[] = [
  { id: 'OUVERTURE', label: 'Ouverture', cls: 'border-blue text-blue bg-blue/10'       },
  { id: 'PENDANT',   label: 'Pendant',   cls: 'border-green text-green bg-green/10'    },
  { id: 'MENAGE',    label: 'Ménage',    cls: 'border-purple text-purple bg-purple/10' },
  { id: 'FERMETURE', label: 'Fermeture', cls: 'border-accent text-accent bg-accent/10' },
]

const FREQUENCES: { id: MissionFrequence; label: string }[] = [
  { id: 'FIXE',       label: 'Fixe (récurrente)'  },
  { id: 'PONCTUELLE', label: 'Ponctuelle'          },
]

const PRIORITES: { id: MissionPriorite; label: string; cls: string }[] = [
  { id: 'vitale',         label: 'Vitale',           cls: 'border-red text-red bg-red/8'           },
  { id: 'important',      label: 'Important',        cls: 'border-accent text-accent bg-accent/10' },
  { id: 'ne_pas_oublier', label: 'À ne pas oublier', cls: 'border-border text-muted'               },
]

interface Props {
  open:         boolean
  editMission?: EditorMission | null
  zone:         EditorZone
  onClose:      () => void
  onSave:       (data: MissionFormData) => void
}

export default function ModalAddMission({ open, editMission, zone, onClose, onSave }: Props) {
  const [texte,     setTexte]     = useState('')
  const [categorie, setCategorie] = useState<MissionCategorie>('PENDANT')
  const [frequence, setFrequence] = useState<MissionFrequence>('FIXE')
  const [priorite,  setPriorite]  = useState<MissionPriorite>('ne_pas_oublier')

  useEffect(() => {
    if (open) {
      setTexte(editMission?.texte     ?? '')
      setCategorie(editMission?.categorie ?? 'PENDANT')
      setFrequence(editMission?.frequence ?? 'FIXE')
      setPriorite(editMission?.priorite  ?? 'ne_pas_oublier')
    }
  }, [open, editMission])

  function handleSave() {
    if (!texte.trim()) return
    onSave({ texte: texte.trim(), categorie, frequence, priorite, zoneId: zone.id })
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-surface border border-border rounded-t-[24px] px-4 pt-5 pb-20 animate-fadeUp max-w-[390px] mx-auto max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-[18px]" />
        <h2 className="font-syne font-extrabold text-[18px] mb-1">
          {editMission ? 'Modifier la mission' : 'Nouvelle mission'}
        </h2>
        <div className="flex items-center gap-1.5 text-[12px] text-muted mb-4">
          <span className="w-[10px] h-[10px] rounded-[3px]" style={{ background: zone.couleur }} />
          Zone {zone.nom}
        </div>

        {/* Texte */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">
            Description de la mission
          </label>
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Ex : Vérifier les toilettes..."
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-[10px] text-[13px] text-text placeholder:text-muted focus:border-accent outline-none transition-colors"
          />
        </div>

        {/* Catégorie */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Catégorie</label>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategorie(c.id)}
                className={`px-3 py-1.5 rounded-[8px] border text-[12px] font-semibold transition-all ${
                  categorie === c.id ? c.cls : 'border-border text-muted'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fréquence */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Fréquence</label>
          <div className="flex gap-1.5">
            {FREQUENCES.map((f) => (
              <button
                key={f.id}
                onClick={() => setFrequence(f.id)}
                className={`flex-1 px-3 py-1.5 rounded-[8px] border text-[11px] font-semibold transition-all ${
                  frequence === f.id
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border text-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priorité */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Priorité</label>
          <div className="flex gap-1.5 flex-wrap">
            {PRIORITES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPriorite(p.id)}
                className={`flex-1 px-3 py-1.5 rounded-[8px] border text-[11px] font-semibold transition-all ${
                  priorite === p.id ? p.cls : 'border-border text-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-[14px]">
          <button onClick={onClose} className="flex-1 py-3 rounded-[12px] border border-border bg-transparent text-muted text-[13px] font-semibold">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!texte.trim()}
            className="flex-[2] py-3 rounded-[12px] bg-accent border-none text-white font-syne font-extrabold text-[13px] disabled:opacity-40"
          >
            {editMission ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </>
  )
}
