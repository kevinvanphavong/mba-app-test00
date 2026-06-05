'use client'

/**
 * ModalSortie — remplace ConfirmModal sur la désactivation d'un membre
 * (cf. docs/maquettes/registre-personnel.html Vue 3). Demande la date
 * effective + le motif obligatoires pour alimenter le registre.
 *
 * La note interne est un champ UX uniquement en V1 (pas d'audit trail RH).
 */

import { useEffect, useState }      from 'react'
import { AnimatePresence, motion }  from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import type { MotifSortie, StaffMember }   from '@/types/staff'

const MOTIFS: { v: MotifSortie; label: string }[] = [
  { v: 'demission',               label: 'Démission' },
  { v: 'rupture_conventionnelle', label: 'Rupture conventionnelle' },
  { v: 'licenciement',            label: 'Licenciement' },
  { v: 'fin_cdd',                 label: 'Fin de CDD' },
  { v: 'fin_periode_essai',       label: 'Fin de période d\'essai' },
  { v: 'retraite',                label: 'Retraite' },
  { v: 'autre',                   label: 'Autre' },
]

interface Props {
  open:      boolean
  member:    StaffMember | null
  onCancel:  () => void
  onConfirm: (data: { dateSortie: string; motifSortie: MotifSortie }) => void
  isLoading?: boolean
}

export default function ModalSortie({ open, member, onCancel, onConfirm, isLoading }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [dateSortie, setDateSortie]   = useState(today)
  const [motifSortie, setMotifSortie] = useState<MotifSortie | ''>('')
  const [note, setNote]               = useState('')

  useEffect(() => {
    if (open) { setDateSortie(today); setMotifSortie(''); setNote('') }
  }, [open])  // eslint-disable-line react-hooks/exhaustive-deps

  const canConfirm = dateSortie.length === 10 && motifSortie !== ''
  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({ dateSortie, motifSortie: motifSortie as MotifSortie })
  }
  const fullName = member ? `${member.prenom ? member.prenom + ' ' : ''}${member.nom}` : ''

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div variants={backdropVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
            onClick={isLoading ? undefined : onCancel} />
          <motion.div variants={sheetVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-[24px] border border-border bg-surface max-h-[88vh] overflow-y-auto flex flex-col">
            <div className="mx-auto mt-[10px] h-1 w-10 rounded-full bg-border" />

            <header className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="font-syne text-[17px] font-extrabold text-text">Enregistrer une sortie</h2>
                <p className="text-[12px] text-muted mt-0.5">
                  {fullName}{member?.emploi ? ` · ${member.emploi}` : ''}
                </p>
              </div>
              <button type="button" onClick={onCancel} aria-label="Fermer"
                className="w-[30px] h-[30px] rounded-[8px] border border-border bg-surface2 text-muted text-[17px] flex items-center justify-center">×</button>
            </header>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="border border-red/30 bg-red/10 rounded-[12px] p-3.5 text-[12.5px] text-text leading-relaxed">
                <strong>Action enregistrée au registre du personnel.</strong><br />
                {fullName || 'Ce membre'} sera marqué comme sorti. Il ne pourra plus se connecter
                à l&apos;app, mais l&apos;intégralité de ses pointages, services et compétences
                reste conservée pendant <strong>5 ans</strong> (durée légale).
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted">
                  Date de sortie <span className="text-accent">*</span>
                </span>
                <input type="date" value={dateSortie} onChange={(e) => setDateSortie(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-[10px] text-[13px] text-text outline-none focus:border-accent/50" />
                <span className="text-[10px] text-muted">Dernier jour effectivement travaillé (ou date de notification).</span>
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted">
                  Motif de sortie <span className="text-accent">*</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {MOTIFS.map((m) => {
                    const on = motifSortie === m.v
                    return (
                      <button key={m.v} type="button" onClick={() => setMotifSortie(on ? '' : m.v)}
                        className={`px-[11px] py-1.5 rounded-[8px] text-[11px] font-bold border transition-colors ${
                          on ? 'bg-accent/10 border-accent/40 text-accent' : 'border-border text-muted'
                        }`}>{m.label}</button>
                    )
                  })}
                </div>
                <span className="text-[10px] text-muted">Mention obligatoire au registre du personnel.</span>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted">Note interne (optionnel)</span>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Commentaire libre, non exporté au PDF officiel"
                  className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-[10px] text-[13px] text-text placeholder:text-muted outline-none focus:border-accent/50" />
              </label>
            </div>

            <footer className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-surface">
              <button type="button" onClick={onCancel} disabled={isLoading}
                className="px-4 py-2.5 rounded-[11px] bg-surface2 border border-border text-text text-[13px] font-semibold disabled:opacity-50">Annuler</button>
              <button type="button" onClick={handleConfirm} disabled={!canConfirm || isLoading}
                className="px-5 py-2.5 rounded-[11px] bg-red text-white font-syne font-extrabold text-[13px] disabled:opacity-40 transition-opacity">
                {isLoading ? 'Enregistrement…' : 'Confirmer la sortie'}
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
