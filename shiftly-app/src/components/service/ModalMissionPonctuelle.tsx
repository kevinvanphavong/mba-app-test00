'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn }                       from '@/lib/cn'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useCreateMission }         from '@/hooks/useMissions'
import type { ServiceZone }         from '@/types/service'

type MissionCategorie = 'OUVERTURE' | 'PENDANT' | 'MENAGE' | 'FERMETURE'
type MissionPriorite  = 'vitale' | 'important' | 'ne_pas_oublier'

interface Props {
  open:      boolean
  zone:      ServiceZone
  serviceId: number
  onClose:   () => void
}

const CATEGORIES: Array<{ value: MissionCategorie; label: string }> = [
  { value: 'OUVERTURE', label: 'Ouverture' },
  { value: 'PENDANT',   label: 'Service'   },
  { value: 'MENAGE',    label: 'Ménage'    },
  { value: 'FERMETURE', label: 'Fermeture' },
]

const PRIORITES: Array<{ value: MissionPriorite; label: string; cls: string; activeCls: string }> = [
  {
    value: 'vitale',
    label: 'Vitale',
    cls: 'border-border text-muted hover:border-red/40',
    activeCls: 'border-red bg-red/10 text-red',
  },
  {
    value: 'important',
    label: 'Important',
    cls: 'border-border text-muted hover:border-yellow/40',
    activeCls: 'border-yellow bg-yellow/10 text-yellow',
  },
  {
    value: 'ne_pas_oublier',
    label: 'À ne pas oublier',
    cls: 'border-border text-muted hover:border-muted/60',
    activeCls: 'border-muted bg-surface2 text-text',
  },
]

export default function ModalMissionPonctuelle({ open, zone, serviceId, onClose }: Props) {
  const [texte,     setTexte]     = useState('')
  const [categorie, setCategorie] = useState<MissionCategorie>('PENDANT')
  const [priorite,  setPriorite]  = useState<MissionPriorite>('important')
  const [error,     setError]     = useState<string | null>(null)

  const createMission = useCreateMission()

  const handleClose = () => {
    setTexte(''); setCategorie('PENDANT'); setPriorite('important'); setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!texte.trim()) { setError('Décris la mission en quelques mots.'); return }
    setError(null)

    try {
      await createMission.mutateAsync({
        texte:     texte.trim(),
        categorie,
        frequence: 'PONCTUELLE',
        priorite,
        zoneId:    zone.id,
        serviceId,
      })
      handleClose()
    } catch {
      setError('Erreur lors de la création — réessaie.')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-40"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="exit"
          />

          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-[24px] shadow-2xl flex flex-col"
            variants={sheetVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <div>
                <h2 className="font-syne font-extrabold text-[16px] text-text">
                  Mission ponctuelle
                </h2>
                {/* Zone badge */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: zone.couleur }}
                  />
                  <span className="text-[11px] font-semibold" style={{ color: zone.couleur }}>
                    {zone.nom}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-muted hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenu */}
            <div className="px-5 py-4 space-y-4">

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Mission <span className="text-red">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={texte}
                  onChange={e => setTexte(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Ex : Vider les poubelles du couloir…"
                  className={cn(
                    'w-full bg-surface2 border rounded-[12px] px-3.5 py-3 text-[13px] text-text placeholder:text-muted',
                    'outline-none transition-colors',
                    error && !texte.trim()
                      ? 'border-red/60 focus:border-red'
                      : 'border-border focus:border-accent/60'
                  )}
                />
                {error && !texte.trim() && (
                  <p className="text-[11px] text-red mt-1">{error}</p>
                )}
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Moment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCategorie(c.value)}
                      className={cn(
                        'py-2 px-3 rounded-[10px] border text-[12px] font-semibold transition-all duration-150',
                        categorie === c.value
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border text-muted hover:border-border/80'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Priorité
                </label>
                <div className="flex gap-2">
                  {PRIORITES.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPriorite(p.value)}
                      className={cn(
                        'flex-1 py-2 px-2 rounded-[10px] border text-[11px] font-bold transition-all duration-150',
                        priorite === p.value ? p.activeCls : p.cls
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Erreur générique */}
              {error && texte.trim() && (
                <p className="text-[12px] text-red bg-red/5 border border-red/20 rounded-[8px] px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 px-5 py-4 border-t border-border flex-shrink-0">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-[12px] bg-surface2 border border-border text-[13px] font-bold text-muted hover:text-text transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMission.isPending || !texte.trim()}
                className={cn(
                  'flex-[2] py-3 rounded-[12px] text-[13px] font-extrabold text-white transition-all duration-200',
                  'bg-gradient-to-r from-purple to-purple/80',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  !createMission.isPending && texte.trim() && 'hover:opacity-90 active:scale-[0.98]'
                )}
              >
                {createMission.isPending ? '⏳ Création…' : '+ Ajouter'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
