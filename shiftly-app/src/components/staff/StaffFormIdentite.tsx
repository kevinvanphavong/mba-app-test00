'use client'

/**
 * Carte « Identité & compte » du formulaire membre.
 * Présentationnel : pas de logique métier, juste des contrôles connectés
 * aux state setters du parent (ModalEditStaff).
 */

import { StaffFormCard, StaffFormField, STAFF_FORM_INPUT } from './StaffFormCard'

const ROLES = [
  { value: 'EMPLOYE' as const, label: 'Employé' },
  { value: 'MANAGER' as const, label: 'Manager' },
]

interface Props {
  prenom:     string
  nom:        string
  email:      string
  password:   string
  role:       'MANAGER' | 'EMPLOYE'
  /** En édition, le mot de passe est optionnel (placeholder dédié) */
  isEdit:     boolean
  onPrenom:   (v: string) => void
  onNom:      (v: string) => void
  onEmail:    (v: string) => void
  onPassword: (v: string) => void
  onRole:     (v: 'MANAGER' | 'EMPLOYE') => void
}

export default function StaffFormIdentite(p: Props) {
  return (
    <StaffFormCard ico="●" title="Identité & compte">
      <div className="grid grid-cols-2 gap-2.5">
        <StaffFormField label="Prénom">
          <input value={p.prenom} onChange={e => p.onPrenom(e.target.value)} className={STAFF_FORM_INPUT} />
        </StaffFormField>
        <StaffFormField label="Nom" required>
          <input value={p.nom} onChange={e => p.onNom(e.target.value)} className={STAFF_FORM_INPUT} />
        </StaffFormField>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StaffFormField label="Email" required>
          <input value={p.email} onChange={e => p.onEmail(e.target.value)} type="email" className={STAFF_FORM_INPUT} />
        </StaffFormField>
        <StaffFormField label="Mot de passe" required={!p.isEdit}>
          <input
            value={p.password}
            onChange={e => p.onPassword(e.target.value)}
            type="password"
            placeholder={p.isEdit ? 'Inchangé' : ''}
            className={STAFF_FORM_INPUT}
          />
        </StaffFormField>
      </div>

      <StaffFormField label="Rôle">
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => p.onRole(r.value)}
              className={`py-2 rounded-[9px] text-[12px] font-bold border transition-colors ${
                p.role === r.value ? 'bg-accent/10 border-accent/40 text-accent' : 'border-border text-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </StaffFormField>
    </StaffFormCard>
  )
}
