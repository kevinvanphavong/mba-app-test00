'use client'

/**
 * Carte « Accès & statut » du formulaire membre — PIN + toggle Membre actif.
 * Présentationnel : aucune logique métier. Le toggle actif n'est affiché qu'en édition.
 */

import { StaffFormCard, StaffFormField } from './StaffFormCard'

interface Props {
  codePointage:   string
  /** Affiche le toggle « Membre actif » uniquement en édition */
  showActifRow:   boolean
  actif:          boolean
  onCodePointage: (v: string) => void
  onActif:        (v: boolean) => void
}

export default function StaffFormAcces(p: Props) {
  const pinIncomplete = p.codePointage.length > 0 && p.codePointage.length < 4

  return (
    <StaffFormCard ico="⚿" title="Accès & statut">
      <StaffFormField label="Code PIN pointage">
        <input
          value={p.codePointage}
          onChange={e => p.onCodePointage(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="1234"
          inputMode="numeric"
          maxLength={4}
          className="w-full px-[14px] py-2.5 bg-surface border border-border rounded-[10px] text-text font-syne font-extrabold text-[16px] tracking-[10px] placeholder:text-muted placeholder:font-normal placeholder:tracking-normal outline-none focus:border-accent/50"
        />
        <span className="text-[11px] text-muted">
          {pinIncomplete
            ? <span className="text-yellow">Le code doit comporter exactement 4 chiffres.</span>
            : '4 chiffres. Code actuel pré-rempli — efface et retape pour le changer.'}
        </span>
      </StaffFormField>

      {p.showActifRow && (
        <div className="flex items-center justify-between bg-surface border border-border rounded-[11px] px-3.5 py-3">
          <p className="text-[13px] font-semibold text-text">
            Membre actif <span className="text-[11px] font-normal text-muted">— visible dans l'app</span>
          </p>
          <button
            type="button"
            onClick={() => p.onActif(!p.actif)}
            aria-pressed={p.actif}
            className={`w-[42px] h-[23px] rounded-full relative flex-shrink-0 transition-colors ${
              p.actif ? 'bg-green' : 'bg-surface2 border border-border'
            }`}
          >
            <span className={`absolute top-[3px] w-[17px] h-[17px] bg-white rounded-full transition-all ${
              p.actif ? 'left-[22px]' : 'left-[3px]'
            }`} />
          </button>
        </div>
      )}
    </StaffFormCard>
  )
}
