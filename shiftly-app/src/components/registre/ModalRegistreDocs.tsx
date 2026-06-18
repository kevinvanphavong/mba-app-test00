'use client'

/**
 * ModalRegistreDocs — modale « Documents & contrats » d'un salarié, ouverte
 * depuis la 2ᵉ action du registre. Regroupe :
 *   - les documents (contrats signés, pièces) stockés sur R2 (E2)
 *   - l'historique des contrats (E3) + génération IA depuis les documents
 *
 * Toute la logique vit dans les sous-composants présentationnels. < 150 lignes.
 */

import { AnimatePresence, motion }   from 'framer-motion'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useCurrentUser }            from '@/hooks/useCurrentUser'
import type { StaffMember }          from '@/types/staff'
import StaffFormDocuments            from '@/components/staff/StaffFormDocuments'
import StaffFormHistoriqueContrat    from './StaffFormHistoriqueContrat'
import ContratAiSuggest              from './ContratAiSuggest'

interface Props {
  open:    boolean
  member:  StaffMember | null
  onClose: () => void
}

export default function ModalRegistreDocs({ open, member, onClose }: Props) {
  const { user } = useCurrentUser()
  const memberName = member ? `${member.prenom ? `${member.prenom} ` : ''}${member.nom}` : null
  const subtitle   = [memberName, user?.centre?.nom].filter(Boolean).join(' · ')

  return (
    <AnimatePresence>
      {open && member && (
        <>
          <motion.div variants={backdropVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm" onClick={onClose} />
          <motion.div variants={sheetVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[720px] rounded-t-[24px] border border-border bg-surface max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="mx-auto mt-[10px] h-1 w-10 rounded-full bg-border" />
            <header className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="font-syne text-[17px] font-extrabold text-text">Documents &amp; contrats</h2>
                {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Fermer"
                className="w-[30px] h-[30px] rounded-[8px] border border-border bg-surface2 text-muted text-[17px] flex items-center justify-center">×</button>
            </header>

            <div className="flex flex-col gap-[14px] p-5">
              <StaffFormDocuments employeId={member.id} />
              <ContratAiSuggest employeId={member.id} />
              <StaffFormHistoriqueContrat employeId={member.id} />
            </div>

            <footer className="flex items-center justify-end px-6 py-4 border-t border-border bg-surface">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-[11px] bg-accent text-white font-syne font-extrabold text-[13px]">Fermer</button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
