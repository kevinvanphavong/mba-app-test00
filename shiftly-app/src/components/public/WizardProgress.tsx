'use client'

/** En-tête « Étape n/3 » + barre de progression du parcours de réservation. */
export default function WizardProgress({ step, total = 3 }: { step: number; total?: number }) {
  const labels = ['Prestation & créneau', 'Personnes & récap', 'Acompte']

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-syne text-sm font-bold text-text">{labels[step - 1]}</span>
        <span className="font-sans text-xs text-muted">
          Étape {step}/{total}
        </span>
      </div>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-pill ${i < step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>
    </div>
  )
}
