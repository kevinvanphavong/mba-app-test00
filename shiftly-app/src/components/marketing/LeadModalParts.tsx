'use client'

import type { LeadIntent, LeadPlan } from '@/store/leadModalStore'
import { PLANS } from './plansData'

const CHIPS: { key: LeadIntent; label: string; emoji: string }[] = [
  { key: 'trial', label: 'Essai gratuit', emoji: '🎁' },
  { key: 'demo', label: 'Démo en visio', emoji: '📅' },
  { key: 'custom', label: 'Sur mesure', emoji: '👑' },
]

export function IntentChips({
  intent,
  onChange,
}: {
  intent: LeadIntent
  onChange: (i: LeadIntent) => void
}) {
  return (
    <div className="mkt-lead-section">
      <label className="mkt-lead-label">Type de demande</label>
      <div className="mkt-lead-chips">
        {CHIPS.map((c) => (
          <button
            type="button"
            key={c.key}
            className={`mkt-lead-chip ${intent === c.key ? 'is-active' : ''}`}
            onClick={() => onChange(c.key)}
          >
            <span>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="intent" value={intent} />
    </div>
  )
}

export function PlanSelect({
  value,
  onChange,
}: {
  value: LeadPlan
  onChange: (v: LeadPlan) => void
}) {
  return (
    <div className="mkt-lead-section">
      <label className="mkt-lead-label">Formule d&apos;intérêt</label>
      <div className="mkt-lead-field">
        <select
          name="plan"
          value={value}
          onChange={(e) => onChange(e.target.value as LeadPlan)}
        >
          {PLANS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.emoji} {p.name} — {p.monthly.val}{p.monthly.unit}
            </option>
          ))}
          <option value="undecided">🤔 Je ne sais pas encore</option>
        </select>
      </div>
    </div>
  )
}

export function ConsentFoot({
  consent,
  consentError,
  networkError,
  submitting,
  onToggle,
}: {
  consent: boolean
  consentError: boolean
  networkError: string | null
  submitting: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <div className="mkt-lead-foot">
      <label className={`mkt-lead-consent ${consent ? 'is-checked' : ''}`}>
        <input type="checkbox" checked={consent} onChange={(e) => onToggle(e.target.checked)} />
        <span className="mkt-lead-consent-text">
          <strong>J&apos;accepte</strong> que Shiftly traite mes données pour me recontacter
          dans le cadre de cette demande. Données hébergées en France, conservées 24 mois,
          jamais revendues. Voir notre <a href="/confidentialite">politique de confidentialité</a>{' '}
          et nos <a href="/cgu">CGU</a>.
        </span>
      </label>

      {consentError && (
        <div className="mkt-lead-error">
          Merci de cocher la case pour accepter le traitement de vos données.
        </div>
      )}
      {networkError && <div className="mkt-lead-error">{networkError}</div>}

      <button
        type="submit"
        className="mkt-btn mkt-btn-primary mkt-btn-lg"
        disabled={submitting}
      >
        {submitting ? 'Envoi en cours…' : 'Envoyer ma demande →'}
      </button>
      <p className="mkt-lead-foot-note">
        🔒 Données hébergées en France · Kévin vous répond sous 4h ouvrées
      </p>
    </div>
  )
}

export function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="mkt-lead-success">
      <div className="mkt-lead-success-emoji">🎉</div>
      <h3>Demande envoyée !</h3>
      <p>
        Merci, j&apos;ai bien reçu votre demande. Je vous recontacte personnellement{' '}
        <strong>sous 4h ouvrées</strong> par téléphone ou email selon ce que vous avez indiqué.
        <br />
        <br />— Kévin, fondateur
      </p>
      <button type="button" className="mkt-btn mkt-btn-secondary" onClick={onClose}>
        Fermer
      </button>
    </div>
  )
}
