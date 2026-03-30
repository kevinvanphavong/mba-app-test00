'use client'

import { useState, useEffect } from 'react'
import type { StaffMember }    from '@/types/staff'

const ROLES = [
  { value: 'EMPLOYE' as const,  label: 'Employé' },
  { value: 'MANAGER' as const,  label: 'Manager' },
]

interface SaveData {
  nom:        string
  prenom:     string | null
  email:      string
  role:       'MANAGER' | 'EMPLOYE'
  tailleHaut: string | null
  tailleBas:  string | null
  pointure:   string | null
  actif:      boolean
  password?:  string
}

interface Props {
  open:    boolean
  member:  StaffMember | null
  onClose: () => void
  onSave:  (data: SaveData) => void
}

export default function ModalEditStaff({ open, member, onClose, onSave }: Props) {
  const [nom,        setNom]        = useState('')
  const [prenom,     setPrenom]     = useState('')
  const [email,      setEmail]      = useState('')
  const [role,       setRole]       = useState<'MANAGER' | 'EMPLOYE'>('EMPLOYE')
  const [tailleHaut, setTailleHaut] = useState('')
  const [tailleBas,  setTailleBas]  = useState('')
  const [pointure,   setPointure]   = useState('')
  const [actif,      setActif]      = useState(true)
  const [password,   setPassword]   = useState('')

  useEffect(() => {
    if (!open) return
    if (member) {
      setNom(member.nom)
      setPrenom(member.prenom ?? '')
      setEmail(member.email)
      setRole(member.role)
      setTailleHaut(member.tailleHaut ?? '')
      setTailleBas(member.tailleBas ?? '')
      setPointure(member.pointure ?? '')
      setActif(member.actif)
      setPassword('')
    } else {
      setNom(''); setPrenom(''); setEmail(''); setRole('EMPLOYE')
      setTailleHaut(''); setTailleBas(''); setPointure('')
      setActif(true); setPassword('')
    }
  }, [open, member])

  function handleSubmit() {
    if (!nom.trim() || !email.trim()) return
    onSave({
      nom:        nom.trim(),
      prenom:     prenom.trim() || null,
      email:      email.trim(),
      role,
      tailleHaut: tailleHaut.trim() || null,
      tailleBas:  tailleBas.trim() || null,
      pointure:   pointure.trim() || null,
      actif,
      password:   password || undefined,
    })
  }

  if (!open) return null

  const inputCls = "w-full px-3 py-2.5 bg-surface2 border border-border rounded-[10px] text-[13px] text-text placeholder:text-muted outline-none focus:border-accent/50"

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-[24px] px-5 pt-5 pb-10 max-h-[90vh] overflow-y-auto flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <h3 className="font-syne font-extrabold text-[16px] text-text">
            {member ? 'Modifier le membre' : 'Nouveau membre'}
          </h3>
          <button onClick={onClose} className="text-muted text-[20px] leading-none">×</button>
        </div>

        {/* Identité */}
        <div className="flex gap-2">
          <input value={prenom} onChange={e => setPrenom(e.target.value)}
            placeholder="Prénom" className={`flex-1 ${inputCls}`} />
          <input value={nom} onChange={e => setNom(e.target.value)}
            placeholder="Nom *" className={`flex-1 ${inputCls}`} />
        </div>

        <input value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email *" type="email" className={inputCls} />

        {/* Mot de passe */}
        <input value={password} onChange={e => setPassword(e.target.value)}
          placeholder={member ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}
          type="password" className={inputCls} />

        {/* Rôle */}
        <div className="flex gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`flex-1 py-2 rounded-[10px] text-[11px] font-bold border transition-all ${
                role === r.value ? 'bg-accent/10 border-accent/40 text-accent' : 'border-border text-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Tailles */}
        <div>
          <p className="text-[10px] font-syne font-bold uppercase tracking-widest text-muted mb-2">Équipement</p>
          <div className="grid grid-cols-3 gap-2">
            <input value={tailleHaut} onChange={e => setTailleHaut(e.target.value)}
              placeholder="Haut" className={inputCls} />
            <input value={tailleBas} onChange={e => setTailleBas(e.target.value)}
              placeholder="Bas" className={inputCls} />
            <input value={pointure} onChange={e => setPointure(e.target.value)}
              placeholder="Pointure" className={inputCls} />
          </div>
        </div>

        {/* Statut actif */}
        {member && (
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[13px] text-text font-medium">Membre actif</p>
              <p className="text-[11px] text-muted">Visible dans l'app et les statistiques</p>
            </div>
            <button
              onClick={() => setActif(v => !v)}
              className={`w-[44px] h-[24px] rounded-full relative flex-shrink-0 transition-colors ${
                actif ? 'bg-green' : 'bg-surface2 border border-border'
              }`}
            >
              <span className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all ${
                actif ? 'left-[23px]' : 'left-[3px]'
              }`} />
            </button>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!nom.trim() || !email.trim() || (!member && !password.trim())}
          className="w-full py-3 rounded-[12px] bg-accent text-white font-syne font-bold text-[14px] disabled:opacity-40 transition-opacity"
        >
          {member ? 'Enregistrer' : 'Créer le membre'}
        </button>
      </div>
    </div>
  )
}
