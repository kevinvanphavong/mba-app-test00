'use client'

/**
 * ModalRegistreFiche — variante de ModalEditStaff enrichie pour le registre
 * du personnel : ajoute la carte « État civil & adresse » + champ « Emploi »
 * dans la carte Contrat (cf. docs/maquettes/registre-personnel.html Vue 2).
 *
 * Toute la logique métier vit dans ce fichier (state local, mapping, save).
 * Les sous-composants sont présentationnels. Inférieur à 150 lignes.
 */

import { useEffect, useState }       from 'react'
import { AnimatePresence, motion }   from 'framer-motion'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useCurrentUser }            from '@/hooks/useCurrentUser'
import type { Sexe, StaffMember }    from '@/types/staff'
import StaffFormIdentite             from '@/components/staff/StaffFormIdentite'
import StaffFormContrat              from '@/components/staff/StaffFormContrat'
import StaffFormAcces                from '@/components/staff/StaffFormAcces'
import StaffFormEtatCivil            from './StaffFormEtatCivil'
import { emptyFicheState, ficheStateFromMember, type FicheState } from './ficheState'

// Pas d'avatar ni d'équipement : c'est géré dans la modale /staff côté manager.
// La modale registre se concentre sur la conformité RH (Art. L1221-13).
export interface RegistreSaveData {
  nom: string; prenom: string | null; email: string
  role: 'MANAGER' | 'EMPLOYE'
  actif: boolean
  heuresHebdo: number | null
  typeContrat: string | null; dateEmbauche: string | null
  codePointage: string | null; password?: string
  emploi: string | null
  dateNaissance: string | null
  lieuNaissanceCommune: string | null; lieuNaissanceDepartement: string | null
  sexe: Sexe | null; nationalite: string | null
  adresse: string | null; codePostal: string | null; ville: string | null
  telephone: string | null
}

interface Props {
  open:    boolean
  member:  StaffMember | null
  onClose: () => void
  onSave:  (data: RegistreSaveData) => void
}

export default function ModalRegistreFiche({ open, member, onClose, onSave }: Props) {
  const { user } = useCurrentUser()
  const [s, setS] = useState(emptyFicheState)

  useEffect(() => {
    if (!open) return
    setS(member ? ficheStateFromMember(member) : emptyFicheState())
  }, [open, member])

  // Setter factorisé : `bind('nom')` retourne (v) => setS({ ...prev, nom: v }).
  const bind = <K extends keyof FicheState>(key: K) =>
    (v: FicheState[K]) => setS((p) => ({ ...p, [key]: v }))

  function handleSubmit() {
    if (!s.nom.trim() || !s.email.trim()) return
    onSave({
      nom: s.nom.trim(), prenom: s.prenom.trim() || null, email: s.email.trim(), role: s.role,
      actif: s.actif,
      heuresHebdo:  s.heuresHebdo !== '' ? parseInt(s.heuresHebdo, 10) : null,
      typeContrat:  s.typeContrat || null,
      dateEmbauche: s.dateEmbauche || null,
      codePointage: s.codePointage.length === 4 ? s.codePointage : null,
      password:     s.password || undefined,
      emploi:        s.emploi.trim() || null,
      dateNaissance: s.dateNaissance || null,
      lieuNaissanceCommune:     s.lieuNaissanceCommune.trim() || null,
      lieuNaissanceDepartement: s.lieuNaissanceDepartement.trim() || null,
      sexe:        s.sexe || null,
      nationalite: s.nationalite.trim() || null,
      adresse:     s.adresse.trim() || null,
      codePostal:  s.codePostal.trim() || null,
      ville:       s.ville.trim() || null,
      telephone:   s.telephone.trim() || null,
    })
  }

  const isEdit     = member !== null
  const memberName = isEdit ? `${member?.prenom ? `${member.prenom} ` : ''}${member?.nom}` : null
  const subtitle   = [memberName, user?.centre?.nom].filter(Boolean).join(' · ')
  const canSubmit  = s.nom.trim().length > 0 && s.email.trim().length > 0 && (isEdit || s.password.trim().length > 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div variants={backdropVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm" onClick={onClose} />
          <motion.div variants={sheetVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[720px] rounded-t-[24px] border border-border bg-surface max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="mx-auto mt-[10px] h-1 w-10 rounded-full bg-border" />
            <header className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="font-syne text-[17px] font-extrabold text-text">{isEdit ? 'Modifier la fiche RH' : 'Nouveau membre · Fiche RH'}</h2>
                {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Fermer"
                className="w-[30px] h-[30px] rounded-[8px] border border-border bg-surface2 text-muted text-[17px] flex items-center justify-center">×</button>
            </header>

            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-[14px] p-5">
              <div className="flex flex-col gap-[14px]">
                <StaffFormIdentite prenom={s.prenom} nom={s.nom} email={s.email} password={s.password} role={s.role} isEdit={isEdit}
                  onPrenom={bind('prenom')} onNom={bind('nom')} onEmail={bind('email')}
                  onPassword={bind('password')} onRole={bind('role')} />
                <StaffFormEtatCivil
                  dateNaissance={s.dateNaissance} sexe={s.sexe}
                  lieuNaissanceCommune={s.lieuNaissanceCommune} lieuNaissanceDepartement={s.lieuNaissanceDepartement}
                  nationalite={s.nationalite} adresse={s.adresse} codePostal={s.codePostal} ville={s.ville} telephone={s.telephone}
                  onDateNaissance={bind('dateNaissance')} onSexe={bind('sexe')}
                  onLieuNaissanceCommune={bind('lieuNaissanceCommune')}
                  onLieuNaissanceDepartement={bind('lieuNaissanceDepartement')}
                  onNationalite={bind('nationalite')} onAdresse={bind('adresse')}
                  onCodePostal={bind('codePostal')} onVille={bind('ville')} onTelephone={bind('telephone')} />
              </div>
              <div className="flex flex-col gap-[14px]">
                <StaffFormContrat emploi={s.emploi} onEmploi={bind('emploi')}
                  typeContrat={s.typeContrat} heuresHebdo={s.heuresHebdo} dateEmbauche={s.dateEmbauche}
                  onTypeContrat={bind('typeContrat')} onHeuresHebdo={bind('heuresHebdo')} onDateEmbauche={bind('dateEmbauche')} />
                <StaffFormAcces codePointage={s.codePointage} actif={s.actif} showActifRow={isEdit}
                  onCodePointage={bind('codePointage')} onActif={bind('actif')} />
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-surface">
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 rounded-[11px] bg-surface2 border border-border text-text text-[13px] font-semibold">Annuler</button>
              <button type="button" onClick={handleSubmit} disabled={!canSubmit}
                className="px-5 py-2.5 rounded-[11px] bg-accent text-white font-syne font-extrabold text-[13px] disabled:opacity-40 transition-opacity">
                {isEdit ? 'Enregistrer' : 'Créer le membre'}
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
