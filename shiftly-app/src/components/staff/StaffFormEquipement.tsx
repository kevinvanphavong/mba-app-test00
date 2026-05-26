'use client'

/**
 * Carte « Équipement » du formulaire membre — tailles haut / bas / pointure.
 * Présentationnel : aucune logique métier.
 */

import { StaffFormCard, StaffFormField, STAFF_FORM_INPUT } from './StaffFormCard'

interface Props {
  tailleHaut:    string
  tailleBas:     string
  pointure:      string
  onTailleHaut:  (v: string) => void
  onTailleBas:   (v: string) => void
  onPointure:    (v: string) => void
}

export default function StaffFormEquipement(p: Props) {
  return (
    <StaffFormCard ico="◈" title="Équipement">
      <div className="grid grid-cols-3 gap-2.5">
        <StaffFormField label="Haut">
          <input value={p.tailleHaut} onChange={e => p.onTailleHaut(e.target.value)} className={STAFF_FORM_INPUT} />
        </StaffFormField>
        <StaffFormField label="Bas">
          <input value={p.tailleBas} onChange={e => p.onTailleBas(e.target.value)} className={STAFF_FORM_INPUT} />
        </StaffFormField>
        <StaffFormField label="Pointure">
          <input value={p.pointure} onChange={e => p.onPointure(e.target.value)} className={STAFF_FORM_INPUT} />
        </StaffFormField>
      </div>
    </StaffFormCard>
  )
}
