'use client'

import { useState } from 'react'
import type { PublicPrestation } from '@/features/public/types'
import { emptyDraft, toDateCreneauISO, type ReservationDraft } from '@/features/public/reservation'
import { useCreateReservation } from '@/features/public/useCreateReservation'
import WizardProgress from './WizardProgress'
import StepPrestationCreneau from './steps/StepPrestationCreneau'
import StepPersonnesRecap from './steps/StepPersonnesRecap'
import StepAcompte from './steps/StepAcompte'
import ReservationConfirmation from './ReservationConfirmation'
import { PublicEmpty } from './StateBlocks'

/** Parcours de réservation en 3 étapes. Le centre est résolu par host côté API. */
export default function ReservationWizard({
  prestations,
  initialPrestationId = null,
}: {
  prestations: PublicPrestation[]
  initialPrestationId?: number | null
}) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<ReservationDraft>(() => emptyDraft(initialPrestationId))
  const mutation = useCreateReservation()

  const patch = (p: Partial<ReservationDraft>) => setDraft((d) => ({ ...d, ...p }))
  const selected = prestations.find((p) => p.id === draft.prestationId) ?? null

  if (prestations.length === 0) {
    return <PublicEmpty message="Aucune prestation réservable pour le moment." />
  }
  if (mutation.isSuccess) {
    return <ReservationConfirmation result={mutation.data} />
  }

  const submit = () => {
    const dateCreneau = toDateCreneauISO(draft)
    if (dateCreneau === null || draft.prestationId === null) return
    mutation.mutate({
      prestationId: draft.prestationId,
      dateCreneau,
      nbPersonnes: draft.nbPersonnes,
      nom: draft.nom,
      email: draft.email,
      telephone: draft.telephone,
    })
  }

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
          isPending={mutation.isPending}
          isError={mutation.isError}
        />
      )}
    </div>
  )
}
