'use client'

/**
 * Carte « Contrat » du formulaire membre — chips type + heures + date d'embauche.
 * Présentationnel : aucune logique métier, le parent gère les states.
 */

import { StaffFormCard, StaffFormField, STAFF_FORM_INPUT } from './StaffFormCard'

const CONTRATS = ['CDI', 'CDD', 'EXTRA', 'ALTERNANCE', 'STAGE'] as const

interface Props {
  emploi?:        string
  typeContrat:    string
  heuresHebdo:    string
  dateEmbauche:   string
  onEmploi?:      (v: string) => void
  onTypeContrat:  (v: string) => void
  onHeuresHebdo:  (v: string) => void
  onDateEmbauche: (v: string) => void
}

export default function StaffFormContrat(p: Props) {
  return (
    <StaffFormCard ico="▮" title="Contrat">
      {p.onEmploi !== undefined && (
        <StaffFormField label="Emploi (intitulé contractuel)" required>
          <input
            value={p.emploi ?? ''}
            onChange={(e) => p.onEmploi!(e.target.value)}
            placeholder="Responsable bar"
            className={STAFF_FORM_INPUT}
          />
          <span className="text-[10px] text-muted mt-0.5">
            Mention obligatoire au registre. Ex&nbsp;: « Hôte d&apos;accueil », « Responsable bar »…
          </span>
        </StaffFormField>
      )}

      <div className="flex flex-wrap gap-1.5">
        {CONTRATS.map(c => {
          const on = p.typeContrat === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => p.onTypeContrat(on ? '' : c)}
              className={`px-[11px] py-1.5 rounded-[8px] text-[11px] font-bold border transition-colors ${
                on ? 'bg-accent/10 border-accent/40 text-accent' : 'border-border text-muted'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StaffFormField label="Heures / semaine">
          <input
            value={p.heuresHebdo}
            onChange={e => p.onHeuresHebdo(e.target.value.replace(/\D/g, ''))}
            placeholder="35"
            inputMode="numeric"
            className={STAFF_FORM_INPUT}
          />
        </StaffFormField>
        <StaffFormField label="Date d'embauche">
          <input
            type="date"
            value={p.dateEmbauche}
            onChange={e => p.onDateEmbauche(e.target.value)}
            className={STAFF_FORM_INPUT}
          />
        </StaffFormField>
      </div>
    </StaffFormCard>
  )
}
