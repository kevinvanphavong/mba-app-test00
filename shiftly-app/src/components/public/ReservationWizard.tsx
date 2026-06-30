'use client'

import { useState } from 'react'
import type { PublicPrestation } from '@/features/public/types'
import { emptyDraft, toDateCreneauISO, type ReservationDraft } from '@/features/public/reservation'
import { useCreateReservation } from '@/features/public/useCreateReservation'
import { useReservationCheckout } from '@/features/public/useReservationCheckout'
import WizardProgress from './WizardProgress'
import StepPrestationCreneau from './steps/StepPrestationCreneau'
import StepPersonnesRecap from './steps/StepPersonnesRecap'
import StepAcompte from './steps/StepAcompte'
import { PublicEmpty } from './StateBlocks'

/**
 * Parcours de réservation en 3 étapes. Au paiement, on crée la résa
 * (EN_ATTENTE_ACOMPTE) puis on récupère l'URL Stripe Checkout et on **redirige**
 * le visiteur vers le paiement hébergé. La confirmation (CONFIRMEE) s'affiche au
 * retour, sur la page succès. Le centre est résolu par host côté API.
 */
export default function ReservationWizard({
  prestations,
  initialPrestationId = null,
}: {
  prestations: PublicPrestation[]
  initialPrestationId?: number | null
}) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<ReservationDraft>(() => emptyDraft(initialPrestationId))
  const createReservation = useCreateReservation()
  const checkout = useReservationCheckout()

  const patch = (p: Partial<ReservationDraft>) => setDraft((d) => ({ ...d, ...p }))
  const selected = prestations.find((p) => p.id === draft.prestationId) ?? null

  if (prestations.length === 0) {
    return <PublicEmpty message="Aucune prestation réservable pour le moment." />
  }

  // Création → URL de paiement → redirection vers Stripe Checkout (hébergé).
  const submit = () => {
    const dateCreneau = toDateCreneauISO(draft)
    if (dateCreneau === null || draft.prestationId === null) return

    createReservation.mutate(
      {
        prestationId: draft.prestationId,
        dateCreneau,
        nbPersonnes: draft.nbPersonnes,
        nom: draft.nom,
        email: draft.email,
        telephone: draft.telephone,
      },
      {
        onSuccess: (reservation) =>
          checkout.mutate(reservation.id, {
            onSuccess: ({ url }) => {
              if (typeof window !== 'undefined') window.location.href = url
            },
          }),
      },
    )
  }

  // « En cours » couvre création + obtention d'URL + redirection imminente.
  const isPending = createReservation.isPending || checkout.isPending || checkout.isSuccess
  const isError = createReservation.isError || checkout.isError

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <WizardProgress step={step} />

      {step === 1 && (
        <StepPrestationCreneau
          prestations={prestations}
          draft={draft}
          onChange={patch}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && selected && (
        <StepPersonnesRecap
          prestation={selected}
          draft={draft}
          onChange={patch}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selected && (
        <StepAcompte
          prestation={selected}
          draft={draft}
          onChange={patch}
          onBack={() => setStep(2)}
          onSubmit={submit}
          isPending={isPending}
          isError={isError}
        />
      )}
    </div>
  )
}
