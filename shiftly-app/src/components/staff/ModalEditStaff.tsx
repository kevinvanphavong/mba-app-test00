'use client'

/**
 * ModalEditStaff — bottom-sheet ancré en bas (cf. ShiftModal), centré,
 * 720px de large, organisé en deux colonnes de cartes titrées (Variante 4
 * — cf. docs/maquettes/staff-form-variants.html).
 *
 * Responsabilités : state local, chargement depuis `member`, validation,
 * appel `onSave`. Toute la mise en forme passe par les sous-composants
 * présentationnels `StaffForm*` du même dossier.
 */

import { useState, useEffect }    from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { useCurrentUser }          from '@/hooks/useCurrentUser'
import type { StaffMember }        from '@/types/staff'
import StaffFormIdentite           from './StaffFormIdentite'
import StaffFormAvatar             from './StaffFormAvatar'
import StaffFormContrat            from './StaffFormContrat'
import StaffFormEquipement         from './StaffFormEquipement'
import StaffFormAcces              from './StaffFormAcces'

const DEFAULT_COLOR = '#f97316'

interface SaveData {
  nom: string; prenom: string | null; email: string
  role: 'MANAGER' | 'EMPLOYE'
  tailleHaut: string | null; tailleBas: string | null; pointure: string | null
  actif: boolean; avatarColor: string
  heuresHebdo: number | null
  typeContrat: string | null; dateEmbauche: string | null
  codePointage: string | null; password?: string
}

interface Props {
  open:    boolean
  member:  StaffMember | null
  onClose: () => void
  onSave:  (data: SaveData) => void
}

export default function ModalEditStaff({ open, member, onClose, onSave }: Props) {
  const { user } = useCurrentUser()
  const [nom, setNom] = useState(''); const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [role, setRole] = useState<'MANAGER' | 'EMPLOYE'>('EMPLOYE')
  const [tailleHaut, setTailleHaut] = useState(''); const [tailleBas, setTailleBas] = useState('')
  const [pointure, setPointure] = useState('')
  const [actif, setActif] = useState(true)
  const [avatarColor, setAvatarColor] = useState(DEFAULT_COLOR)
  const [heuresHebdo, setHeuresHebdo] = useState('')
  const [typeContrat, setTypeContrat] = useState(''); const [dateEmbauche, setDateEmbauche] = useState('')
  const [codePointage, setCodePointage] = useState('')

  useEffect(() => {
    if (!open) return
    if (member) {
      setNom(member.nom); setPrenom(member.prenom ?? ''); setEmail(member.email); setRole(member.role)
      setTailleHaut(member.tailleHaut ?? ''); setTailleBas(member.tailleBas ?? ''); setPointure(member.pointure ?? '')
      setActif(member.actif); setAvatarColor(member.avatarColor ?? DEFAULT_COLOR)
      setHeuresHebdo(member.heuresHebdo != null ? String(member.heuresHebdo) : '')
      setTypeContrat(member.typeContrat ?? ''); setDateEmbauche(member.dateEmbauche ?? '')
      setCodePointage(member.codePointage ?? ''); setPassword('')
    } else {
      setNom(''); setPrenom(''); setEmail(''); setRole('EMPLOYE')
      setTailleHaut(''); setTailleBas(''); setPointure('')
      setActif(true); setAvatarColor(DEFAULT_COLOR)
      setHeuresHebdo(''); setTypeContrat(''); setDateEmbauche(''); setCodePointage('0000'); setPassword('')
    }
  }, [open, member])

  function handleSubmit() {
    if (!nom.trim() || !email.trim()) return
    onSave({
      nom: nom.trim(), prenom: prenom.trim() || null, email: email.trim(), role,
      tailleHaut: tailleHaut.trim() || null, tailleBas: tailleBas.trim() || null, pointure: pointure.trim() || null,
      actif, avatarColor,
      heuresHebdo:  heuresHebdo !== '' ? parseInt(heuresHebdo, 10) : null,
      typeContrat:  typeContrat || null,
      dateEmbauche: dateEmbauche || null,
      codePointage: codePointage.length === 4 ? codePointage : null,
      password:     password || undefined,
    })
  }

  const initials   = ((prenom?.[0] ?? nom[0] ?? '?') + (nom.split(' ')[0]?.[0] ?? '')).toUpperCase()
  const isEdit     = member !== null
  const memberName = isEdit ? `${member?.prenom ? `${member.prenom} ` : ''}${member?.nom}` : null
  const subtitle   = [memberName, user?.centre?.nom].filter(Boolean).join(' · ')
  const canSubmit  = nom.trim().length > 0 && email.trim().length > 0 && (isEdit || password.trim().length > 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div variants={backdropVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm" onClick={onClose} />

          <motion.div variants={sheetVariants} initial="closed" animate="open" exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[720px] rounded-t-[24px] border border-border bg-surface max-h-[90vh] overflow-y-auto flex flex-col">

            <div className="mx-auto mt-[10px] h-1 w-10 rounded-full bg-border" />

            <header className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="font-syne text-[17px] font-extrabold text-text">{isEdit ? 'Modifier le membre' : 'Nouveau membre'}</h2>
                {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose}
                aria-label="Fermer"
                className="w-[30px] h-[30px] rounded-[8px] border border-border bg-surface2 text-muted text-[17px] flex items-center justify-center">
                ×
              </button>
            </header>

            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-[14px] p-5">
              <div className="flex flex-col gap-[14px]">
                <StaffFormIdentite prenom={prenom} nom={nom} email={email} password={password} role={role} isEdit={isEdit}
                  onPrenom={setPrenom} onNom={setNom} onEmail={setEmail} onPassword={setPassword} onRole={setRole} />
                <StaffFormAvatar value={avatarColor} initials={initials} onChange={setAvatarColor} />
              </div>
              <div className="flex flex-col gap-[14px]">
                <StaffFormContrat typeContrat={typeContrat} heuresHebdo={heuresHebdo} dateEmbauche={dateEmbauche}
                  onTypeContrat={setTypeContrat} onHeuresHebdo={setHeuresHebdo} onDateEmbauche={setDateEmbauche} />
                <StaffFormEquipement tailleHaut={tailleHaut} tailleBas={tailleBas} pointure={pointure}
                  onTailleHaut={setTailleHaut} onTailleBas={setTailleBas} onPointure={setPointure} />
                <StaffFormAcces codePointage={codePointage} actif={actif} showActifRow={isEdit}
                  onCodePointage={setCodePointage} onActif={setActif} />
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-surface">
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 rounded-[11px] bg-surface2 border border-border text-text text-[13px] font-semibold">
                Annuler
              </button>
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
