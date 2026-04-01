'use client'

import { useState, useEffect }               from 'react'
import { AVATAR_PALETTE, getGradientFromColor } from '@/lib/colors'
import type { StaffMember }                  from '@/types/staff'

const ROLES = [
  { value: 'EMPLOYE' as const,  label: 'Employé' },
  { value: 'MANAGER' as const,  label: 'Manager' },
]

const DEFAULT_COLOR = '#f97316'

interface SaveData {
  nom:         string
  prenom:      string | null
  email:       string
  role:        'MANAGER' | 'EMPLOYE'
  tailleHaut:  string | null
  tailleBas:   string | null
  pointure:    string | null
  actif:       boolean
  avatarColor: string
  password?:   string
}

interface Props {
  open:    boolean
  member:  StaffMember | null
  onClose: () => void
  onSave:  (data: SaveData) => void
}

export default function ModalEditStaff({ open, member, onClose, onSave }: Props) {
  const [nom,         setNom]         = useState('')
  const [prenom,      setPrenom]      = useState('')
  const [email,       setEmail]       = useState('')
  const [role,        setRole]        = useState<'MANAGER' | 'EMPLOYE'>('EMPLOYE')
  const [tailleHaut,  setTailleHaut]  = useState('')
  const [tailleBas,   setTailleBas]   = useState('')
  const [pointure,    setPointure]    = useState('')
  const [actif,       setActif]       = useState(true)
  const [password,    setPassword]    = useState('')
  const [avatarColor, setAvatarColor] = useState(DEFAULT_COLOR)

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
      setAvatarColor(member.avatarColor ?? DEFAULT_COLOR)
      setPassword('')
    } else {
      setNom(''); setPrenom(''); setEmail(''); setRole('EMPLOYE')
      setTailleHaut(''); setTailleBas(''); setPointure('')
      setActif(true); setAvatarColor(DEFAULT_COLOR); setPassword('')
    }
  }, [open, member])

  function handleSubmit() {
    if (!nom.trim() || !email.trim()) return
    onSave({
      nom:         nom.trim(),
      prenom:      prenom.trim() || null,
      email:       email.trim(),
      role,
      tailleHaut:  tailleHaut.trim() || null,
      tailleBas:   tailleBas.trim() || null,
      pointure:    pointure.trim() || null,
      actif,
      avatarColor,
      password:    password || undefined,
    })
  }

  if (!open) return null

  const inputCls = "w-full px-3 py-2.5 bg-surface2 border border-border rounded-[10px] text-[13px] text-text placeholder:text-muted outline-none focus:border-accent/50"

  /* Initiales pour la preview */
  const initials = ((prenom?.[0] ?? nom[0] ?? '?') + (nom.split(' ')[0]?.[0] ?? '')).toUpperCase()
  const gradient = getGradientFromColor(avatarColor)

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

        {/* Couleur avatar */}
        <div>
          <p className="text-[10px] font-syne font-bold uppercase tracking-widest text-muted mb-3">
            Couleur de l'avatar
          </p>

          {/* Preview */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-[2.5px] rounded-[12px]" style={{ background: avatarColor }}>
              <div
                className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-white font-extrabold text-[13px]"
                style={{ background: gradient }}
              >
                {initials || '?'}
              </div>
            </div>
            <p className="text-[12px] text-muted">
              {AVATAR_PALETTE.find(p => p.color === avatarColor)?.label ?? 'Personnalisée'}
            </p>
          </div>

          {/* Palette */}
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_PALETTE.map(entry => (
              <button
                key={entry.color}
                onClick={() => setAvatarColor(entry.color)}
                title={entry.label}
                className="relative w-9 h-9 rounded-[10px] transition-transform active:scale-90"
                style={{ background: entry.gradient }}
              >
                {avatarColor === entry.color && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
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
