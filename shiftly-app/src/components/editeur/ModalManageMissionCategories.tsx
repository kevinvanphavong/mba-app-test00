'use client'

/**
 * Admin des catégories de mission — modale plein écran tablet/desktop, bottom-sheet mobile.
 *
 * Manager-only. Permet : ajout / édition (nom + couleur + icône + ordre) /
 * suppression. La suppression effective côté backend ne casse PAS les missions
 * existantes (elles gardent leur slug `categorie` texte), mais elles deviennent
 * "orphelines" visuellement : couleur et icône fallback gris. C'est mentionné
 * comme avertissement avant suppression.
 */

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import {
  useMissionCategories, useCreateMissionCategorie,
  useUpdateMissionCategorie, useDeleteMissionCategorie,
  type MissionCategorie,
} from '@/hooks/useMissionCategories'
import { useToastStore } from '@/store/toastStore'

const ICON_CHOICES = ['🔓', '⚡', '🧽', '🔒', '📋', '🛠️', '🍽️', '🎯', '🚪', '✨', '🧹', '💡']

interface Props {
  open:    boolean
  onClose: () => void
}

export default function ModalManageMissionCategories({ open, onClose }: Props) {
  const { data: categories = [] } = useMissionCategories()
  const createCat = useCreateMissionCategorie()
  const updateCat = useUpdateMissionCategorie()
  const deleteCat = useDeleteMissionCategorie()
  const toast     = useToastStore(s => s.show)

  // ─ état du formulaire (création ou édition d'une ligne) ─
  const [editing,  setEditing]  = useState<MissionCategorie | null>(null)
  const [nom,      setNom]      = useState('')
  const [couleur,  setCouleur]  = useState('#3b82f6')
  const [icone,    setIcone]    = useState<string>('')

  // Reset à la fermeture pour ne pas garder l'état précédent
  useEffect(() => {
    if (!open) {
      setEditing(null); setNom(''); setCouleur('#3b82f6'); setIcone('')
    }
  }, [open])

  function startEdit(c: MissionCategorie) {
    setEditing(c)
    setNom(c.nom)
    setCouleur(c.couleur)
    setIcone(c.icone ?? '')
  }
  function resetForm() {
    setEditing(null); setNom(''); setCouleur('#3b82f6'); setIcone('')
  }

  function handleSubmit() {
    if (!nom.trim()) return
    const payload = { nom: nom.trim(), couleur, icone: icone || null }
    if (editing) {
      updateCat.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: () => { toast('Catégorie modifiée', 'success'); resetForm() },
          onError:   () => toast('Erreur lors de la modification', 'error'),
        },
      )
    } else {
      createCat.mutate(
        { ...payload, ordre: categories.length },
        {
          onSuccess: () => { toast('Catégorie créée', 'success'); resetForm() },
          onError:   () => toast('Erreur lors de la création', 'error'),
        },
      )
    }
  }

  function handleDelete(c: MissionCategorie) {
    const confirmed = confirm(
      `Supprimer la catégorie « ${c.nom} » ?\n\n` +
      `Les missions associées ne seront pas supprimées, mais perdent leur ` +
      `couleur et icône. Tu pourras les reclasser dans une autre catégorie.`,
    )
    if (!confirmed) return
    deleteCat.mutate(c.id, {
      onSuccess: () => toast('Catégorie supprimée', 'success'),
      onError:   () => toast('Erreur lors de la suppression', 'error'),
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[55] flex items-end justify-center tablet:items-center tablet:p-4">
          <motion.div
            className="absolute inset-0 bg-black/60"
            variants={backdropVariants}
            initial="closed" animate="open" exit="exit"
            onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="manage-cat-title"
            className="relative z-[60] w-full rounded-t-[24px] border-t border-border bg-surface tablet:w-auto tablet:max-w-[720px] tablet:rounded-[20px] tablet:border max-h-[90vh] overflow-y-auto"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
            variants={sheetVariants}
            initial="closed" animate="open" exit="exit"
          >
            <div className="flex justify-center pb-1 pt-3 tablet:hidden">
              <div className="h-1 w-9 rounded-full bg-border" />
            </div>

            <div className="px-5 pt-2 pb-4">
              <div className="flex items-center justify-between mb-1">
                <h2 id="manage-cat-title" className="font-syne text-[16px] font-bold text-text">
                  Catégories de mission
                </h2>
                <button onClick={onClose} className="text-muted text-[20px] leading-none">×</button>
              </div>
              <p className="text-[12px] text-muted mb-4">
                Personnalise les catégories utilisées pour classer les missions du centre.
              </p>

              {/* ── Liste des catégories existantes ── */}
              <div className="flex flex-col gap-2 mb-5">
                {categories.length === 0 && (
                  <p className="text-[12px] text-muted italic py-2 text-center">Aucune catégorie configurée.</p>
                )}
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-border bg-surface2"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.couleur }} />
                    <span className="text-[16px] leading-none">{c.icone || '·'}</span>
                    <span className="text-[13px] font-semibold text-text flex-1 min-w-0 truncate">{c.nom}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                    >
                      ✎ Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md text-red hover:bg-red/10 transition-colors"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Formulaire création/édition ── */}
              <div className="rounded-[12px] border border-border bg-surface2 p-3 flex flex-col gap-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-muted">
                  {editing ? `Modifier « ${editing.nom} »` : 'Nouvelle catégorie'}
                </div>

                <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
                  {/* Nom */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Nom</label>
                    <input
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Ex : Service du soir"
                      className="w-full bg-surface border border-border rounded-[10px] px-3 py-[10px] text-[13px] text-text placeholder:text-muted focus:border-accent outline-none transition-colors"
                    />
                  </div>

                  {/* Couleur */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">Couleur</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={couleur}
                        onChange={(e) => setCouleur(e.target.value)}
                        className="w-10 h-10 rounded-[8px] border border-border bg-surface cursor-pointer"
                      />
                      <input
                        value={couleur}
                        onChange={(e) => setCouleur(e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1 bg-surface border border-border rounded-[10px] px-3 py-[10px] text-[13px] text-text placeholder:text-muted focus:border-accent outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Icône (optionnelle) — palette de choix */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-[5px]">
                    Icône (optionnel)
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIcone('')}
                      className={`px-3 py-1.5 rounded-[8px] border text-[12px] font-semibold transition-all ${
                        icone === '' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted'
                      }`}
                    >
                      Aucune
                    </button>
                    {ICON_CHOICES.map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setIcone(emo)}
                        className={`w-9 h-9 rounded-[8px] border text-[18px] flex items-center justify-center transition-all ${
                          icone === emo ? 'border-accent bg-accent/10' : 'border-border'
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {editing && (
                    <button
                      onClick={resetForm}
                      className="flex-1 py-2.5 rounded-[10px] border border-border bg-transparent text-muted text-[13px] font-semibold"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!nom.trim()}
                    className="flex-[2] py-2.5 rounded-[10px] bg-accent border-none text-white font-syne font-extrabold text-[13px] disabled:opacity-40"
                  >
                    {editing ? 'Enregistrer' : '+ Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
