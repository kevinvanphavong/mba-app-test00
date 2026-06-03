'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'
import api from '@/lib/api'
import { useLeadModal } from '@/store/leadModalStore'
import LeadModalForm from './LeadModalForm'
import { ConsentFoot, IntentChips, PlanSelect, SuccessView } from './LeadModalParts'

type IntentCopy = { emoji: string; title: string; subtitle: string }
const COPY: Record<'trial' | 'demo' | 'custom', IntentCopy> = {
  trial: {
    emoji: '🎁',
    title: 'Démarrez votre essai gratuit',
    subtitle: '14 jours sans carte bancaire. Kévin active votre compte sous 4h ouvrées et vous accompagne au démarrage.',
  },
  demo: {
    emoji: '📅',
    title: 'Réservez votre démo de 20 min',
    subtitle: '20 minutes avec Kévin pour découvrir Shiftly et voir si ça colle à votre centre.',
  },
  custom: {
    emoji: '👑',
    title: 'Parlons de votre projet sur mesure',
    subtitle: 'Audit, intégration, fonctionnalités exclusives. Kévin vous envoie un devis personnalisé sous 48h.',
  },
}

// Modale lead — orchestre intent/plan/RGPD/soumission. La présentation des
// champs est isolée dans LeadModalForm, les sous-blocs dans LeadModalParts.
export default function LeadModal() {
  const { isOpen, intent, plan, close, setIntent, setPlan } = useLeadModal()
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    setConsent(false)
    setConsentError(false)
    setNetworkError(null)
    setSuccess(false)
    setSubmitting(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!consent) {
      setConsentError(true)
      return
    }
    setConsentError(false)
    setNetworkError(null)
    setSubmitting(true)

    const payload: Record<string, unknown> = Object.fromEntries(new FormData(e.currentTarget).entries())
    payload.consent = true
    payload.source = 'shiftly.fr (landing /)'
    payload.created_at = new Date().toISOString()

    try {
      await api.post('/leads', payload, { headers: { 'Content-Type': 'application/json' } })
      setSuccess(true)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setNetworkError(
        status === 404
          ? "Le service de leads n'est pas encore disponible. Écrivez à hello@shiftly.fr en attendant — Kévin vous répond sous 4h."
          : 'Erreur réseau. Réessayez ou écrivez directement à hello@shiftly.fr.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const copy = COPY[intent]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="mkt-lead-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leadTitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <motion.div
            className="mkt-lead-sheet"
            initial={{ y: 20, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.5, 0.05, 0.1, 1] }}
          >
            <div className="mkt-lead-head">
              <div>
                <h3 id="leadTitle">
                  <span>{copy.emoji}</span>
                  <span>{copy.title}</span>
                </h3>
                <p>{copy.subtitle}</p>
              </div>
              <button type="button" className="mkt-lead-close" aria-label="Fermer" onClick={close}>
                ×
              </button>
            </div>

            {success ? (
              <SuccessView onClose={close} />
            ) : (
              <form className="mkt-lead-body" onSubmit={onSubmit} noValidate>
                <IntentChips intent={intent} onChange={setIntent} />
                <PlanSelect value={plan} onChange={setPlan} />
                <LeadModalForm intent={intent} />

                <ConsentFoot
                  consent={consent}
                  consentError={consentError}
                  networkError={networkError}
                  submitting={submitting}
                  onToggle={(next) => {
                    setConsent(next)
                    if (next) setConsentError(false)
                  }}
                />
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
